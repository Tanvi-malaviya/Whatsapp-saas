<?php

namespace App\Shared;

use InvalidArgumentException;

class PhoneNumber
{
    private string $e164;

    public function __construct(string $rawNumber, string $defaultCountryCode = '+91')
    {
        $this->e164 = self::normalize($rawNumber, $defaultCountryCode);
    }

    public static function normalize(string $rawNumber, string $defaultCountryCode = '+91'): string
    {
        // Strip everything except digits and leading plus
        $cleaned = preg_replace('/[^\d+]/', '', trim($rawNumber));

        if (empty($cleaned)) {
            throw new InvalidArgumentException("Phone number cannot be empty.");
        }

        // If it already has +, check length
        if (str_starts_with($cleaned, '+')) {
            $digits = substr($cleaned, 1);
            if (strlen($digits) < 7 || strlen($digits) > 15) {
                throw new InvalidArgumentException("Invalid E.164 phone number: {$cleaned}");
            }
            return $cleaned;
        }

        // Handle Indian 10-digit numbers
        if (strlen($cleaned) === 10) {
            $cleanedCode = ltrim($defaultCountryCode, '+');
            return '+' . $cleanedCode . $cleaned;
        }

        // Handle 09876543210 (leading 0)
        if (strlen($cleaned) === 11 && str_starts_with($cleaned, '0')) {
            $cleanedCode = ltrim($defaultCountryCode, '+');
            return '+' . $cleanedCode . substr($cleaned, 1);
        }

        // Handle 919876543210
        if (strlen($cleaned) === 12 && str_starts_with($cleaned, '91')) {
            return '+' . $cleaned;
        }

        return '+' . $cleaned;
    }

    public function getE164(): string
    {
        return $this->e164;
    }

    public function getWithoutPlus(): string
    {
        return ltrim($this->e164, '+');
    }

    public function __toString(): string
    {
        return $this->e164;
    }
}
