<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\RoomController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RoomInteractionController extends Controller
{
    public function savedRooms(Request $request, RoomController $rooms): JsonResponse
    {
        $savedIds = DB::table('saved_rooms')
            ->where('user_id', $request->user()->id)
            ->pluck('room_id');

        if ($savedIds->isEmpty()) {
            return response()->json([]);
        }

        $saved = $rooms->publicRoomQuery()
            ->whereIn('rooms.id', $savedIds)
            ->orderByDesc('rooms.created_at')
            ->get();

        return response()->json($rooms->attachRoomRelations($saved));
    }

    public function toggleSavedRoom(Request $request, int $roomId): JsonResponse
    {
        $roomExists = DB::table('rooms')
            ->where('id', $roomId)
            ->where('status', 'approved')
            ->exists();
        if (!$roomExists) {
            abort(404, 'Không tìm thấy tin phòng đang hiển thị.');
        }

        $saved = DB::transaction(function () use ($request, $roomId): bool {
            $query = DB::table('saved_rooms')
                ->where('user_id', $request->user()->id)
                ->where('room_id', $roomId);

            if ($query->exists()) {
                $query->delete();
                return false;
            }

            DB::table('saved_rooms')->insert([
                'user_id' => $request->user()->id,
                'room_id' => $roomId,
                'created_at' => now(),
            ]);
            return true;
        });

        return response()->json(['saved' => $saved]);
    }

    public function report(Request $request, int $roomId): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', Rule::in(['lua-dao', 'sai-gia', 'sai-hinh', 'spam', 'trung-lap', 'khac'])],
            'content' => ['required', 'string', 'max:500'],
        ]);

        $roomExists = DB::table('rooms')
            ->where('id', $roomId)
            ->where('status', 'approved')
            ->exists();
        if (!$roomExists) {
            abort(404, 'Không tìm thấy tin phòng đang hiển thị.');
        }

        $reason = [
            'lua-dao' => 'scam',
            'sai-gia' => 'wrong-price',
            'sai-hinh' => 'fake-image',
            'trung-lap' => 'other',
            'khac' => 'other',
        ][$data['reason']] ?? $data['reason'];

        $reportId = DB::table('reports')->insertGetId([
            'room_id' => $roomId,
            'reporter_id' => $request->user()->id,
            'reason' => $reason,
            'content' => $data['content'],
            'status' => 'open',
            'handled_by' => null,
            'created_at' => now(),
        ]);

        return response()->json(['id' => $reportId, 'message' => 'Đã gửi báo cáo.'], 201);
    }

    public function message(Request $request, int $roomId): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
        ]);
        $room = DB::table('rooms')
            ->where('id', $roomId)
            ->where('status', 'approved')
            ->first(['landlord_id']);
        if (!$room) {
            abort(404, 'Không tìm thấy tin phòng đang hiển thị.');
        }
        if ((int) $room->landlord_id === (int) $request->user()->id) {
            return response()->json(['message' => 'Bạn không thể nhắn tin cho chính mình.'], 422);
        }

        $messageId = DB::table('messages')->insertGetId([
            'sender_id' => $request->user()->id,
            'receiver_id' => $room->landlord_id,
            'room_id' => $roomId,
            'content' => $data['content'],
            'is_read' => false,
            'created_at' => now(),
        ]);

        return response()->json(['id' => $messageId, 'message' => 'Đã gửi tin nhắn.'], 201);
    }
}
