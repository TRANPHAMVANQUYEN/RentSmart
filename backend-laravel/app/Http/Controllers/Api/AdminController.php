<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RoomImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $usersByRole = DB::table('users')
            ->select('role', DB::raw('COUNT(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');
        $roomsByStatus = DB::table('rooms')
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $roomsByType = DB::table('rooms')
            ->select('room_type as type', DB::raw('COUNT(*) as total'))
            ->groupBy('room_type')
            ->pluck('total', 'type');
        $topDistricts = DB::table('rooms')
            ->join('districts', 'districts.id', '=', 'rooms.district_id')
            ->select('districts.name', DB::raw('COUNT(*) as total'))
            ->groupBy('districts.id', 'districts.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();
        $dailyViews = DB::table('page_views')
            ->where('created_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('day')
            ->get();
        $weeklyRooms = DB::table('rooms')
            ->where('created_at', '>=', now()->subWeeks(7)->startOfWeek())
            ->selectRaw('YEARWEEK(created_at, 1) as week, COUNT(*) as total')
            ->groupByRaw('YEARWEEK(created_at, 1)')
            ->orderBy('week')
            ->get();
        $pendingRooms = $this->roomQuery()
            ->where('rooms.status', 'pending')
            ->orderByDesc('rooms.created_at')
            ->limit(5)
            ->get();
        $openReports = $this->reportQuery()
            ->where('reports.status', '<>', 'resolved')
            ->orderByDesc('reports.created_at')
            ->limit(5)
            ->get();

        return response()->json([
            'counts' => [
                'users' => (int) DB::table('users')->count(),
                'tenants' => (int) ($usersByRole['tenant'] ?? 0),
                'landlords' => (int) ($usersByRole['landlord'] ?? 0),
                'admins' => (int) ($usersByRole['admin'] ?? 0),
                'rooms' => (int) DB::table('rooms')->count(),
                'pendingRooms' => (int) ($roomsByStatus['pending'] ?? 0),
                'approvedRooms' => (int) ($roomsByStatus['approved'] ?? 0),
                'rejectedRooms' => (int) ($roomsByStatus['rejected'] ?? 0),
                'removedRooms' => (int) ($roomsByStatus['removed'] ?? 0),
                'rentedRooms' => (int) ($roomsByStatus['rented'] ?? 0),
                'todayViews' => (int) DB::table('page_views')->whereDate('created_at', today())->count(),
                'newAccounts' => (int) DB::table('users')->where('created_at', '>=', now()->subDays(7))->count(),
                'openReports' => (int) DB::table('reports')->where('status', '<>', 'resolved')->count(),
            ],
            'roomsByType' => $roomsByType,
            'usersByRole' => $usersByRole,
            'topDistricts' => $topDistricts,
            'dailyViews' => $dailyViews,
            'weeklyRooms' => $weeklyRooms,
            'pendingRooms' => $pendingRooms,
            'openReports' => $this->mapReports($openReports),
        ]);
    }

    public function users(): JsonResponse
    {
        $users = DB::table('users')
            ->leftJoin('rooms', 'rooms.landlord_id', '=', 'users.id')
            ->select(
                'users.id',
                'users.username',
                'users.email',
                'users.phone',
                'users.full_name as fullName',
                'users.avatar',
                'users.role',
                'users.status',
                'users.lock_reason as lockReason',
                'users.last_login_at as lastLogin',
                'users.created_at as createdAt',
                DB::raw('COUNT(rooms.id) as roomCount')
            )
            ->groupBy(
                'users.id',
                'users.username',
                'users.email',
                'users.phone',
                'users.full_name',
                'users.avatar',
                'users.role',
                'users.status',
                'users.lock_reason',
                'users.last_login_at',
                'users.created_at'
            )
            ->orderByDesc('users.created_at')
            ->get();

        return response()->json($users);
    }

    public function saveUser(Request $request, ?int $userId = null): JsonResponse
    {
        $user = $userId ? User::query()->findOrFail($userId) : null;
        $data = $request->validate([
            'username' => ['required', 'string', 'min:4', 'max:50', 'regex:/^[\w.]+$/', Rule::unique('users', 'username')->ignore($userId)],
            'email' => ['required', 'email', 'max:100', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['required', 'regex:/^0\d{9}$/', Rule::unique('users', 'phone')->ignore($userId)],
            'fullName' => ['required', 'string', 'min:2', 'max:100'],
            'avatar' => ['nullable', 'url', 'max:255'],
            'role' => ['required', Rule::in(['tenant', 'landlord', 'admin'])],
            'status' => ['required', Rule::in(['active', 'locked', 'pending'])],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8'],
        ]);

        if ($user && $user->role === 'admin' && $user->id === $request->user()->id
            && ($data['role'] !== 'admin' || $data['status'] !== 'active')) {
            throw ValidationException::withMessages(['role' => 'Không thể tự hạ quyền hoặc khóa tài khoản quản trị đang đăng nhập.']);
        }

        $attributes = [
            'username' => $data['username'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'full_name' => $data['fullName'],
            'avatar' => $data['avatar'] ?? null,
            'role' => $data['role'],
            'status' => $data['status'],
            'lock_reason' => $data['status'] === 'locked' ? ($request->input('lockReason') ?: 'Khóa bởi quản trị viên') : null,
        ];
        if (!empty($data['password'])) {
            $attributes['password_hash'] = Hash::make($data['password']);
        }

        if ($user) {
            $user->forceFill($attributes)->save();
            $action = 'Cập nhật tài khoản';
        } else {
            $user = User::query()->create($attributes);
            $action = 'Thêm tài khoản';
        }

        $this->recordActivity($request, $action, 'user', $user->id, $user->username);

        return response()->json(['user' => $this->userSummary($user->id)], $userId ? 200 : 201);
    }

    public function deleteUser(Request $request, int $userId): JsonResponse
    {
        $request->validate(['note' => ['nullable', 'string', 'max:255']]);
        $user = User::query()->findOrFail($userId);
        if ($user->role === 'admin' || $user->id === $request->user()->id) {
            throw ValidationException::withMessages(['user' => 'Không thể xóa tài khoản quản trị hoặc tài khoản đang đăng nhập.']);
        }
        if (DB::table('activity_logs')->where('admin_id', $user->id)->exists()) {
            throw ValidationException::withMessages(['user' => 'Tài khoản có nhật ký quản trị và không thể xóa; hãy khóa tài khoản thay thế.']);
        }

        DB::transaction(function () use ($request, $user): void {
            $roomIds = DB::table('rooms')->where('landlord_id', $user->id)->pluck('id');
            $this->deleteRooms($roomIds);
            DB::table('reports')->where('reporter_id', $user->id)->orWhere('handled_by', $user->id)->delete();
            DB::table('messages')->where('sender_id', $user->id)->orWhere('receiver_id', $user->id)->delete();
            DB::table('saved_rooms')->where('user_id', $user->id)->delete();
            DB::table('page_views')->where('user_id', $user->id)->update(['user_id' => null]);
            DB::table('personal_access_tokens')->where('tokenable_type', User::class)->where('tokenable_id', $user->id)->delete();
            $this->recordActivity($request, 'Xóa tài khoản', 'user', $user->id, $request->input('note') ?: $user->username);
            $user->delete();
        });

        return response()->json(['message' => 'Đã xóa tài khoản và dữ liệu liên quan.']);
    }

    public function updateUserStatus(Request $request, int $userId): JsonResponse
    {
        $user = User::query()->findOrFail($userId);
        $data = $request->validate([
            'status' => ['required', Rule::in(['active', 'locked', 'pending'])],
            'lockReason' => ['nullable', 'string', 'max:255'],
        ]);
        if ($user->role === 'admin' && ($user->id === $request->user()->id || $data['status'] !== 'active')) {
            throw ValidationException::withMessages(['status' => 'Không thể khóa hoặc tự thay đổi trạng thái tài khoản quản trị này.']);
        }
        $user->forceFill([
            'status' => $data['status'],
            'lock_reason' => $data['status'] === 'locked' ? ($data['lockReason'] ?: 'Khóa bởi quản trị viên') : null,
        ])->save();
        $this->recordActivity($request, $data['status'] === 'locked' ? 'Khóa tài khoản' : 'Mở khóa tài khoản', 'user', $user->id, $data['lockReason'] ?? null);

        return response()->json(['user' => $this->userSummary($user->id)]);
    }

    public function rooms(): JsonResponse
    {
        $rooms = $this->roomQuery()->orderByDesc('rooms.created_at')->get();
        $rooms->each(function (object $room): void {
            $room->images = DB::table('room_images')
                ->where('room_id', $room->id)
                ->orderByDesc('is_primary')
                ->orderBy('sort_order')
                ->get(['image_url as imageUrl', 'is_primary as isPrimary']);
            $room->amenityIds = DB::table('room_amenities')->where('room_id', $room->id)->pluck('amenity_id');
        });

        return response()->json($rooms);
    }

    public function saveRoom(Request $request, ?int $roomId = null): JsonResponse
    {
        $room = $roomId ? DB::table('rooms')->where('id', $roomId)->first() : null;
        if ($roomId && !$room) {
            abort(404, 'Không tìm thấy tin đăng.');
        }
        $data = $request->validate([
            'landlordId' => ['required', 'integer', Rule::exists('users', 'id')->where('role', 'landlord')],
            'title' => ['required', 'string', 'min:10', 'max:120'],
            'description' => ['required', 'string', 'min:20'],
            'price' => ['required', 'numeric', 'min:500000'],
            'area' => ['required', 'numeric', 'min:5', 'max:500'],
            'address' => ['required', 'string', 'max:255'],
            'districtId' => ['required', 'integer', Rule::exists('districts', 'id')],
            'roomType' => ['required', Rule::in(['phong-tro', 'nha-nguyen-can', 'can-ho', 'o-ghep'])],
            'amenityIds' => ['array'],
            'amenityIds.*' => ['integer', Rule::exists('amenities', 'id')],
            'images' => ['array', 'max:8'],
            'images.*.url' => ['required', 'string'],
            'images.*.primary' => ['sometimes', 'boolean'],
        ]);
        $attributes = [
            'landlord_id' => $data['landlordId'],
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
                'status' => 'approved',
                'is_featured' => false,
                'view_count' => 0,
                'created_at' => now(),
            ];
        }

        $savedId = DB::transaction(function () use ($request, $roomId, $room, $attributes, $data): int {
            if ($room) {
                DB::table('rooms')->where('id', $roomId)->update($attributes);
                $savedId = $roomId;
            } else {
                $savedId = DB::table('rooms')->insertGetId($attributes);
            }

            DB::table('room_images')->where('room_id', $savedId)->delete();
            foreach ($data['images'] ?? [] as $index => $image) {
                $imageUrl = RoomImageStorage::store($image['url'], $savedId);
                DB::table('room_images')->insert([
                    'room_id' => $savedId,
                    'image_url' => $imageUrl,
                    'is_primary' => (bool) ($image['primary'] ?? false),
                    'sort_order' => $index,
                ]);
            }
            DB::table('room_amenities')->where('room_id', $savedId)->delete();
            foreach (array_unique($data['amenityIds'] ?? []) as $amenityId) {
                DB::table('room_amenities')->insert(['room_id' => $savedId, 'amenity_id' => $amenityId]);
            }
            $this->recordActivity($request, $room ? 'Sửa tin' : 'Đăng tin hộ chủ nhà', 'room', $savedId, $data['title']);

            return $savedId;
        });

        return response()->json(['roomId' => $savedId], $roomId ? 200 : 201);
    }

    public function updateRoom(Request $request, int $roomId): JsonResponse
    {
        $room = DB::table('rooms')->where('id', $roomId)->first();
        if (!$room) {
            abort(404, 'Không tìm thấy tin đăng.');
        }
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'approved', 'rejected', 'removed', 'rented'])],
            'featured' => ['sometimes', 'boolean'],
            'rejectReason' => ['nullable', 'string', 'max:255'],
        ]);
        if (!$data) {
            throw ValidationException::withMessages(['room' => 'Không có nội dung cập nhật hợp lệ.']);
        }

        $changes = [];
        if (array_key_exists('status', $data)) {
            $changes['status'] = $data['status'];
            if (in_array($data['status'], ['rejected', 'removed'], true)) {
                $changes['reject_reason'] = $data['rejectReason'] ?? null;
            } else {
                $changes['reject_reason'] = null;
            }
        }
        if (array_key_exists('featured', $data)) {
            $changes['is_featured'] = (bool) $data['featured'];
        }
        DB::table('rooms')->where('id', $roomId)->update($changes);
        $this->recordActivity($request, 'Cập nhật tin đăng', 'room', $roomId, $data['rejectReason'] ?? ($data['status'] ?? 'Ghim tin'));

        return response()->json(['room' => $this->roomQuery()->where('rooms.id', $roomId)->first()]);
    }

    public function deleteRoom(Request $request, int $roomId): JsonResponse
    {
        $request->validate(['note' => ['nullable', 'string', 'max:255']]);
        if (!DB::table('rooms')->where('id', $roomId)->exists()) {
            abort(404, 'Không tìm thấy tin đăng.');
        }

        DB::transaction(function () use ($request, $roomId): void {
            $this->deleteRooms(collect([$roomId]));
            $this->recordActivity($request, 'Xóa vĩnh viễn tin', 'room', $roomId, 'Xóa bởi quản trị viên');
        });

        return response()->json(['message' => 'Đã xóa tin đăng và dữ liệu liên quan.']);
    }

    public function reports(): JsonResponse
    {
        return response()->json($this->mapReports($this->reportQuery()->orderByDesc('reports.created_at')->get()));
    }

    public function resolveReport(Request $request, int $reportId): JsonResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['ignore', 'remove', 'warn', 'lock', 'delete'])],
            'note' => ['nullable', 'string', 'max:255'],
        ]);
        $report = DB::table('reports')->where('reports.id', $reportId)->first();
        if (!$report) {
            abort(404, 'Không tìm thấy báo cáo.');
        }
        if ($report->status === 'resolved') {
            throw ValidationException::withMessages(['report' => 'Báo cáo này đã được xử lý trước đó.']);
        }

        DB::transaction(function () use ($request, $report, $data): void {
            $room = DB::table('rooms')->where('id', $report->room_id)->first();
            $note = ($data['note'] ?? '') ?: 'Đã kiểm tra thủ công';
            if ($data['action'] === 'remove' && $room) {
                DB::table('rooms')->where('id', $room->id)->update(['status' => 'removed', 'reject_reason' => $note]);
                $this->recordActivity($request, 'Gỡ tin', 'room', $room->id, $note);
            }
            if (in_array($data['action'], ['warn', 'lock', 'delete'], true) && $room) {
                $owner = User::query()->find($room->landlord_id);
                if ($owner && $owner->role !== 'admin' && $owner->id !== $request->user()->id) {
                    if ($data['action'] === 'lock') {
                        $owner->forceFill(['status' => 'locked', 'lock_reason' => $note])->save();
                        $this->recordActivity($request, 'Khóa tài khoản', 'user', $owner->id, $note);
                    } elseif ($data['action'] === 'delete') {
                        $this->deleteUserData($request, $owner);
                    } else {
                        $this->recordActivity($request, 'Cảnh cáo chủ tin', 'user', $owner->id, $note);
                    }
                }
            }
            DB::table('reports')->where('id', $report->id)->update([
                'status' => 'resolved',
                'handled_by' => $request->user()->id,
            ]);
            $this->recordActivity($request, 'Xử lý báo cáo', 'report', $report->id, $data['action'].': '.$note);
        });

        return response()->json(['message' => 'Đã cập nhật kết quả xử lý báo cáo.']);
    }

    public function activityLogs(): JsonResponse
    {
        return response()->json(
            DB::table('activity_logs')
                ->leftJoin('users', 'users.id', '=', 'activity_logs.admin_id')
                ->select(
                    'activity_logs.id',
                    'activity_logs.admin_id as adminId',
                    'users.full_name as adminName',
                    'activity_logs.action',
                    'activity_logs.target_type as targetType',
                    'activity_logs.target_id as targetId',
                    'activity_logs.note',
                    'activity_logs.created_at as createdAt'
                )
                ->orderByDesc('activity_logs.created_at')
                ->limit(1000)
                ->get()
                ->map(function (object $log): object {
                    $log->target = trim(($log->targetType ?: 'Mục').($log->targetId ? ' #'.$log->targetId : ''));
                    $log->admin = ['fullName' => $log->adminName ?: 'Không xác định'];
                    return $log;
                })
        );
    }

    private function roomQuery()
    {
        return DB::table('rooms')
            ->join('districts', 'districts.id', '=', 'rooms.district_id')
            ->join('users as owner', 'owner.id', '=', 'rooms.landlord_id')
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
                'owner.full_name as ownerName',
                'owner.username as ownerUsername',
                'owner.phone as contactPhone',
                DB::raw('(SELECT image_url FROM room_images WHERE room_images.room_id = rooms.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as coverImage'),
                DB::raw('(SELECT COUNT(*) FROM reports WHERE reports.room_id = rooms.id AND reports.status <> "resolved") as reportCount')
            );
    }

    private function reportQuery()
    {
        return DB::table('reports')
            ->leftJoin('rooms', 'rooms.id', '=', 'reports.room_id')
            ->leftJoin('users as reporter', 'reporter.id', '=', 'reports.reporter_id')
            ->leftJoin('users as owner', 'owner.id', '=', 'rooms.landlord_id')
            ->select(
                'reports.id',
                'reports.room_id as roomId',
                'reports.reporter_id as reporterId',
                'reports.reason',
                'reports.content',
                'reports.status',
                'reports.created_at as createdAt',
                'rooms.title as roomTitle',
                'rooms.landlord_id as landlordId',
                'reporter.full_name as reporterName',
                'owner.full_name as ownerName',
                'owner.username as ownerUsername'
            );
    }

    private function mapReports($reports)
    {
        return $reports->map(function (object $report): object {
            $report->reason = [
                'scam' => 'lua-dao',
                'wrong-price' => 'sai-gia',
                'fake-image' => 'sai-hinh',
                'other' => 'khac',
            ][$report->reason] ?? $report->reason;
            $report->status = $report->status === 'resolved' ? 'done' : $report->status;
            $report->room = $report->roomId ? [
                'id' => $report->roomId,
                'title' => $report->roomTitle,
                'landlordId' => $report->landlordId,
            ] : null;
            $report->reporter = ['id' => $report->reporterId, 'fullName' => $report->reporterName ?: 'Không xác định'];
            $report->owner = $report->landlordId ? [
                'id' => $report->landlordId,
                'fullName' => $report->ownerName ?: 'Không xác định',
                'username' => $report->ownerUsername ?: '',
                'role' => 'landlord',
            ] : null;
            return $report;
        });
    }

    private function userSummary(int $userId): array
    {
        $user = User::query()->findOrFail($userId);
        return [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'fullName' => $user->full_name,
            'avatar' => $user->avatar,
            'role' => $user->role,
            'status' => $user->status,
            'lockReason' => $user->lock_reason,
            'lastLogin' => $user->last_login_at,
            'createdAt' => $user->created_at,
            'roomCount' => DB::table('rooms')->where('landlord_id', $userId)->count(),
        ];
    }

    private function deleteUserData(Request $request, User $user): void
    {
        if (DB::table('activity_logs')->where('admin_id', $user->id)->exists()) {
            throw ValidationException::withMessages(['user' => 'Tài khoản có nhật ký quản trị và không thể xóa; hãy khóa tài khoản thay thế.']);
        }
        $roomIds = DB::table('rooms')->where('landlord_id', $user->id)->pluck('id');
        $this->deleteRooms($roomIds);
        DB::table('reports')->where('reporter_id', $user->id)->orWhere('handled_by', $user->id)->delete();
        DB::table('messages')->where('sender_id', $user->id)->orWhere('receiver_id', $user->id)->delete();
        DB::table('saved_rooms')->where('user_id', $user->id)->delete();
        DB::table('page_views')->where('user_id', $user->id)->update(['user_id' => null]);
        DB::table('personal_access_tokens')->where('tokenable_type', User::class)->where('tokenable_id', $user->id)->delete();
        $this->recordActivity($request, 'Xóa tài khoản', 'user', $user->id, $user->username);
        $user->delete();
    }

    private function deleteRooms($roomIds): void
    {
        if ($roomIds->isEmpty()) {
            return;
        }
        $imageUrls = DB::table('room_images')->whereIn('room_id', $roomIds)->pluck('image_url');
        DB::afterCommit(function () use ($imageUrls): void {
            foreach ($imageUrls as $imageUrl) {
                $path = parse_url($imageUrl, PHP_URL_PATH);
                if (is_string($path) && str_starts_with($path, '/storage/rooms/')) {
                    Storage::disk('public')->delete(substr($path, strlen('/storage/')));
                }
            }
        });
        DB::table('room_images')->whereIn('room_id', $roomIds)->delete();
        DB::table('room_amenities')->whereIn('room_id', $roomIds)->delete();
        DB::table('saved_rooms')->whereIn('room_id', $roomIds)->delete();
        DB::table('reports')->whereIn('room_id', $roomIds)->delete();
        DB::table('messages')->whereIn('room_id', $roomIds)->delete();
        DB::table('page_views')->whereIn('room_id', $roomIds)->update(['room_id' => null]);
        DB::table('rooms')->whereIn('id', $roomIds)->delete();
    }

    private function recordActivity(Request $request, string $action, string $type, int $id, ?string $note): void
    {
        DB::table('activity_logs')->insert([
            'admin_id' => $request->user()->id,
            'action' => mb_substr($action, 0, 60),
            'target_type' => mb_substr($type, 0, 30),
            'target_id' => $id,
            'note' => $note ? mb_substr($note, 0, 255) : null,
            'created_at' => now(),
        ]);
    }
}
