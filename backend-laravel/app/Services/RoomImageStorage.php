<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RoomImageStorage
{
    public static function store(string $value, int $roomId): string
    {
        if (preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$#', $value, $matches)) {
            $contents = base64_decode($matches[2], true);
            if ($contents === false || strlen($contents) > 2 * 1024 * 1024) {
                throw ValidationException::withMessages(['images' => 'Ảnh không hợp lệ hoặc vượt quá 2 MB sau khi nén.']);
            }
            $imageInfo = getimagesizefromstring($contents);
            $expectedMime = $matches[1] === 'jpeg' ? 'image/jpeg' : "image/{$matches[1]}";
            if (!$imageInfo || $imageInfo['mime'] !== $expectedMime) {
                throw ValidationException::withMessages(['images' => 'Nội dung ảnh không khớp với định dạng được khai báo.']);
            }
            $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
            $path = "rooms/{$roomId}/".Str::uuid().".{$extension}";
            if (!Storage::disk('public')->put($path, $contents)) {
                throw new \RuntimeException('Không thể lưu ảnh phòng vào máy chủ.');
            }

            return Storage::disk('public')->url($path);
        }

        $scheme = parse_url($value, PHP_URL_SCHEME);
        $isAllowedUrl = filter_var($value, FILTER_VALIDATE_URL)
            && in_array(strtolower((string) $scheme), ['http', 'https'], true);
        if (strlen($value) > 255 || !(str_starts_with($value, '/storage/') || $isAllowedUrl)) {
            throw ValidationException::withMessages(['images' => 'Đường dẫn ảnh không hợp lệ.']);
        }

        return $value;
    }

    public static function deleteStored(string $imageUrl): void
    {
        $path = parse_url($imageUrl, PHP_URL_PATH);
        if (is_string($path) && str_starts_with($path, '/storage/rooms/')) {
            Storage::disk('public')->delete(substr($path, strlen('/storage/')));
        }
    }
}
