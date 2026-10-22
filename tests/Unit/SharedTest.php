<?php

use App\Shared\Money;
use App\Shared\PhoneNumber;

test('Money stores in paise and formats in Indian currency grouping', function () {
    $money = Money::fromRupees(100000); // 1 Lakh
    expect($money->getPaise())->toBe(10000000);
    expect($money->format())->toBe('₹1,00,000');
    expect($money->format(true))->toBe('₹1,00,000');

    $small = Money::fromRupees(2999);
    expect($small->format())->toBe('₹2,999');

    $gst = $small->calculateGst(18.0);
    expect($gst->getPaise())->toBe(53982); // 18% of 299900 paise = 53982 paise
});

test('PhoneNumber normalizes 10-digit Indian numbers to E.164 with +91', function () {
    $phone = new PhoneNumber('98765 43210');
    expect($phone->getE164())->toBe('+919876543210');
    expect($phone->getWithoutPlus())->toBe('919876543210');

    $phoneWithZero = new PhoneNumber('098765-43210');
    expect($phoneWithZero->getE164())->toBe('+919876543210');

    $phoneWithCode = new PhoneNumber('+91 98765 43210');
    expect($phoneWithCode->getE164())->toBe('+919876543210');
});
