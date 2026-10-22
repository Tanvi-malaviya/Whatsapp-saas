<?php

namespace App\Shared;

use InvalidArgumentException;

class Money
{
    /**
     * Amount stored in paise (1 INR = 100 paise)
     */
    private int $amountInPaise;
    private string $currency;

    public function __construct(int $amountInPaise, string $currency = 'INR')
    {
        $this->amountInPaise = $amountInPaise;
        $this->currency = strtoupper($currency);
    }

    public static function fromRupees(float|int $rupees, string $currency = 'INR'): self
    {
        return new self((int) round($rupees * 100), $currency);
    }

    public static function fromPaise(int $paise, string $currency = 'INR'): self
    {
        return new self($paise, $currency);
    }

    public function getPaise(): int
    {
        return $this->amountInPaise;
    }

    public function getRupees(): float
    {
        return $this->amountInPaise / 100;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    /**
     * Format amount in Indian currency notation (e.g. ₹1,00,000.00 or ₹1,00,000)
     */
    public function format(bool $withDecimals = false): string
    {
        $rupees = $this->getRupees();
        $isNegative = $rupees < 0;
        $absRupees = abs($rupees);

        $parts = explode('.', number_format($absRupees, 2, '.', ''));
        $whole = $parts[0];
        $decimals = $parts[1];

        if (strlen($whole) > 3) {
            $lastThree = substr($whole, -3);
            $rest = substr($whole, 0, -3);
            $rest = preg_replace('/\B(?=(\d{2})+(?!\d))/', ',', $rest);
            $formattedWhole = $rest . ',' . $lastThree;
        } else {
            $formattedWhole = $whole;
        }

        $formatted = '₹' . $formattedWhole;
        if ($withDecimals && (int) $decimals > 0) {
            $formatted .= '.' . $decimals;
        }

        return $isNegative ? '-' . $formatted : $formatted;
    }

    public function calculateGst(float $gstPercentage = 18.0): self
    {
        $gstPaise = (int) round(($this->amountInPaise * $gstPercentage) / 100);
        return new self($gstPaise, $this->currency);
    }

    public function add(self $other): self
    {
        $this->ensureSameCurrency($other);
        return new self($this->amountInPaise + $other->getPaise(), $this->currency);
    }

    public function subtract(self $other): self
    {
        $this->ensureSameCurrency($other);
        return new self($this->amountInPaise - $other->getPaise(), $this->currency);
    }

    private function ensureSameCurrency(self $other): void
    {
        if ($this->currency !== $other->getCurrency()) {
            throw new InvalidArgumentException("Cannot operate on different currencies: {$this->currency} and {$other->getCurrency()}");
        }
    }
}
