<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
            'email_verified_at' => now(),
        ]);
        $user->markEmailAsVerified();

        // Auto-create workspace for self-registered user
        $wsName = $input['name'] . "'s Workspace";
        $slug = Str::slug($input['name']) . '-' . rand(100, 999);

        $orgData = [
            'name' => $wsName,
            'slug' => $slug,
            'subscription_plan' => 'starter',
            'status' => 'active',
        ];

        if (Schema::hasColumn('organizations', 'max_channels')) {
            $orgData['max_channels'] = 1; // Default to Single Number
        }

        $org = Organization::create($orgData);
        $user->organizations()->attach($org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $org->id]);

        return $user;
    }
}
