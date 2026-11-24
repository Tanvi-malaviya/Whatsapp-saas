<?php

namespace App\Modules\Foundation\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class WorkspaceInvitation extends Notification
{
    public function __construct(public string $workspace, public string $token) {}
    public function via(object $notifiable): array { return ['mail']; }
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)->subject('Invitation to '.$this->workspace)->line('You have been invited to join '.$this->workspace.'. Sign in or create an account using this email address.')->action('Accept invitation', url('/invitations/'.$this->token))->line('This invitation expires in seven days.');
    }
}
