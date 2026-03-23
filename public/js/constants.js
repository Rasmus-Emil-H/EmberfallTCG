/**
 * Emberfall – Shared constants
 * Single source of truth for class/rarity mappings used across all JS modules.
 */

// Build class maps dynamically from server-provided APP_DATA so new classes
// created via admin are reflected without a code deploy.
function _buildClassMaps() {
    const classes = window.APP_DATA?.heroClasses ?? [];
    const emoji = {};
    const grad  = {};
    for (const c of classes) {
        emoji[c.key] = c.emoji;
        grad[c.key]  = c.gradient;
    }
    return { emoji, grad };
}

const { emoji: _classEmoji, grad: _classGrad } = _buildClassMaps();

export const CLASS_EMOJI = _classEmoji;
export const CLASS_GRAD  = _classGrad;

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
