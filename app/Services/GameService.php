<?php

namespace App\Services;

use App\Models\Deck;
use App\Models\DeckCard;
use App\Models\Game;
use App\Models\Card;

class GameService
{
    /**
     * Initialize a new game with both players' decks.
     */
    public function initializeGame(Game $game): array
    {
        // Get player decks (use first deck available or random cards)
        [$player1Deck, $player1Class] = $this->getPlayerDeck($game->player1_id);
        [$player2Deck, $player2Class] = $this->getPlayerDeck($game->player2_id);

        // Shuffle decks
        shuffle($player1Deck);
        shuffle($player2Deck);

        // Deal 3 starting cards to each player
        $player1Hand = array_splice($player1Deck, 0, 3);
        $player2Hand = array_splice($player2Deck, 0, 3);

        $state = [
            'players' => [
                (string)$game->player1_id => [
                    'hero_hp'        => 30,
                    'mana'           => 1,
                    'max_mana'       => 1,
                    'hand'           => $player1Hand,
                    'board'          => [],
                    'deck'           => $player1Deck,
                    'hero_power_used'=> false,
                    'hero_class'     => $player1Class,
                ],
                (string)$game->player2_id => [
                    'hero_hp'        => 30,
                    'mana'           => 0,
                    'max_mana'       => 0,
                    'hand'           => $player2Hand,
                    'board'          => [],
                    'deck'           => $player2Deck,
                    'hero_power_used'=> false,
                    'hero_class'     => $player2Class,
                ],
            ],
            'turn'          => 1,
            'active_player' => $game->player1_id,
        ];

        return $state;
    }

    /**
     * Get a player's deck card IDs. Falls back to random cards if no deck exists.
     */
    private function getPlayerDeck(int $playerId): array
    {
        // Try to find a user deck
        $deck = Deck::where('user_id', $playerId)->first();

        if ($deck) {
            $cardIds = [];
            $deckCards = DeckCard::where('deck_id', $deck->id)->get();
            foreach ($deckCards as $dc) {
                for ($i = 0; $i < $dc->quantity; $i++) {
                    $cardIds[] = $dc->card_id;
                }
            }
            if (count($cardIds) >= 10) {
                return [$cardIds, $deck->hero_class ?? 'neutral'];
            }
        }

        // Fallback: random 20 cards
        $cards = Card::inRandomOrder()->limit(20)->pluck('id')->toArray();
        return [$cards, 'neutral'];
    }

    /**
     * Draw a card from deck to hand.
     */
    public function drawCard(array $state, int $playerId): array
    {
        $playerKey = (string)$playerId;

        if (empty($state['players'][$playerKey]['deck'])) {
            // Fatigue damage - no cards left
            $state['players'][$playerKey]['hero_hp'] -= 1;
            return $state;
        }

        $card = array_shift($state['players'][$playerKey]['deck']);

        // Max hand size is 10
        if (count($state['players'][$playerKey]['hand']) < 10) {
            $state['players'][$playerKey]['hand'][] = $card;
        }

        return $state;
    }

    /**
     * Play a minion from hand onto the board.
     */
    public function playMinion(array $state, int $playerId, int $cardId, int $position): array
    {
        $playerKey = (string)$playerId;
        $player = &$state['players'][$playerKey];

        // Find card in hand
        $handIndex = array_search($cardId, $player['hand']);
        if ($handIndex === false) {
            return $state;
        }

        // Get card data to check mana cost
        $card = Card::find($cardId);
        if (!$card) {
            return $state;
        }

        // Check mana
        if ($player['mana'] < $card->mana_cost) {
            return $state;
        }

        // Remove from hand
        array_splice($player['hand'], $handIndex, 1);

        // Deduct mana
        $player['mana'] -= $card->mana_cost;

        // Add to board at position
        $boardCard = [
            'id' => $cardId,
            'attack' => $card->attack ?? 0,
            'health' => $card->health ?? 1,
            'max_health' => $card->health ?? 1,
            'can_attack' => false, // Summoning sickness
            'effects' => [],
        ];

        // Check for charge effect in description
        if ($card->description && stripos($card->description, 'charge') !== false) {
            $boardCard['can_attack'] = true;
        }

        array_splice($player['board'], $position, 0, [$boardCard]);

        return $state;
    }

