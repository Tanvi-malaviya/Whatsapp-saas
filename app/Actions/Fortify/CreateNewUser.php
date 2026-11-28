<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use Illuminate\Support\Facades\DB;
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
        // Clean up any failed incomplete registration for this email
        if (! empty($input['email'])) {
            User::where('email', $input['email'])->whereDoesntHave('organizations')->delete();
        }

        Validator::make($input, [
            ...$this->profileRules(),
            'workspace_name' => ['nullable', 'string', 'max:100'],
            'password' => $this->passwordRules(),
        ])->validate();

        return DB::transaction(function () use ($input) {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            // Handle referral code if provided
            $referrer = null;
            if (! empty($input['referral_code'])) {
                $code = strtoupper(trim($input['referral_code']));
                $referrer = User::where('referral_code', $code)->first();
                if ($referrer && $referrer->id !== $user->id) {
                    $user->update(['referred_by_id' => $referrer->id]);
                }
            }
            $user->generateReferralCode();

            // Custom workspace name provided or fallback to User's Workspace
            $workspaceName = ! empty(trim($input['workspace_name'] ?? ''))
                ? trim($input['workspace_name'])
                : $input['name'] . "'s Workspace";
            $slug = Str::slug($workspaceName) . '-' . rand(100, 999);

            $orgData = [
                'name' => $workspaceName,
                'slug' => $slug,
                'subscription_plan' => 'annual',
                'subscription_expires_at' => null,
                'subscription_price_paise' => 0,
                'status' => 'active',
            ];

            if ($referrer && $referrer->isB2BAgent()) {
                $orgData['b2b_agent_id'] = $referrer->id;
            }

            if (Schema::hasColumn('organizations', 'max_channels')) {
                $orgData['max_channels'] = 1; // Default to Single Number
            }

            $org = Organization::create($orgData);
            $org->getOrCreateWallet();
            $user->organizations()->attach($org->id, ['role' => 'Owner']);
            $user->update(['current_organization_id' => $org->id]);

            return $user;
        });
    }
}
