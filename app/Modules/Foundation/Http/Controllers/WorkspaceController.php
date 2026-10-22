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
}
