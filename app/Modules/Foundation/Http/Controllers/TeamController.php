<?php

namespace App\Modules\Foundation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Foundation\Models\OrganizationInvitation;
use App\Modules\Foundation\Models\AuditLog;
use App\Shared\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class TeamController extends Controller
{
    private function channelAccess(array $ids): void
    {
        $count = TenantContext::get()->channels()->whereIn('id', $ids)->count();
        abort_unless($count === count(array_unique($ids)), 422, 'Choose numbers belonging to this workspace.');
    }
    public function invite(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:255', 'role' => 'required|in:Admin,Manager,Agent,Viewer', 'channel_access' => 'nullable|array', 'channel_access.*' => 'uuid']);
        $this->channelAccess($data['channel_access'] ?? []);
        $org = TenantContext::get();
        $plan = config('release.plans.'.$org->subscription_plan, config('release.plans.starter'));
        abort_if($org->users()->count() + $org->invitations()->whereNull('accepted_at')->where('expires_at', '>', now())->count() >= $plan['seats'], 422, 'Team member allowance reached.');
        abort_if($org->users()->where('email', $data['email'])->exists(), 422, 'This user is already a member.');
        $invite = OrganizationInvitation::updateOrCreate(['organization_id' => $org->id, 'email' => $data['email'], 'accepted_at' => null], ['role' => $data['role'], 'channel_access' => $data['channel_access'] ?? [], 'token' => \Illuminate\Support\Str::random(48), 'expires_at' => now()->addDays(7)]);
        Notification::route('mail', $invite->email)->notify(new \App\Modules\Foundation\Notifications\WorkspaceInvitation($org->name, $invite->token));
        AuditLog::record('team.invitation.created', $invite);
        return back()->with('success', 'Invitation created and submitted to the mail service.');
    }
    public function update(Request $request)
    {
        $data = $request->validate(['user_id' => 'required|integer', 'role' => 'required|in:Admin,Manager,Agent,Viewer', 'channel_access' => 'nullable|array', 'channel_access.*' => 'uuid']);
        $this->channelAccess($data['channel_access'] ?? []);
        $org = TenantContext::get(); $member = $org->users()->findOrFail($data['user_id']);
        abort_if($member->pivot->role === 'Owner', 422, 'The workspace owner role cannot be changed here.');
        $org->users()->updateExistingPivot($member->id, ['role' => $data['role'], 'channel_access' => json_encode($data['channel_access'] ?? [])]);
        AuditLog::record('team.member.updated', $member); return back()->with('success', 'Team member updated.');
    }
    public function remove(Request $request, int $id)
    {
        $org = TenantContext::get(); $member = $org->users()->findOrFail($id);
        abort_if($member->id === $request->user()->id || $member->pivot->role === 'Owner', 422, 'You cannot remove yourself or the workspace owner.');
        $org->users()->detach($id);
        if ($member->current_organization_id === $org->id) { $member->update(['current_organization_id' => null]); }
        AuditLog::record('team.member.removed', $member); return back()->with('success', 'Team member removed.');
    }
    public function permissions(Request $request)
    {
        abort_unless($request->user()->isOwnerOf(TenantContext::get()) || $request->user()->isSuperAdmin(), 403, 'Only the workspace owner can edit role permissions.');
        $data = $request->validate(['matrix' => 'required|array', 'matrix.*' => 'array', 'matrix.*.*' => 'array', 'matrix.*.*.*' => 'boolean']);
        $org = TenantContext::get(); $meta = $org->metadata ?? []; $meta['role_permissions'] = $data['matrix']; $org->update(['metadata' => $meta]);
        AuditLog::record('team.permissions.updated', $org); return back()->with('success', 'Permissions saved.');
    }
    public function accept(Request $request, string $token)
    {
        DB::transaction(function () use ($request, $token) {
            $invitation = OrganizationInvitation::where('token', $token)->lockForUpdate()->firstOrFail();
            abort_if($invitation->isExpired() || $invitation->isAccepted(), 410, 'This invitation has expired or has already been accepted.');
            abort_unless(strcasecmp($request->user()->email, $invitation->email) === 0, 403, 'Sign in using the invited email address.');
            $org = Organization::whereKey($invitation->organization_id)->lockForUpdate()->firstOrFail();
            abort_unless($org->isActive(), 403, 'This workspace is suspended.');
            $org->users()->syncWithoutDetaching([$request->user()->id => ['role' => $invitation->role, 'channel_access' => json_encode($invitation->channel_access ?? [])]]);
            $invitation->update(['accepted_at' => now()]); $request->user()->switchOrganization($org);
        });
        return redirect('/dashboard')->with('success', 'Workspace invitation accepted.');
    }
}
