<?php

namespace App\Modules\Foundation\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Foundation\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function switch(Request $request, Organization $organization): RedirectResponse
    {
        $user = $request->user();

        if (! $user->organizations()->where('organizations.id', $organization->id)->exists()) {
            abort(403, 'You do not have access to this workspace.');
        }

        $user->switchOrganization($organization);

        return back();
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $baseSlug = \Illuminate\Support\Str::slug($validated['name']);
        $slug = $baseSlug ?: 'workspace';
        $counter = 1;
        while (Organization::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $user = $request->user();

        $org = Organization::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'billing_email' => $user->email,
            'timezone' => 'Asia/Kolkata',
            'currency' => 'INR',
            'status' => 'active',
        ]);

        $user->organizations()->attach($org->id, ['role' => 'Owner']);
        $user->switchOrganization($org);

        return back();
    }
}
