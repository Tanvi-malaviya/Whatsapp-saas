<?php

namespace App\Modules\Foundation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Foundation\Models\AuditLog;
use App\Shared\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OrganizationSettingsController extends Controller
{
    public function index()
    {
        $org = TenantContext::get();
        return Inertia::render('settings/organization', ['organization' => $org->only(['id','name','slug','billing_email','timezone','currency']), 'members' => $org->users()->get(['users.id','name','email']), 'channels' => $org->channels()->get(['id','name','phone_number','waba_id','status'])]);
    }
    public function update(Request $request)
    {
        $org = TenantContext::get();
        $data = $request->validate(['name' => 'required|string|max:100', 'slug' => ['required','alpha_dash','max:100',Rule::unique('organizations')->ignore($org->id)], 'billing_email' => 'required|email|max:255', 'timezone' => 'required|timezone', 'currency' => 'required|in:INR,USD,EUR,GBP,AED']);
        $org->update($data); AuditLog::record('workspace.profile.updated', $org);
        return back()->with('success', 'Workspace settings saved.');
    }
}
