<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validate([
            'fullName' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email', 'max:100', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['required', 'regex:/^0\d{9}$/', Rule::unique('users', 'phone')->ignore($user->id)],
            'avatar' => ['sometimes', 'nullable', 'string', 'max:3000000'],
        ]);

        $attributes = [
            'full_name' => $data['fullName'],
            'email' => $data['email'],
            'phone' => $data['phone'],
        ];
        if (array_key_exists('avatar', $data)) {
            $attributes['avatar'] = $data['avatar'] === null ? null : $this->storeAvatar($data['avatar'], $user->id);
        }

        $oldAvatar = $user->avatar;
        DB::transaction(function () use ($user, $attributes, $oldAvatar, $data): void {
            $user->forceFill($attributes)->save();
            if (array_key_exists('avatar', $data) && $oldAvatar && $oldAvatar !== $user->avatar) {
                DB::afterCommit(fn () => $this->deleteStoredAvatar($oldAvatar));
            }
        });

        return response()->json(['user' => $this->userData($user)]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validate([
            'currentPassword' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $storedHash = $user->password_hash;
        if (!Hash::check($data['currentPassword'], $storedHash)) {
            throw ValidationException::withMessages(['currentPassword' => 'Mật khẩu hiện tại không đúng.']);
        }

        $user->forceFill(['password_hash' => Hash::make($data['password'])])->save();

        return response()->json(['message' => 'Đã đổi mật khẩu.']);
    }

    private function userData(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'fullName' => $user->full_name,
            'avatar' => $user->avatar,
            'role' => $user->role,
            'status' => $user->status,
        ];
    }

    private function storeAvatar(string $value, int $userId): string
    {
        if (!preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$#', $value, $matches)) {
            throw ValidationException::withMessages(['avatar' => 'Ảnh đại diện không hợp lệ.']);
        }
        $contents = base64_decode($matches[2], true);
        $imageInfo = $contents === false ? false : getimagesizefromstring($contents);
        $expectedMime = $matches[1] === 'jpeg' ? 'image/jpeg' : "image/{$matches[1]}";
        if ($contents === false || strlen($contents) > 2 * 1024 * 1024 || !$imageInfo || $imageInfo['mime'] !== $expectedMime) {
            throw ValidationException::withMessages(['avatar' => 'Ảnh đại diện không hợp lệ hoặc vượt quá 2 MB sau khi nén.']);
        }

        $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
        $path = "avatars/{$userId}/".Str::uuid().".{$extension}";
        if (!Storage::disk('public')->put($path, $contents)) {
            throw new \RuntimeException('Không thể lưu ảnh đại diện vào máy chủ.');
        }

        return Storage::disk('public')->url($path);
    }

    private function deleteStoredAvatar(string $avatar): void
    {
        $path = parse_url($avatar, PHP_URL_PATH);
        if (is_string($path) && str_starts_with($path, '/storage/avatars/')) {
            Storage::disk('public')->delete(substr($path, strlen('/storage/')));
        }
    }
}
