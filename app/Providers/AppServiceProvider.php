<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        date_default_timezone_set(config('app.timezone', 'Asia/Kolkata'));
        $this->configureDefaults();
        $this->configureMailFromSettings();
    }

    /**
     * Dynamically override mail configuration from PlatformSetting database records.
     */
    protected function configureMailFromSettings(): void
    {
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('platform_settings')) {
                $mailer = \App\Models\PlatformSetting::read('mail_mailer');
                if ($mailer) {
                    $host = \App\Models\PlatformSetting::read('mail_host', config('mail.mailers.smtp.host'));
                    $port = (int) \App\Models\PlatformSetting::read('mail_port', config('mail.mailers.smtp.port'));
                    $scheme = \App\Models\PlatformSetting::read('mail_scheme', config('mail.mailers.smtp.scheme'));
                    $username = \App\Models\PlatformSetting::read('mail_username', config('mail.mailers.smtp.username'));
                    $password = \App\Models\PlatformSetting::read('mail_password', config('mail.mailers.smtp.password'));
                    $fromAddress = \App\Models\PlatformSetting::read('mail_from_address', config('mail.from.address'));
                    $fromName = \App\Models\PlatformSetting::read('mail_from_name', config('mail.from.name'));

                    config([
                        'mail.default' => $mailer,
                        'mail.mailers.smtp.host' => $host,
                        'mail.mailers.smtp.port' => $port,
                        'mail.mailers.smtp.scheme' => $scheme,
                        'mail.mailers.smtp.username' => $username,
                        'mail.mailers.smtp.password' => $password,
                        'mail.from.address' => $fromAddress ?: config('mail.from.address'),
                        'mail.from.name' => $fromName ?: config('mail.from.name'),
                    ]);
                }
            }
        } catch (\Throwable) {
            // Silently ignore if DB connection is unavailable during build/cli
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
