<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\BotGuard;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        abort_unless(config('security.auth.public_registration'), 404);

        // Get available user roles for registration with specific order
        $roleOrder = ['super-admin', 'administrator', 'inventory-manager', 'cashier'];
        $userRoles = Role::whereIn('name', $roleOrder)
            ->get(['id', 'name'])
            ->sortBy(function ($role) use ($roleOrder) {
                return array_search($role->name, $roleOrder);
            })
            ->values();

        return Inertia::render('Auth/Register', [
            'botGuard' => BotGuard::payload(),
            'userRoles' => $userRoles,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        abort_unless(config('security.auth.public_registration'), 404);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:super-admin,administrator,inventory-manager,cashier',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Automatically verify email in localhost/development environments
        if (app()->environment('local', 'testing')) {
            $user->markEmailAsVerified();
        }

        // Assign the selected role to the new user
        $user->assignRole($request->role);

        event(new Registered($user));

        Auth::login($user);

        // Skip the verification notice in localhost/development environments
        if (app()->environment('local', 'testing')) {
            return redirect()->route('dashboard');
        }

        return redirect()->route('verification.notice');
    }
}