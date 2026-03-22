/**
 * Realm Wars - Three.js Game Board
 */

import * as THREE from 'three';

const CARD_W = 0.9;
const CARD_H = 1.35;
const CARD_D = 0.04;
const SLOT_SPACING = 1.1;
const MAX_BOARD_SLOTS = 7;

const CLASS_COLORS = {
    warrior: 0x6b7280, mage: 0x3b82f6, ranger: 0x22c55e,
    paladin: 0xfcd34d, druid: 0x10b981, neutral: 0x4b5563,
};
const RARITY_COLORS = {
    common: 0x9ca3af, rare: 0x3b82f6, epic: 0xa855f7, legendary: 0xf59e0b,
};

/**
 * Creates a simple card mesh for the game board
 */
function createBoardCardMesh(cardData) {
    const geo = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');

    const classKey = (cardData.hero_class || 'neutral').toLowerCase();
    const primaryColor = '#' + (CLASS_COLORS[classKey] || 0x4b5563).toString(16).padStart(6, '0');

    const grad = ctx.createLinearGradient(0, 0, 128, 192);
    grad.addColorStop(0, '#0a0a14');
    grad.addColorStop(1, primaryColor + '66');
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, 128, 192, 8);
    ctx.fill();

    const rarityColor = '#' + (RARITY_COLORS[cardData.rarity] || 0x9ca3af).toString(16).padStart(6, '0');
    ctx.strokeStyle = rarityColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = rarityColor;
    ctx.shadowBlur = 6;
    ctx.roundRect(2, 2, 124, 188, 7);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Art area
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.roundRect(6, 22, 116, 80, 4);
    ctx.fill();

    // Emoji
    const emojis = { warrior: '⚔️', mage: '🔮', ranger: '🏹', paladin: '🛡️', druid: '🌿', neutral: '⭐' };
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojis[classKey] || '⭐', 64, 62);

    // Mana
    ctx.fillStyle = '#1e3a5f';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(16, 16, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 12px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cardData.mana_cost, 16, 16);

    // Name
    ctx.fillStyle = '#e8e0d0';
    ctx.font = 'bold 9px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const name = cardData.name;
    ctx.fillText(name.length > 13 ? name.substring(0, 11) + '..' : name, 64, 108);

    // Stats
    if (cardData.card_type !== 'spell') {
        ctx.fillStyle = '#7f1d1d';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(18, 174, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 11px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cardData.attack ?? 0, 18, 174);

        ctx.fillStyle = '#14532d';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(110, 174, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#86efac';
        ctx.font = 'bold 11px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cardData.health ?? 0, 110, 174);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshPhongMaterial({ map: texture });
    const sideMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
    const mesh = new THREE.Mesh(geo, [sideMat, sideMat, sideMat, sideMat, sideMat, mat]);

    return mesh;
}

/**
 * GameBoard - The main 3D game board
 */
export class GameBoard {
    constructor(container) {
        this.container = container;
        this.playerMeshes = {};
        this.opponentMeshes = {};
        this.handMeshes = [];
        this.selectedCard = null;
        this.onCardClickCb = null;
        this.onTargetSelectCb = null;
        this.gameState = null;
        this.playerId = null;
        this.opponentId = null;
        this._init();
    }

    _init() {
        const W = this.container.clientWidth;
        const H = this.container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x04040c);
        this.scene.fog = new THREE.Fog(0x04040c, 15, 30);

        this.camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
        this.camera.position.set(0, 6, 10);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(W, H);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambient = new THREE.AmbientLight(0x334455, 1.5);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
        sun.position.set(5, 10, 5);
        sun.castShadow = true;
        this.scene.add(sun);

        const fill = new THREE.PointLight(0x6b21a8, 0.8, 20);
        fill.position.set(-5, 3, 2);
        this.scene.add(fill);

        // Build board
        this._buildBoard();
        this._buildHeroZones();

        // Raycaster for click
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this._clickHandler = (e) => this._onClick(e);
        this._mouseMoveHandler = (e) => this._onMouseMove(e);
        this.renderer.domElement.addEventListener('click', this._clickHandler);
        this.renderer.domElement.addEventListener('mousemove', this._mouseMoveHandler);

        // Resize
        this._resizeHandler = () => this._onResize();
        window.addEventListener('resize', this._resizeHandler);

        this._rendering = true;
        this._renderLoop();
    }

    _buildBoard() {
        // Main board surface
        const boardGeo = new THREE.BoxGeometry(14, 0.3, 10);

        // Create board texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Board background
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, '#0d1b2a');
        grad.addColorStop(0.5, '#1a2a3a');
        grad.addColorStop(1, '#0d1b2a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);

        // Center divider
        ctx.fillStyle = 'rgba(201,168,76,0.3)';
        ctx.fillRect(0, 248, 1024, 16);

        // Rune circles
        ctx.strokeStyle = 'rgba(107,33,168,0.3)';
        ctx.lineWidth = 3;
        for (let cx of [256, 512, 768]) {
            ctx.beginPath();
            ctx.arc(cx, 256, 80, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, 256, 120, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(201,168,76,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1024; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();
        }
        for (let y = 0; y < 512; y += 64) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1024, y);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        const boardMat = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 20,
        });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.receiveShadow = true;
        board.position.y = -0.15;
        this.scene.add(board);

        // Center divider line
        const dividerGeo = new THREE.BoxGeometry(14, 0.01, 0.08);
        const dividerMat = new THREE.MeshBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.5 });
        const divider = new THREE.Mesh(dividerGeo, dividerMat);
        divider.position.y = 0.01;
        this.scene.add(divider);

        // Board border
        const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(14.1, 0.4, 10.1));
        const borderMat = new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.4 });
        const border = new THREE.LineSegments(borderGeo, borderMat);
        border.position.y = -0.15;
        this.scene.add(border);

        // Battle zone slots
        this._createBattleZoneSlots();
    }

    _createBattleZoneSlots() {
        this.playerSlots = [];
        this.opponentSlots = [];

        const slotGeo = new THREE.BoxGeometry(CARD_W + 0.15, 0.02, CARD_H + 0.15);
        const playerSlotMat = new THREE.MeshBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.4 });
        const opponentSlotMat = new THREE.MeshBasicMaterial({ color: 0x5f1e1e, transparent: true, opacity: 0.4 });

        for (let i = 0; i < MAX_BOARD_SLOTS; i++) {
            const x = (i - (MAX_BOARD_SLOTS - 1) / 2) * SLOT_SPACING;

            const playerSlot = new THREE.Mesh(slotGeo, playerSlotMat);
            playerSlot.position.set(x, 0.01, 2);
            this.scene.add(playerSlot);
            this.playerSlots.push(playerSlot);

            const oppSlot = new THREE.Mesh(slotGeo, opponentSlotMat);
            oppSlot.position.set(x, 0.01, -2);
            this.scene.add(oppSlot);
            this.opponentSlots.push(oppSlot);
        }
    }

    _buildHeroZones() {
        // Player hero
        this._buildHero(new THREE.Vector3(0, 0.3, 4.5), false);
        // Opponent hero
        this._buildHero(new THREE.Vector3(0, 0.3, -4.5), true);
    }

    _buildHero(position, isOpponent) {
        const group = new THREE.Group();

        // Platform
        const platGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.3, 8);
        const platMat = new THREE.MeshPhongMaterial({
            color: isOpponent ? 0x5f1e1e : 0x1e3a5f,
            shininess: 60,
        });
        const plat = new THREE.Mesh(platGeo, platMat);
        group.add(plat);

        // Hero body (simple humanoid silhouette)
        const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8);
        const bodyMat = new THREE.MeshPhongMaterial({
            color: isOpponent ? 0x8b2020 : 0x204080,
            shininess: 40,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.7;
        group.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.22, 8, 8);
        const headMat = new THREE.MeshPhongMaterial({
            color: isOpponent ? 0xb03030 : 0x3060b0,
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.35;
        group.add(head);

        // HP orb glow
        const hpGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const hpMat = new THREE.MeshBasicMaterial({
            color: isOpponent ? 0xff4444 : 0x44ff44,
            transparent: true,
            opacity: 0.8,
        });
        const hpOrb = new THREE.Mesh(hpGeo, hpMat);
        hpOrb.position.set(0.6, 0.3, 0);
        group.add(hpOrb);

        if (isOpponent) {
            this.opponentHeroGroup = group;
            this.opponentHpOrb = hpOrb;
        } else {
            this.playerHeroGroup = group;
            this.playerHpOrb = hpOrb;
        }

        group.position.copy(position);
        this.scene.add(group);
    }

    updateFromGameState(gameState, myPlayerId) {
        this.gameState = gameState;
        this.playerId = myPlayerId;

        const playerKeys = Object.keys(gameState.players);
        this.opponentId = playerKeys.find(k => parseInt(k) !== myPlayerId);

        const myState = gameState.players[String(myPlayerId)];
        const oppState = gameState.players[this.opponentId];

        if (myState) {
            this._updateBoardCards(myState.board || [], false);
            this._updateHandCards(myState.hand || [], myState);
            this._updateManaDisplay(myState.mana, myState.max_mana);
            if (this.playerHpOrb) {
                const hp = myState.hero_hp;
                this.playerHpOrb.material.color.setHex(hp > 15 ? 0x44ff44 : hp > 8 ? 0xffaa00 : 0xff3333);
            }
        }

        if (oppState) {
            this._updateBoardCards(oppState.board || [], true);
            if (this.opponentHpOrb) {
                const hp = oppState.hero_hp;
                this.opponentHpOrb.material.color.setHex(hp > 15 ? 0x44ff44 : hp > 8 ? 0xffaa00 : 0xff3333);
            }
        }
    }

    _updateBoardCards(boardData, isOpponent) {
        const existing = isOpponent ? this.opponentMeshes : this.playerMeshes;
        const slots = isOpponent ? this.opponentSlots : this.playerSlots;
        const zPos = isOpponent ? -2 : 2;

        // Remove old meshes
        Object.values(existing).forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
            else mesh.material?.dispose();
        });

        if (isOpponent) {
            this.opponentMeshes = {};
        } else {
            this.playerMeshes = {};
        }

        const count = boardData.length;
        boardData.forEach((cardInfo, i) => {
            const x = count > 1 ? (i - (count - 1) / 2) * SLOT_SPACING : 0;

            // We need to look up full card data - use stored card data
            const cardData = cardInfo._cardData || {
                id: cardInfo.id,
                name: `Card ${cardInfo.id}`,
                mana_cost: 0,
                attack: cardInfo.attack || 0,
                health: cardInfo.health || 0,
                card_type: 'minion',
                rarity: 'common',
                hero_class: 'neutral',
            };

            const mesh = createBoardCardMesh(cardData);
            mesh.position.set(x, 0.6, zPos);
            mesh.rotation.x = isOpponent ? 0.2 : -0.2;
            mesh.userData = { cardId: cardInfo.id, isOpponent, boardIndex: i };

            if (isOpponent) {
                this.opponentMeshes[cardInfo.id] = mesh;
            } else {
                this.playerMeshes[cardInfo.id] = mesh;
            }

            this.scene.add(mesh);
        });
    }

    _updateHandCards(handIds, playerState) {
        // Remove old hand meshes
        this.handMeshes.forEach(m => {
            this.scene.remove(m);
            m.geometry?.dispose();
            if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
            else m.material?.dispose();
        });
        this.handMeshes = [];

        const count = handIds.length;
        if (count === 0) return;

        const totalWidth = (count - 1) * 1.05;

        handIds.forEach((cardId, i) => {
            const cardData = this._getCardData(cardId);
            const mesh = createBoardCardMesh(cardData);

            const x = count > 1 ? -totalWidth / 2 + i * 1.05 : 0;
            const fanAngle = count > 1 ? (-8 + (16 / (count - 1)) * i) * (Math.PI / 180) : 0;

            mesh.position.set(x, 0.4, 7.5);
            mesh.rotation.x = -0.7;
            mesh.rotation.z = fanAngle;
            mesh.userData = { cardId, isHand: true };

            this.handMeshes.push(mesh);
            this.scene.add(mesh);
        });
    }

    _updateManaDisplay(mana, maxMana) {
        // Update DOM-based mana display
        const manaEl = document.getElementById('game-mana-display');
        if (manaEl) {
            manaEl.innerHTML = '';
            for (let i = 0; i < (maxMana || 0); i++) {
                const crystal = document.createElement('div');
                crystal.className = 'mana-crystal ' + (i < mana ? 'full' : 'empty');
                manaEl.appendChild(crystal);
            }
        }
    }

    _getCardData(cardId) {
        // Try to get from global card cache
        if (window._cardCache && window._cardCache[cardId]) {
            return window._cardCache[cardId];
        }
        return {
            id: cardId,
            name: `Card #${cardId}`,
            mana_cost: 0,
            attack: 0,
            health: 0,
            card_type: 'minion',
            rarity: 'common',
            hero_class: 'neutral',
        };
    }

    _onClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check hand cards
        const handIntersects = this.raycaster.intersectObjects(this.handMeshes);
        if (handIntersects.length > 0) {
            const mesh = handIntersects[0].object;
            const { cardId } = mesh.userData;
            if (this.onCardClickCb) {
                this.onCardClickCb(cardId, 'hand');
            }
            this._highlightCard(mesh);
            return;
        }

        // Check opponent board cards (for attack targets)
        const oppMeshList = Object.values(this.opponentMeshes);
        const oppIntersects = this.raycaster.intersectObjects(oppMeshList);
        if (oppIntersects.length > 0) {
            const mesh = oppIntersects[0].object;
            const { cardId } = mesh.userData;
            if (this.onTargetSelectCb) {
                this.onTargetSelectCb(cardId, 'minion');
            }
            return;
        }

        // Check opponent hero
        if (this.opponentHeroGroup) {
            const heroMeshes = [];
            this.opponentHeroGroup.traverse(c => { if (c.isMesh) heroMeshes.push(c); });
            const heroIntersects = this.raycaster.intersectObjects(heroMeshes);
            if (heroIntersects.length > 0) {
                if (this.onTargetSelectCb) {
                    this.onTargetSelectCb(null, 'hero');
                }
                return;
            }
        }

        // Check own board (for attack selection)
        const ownMeshList = Object.values(this.playerMeshes);
        const ownIntersects = this.raycaster.intersectObjects(ownMeshList);
        if (ownIntersects.length > 0) {
            const mesh = ownIntersects[0].object;
            const { cardId } = mesh.userData;
            if (this.onCardClickCb) {
                this.onCardClickCb(cardId, 'board');
            }
        }
    }

    _onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Hover on hand cards
        this.handMeshes.forEach(mesh => {
            const intersects = this.raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                mesh.position.y = 0.8; // lift on hover
            } else {
                mesh.position.y = 0.4; // back to normal
            }
        });
    }

    _highlightCard(mesh) {
        if (this.selectedCardMesh) {
            this.selectedCardMesh.material?.forEach?.(m => {
                if (m.emissive) m.emissive.setHex(0x000000);
            });
        }
        this.selectedCardMesh = mesh;
    }

    playCard(cardData, boardSlotIndex) {
        // Animate card from hand to board
        const cardInHand = this.handMeshes.find(m => m.userData.cardId === cardData.id);
        if (!cardInHand) return;

        const targetX = (boardSlotIndex - 3) * SLOT_SPACING;
        this._animateTo(cardInHand, new THREE.Vector3(targetX, 0.6, 2), 0.6);
    }

    attackAnimation(attackerCardId, targetCardId) {
        const attacker = this.playerMeshes[attackerCardId];
        if (!attacker) return;

        let target;
        if (targetCardId) {
            target = this.opponentMeshes[targetCardId];
        }

        const originalPos = attacker.position.clone();
        const targetPos = target
            ? target.position.clone()
            : new THREE.Vector3(0, 0.5, -2); // hero position

        // Lunge forward
        this._animateTo(attacker, targetPos, 0.2).then(() => {
            // Flash impact
            this._flashImpact(targetPos);
            // Return
            this._animateTo(attacker, originalPos, 0.3);
        });
    }

    deathAnimation(cardId, isOpponent) {
        const meshMap = isOpponent ? this.opponentMeshes : this.playerMeshes;
        const mesh = meshMap[cardId];
        if (!mesh) return;

        const startTime = performance.now();
        const duration = 600;
        const originalY = mesh.position.y;
        const originalScale = mesh.scale.clone();

        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            mesh.position.y = originalY - progress * 2;
            mesh.scale.setScalar(1 - progress);
            mesh.material?.forEach?.((m) => {
                if (m.transparent) m.opacity = 1 - progress;
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(mesh);
                mesh.geometry?.dispose();
            }
        };
        requestAnimationFrame(animate);

        delete meshMap[cardId];
    }

    _flashImpact(position) {
        const geo = new THREE.SphereGeometry(0.3, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
        const flash = new THREE.Mesh(geo, mat);
        flash.position.copy(position);
        this.scene.add(flash);

        const start = performance.now();
        const animate = (now) => {
            const progress = Math.min((now - start) / 300, 1);
            flash.scale.setScalar(1 + progress * 2);
            flash.material.opacity = 0.8 * (1 - progress);
            if (progress < 1) requestAnimationFrame(animate);
            else {
                this.scene.remove(flash);
                flash.geometry.dispose();
                flash.material.dispose();
            }
        };
        requestAnimationFrame(animate);
    }

    _animateTo(mesh, target, duration) {
        return new Promise(resolve => {
            const start = mesh.position.clone();
            const startTime = performance.now();
            const ms = duration * 1000;

            const animate = (now) => {
                const progress = Math.min((now - startTime) / ms, 1);
                const eased = 1 - Math.pow(1 - progress, 2);
                mesh.position.lerpVectors(start, target, eased);
                if (progress < 1) requestAnimationFrame(animate);
                else resolve();
            };
            requestAnimationFrame(animate);
        });
    }

    _renderLoop() {
        if (!this._rendering) return;
        requestAnimationFrame(() => this._renderLoop());

        const now = performance.now();

        // Subtle camera bob
        this.camera.position.y = 6 + Math.sin(now * 0.0005) * 0.1;

        // Animate hero glows
        if (this.playerHeroGroup) {
            this.playerHeroGroup.rotation.y = Math.sin(now * 0.001) * 0.05;
        }
        if (this.opponentHeroGroup) {
            this.opponentHeroGroup.rotation.y = Math.sin(now * 0.001 + 1) * 0.05;
        }

        this.renderer.render(this.scene, this.camera);
    }

    _onResize() {
        if (!this.container || !this.renderer) return;
        const W = this.container.clientWidth;
        const H = this.container.clientHeight;
        this.camera.aspect = W / H;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(W, H);
    }

    onCardClick(callback) {
        this.onCardClickCb = callback;
    }

    onTargetSelect(callback) {
        this.onTargetSelectCb = callback;
    }

    destroy() {
        this._rendering = false;
        window.removeEventListener('resize', this._resizeHandler);
        this.renderer.domElement.removeEventListener('click', this._clickHandler);
        this.renderer.domElement.removeEventListener('mousemove', this._mouseMoveHandler);
        this.renderer.dispose();
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
}
