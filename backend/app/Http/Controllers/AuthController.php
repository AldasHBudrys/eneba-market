<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * Token auth with Sanctum: register/login return a plain-text token once; the DB only stores its hash.
 * The frontend sends it back as "Authorization: Bearer <token>".
 */
class AuthController extends Controller
{
    /** POST /api/auth/register */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);
        $user = User::create($data); // the User model's 'hashed' cast hashes the password

        return response()->json($this->session($user), 201);
    }

    /** POST /api/auth/login */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            // Same message for "no such email" and "wrong password", so it doesn't reveal which emails have accounts.
            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }

        return $this->session($user);
    }

    /** POST /api/auth/logout: revokes only the token used for this request (other devices stay logged in). */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    /** GET /api/me */
    public function me(Request $request)
    {
        return $request->user()->only('id', 'name', 'email');
    }

    private function session(User $user): array
    {
        return [
            'token' => $user->createToken('web')->plainTextToken,
            'user' => $user->only('id', 'name', 'email'),
        ];
    }
}
