<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class ApiAuthorizationTest extends TestCase
{
    public function test_landlord_routes_require_authentication_and_return_json(): void
    {
        $response = $this->call('GET', '/api/landlord/rooms', server: ['HTTP_ACCEPT' => 'text/html']);

        $response->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_landlord_route_rejects_a_tenant(): void
    {
        $tenant = new User(['role' => 'tenant', 'status' => 'active']);

        $this->actingAs($tenant, 'sanctum')
            ->getJson('/api/landlord/rooms')
            ->assertForbidden()
            ->assertJson(['message' => 'Bạn không có quyền thực hiện thao tác này.']);
    }

    public function test_admin_route_rejects_a_landlord(): void
    {
        $landlord = new User(['role' => 'landlord', 'status' => 'active']);

        $this->actingAs($landlord, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertForbidden()
            ->assertJson(['message' => 'Bạn không có quyền thực hiện thao tác này.']);
    }

    public function test_locked_landlord_cannot_manage_rooms(): void
    {
        $landlord = new User(['role' => 'landlord', 'status' => 'locked']);

        $this->actingAs($landlord, 'sanctum')
            ->getJson('/api/landlord/rooms')
            ->assertForbidden()
            ->assertJson(['message' => 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.']);
    }
}
