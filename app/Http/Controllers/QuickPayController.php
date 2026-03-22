<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class QuickPayController extends Controller
{
    // Gold packages: price in Danish øre (100 øre = 1 DKK)
    public const PACKAGES = [
        'small'  => ['gold' => 1_500,  'ore' => 900,  'label' => 'Starter Chest',       'emoji' => '💰', 'popular' => false],
        'medium' => ['gold' => 4_500,  'ore' => 1900, 'label' => "Champion's Hoard",    'emoji' => '💎', 'popular' => true],
        'large'  => ['gold' => 12_000, 'ore' => 3900, 'label' => "Warlord's Treasury",  'emoji' => '👑', 'popular' => false],
        'mega'   => ['gold' => 30_000, 'ore' => 7900, 'label' => 'Legendary Vault',     'emoji' => '⚡', 'popular' => false],
    ];

    /**
     * POST /api/shop/purchase
     * Creates a QuickPay payment and returns a payment link.
     */
    public function createPayment(Request $request)
    {
        $request->validate(['package_id' => 'required|string|in:small,medium,large,mega']);

        $pkg     = self::PACKAGES[$request->package_id];
        $user    = $request->user();
        $orderId = 'rw-' . $user->id . '-' . Str::random(8);

        $apiKey  = config('services.quickpay.api_key');
        $baseUrl = rtrim(config('app.url'), '/');

        if (!$apiKey) {
            return response()->json(['error' => 'Payment provider not configured. Add QUICKPAY_API_KEY to .env.'], 503);
        }

        // 1. Create payment object
        $createRes = Http::withBasicAuth('', $apiKey)
            ->withHeaders(['Accept-Version' => 'v10'])
            ->post('https://api.quickpay.net/payments', [
                'order_id' => $orderId,
                'currency' => 'DKK',
            ]);

        if (!$createRes->successful()) {
            Log::error('QuickPay create payment failed', ['body' => $createRes->body()]);
            return response()->json(['error' => 'Could not create payment.'], 502);
        }

        $qpPaymentId = $createRes->json('id');

        // 2. Create payment link
        $linkRes = Http::withBasicAuth('', $apiKey)
            ->withHeaders(['Accept-Version' => 'v10'])
            ->put("https://api.quickpay.net/payments/{$qpPaymentId}/link", [
                'amount'       => $pkg['ore'],
                'continue_url' => $baseUrl . '/payment/success',
                'cancel_url'   => $baseUrl . '/payment/cancel',
                'callback_url' => $baseUrl . '/api/quickpay/callback',
                'language'     => app()->getLocale() === 'da' ? 'da' : 'en',
                'auto_capture' => true,
            ]);

        if (!$linkRes->successful()) {
            Log::error('QuickPay create link failed', ['body' => $linkRes->body()]);
            return response()->json(['error' => 'Could not create payment link.'], 502);
        }

        $paymentUrl = $linkRes->json('url');

        // 3. Store pending payment
        Payment::create([
            'user_id'             => $user->id,
            'order_id'            => $orderId,
            'quickpay_payment_id' => $qpPaymentId,
            'package_id'          => $request->package_id,
            'amount_ore'          => $pkg['ore'],
            'gold_amount'         => $pkg['gold'],
            'status'              => 'pending',
        ]);

        return response()->json(['payment_url' => $paymentUrl]);
    }

    /**
     * POST /api/quickpay/callback  (no auth — called by QuickPay)
     */
    public function callback(Request $request)
    {
        $privateKey = config('services.quickpay.private_key');
        $rawBody    = $request->getContent();
        $expected   = hash_hmac('sha256', $rawBody, $privateKey);
        $received   = $request->header('X-Quickpay-Checksum-Sha256', '');

        if (!hash_equals($expected, $received)) {
            Log::warning('QuickPay callback checksum mismatch');
            return response('Checksum mismatch', 403);
        }

        $data    = json_decode($rawBody, true);
        $orderId = $data['order_id'] ?? null;
        $payment = Payment::where('order_id', $orderId)->first();

        if (!$payment) {
            Log::warning('QuickPay callback: unknown order', ['order_id' => $orderId]);
            return response('Unknown order', 404);
        }

        // Guard against duplicate callbacks
        if ($payment->status === 'accepted') {
            return response('Already processed', 200);
        }

        $accepted = ($data['accepted'] ?? false) === true
            && ($data['state'] ?? '') === 'processed';

        if ($accepted) {
            $payment->update(['status' => 'accepted', 'accepted_at' => now()]);
            $payment->user->increment('gold', $payment->gold_amount);
            Log::info("QuickPay payment accepted: order {$orderId}, +{$payment->gold_amount} gold to user {$payment->user_id}");
        } else {
            $payment->update(['status' => 'rejected']);
        }

        return response('OK', 200);
    }
}
