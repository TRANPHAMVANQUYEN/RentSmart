<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FrontendPasswordReset extends Notification
{
    use Queueable;

    public function __construct(private readonly string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_url'), '/').'/dat-lai-mat-khau.html?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], '', '&', PHP_QUERY_RFC3986);

        return (new MailMessage)
            ->subject('Đặt lại mật khẩu RentSmart')
            ->greeting('Xin chào!')
            ->line('Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu tài khoản RentSmart.')
            ->action('Đặt lại mật khẩu', $url)
            ->line('Liên kết có hiệu lực trong 60 phút. Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.');
    }
}
