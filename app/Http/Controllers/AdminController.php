<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Shared\TenantContext;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    private function ensureSchemaReady(): void
    {
        try {
            if (!Schema::hasColumn('organizations', 'max_channels')) {
                Schema::table('organizations', function (Blueprint $table) {
                    $table->integer('max_channels')->default(1)->after('subscription_plan');
                });
                DB::table('organizations')
                    ->where('slug', 'sathwara-infotech')
                    ->orWhere('name', 'like', '%Sathwara%')
                    ->update(['max_channels' => 20]);
            }

            if (!Schema::hasColumn('users', 'is_super_admin')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->boolean('is_super_admin')->default(false)->after('email');
                });
                DB::table('users')
                    ->where('email', 'like', '%sathwara%')
                    ->orWhere('email', 'like', '%malaviya%')
                    ->orWhere('id', 1)
                    ->update(['is_super_admin' => true]);
            }
        } catch (\Throwable $e) {}
    }

    private function ensureSuperAdmin(Request $request): void
    {
        $this->ensureSchemaReady();

        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated. Please log in.');
        }

        if (!$user->isSuperAdmin()) {
            abort(403, 'Unauthorized access. Super Administrator role required.');
        }
    }

    /**
     * Show Super Admin Login Page
     */
    public function showLogin(Request $request): Response|RedirectResponse
    {
        $this->ensureSchemaReady();

        if ($request->user() && $request->user()->isSuperAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('admin/login', [
            'status' => session('status'),
        ]);
    }

    /**
     * Process Super Admin Login
     */
    public function login(Request $request): RedirectResponse
    {
        $this->ensureSchemaReady();

        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember');

        if (!Auth::attempt($credentials, $remember)) {
            return back()->withErrors([
                'email' => 'Invalid admin credentials or password.',
            ])->onlyInput('email');
        }

        $user = Auth::user();

        // Strictly verify that the user is a Super Administrator
        if (!$user->isSuperAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()->withErrors([
                'email' => 'Access Denied: This account does not have Super Administrator privileges.',
            ])->onlyInput('email');
        }

        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * Super Admin Logout
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')->with('success', 'You have been safely signed out from the Super Admin portal.');
    }

    /**
     * Super Admin Overview Dashboard
     */
    public function dashboard(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $totalClients = Organization::count();
        $totalChannels = WhatsAppChannel::count();
        $totalUsers = User::count();
        $totalMessages = Message::count();

        $hasMaxChannels = Schema::hasColumn('organizations', 'max_channels');

        $singleNumberClients = $hasMaxChannels
            ? Organization::where('max_channels', 1)->count()
            : Organization::all()->filter(fn ($o) => $o->getMaxChannels() === 1)->count();

        $multiNumberClients = $hasMaxChannels
            ? Organization::where(function ($q) {
                $q->where('max_channels', '>', 1)->orWhere('max_channels', '<=', 0);
            })->count()
            : Organization::all()->filter(fn ($o) => $o->getMaxChannels() > 1 || $o->getMaxChannels() <= 0)->count();

        $recentOrganizations = Organization::withCount('channels')
            ->latest()
            ->take(6)
            ->get()
            ->map(fn ($org) => [
                'id' => (string) $org->id,
                'name' => $org->name,
                'slug' => $org->slug,
                'subscription_plan' => $org->subscription_plan ?: 'starter',
                'max_channels' => $org->getMaxChannels(),
                'channels_count' => (int) $org->channels_count,
                'status' => $org->status ?: 'active',
                'created_at' => $org->created_at ? $org->created_at->format('M d, Y') : '—',
            ]);

        $recentChannels = WhatsAppChannel::with('organization:id,name,slug')
            ->latest()
            ->take(6)
            ->get()
            ->map(fn ($ch) => [
                'id' => (string) $ch->id,
                'name' => $ch->name,
                'phone_number' => $ch->phone_number,
                'phone_number_id' => $ch->phone_number_id,
                'organization_name' => $ch->organization?->name ?: 'Unknown',
                'quality_rating' => $ch->quality_rating ?: 'GREEN',
                'status' => $ch->status,
                'is_default' => (bool) $ch->is_default,
                'created_at' => $ch->created_at ? $ch->created_at->format('M d, Y') : '—',
            ]);

        return Inertia::render('admin/dashboard', [
            'metrics' => [
                'totalClients' => $totalClients,
                'totalChannels' => $totalChannels,
                'totalUsers' => $totalUsers,
                'totalMessages' => $totalMessages,
                'singleNumberClients' => $singleNumberClients,
                'multiNumberClients' => $multiNumberClients,
            ],
            'recentOrganizations' => $recentOrganizations,
            'recentChannels' => $recentChannels,
        ]);
    }

    /**
     * Client Workspaces & WhatsApp Quota Limits Management
     */
    public function organizations(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $organizations = Organization::withCount(['channels', 'users'])
            ->with([
                'channels:id,organization_id,name,phone_number,phone_number_id,waba_id,quality_rating,status,is_default',
                'users:id,name,email',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($org) {
                return [
                    'id' => (string) $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'billing_email' => $org->billing_email,
                    'subscription_plan' => $org->subscription_plan ?: 'starter',
                    'max_channels' => $org->getMaxChannels(),
                    'channels_count' => (int) $org->channels_count,
                    'users_count' => (int) $org->users_count,
                    'status' => $org->status ?: 'active',
                    'created_at' => $org->created_at ? $org->created_at->format('M d, Y') : '—',
                    'channels' => $org->channels->map(fn ($c) => [
                        'id' => (string) $c->id,
                        'name' => $c->name,
                        'phone_number' => $c->phone_number,
                        'phone_number_id' => $c->phone_number_id,
                        'quality_rating' => $c->quality_rating ?: 'GREEN',
                        'status' => $c->status,
                        'is_default' => (bool) $c->is_default,
                    ]),
                    'owner' => $org->users->first() ? [
                        'id' => $org->users->first()->id,
                        'name' => $org->users->first()->name,
                        'email' => $org->users->first()->email,
                    ] : null,
                ];
            });

        return Inertia::render('admin/organizations', [
            'organizations' => $organizations,
            'currentOrgId' => TenantContext::id() ?? $request->user()?->current_organization_id,
        ]);
    }

    /**
     * Update an Organization's WhatsApp Quota and Subscription Plan
     */
    public function updateLimit(Request $request, string $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'max_channels' => 'required|integer|min:0', // 0 = unlimited, 1 = single, 2+ = multi
            'subscription_plan' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:active,suspended',
        ]);

        $org = Organization::findOrFail($id);
        $data = [
            'subscription_plan' => $validated['subscription_plan'] ?? $org->subscription_plan,
            'status' => $validated['status'] ?? $org->status,
        ];

        if (Schema::hasColumn('organizations', 'max_channels')) {
            $data['max_channels'] = (int) $validated['max_channels'];
        } else {
            $metadata = $org->metadata ?? [];
            $metadata['max_channels'] = (int) $validated['max_channels'];
            $data['metadata'] = $metadata;
        }

        $org->update($data);

        $limitText = $validated['max_channels'] == 0
            ? 'Unlimited numbers'
            : ($validated['max_channels'] == 1 ? 'Single Number (1 max)' : "Multiple Numbers ({$validated['max_channels']} max)");

        return back()->with('success', "Limits updated for {$org->name}: {$limitText}");
    }

    /**
     * Jump / Impersonate directly into a Client's workspace
     */
    public function switchWorkspace(Request $request, string $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $org = Organization::findOrFail($id);
        $user = $request->user();

        if ($user) {
            $user->switchOrganization($org);
        }

        return redirect()->route('dashboard')->with('success', "Switched workspace to {$org->name}");
    }

    /**
     * Global Master List of All WhatsApp Channels
     */
    public function channels(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $channels = WhatsAppChannel::with('organization:id,name,slug')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($ch) => [
                'id' => (string) $ch->id,
                'organization_id' => (string) $ch->organization_id,
                'organization_name' => $ch->organization?->name ?: 'Unknown Organization',
                'organization_slug' => $ch->organization?->slug ?: '',
                'name' => $ch->name,
                'phone_number' => $ch->phone_number,
                'phone_number_id' => $ch->phone_number_id,
                'waba_id' => $ch->waba_id,
                'quality_rating' => $ch->quality_rating ?: 'GREEN',
                'messaging_limit' => $ch->messaging_limit ?: 'TIER_1K',
                'status' => $ch->status,
                'is_default' => (bool) $ch->is_default,
                'webhook_verified' => !empty($ch->webhook_verified_at),
                'created_at' => $ch->created_at ? $ch->created_at->format('M d, Y H:i') : '—',
            ]);

        return Inertia::render('admin/channels', [
            'channels' => $channels,
        ]);
    }

    /**
     * System Users Directory
     */
    public function users(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $users = User::with('organizations:id,name,slug')
            ->orderBy('id', 'asc')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'is_super_admin' => (bool) $u->is_super_admin,
                'organizations' => $u->organizations->map(fn ($o) => [
                    'id' => (string) $o->id,
                    'name' => $o->name,
                    'role' => $o->pivot->role ?? 'Member',
                ]),
                'created_at' => $u->created_at ? $u->created_at->format('M d, Y') : '—',
            ]);

        return Inertia::render('admin/users', [
            'users' => $users,
        ]);
    }

    /**
     * Create a New User & Client Workspace from Admin Panel
     */
    public function storeUser(Request $request): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'workspace_name' => ['nullable', 'string', 'max:255'],
            'max_channels' => ['nullable', 'integer', 'min:0'],
            'is_super_admin' => ['nullable', 'boolean'],
        ]);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ];

        if (Schema::hasColumn('users', 'is_super_admin')) {
            $userData['is_super_admin'] = (bool) $request->input('is_super_admin', false);
        }

        $user = User::create($userData);
        $user->markEmailAsVerified();

        // Auto-provision Workspace for user
        $wsName = !empty($validated['workspace_name'])
            ? $validated['workspace_name']
            : ($validated['name'] . "'s Workspace");
        $slug = Str::slug($wsName) . '-' . rand(100, 999);

        $orgData = [
            'name' => $wsName,
            'slug' => $slug,
            'subscription_plan' => 'growth',
            'status' => 'active',
        ];

        if (Schema::hasColumn('organizations', 'max_channels')) {
            $orgData['max_channels'] = $request->has('max_channels') ? (int) $request->input('max_channels') : 1;
        }

        $org = Organization::create($orgData);
        $user->organizations()->attach($org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $org->id]);

        return back()->with('success', "New user '{$user->name}' ({$user->email}) and workspace '{$org->name}' created successfully!");
    }

    /**
     * Update User Credentials (Name, Email, Password, Super Admin)
     */
    public function updateUser(Request $request, int $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $targetUser = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $targetUser->id],
            'password' => ['nullable', 'string', 'min:6'],
            'is_super_admin' => ['nullable', 'boolean'],
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'email_verified_at' => $targetUser->email_verified_at ?: now(),
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        if (Schema::hasColumn('users', 'is_super_admin')) {
            // Prevent demoting primary owner ID 1
            if ($targetUser->id === 1) {
                $updateData['is_super_admin'] = true;
            } else {
                $updateData['is_super_admin'] = (bool) $request->input('is_super_admin', false);
            }
        }

        $targetUser->update($updateData);

        return back()->with('success', "Credentials for '{$targetUser->name}' ({$targetUser->email}) updated successfully!");
    }

    /**
     * Delete a User Account
     */
    public function destroyUser(Request $request, int $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $targetUser = User::findOrFail($id);

        // Protect primary super admin ID 1
        if ($targetUser->id === 1) {
            return back()->with('error', 'Primary Super Administrator (ID 1) cannot be deleted.');
        }

        // Prevent super admin from deleting themselves
        if ($request->user() && $request->user()->id === $targetUser->id) {
            return back()->with('error', 'You cannot delete your own account while logged in.');
        }

        $userName = $targetUser->name;
        $userEmail = $targetUser->email;

        // Auto clean up workspaces where this user was the only member
        $userOrgs = $targetUser->organizations()->get();
        foreach ($userOrgs as $org) {
            if ($org->users()->count() <= 1) {
                $org->channels()->delete();
                $org->delete();
            }
        }

        // Detach from remaining organizations
        $targetUser->organizations()->detach();

        // Delete user
        $targetUser->delete();

        return back()->with('success', "User '{$userName}' ({$userEmail}) has been deleted successfully.");
    }

    /**
     * Delete an Organization / Client Workspace
     */
    public function destroyOrganization(Request $request, string $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $org = Organization::findOrFail($id);

        // Delete channels
        $org->channels()->delete();

        // Detach all users
        $org->users()->detach();

        // Soft delete the organization
        $org->delete();

        return back()->with('success', "Workspace '{$org->name}' has been deleted successfully.");
    }

    /**
     * Toggle Super Admin Privileges for a User
     */
    public function toggleSuperAdmin(Request $request, int $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $targetUser = User::findOrFail($id);

        // Protect primary owner from being demoted
        if ($targetUser->id === 1 && $targetUser->is_super_admin) {
            return back()->with('error', 'Primary Super Administrator (ID 1) cannot be revoked.');
        }

        if (Schema::hasColumn('users', 'is_super_admin')) {
            $targetUser->update([
                'is_super_admin' => !$targetUser->is_super_admin,
            ]);
        }

        $status = $targetUser->is_super_admin ? 'granted' : 'revoked';
        return back()->with('success', "Super Admin access {$status} for {$targetUser->name} ({$targetUser->email}).");
    }

    /**
     * Global Platform & Meta Cloud API Settings Overview
     */
    public function settings(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $appId = Cache::get('meta_app_id') ?: env('META_APP_ID', '1079349601748656');
        $configId = Cache::get('meta_config_id') ?: env('META_CONFIG_ID', '1835889181059188');
        $permanentToken = Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');
        $verifyToken = Cache::get('meta_verify_token') ?: env('META_VERIFY_TOKEN') ?: config('services.meta.verify_token', '3tPseIuEUrfCcUlCaZkeZp5a3y3bC7FXLUoLTPiMxQcrJnk6VlP3N8Tln5jOr16b');

        return Inertia::render('admin/settings', [
            'settings' => [
                'app_id' => $appId,
                'config_id' => $configId,
                'permanent_token' => $permanentToken,
                'webhook_url' => url('/webhooks/meta'),
                'verify_token' => $verifyToken,
                'graph_version' => 'v22.0',
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'environment' => config('app.env'),
            ],
        ]);
    }

    /**
     * Save Meta API Credentials & Webhook Settings
     */
    public function updateSettings(Request $request): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'app_id' => 'required|string|max:100',
            'config_id' => 'required|string|max:100',
            'verify_token' => 'required|string|max:255',
            'permanent_token' => 'nullable|string',
        ]);

        $appId = trim($validated['app_id']);
        $configId = trim($validated['config_id']);
        $verifyToken = trim($validated['verify_token']);
        $permanentToken = trim($validated['permanent_token'] ?? '');

        // 1. Store reliably in persistent cache / database
        Cache::forever('meta_app_id', $appId);
        Cache::forever('meta_config_id', $configId);
        Cache::forever('meta_verify_token', $verifyToken);
        if ($permanentToken !== '') {
            Cache::forever('meta_whatsapp_token', $permanentToken);
        }

        // 2. Safely attempt to write to .env (ignore permission errors on Linux server)
        try {
            $envPath = base_path('.env');
            if (file_exists($envPath) && is_writable($envPath)) {
                $envContent = file_get_contents($envPath);

                $replacements = [
                    'META_APP_ID' => $appId,
                    'META_CONFIG_ID' => $configId,
                    'META_VERIFY_TOKEN' => $verifyToken,
                ];
                if ($permanentToken !== '') {
                    $replacements['META_WHATSAPP_TOKEN'] = $permanentToken;
                }

                foreach ($replacements as $key => $value) {
                    if (preg_match("/^{$key}=.*/m", $envContent)) {
                        $envContent = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $envContent);
                    } else {
                        $envContent .= "\n{$key}={$value}";
                    }
                }

                file_put_contents($envPath, $envContent);
            }
        } catch (\Throwable $e) {
            // Non-critical if .env is read-only
        }

        // 3. If permanent token provided, dynamically sync details from Meta Graph API for all connected channels!
        $tokenToUse = $permanentToken ?: Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');
        if ($tokenToUse) {
            $channels = WhatsAppChannel::withoutGlobalScopes()->get();
            foreach ($channels as $ch) {
                // Update access token on channels if missing
                if (empty($ch->access_token)) {
                    $ch->update(['access_token' => $tokenToUse]);
                }

                // If channel phone_number is missing or 'Registered', fetch from Meta Graph API!
                if (empty($ch->phone_number) || str_contains($ch->phone_number, 'Registered')) {
                    if (!empty($ch->phone_number_id) && !str_starts_with($ch->phone_number_id, 'phone_')) {
                        try {
                            $resp = Http::withToken($tokenToUse)->get("https://graph.facebook.com/v22.0/{$ch->phone_number_id}", [
                                'fields' => 'display_phone_number,verified_name,quality_rating',
                            ]);
                            if ($resp->successful()) {
                                $data = $resp->json();
                                $ch->update(array_filter([
                                    'phone_number' => $data['display_phone_number'] ?? null,
                                    'name' => $data['verified_name'] ?? null,
                                    'quality_rating' => $data['quality_rating'] ?? 'GREEN',
                                    'access_token' => $tokenToUse,
                                ]));
                            }
                        } catch (\Throwable $e) {}
                    }
                }
            }
        }

        return redirect()->route('admin.settings')->with('success', 'Meta Cloud API settings updated and saved successfully.');
    }
}
