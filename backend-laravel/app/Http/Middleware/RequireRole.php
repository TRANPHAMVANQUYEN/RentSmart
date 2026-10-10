<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        if (!$user || $user->role !== $role) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện thao tác này.'], 403);
        }
        if ($user->status === 'locked') {
            return response()->json(['message' => 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.'], 403);
        }

        return $next($request);
    }
}
