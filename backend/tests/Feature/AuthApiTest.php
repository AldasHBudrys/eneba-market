<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    private const NEW_USER = ['name' => 'Ada', 'email' => 'ada@example.test', 'password' => 'secret123', 'password_confirmation' => 'secret123'];

    public function test_register_returns_a_working_token_and_hashes_the_password(): void
    {
        $token = $this->postJson('/api/auth/register', self::NEW_USER)
            ->assertCreated()
            ->assertJsonPath('user.email', 'ada@example.test')
            ->json('token');

        $this->withToken($token)->getJson('/api/me')->assertOk()->assertJsonPath('name', 'Ada');
        $this->assertNotSame('secret123', User::first()->password); // stored as a hash, never plain text
    }

    public function test_register_rejects_duplicate_email_and_mismatched_confirmation(): void
    {
        User::create(['name' => 'Old', 'email' => 'ada@example.test', 'password' => 'whatever1']);

        $this->postJson('/api/auth/register', self::NEW_USER)->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/api/auth/register', ['email' => 'new@example.test', 'password_confirmation' => 'different1'] + self::NEW_USER)
            ->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_login_works_and_wrong_password_gets_a_generic_error(): void
    {
        User::create(['name' => 'Ada', 'email' => 'ada@example.test', 'password' => 'secret123']);

        $this->postJson('/api/auth/login', ['email' => 'ada@example.test', 'password' => 'secret123'])->assertOk()->assertJsonStructure(['token', 'user']);

        $wrong = $this->postJson('/api/auth/login', ['email' => 'ada@example.test', 'password' => 'nope12345'])->assertUnprocessable();
        $unknown = $this->postJson('/api/auth/login', ['email' => 'ghost@example.test', 'password' => 'nope12345'])->assertUnprocessable();
        $this->assertSame($wrong->json('errors'), $unknown->json('errors')); // can't tell "no account" from "wrong password"
    }

    public function test_me_requires_a_token_and_logout_revokes_it(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();

        $token = $this->postJson('/api/auth/register', self::NEW_USER)->json('token');
        $this->withToken($token)->postJson('/api/auth/logout')->assertNoContent();

        $this->app['auth']->forgetGuards(); // the test client caches the logged-in user between requests; real requests don't
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'ada@example.test', 'password' => 'guess'.$i])->assertUnprocessable();
        }
        $this->postJson('/api/auth/login', ['email' => 'ada@example.test', 'password' => 'guess7'])->assertTooManyRequests();
    }
}
