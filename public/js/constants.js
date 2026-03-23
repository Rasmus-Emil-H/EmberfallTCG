/**
 * Emberfall – Shared constants
 * Single source of truth for class/rarity mappings used across all JS modules.
 */

export const CLASS_EMOJI = {
    warrior: '⚔️',
    mage:    '🔮',
    ranger:  '🏹',
    paladin: '🛡️',
    druid:   '🌿',
    neutral: '⭐',
};

// CSS gradient strings — used for card art backgrounds in HTML rendering
export const CLASS_GRAD = {
    warrior: 'linear-gradient(160deg,#7f1d1d,#b45309)',
    mage:    'linear-gradient(160deg,#1e3a5f,#4c1d95)',
    ranger:  'linear-gradient(160deg,#14532d,#065f46)',
    paladin: 'linear-gradient(160deg,#78350f,#92400e)',
    druid:   'linear-gradient(160deg,#14532d,#1a2e05)',
    neutral: 'linear-gradient(160deg,#1f2937,#374151)',
};

// CSS hex strings — used for rarity colouring in HTML rendering
export const RARITY_COLOR = {
    common:    '#6b7280',
    rare:      '#3b82f6',
    epic:      '#a855f7',
    legendary: '#f59e0b',
};

// THREE.js numeric hex — used by three-cards.js and three-game.js
export const RARITY_COLOR_HEX = {
    common:    0x9ca3af,
    rare:      0x3b82f6,
    epic:      0xa855f7,
    legendary: 0xf59e0b,
};
