<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class RoomController extends Controller
{
    public function index(): JsonResponse
    {
        $rooms = $this->publicRoomQuery()
            ->orderByDesc('rooms.created_at')
            ->get();

        return response()->json($this->attachRoomRelations($rooms));
    }

    public function show(int $roomId): JsonResponse
    {
        $room = $this->publicRoomQuery()
            ->where('rooms.id', $roomId)
            ->first();

        if (!$room) {
            abort(404, 'Không tìm thấy tin phòng đang hiển thị.');
        }

        DB::table('rooms')->where('id', $roomId)->increment('view_count');
        $room->views = (int) $room->views + 1;
        $room = $this->attachRoomRelations(collect([$room]))->first();

        $room->landlord = DB::table('users')
            ->where('id', $room->landlordId)
            ->select('id', 'username', 'full_name as fullName', 'avatar', 'created_at as createdAt')
            ->first();
        $room->landlordRoomCount = DB::table('rooms')
            ->where('landlord_id', $room->landlordId)
            ->where('status', 'approved')
            ->count();
        $room->similar = $this->attachRoomRelations(
            $this->publicRoomQuery()
                ->where('rooms.id', '<>', $roomId)
                ->where(function (Builder $query) use ($room): void {
                    $query->where('rooms.district_id', $room->districtId)
                        ->orWhereBetween('rooms.price', [
                            (int) ($room->price * 0.7),
                            (int) ($room->price * 1.3),
                        ]);
                })
                ->orderByRaw('rooms.district_id = ? DESC', [$room->districtId])
                ->limit(4)
                ->get()
        );

        return response()->json($room);
    }

    public function contact(int $roomId): JsonResponse
    {
        $phone = DB::table('rooms')
            ->join('users', 'users.id', '=', 'rooms.landlord_id')
            ->where('rooms.id', $roomId)
            ->where('rooms.status', 'approved')
            ->value('users.phone');

        if (!$phone) {
            abort(404, 'Không tìm thấy thông tin liên hệ cho tin này.');
        }

        return response()->json(['phone' => $phone]);
    }

    public function districts(): JsonResponse
    {
        return response()->json(
            DB::table('districts')->orderBy('name')->get(['id', 'name', 'slug'])
        );
    }

    public function amenities(): JsonResponse
    {
        return response()->json(
            DB::table('amenities')->orderBy('id')->get(['id', 'name', 'icon'])
        );
    }

    public function publicRoomQuery(): Builder
    {
        return DB::table('rooms')
            ->join('districts', 'districts.id', '=', 'rooms.district_id')
            ->where('rooms.status', 'approved')
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
                'rooms.is_featured as featured',
                'rooms.view_count as views',
                'rooms.created_at as createdAt'
            );
    }

    public function attachRoomRelations(Collection $rooms): Collection
    {
        if ($rooms->isEmpty()) {
            return $rooms;
        }

        $roomIds = $rooms->pluck('id');
        $images = DB::table('room_images')
            ->whereIn('room_id', $roomIds)
            ->orderByDesc('is_primary')
            ->orderBy('sort_order')
            ->get(['id', 'room_id', 'image_url', 'is_primary', 'sort_order']);
        $amenities = DB::table('room_amenities')
            ->join('amenities', 'amenities.id', '=', 'room_amenities.amenity_id')
            ->whereIn('room_amenities.room_id', $roomIds)
            ->orderBy('amenities.id')
            ->get([
                'room_amenities.room_id',
                'amenities.id',
                'amenities.name',
                'amenities.icon',
            ]);

        foreach ($rooms as $room) {
            $roomImages = $images->where('room_id', $room->id)->values();
            $room->images = $roomImages->map(fn (object $image): array => [
                'id' => $image->id,
                'imageUrl' => $image->image_url,
                'isPrimary' => (bool) $image->is_primary,
                'sortOrder' => $image->sort_order,
            ]);
            $room->coverImage = $roomImages->first()?->image_url;
            $room->amenities = $amenities->where('room_id', $room->id)
                ->map(fn (object $amenity): array => [
                    'id' => $amenity->id,
                    'name' => $amenity->name,
                    'icon' => $amenity->icon,
                ])
                ->values();
        }

        return $rooms;
    }
}
