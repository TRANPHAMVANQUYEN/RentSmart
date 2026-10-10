<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\RoomController;
use App\Services\RoomImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LandlordController extends Controller
{
    private const SELF_HIDDEN = 'Chủ tin tự ẩn';

    public function rooms(Request $request, RoomController $roomController): JsonResponse
    {
        $rooms = $this->roomQuery($request->user()->id)->get();
        $rooms = $roomController->attachRoomRelations($rooms);
        $amenityIds = DB::table('room_amenities')
            ->whereIn('room_id', $rooms->pluck('id'))
            ->get(['room_id', 'amenity_id'])
            ->groupBy('room_id');

        foreach ($rooms as $room) {
            $room->amenityIds = ($amenityIds[$room->id] ?? collect())->pluck('amenity_id')->map(fn ($id): int => (int) $id)->values();
        }

        return response()->json($rooms);
    }

    public function saveRoom(Request $request, ?int $roomId = null): JsonResponse
    {
        $user = $request->user();
        $room = $roomId
            ? DB::table('rooms')->where('id', $roomId)->where('landlord_id', $user->id)->first()
            : null;
        if ($roomId && !$room) {
            abort(404, 'Không tìm thấy tin đăng của bạn.');
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'min:10', 'max:120'],
            'description' => ['required', 'string', 'min:20'],
            'price' => ['required', 'numeric', 'min:500000'],
            'area' => ['required', 'numeric', 'min:5', 'max:500'],
            'address' => ['required', 'string', 'max:255'],
            'districtId' => ['required', 'integer', Rule::exists('districts', 'id')],
            'roomType' => ['required', Rule::in(['phong-tro', 'nha-nguyen-can', 'can-ho', 'o-ghep'])],
            'amenityIds' => ['sometimes', 'array'],
            'amenityIds.*' => ['integer', Rule::exists('amenities', 'id')],
            'images' => ['sometimes', 'array', 'max:8'],
            'images.*.url' => ['required', 'string'],
            'images.*.primary' => ['sometimes', 'boolean'],
        ]);

        $attributes = [
            'district_id' => $data['districtId'],
            'title' => $data['title'],
            'description' => $data['description'],
            'price' => $data['price'],
            'area' => $data['area'],
            'address' => $data['address'],
            'room_type' => $data['roomType'],
            'updated_at' => now(),
        ];
        if (!$room) {
            $attributes += [
                'landlord_id' => $user->id,
                'status' => 'pending',
                'is_featured' => false,
                'view_count' => 0,
                'created_at' => now(),
            ];
        } else {
            $attributes['status'] = 'pending';
            $attributes['reject_reason'] = null;
        }

        $savedId = DB::transaction(function () use ($data, $attributes, $room, $roomId, $request): int {
            if ($room) {
                $savedId = $roomId;
                $oldImages = DB::table('room_images')->where('room_id', $savedId)->pluck('image_url');
                DB::afterCommit(function () use ($oldImages): void {
                    foreach ($oldImages as $imageUrl) {
                        RoomImageStorage::deleteStored($imageUrl);
                    }
                });
                DB::table('rooms')->where('id', $savedId)->update($attributes);
            } else {
                $savedId = DB::table('rooms')->insertGetId($attributes);
            }

            DB::table('room_images')->where('room_id', $savedId)->delete();
            foreach ($data['images'] ?? [] as $index => $image) {
                DB::table('room_images')->insert([
                    'room_id' => $savedId,
                    'image_url' => RoomImageStorage::store($image['url'], $savedId),
                    'is_primary' => (bool) ($image['primary'] ?? false),
                    'sort_order' => $index,
                ]);
            }

            DB::table('room_amenities')->where('room_id', $savedId)->delete();
            foreach (array_unique($data['amenityIds'] ?? []) as $amenityId) {
                DB::table('room_amenities')->insert(['room_id' => $savedId, 'amenity_id' => $amenityId]);
            }

            return $savedId;
        });

        return response()->json(['roomId' => $savedId], $roomId ? 200 : 201);
    }

    public function updateStatus(Request $request, int $roomId): JsonResponse
    {
        $room = DB::table('rooms')->where('id', $roomId)->where('landlord_id', $request->user()->id)->first();
        if (!$room) {
            abort(404, 'Không tìm thấy tin đăng của bạn.');
        }

        $data = $request->validate(['status' => ['required', Rule::in(['approved', 'removed', 'rented'])]]);
        $validTransition = match ($data['status']) {
            'rented', 'removed' => $room->status === 'approved',
            'approved' => $room->status === 'removed' && $room->reject_reason === self::SELF_HIDDEN,
        };
        if (!$validTransition) {
            throw ValidationException::withMessages(['status' => 'Không thể đổi trạng thái tin này. Tin bị quản trị viên gỡ hoặc từ chối không thể tự hiện lại.']);
        }

        DB::table('rooms')->where('id', $roomId)->update([
            'status' => $data['status'],
            'reject_reason' => $data['status'] === 'removed' ? self::SELF_HIDDEN : null,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Đã cập nhật trạng thái tin.']);
    }

    public function deleteRoom(Request $request, int $roomId): JsonResponse
    {
        $room = DB::table('rooms')->where('id', $roomId)->where('landlord_id', $request->user()->id)->first();
        if (!$room) {
            abort(404, 'Không tìm thấy tin đăng của bạn.');
        }

        DB::transaction(function () use ($roomId): void {
            $imageUrls = DB::table('room_images')->where('room_id', $roomId)->pluck('image_url');
            DB::afterCommit(function () use ($imageUrls): void {
                foreach ($imageUrls as $imageUrl) {
                    RoomImageStorage::deleteStored($imageUrl);
                }
            });

            DB::table('room_images')->where('room_id', $roomId)->delete();
            DB::table('room_amenities')->where('room_id', $roomId)->delete();
            DB::table('saved_rooms')->where('room_id', $roomId)->delete();
            DB::table('reports')->where('room_id', $roomId)->delete();
            DB::table('messages')->where('room_id', $roomId)->delete();
            DB::table('page_views')->where('room_id', $roomId)->update(['room_id' => null]);
            DB::table('rooms')->where('id', $roomId)->delete();
        });

        return response()->json(['message' => 'Đã xóa tin đăng và dữ liệu liên quan.']);
    }

    private function roomQuery(int $userId)
    {
        return DB::table('rooms')
            ->join('districts', 'districts.id', '=', 'rooms.district_id')
            ->join('users', 'users.id', '=', 'rooms.landlord_id')
            ->where('rooms.landlord_id', $userId)
            ->orderByDesc('rooms.created_at')
            ->select(
                'rooms.id',
                'rooms.landlord_id as landlordId',
                'rooms.district_id as districtId',
                'rooms.title',
                'rooms.description',
                'rooms.price',
                'rooms.area',
                'rooms.address',
                'districts.name as district',
                'rooms.room_type as roomType',
                'rooms.status',
                'rooms.reject_reason as statusNote',
                'rooms.is_featured as featured',
                'rooms.view_count as views',
                'rooms.created_at as createdAt',
                'users.full_name as contactName',
                'users.phone as contactPhone'
            );
    }
}