    /**
     * Resolve combat between two minions.
     */
    public function attackMinion(array $state, int $playerId, int $attackerId, int $targetId): array
    {
        $playerKey = (string)$playerId;
        $opponentKey = $this->getOpponentKey($state, $playerId);

        // Find attacker on player board
        $attackerIndex = $this->findBoardCardIndex($state['players'][$playerKey]['board'], $attackerId);
        if ($attackerIndex === false) {
            return $state;
        }

        // Find target on opponent board
        $targetIndex = $this->findBoardCardIndex($state['players'][$opponentKey]['board'], $targetId);
        if ($targetIndex === false) {
            return $state;
        }

        $attacker = &$state['players'][$playerKey]['board'][$attackerIndex];
        $target = &$state['players'][$opponentKey]['board'][$targetIndex];

        if (!$attacker['can_attack']) {
            return $state;
        }

        // Deal damage
        $attacker['health'] -= $target['attack'];
        $target['health'] -= $attacker['attack'];

        // Mark attacker as having attacked
        $attacker['can_attack'] = false;

        // Remove dead minions
        $state['players'][$playerKey]['board'] = array_values(
            array_filter($state['players'][$playerKey]['board'], fn($c) => $c['health'] > 0)
        );
        $state['players'][$opponentKey]['board'] = array_values(
            array_filter($state['players'][$opponentKey]['board'], fn($c) => $c['health'] > 0)
        );

        return $state;
    }

    /**
     * Attack opponent's hero.
     */
    public function attackHero(array $state, int $playerId, int $attackerId): array
    {
        $playerKey = (string)$playerId;
        $opponentKey = $this->getOpponentKey($state, $playerId);

        // Find attacker on player board
        $attackerIndex = $this->findBoardCardIndex($state['players'][$playerKey]['board'], $attackerId);
        if ($attackerIndex === false) {
            return $state;
        }

        $attacker = &$state['players'][$playerKey]['board'][$attackerIndex];

        if (!$attacker['can_attack']) {
            return $state;
        }

        // Deal damage to hero
        $state['players'][$opponentKey]['hero_hp'] -= $attacker['attack'];

        // Mark as having attacked
        $attacker['can_attack'] = false;

        return $state;
    }

    /**
     * End the current player's turn, switch active player, increment mana, draw card.
     */
    public function endTurn(array $state): array
    {
        $currentPlayerId = $state['active_player'];
        $opponentKey = $this->getOpponentKey($state, $currentPlayerId);
        $opponentId = (int)$opponentKey;

        // Switch active player
        $state['active_player'] = $opponentId;
        $state['turn']++;

        $opponentPlayerKey = (string)$opponentId;

        // Increment mana (max 10)
        $state['players'][$opponentPlayerKey]['max_mana'] = min(10, $state['players'][$opponentPlayerKey]['max_mana'] + 1);
        $state['players'][$opponentPlayerKey]['mana'] = $state['players'][$opponentPlayerKey]['max_mana'];

        // Reset hero power
        $state['players'][$opponentPlayerKey]['hero_power_used'] = false;

        // Allow all minions on new active player's board to attack
        foreach ($state['players'][$opponentPlayerKey]['board'] as &$card) {
            $card['can_attack'] = true;
        }

        // Draw a card for the new active player
        $state = $this->drawCard($state, $opponentId);

        return $state;
    }

    /**
     * Check if the game is over (a player's hero is at 0 or below).
     */
    public function checkGameOver(array $state): ?int
    {
        foreach ($state['players'] as $playerId => $player) {
            if ($player['hero_hp'] <= 0) {
                // Find the other player who won
                $opponentKey = $this->getOpponentKey($state, (int)$playerId);
                return (int)$opponentKey;
            }
        }
        return null;
    }

    private function getOpponentKey(array $state, int $playerId): string
    {
        $playerKeys = array_keys($state['players']);
        foreach ($playerKeys as $key) {
            if ((int)$key !== $playerId) {
                return $key;
            }
        }
        return $playerKeys[0];
    }

    private function findBoardCardIndex(array $board, int $cardId): int|false
    {
        foreach ($board as $index => $card) {
            if ($card['id'] === $cardId) {
                return $index;
            }
        }
        return false;
    }
}
