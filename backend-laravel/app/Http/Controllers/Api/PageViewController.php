<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PageViewController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'path' => ['required', 'string', 'max:255'],
            'roomId' => ['nullable', 'integer'],
            'device' => ['required', Rule::in(['mobile', 'desktop', 'tablet'])],
            'source' => ['nullable', 'string', 'max:255'],
        ]);
        if (str_starts_with($data['path'], '/admin/')) {
            return response()->json(['message' => 'Không ghi nhận lượt truy cập khu vực quản trị.'], 422);
        }
        $roomId = !empty($data['roomId']) && DB::table('rooms')->where('id', $data['roomId'])->exists()
            ? $data['roomId']
            : null;

        DB::table('page_views')->insert([
            'user_id' => null,
            'room_id' => $roomId,
            'path' => $data['path'],
            'ip_address' => null,
            'device' => $data['device'],
            'source' => $data['source'] ?? null,
            'created_at' => now(),
        ]);

        return response()->json(['recorded' => true], 201);
    }

    public function traffic(Request $request): JsonResponse
    {
        $period = $request->query('period', 'day');
        if (!in_array($period, ['day', 'week', 'month'], true)) {
            return response()->json(['message' => 'Khoảng thời gian không hợp lệ.'], 422);
        }

        $days = $period === 'day' ? 30 : ($period === 'week' ? 84 : 365);
        $start = $period === 'month'
            ? now()->subMonths(11)->startOfMonth()
            : now()->subDays($days - 1)->startOfDay();
        $views = DB::table('page_views')->where('created_at', '>=', $start);
        $bucket = match ($period) {
            'week' => 'YEARWEEK(created_at, 1)',
            'month' => "DATE_FORMAT(created_at, '%Y-%m')",
            default => 'DATE(created_at)',
        };
        $periodViews = (clone $views)->selectRaw("{$bucket} as label, COUNT(*) as total")
            ->groupByRaw($bucket)
            ->orderBy('label')
            ->get();

        return response()->json([
            'period' => $period,
            'counts' => [
                'today' => (int) DB::table('page_views')->whereDate('created_at', today())->count(),
                'last24Hours' => (int) DB::table('page_views')->where('created_at', '>=', now()->subHours(24))->count(),
                'last30Days' => (int) DB::table('page_views')->where('created_at', '>=', now()->subDays(29)->startOfDay())->count(),
            ],
            'periodViews' => $periodViews,
            'devices' => (clone $views)->select('device', DB::raw('COUNT(*) as total'))
                ->groupBy('device')->pluck('total', 'device'),
            'sources' => (clone $views)->whereNotNull('source')->where('source', '<>', '')
                ->select('source', DB::raw('COUNT(*) as total'))
                ->groupBy('source')->orderByDesc('total')->limit(8)->get(),
            'topPages' => (clone $views)->select('path', DB::raw('COUNT(*) as total'))
                ->groupBy('path')->orderByDesc('total')->limit(10)->get(),
            'accessLogs' => DB::table('page_views')
                ->where('created_at', '>=', $start)
                ->orderByDesc('created_at')->limit(100)
                ->get(['path', 'device', 'source', 'created_at as createdAt']),
        ]);
    }
}
