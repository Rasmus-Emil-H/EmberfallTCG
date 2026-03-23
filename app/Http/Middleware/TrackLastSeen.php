<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class TrackLastSeen
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $user = $request->user();
        if ($user) {
            // Only write to DB at most once per minute to avoid hammering on polling
            if (!$user->last_seen_at || $user->last_seen_at->diffInSeconds(now()) > 60) {
                $user->updateQuietly(['last_seen_at' => now()]);
            }
        }

        return $response;
    }
}
