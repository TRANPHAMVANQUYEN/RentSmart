<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'min:4', 'max:20', 'regex:/^[\w.]+$/', Rule::unique('users', 'username')],
            'email' => ['required', 'email', 'max:100', Rule::unique('users', 'email')],
            'phone' => ['required', 'regex:/^0\d{9}$/', Rule::unique('users', 'phone')],
            'password' => ['required', 'string', 'min:8'],
            'fullName' => ['required', 'string', 'min:2', 'max:255'],
            'role' => ['required', Rule::in(['tenant', 'landlord'])],
        ]);

        $user = User::create([
            'username' => $data['username'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password_hash' => Hash::make($data['password']),
            'full_name' => $data['fullName'],
            'role' => $data['role'],
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Đăng ký thành công.',
            'user' => $this->userData($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        $identifier = trim($data['identifier']);
        $user = User::query()
            ->where('username', $identifier)
            ->orWhere('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (!$user || !$this->verifyPassword($user, $data['password'])) {
            return response()->json(['message' => 'Sai tài khoản hoặc mật khẩu.'], 401);
        }

        if ($user->status === 'locked') {
            return response()->json(['message' => 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.'], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken('rentsmart', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userData($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userData($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Đã đăng xuất.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:100']]);
        $status = Password::sendResetLink(['email' => $data['email']]);

        if ($status !== Password::RESET_LINK_SENT && $status !== Password::INVALID_USER) {
            return response()->json(['message' => 'Không thể gửi hướng dẫn lúc này. Vui lòng thử lại sau.'], 503);
        }

        return response()->json([
            'message' => 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email', 'max:100'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill(['password_hash' => Hash::make($password)])->save();
            $user->tokens()->delete();
        });

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'], 422);
        }

        return response()->json(['message' => 'Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.']);
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

    private function verifyPassword(User $user, string $password): bool
    {
        $storedHash = $user->password_hash;
        $algorithm = password_get_info($storedHash)['algoName'] ?? 'unknown';

        if ($algorithm === 'bcrypt') {
            return Hash::check($password, $storedHash);
        }

        if ($algorithm !== 'unknown' || !preg_match('/\A[a-f0-9]{64}\z/i', $storedHash)) {
            return false;
        }

        if (!hash_equals(strtolower($storedHash), hash('sha256', $password))) {
            return false;
        }

        $user->forceFill(['password_hash' => Hash::make($password)])->save();

        return true;
    }
}
