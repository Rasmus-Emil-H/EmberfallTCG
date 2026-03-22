/**
 * Realm Wars - Three.js Card Renderer
 * Pack Opening Scene with 3D card animations
 */

import * as THREE from 'three';

// Class color map
const CLASS_COLORS = {
    warrior: { primary: 0x6b7280, secondary: 0x374151, emissive: 0x222222 },
    mage:    { primary: 0x1e3a5f, secondary: 0x3b82f6, emissive: 0x0a1a30 },
    ranger:  { primary: 0x14532d, secondary: 0x22c55e, emissive: 0x071a0f },
    paladin: { primary: 0x78350f, secondary: 0xfcd34d, emissive: 0x3a1a05 },
    druid:   { primary: 0x064e3b, secondary: 0x10b981, emissive: 0x022416 },
    neutral: { primary: 0x1f2937, secondary: 0x4b5563, emissive: 0x0d1117 },
};

const RARITY_COLORS = {
    common:    0x9ca3af,
    rare:      0x3b82f6,
    epic:      0xa855f7,
    legendary: 0xf59e0b,
};

const RARITY_GLOW_INTENSITY = {
    common:    0.0,
    rare:      0.3,
    epic:      0.5,
    legendary: 0.9,
};

/**
 * CardMesh - A 3D playing card
 */
export class CardMesh {
    constructor(cardData, scene) {
        this.cardData = cardData;
        this.scene = scene;
        this.group = new THREE.Group();
        this.isFaceUp = false;
        this.isAnimating = false;
        this.originalPosition = new THREE.Vector3();
        this._build();
        scene.add(this.group);
    }

    _build() {
        const W = 1.2;
        const H = 1.8;
        const DEPTH = 0.04;

        const classKey = (this.cardData.hero_class || 'neutral').toLowerCase();
        const colors = CLASS_COLORS[classKey] || CLASS_COLORS.neutral;
        const rarityColor = RARITY_COLORS[this.cardData.rarity] || RARITY_COLORS.common;

        // ---- FRONT FACE ----
        const frontGeo = new THREE.BoxGeometry(W - 0.04, H - 0.04, DEPTH * 0.5);

        // Card face canvas texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 384;
        const ctx = canvas.getContext('2d');

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 256, 384);
        const c1 = '#' + colors.primary.toString(16).padStart(6, '0');
        const c2 = '#' + colors.secondary.toString(16).padStart(6, '0');
        grad.addColorStop(0, '#0a0a14');
        grad.addColorStop(0.3, c1);
        grad.addColorStop(1, c2 + '88');
        ctx.fillStyle = grad;
        ctx.roundRect(0, 0, 256, 384, 12);
        ctx.fill();

        // Art area
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.roundRect(10, 40, 236, 170, 8);
        ctx.fill();

        // Class emoji in art area
        ctx.font = '80px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this._getClassEmoji(), 128, 125);

        // Card frame border
        const rarityHex = '#' + rarityColor.toString(16).padStart(6, '0');
        ctx.strokeStyle = rarityHex;
        ctx.lineWidth = 4;
        ctx.shadowColor = rarityHex;
        ctx.shadowBlur = 10;
        ctx.roundRect(4, 4, 248, 376, 10);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Mana cost bubble
        ctx.fillStyle = '#1e3a5f';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(26, 26, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#93c5fd';
        ctx.font = 'bold 18px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.cardData.mana_cost, 26, 26);

        // Card name
        ctx.fillStyle = '#e8e0d0';
        ctx.font = 'bold 13px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const name = this.cardData.name;
        ctx.fillText(name.length > 16 ? name.substring(0, 14) + '..' : name, 128, 218);

        // Type line
        ctx.fillStyle = 'rgba(201,168,76,0.8)';
        ctx.font = '10px Georgia';
        ctx.fillText(`${this.cardData.rarity} ${this.cardData.card_type}`, 128, 235);

        // Description
        ctx.fillStyle = '#9b8f7a';
        ctx.font = '9px Georgia';
        const desc = this.cardData.description || '';
        this._wrapText(ctx, desc, 20, 255, 216, 13);

        // Stats
        if (this.cardData.card_type !== 'spell') {
            // Attack
            ctx.fillStyle = '#7f1d1d';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(28, 355, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fca5a5';
            ctx.font = 'bold 16px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.cardData.attack ?? 0, 28, 355);

            // Health
            ctx.fillStyle = '#14532d';
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(228, 355, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#86efac';
            ctx.font = 'bold 16px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.cardData.health ?? 0, 228, 355);
        } else {
            // Spell indicator
            ctx.fillStyle = rarityHex;
            ctx.font = '24px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', 128, 355);
        }

        const frontTexture = new THREE.CanvasTexture(canvas);
        const frontMat = new THREE.MeshPhongMaterial({
            map: frontTexture,
            emissiveMap: frontTexture,
            emissive: new THREE.Color(0x111111),
            emissiveIntensity: 0.1,
        });

        // ---- BACK FACE ----
        const backCanvas = document.createElement('canvas');
        backCanvas.width = 256;
        backCanvas.height = 384;
        const bctx = backCanvas.getContext('2d');

        const bgGrad = bctx.createLinearGradient(0, 0, 256, 384);
        bgGrad.addColorStop(0, '#120a1e');
        bgGrad.addColorStop(0.5, '#1e0a38');
        bgGrad.addColorStop(1, '#0a0414');
        bctx.fillStyle = bgGrad;
        bctx.roundRect(0, 0, 256, 384, 12);
        bctx.fill();

        // Pattern
        bctx.strokeStyle = 'rgba(107,33,168,0.4)';
        bctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 12; j++) {
                bctx.beginPath();
                bctx.rect(i * 32 + 4, j * 32 + 4, 24, 24);
                bctx.stroke();
            }
        }

        // Center emblem
        bctx.fillStyle = 'rgba(107,33,168,0.3)';
        bctx.beginPath();
        bctx.arc(128, 192, 60, 0, Math.PI * 2);
        bctx.fill();
        bctx.strokeStyle = '#6b21a8';
        bctx.lineWidth = 2;
        bctx.stroke();

        bctx.fillStyle = '#c9a84c';
        bctx.font = '50px serif';
        bctx.textAlign = 'center';
        bctx.textBaseline = 'middle';
        bctx.fillText('⚔', 128, 192);

        // Border
        bctx.strokeStyle = '#6b21a8';
        bctx.lineWidth = 3;
        bctx.roundRect(4, 4, 248, 376, 10);
        bctx.stroke();

        // Text
        bctx.fillStyle = '#c9a84c';
        bctx.font = 'bold 14px Georgia';
        bctx.textAlign = 'center';
        bctx.textBaseline = 'middle';
        bctx.fillText('REALM WARS', 128, 310);

        const backTexture = new THREE.CanvasTexture(backCanvas);
        const backMat = new THREE.MeshPhongMaterial({
            map: backTexture,
        });

        // ---- CARD MESH ----
        const cardGeo = new THREE.BoxGeometry(W, H, DEPTH);

        // 6 faces: front(+z), back(-z), top, bottom, left, right
        const sideMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
        const materials = [sideMat, sideMat, sideMat, sideMat, backMat, frontMat];

        this.mesh = new THREE.Mesh(cardGeo, materials);
        this.group.add(this.mesh);

        // ---- RARITY GLOW OUTLINE ----
        const glowIntensity = RARITY_GLOW_INTENSITY[this.cardData.rarity] || 0;
        if (glowIntensity > 0) {
            const glowGeo = new THREE.BoxGeometry(W + 0.08, H + 0.08, DEPTH + 0.01);
            const glowMat = new THREE.MeshBasicMaterial({
                color: rarityColor,
                transparent: true,
                opacity: glowIntensity * 0.6,
                side: THREE.BackSide,
            });
            this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
            this.group.add(this.glowMesh);

            if (this.cardData.rarity === 'legendary') {
                this._animateGlow();
            }
        }
    }

    _animateGlow() {
        if (!this.glowMesh) return;
        let t = 0;
        const animate = () => {
            if (!this.glowMesh) return;
            t += 0.03;
            this.glowMesh.material.opacity = 0.4 + Math.sin(t) * 0.3;
            this._glowAnimId = requestAnimationFrame(animate);
        };
        animate();
    }

    _getClassEmoji() {
        const map = {
            warrior: '⚔️',
            mage: '🔮',
            ranger: '🏹',
            paladin: '🛡️',
            druid: '🌿',
            neutral: '⭐',
        };
        return map[(this.cardData.hero_class || 'neutral').toLowerCase()] || '⭐';
    }

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        if (!text) return;
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x + maxWidth / 2, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
                if (currentY > 340) break; // don't overflow card
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x + maxWidth / 2, currentY);
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
        this.originalPosition.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
    }

    // Flip card to show front
    flip(delay = 0) {
        return new Promise(resolve => {
            this.isAnimating = true;
            const duration = 600;
            const startTime = performance.now() + delay;
            const startY = this.group.rotation.y;
            const targetY = startY + Math.PI;

            const animate = (now) => {
                if (now < startTime) {
                    requestAnimationFrame(animate);
                    return;
                }
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this._easeInOut(progress);

                this.group.rotation.y = startY + eased * Math.PI;

                // Lift card during flip
                const liftProgress = Math.sin(progress * Math.PI);
                this.group.position.y = this.originalPosition.y + liftProgress * 0.8;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.group.rotation.y = targetY;
                    this.group.position.y = this.originalPosition.y;
                    this.isAnimating = false;
                    this.isFaceUp = !this.isFaceUp;
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    hover() {
        if (this.isAnimating) return;
        const targetY = this.originalPosition.y + 0.2;
        this._tweenTo(this.group.position, { y: targetY }, 200);
    }

    unhover() {
        if (this.isAnimating) return;
        this._tweenTo(this.group.position, { y: this.originalPosition.y }, 200);
    }

    _tweenTo(obj, target, duration) {
        const start = {};
        const keys = Object.keys(target);
        keys.forEach(k => start[k] = obj[k]);

        const startTime = performance.now();
        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = this._easeOut(progress);
            keys.forEach(k => {
                obj[k] = start[k] + (target[k] - start[k]) * eased;
            });
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    _easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    _easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    destroy() {
        if (this._glowAnimId) cancelAnimationFrame(this._glowAnimId);
        this.scene.remove(this.group);
        this.group.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
    }
}

/**
 * PackOpeningScene - Full pack opening experience
 */
export class PackOpeningScene {
    constructor(container) {
        this.container = container;
        this.cards = [];
        this.particleSystems = [];
        this._init();
    }

    _init() {
        const W = this.container.clientWidth;
        const H = this.container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x04040c);
        this.scene.fog = new THREE.FogExp2(0x04040c, 0.15);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
        this.camera.position.set(0, 0, 7);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(W, H);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambient = new THREE.AmbientLight(0x220033, 0.8);
        this.scene.add(ambient);

        this.mainLight = new THREE.PointLight(0xc9a84c, 2, 20);
        this.mainLight.position.set(0, 5, 5);
        this.scene.add(this.mainLight);

        const rimLight = new THREE.PointLight(0x6b21a8, 1.5, 15);
        rimLight.position.set(-5, -2, 3);
        this.scene.add(rimLight);

        // Background star particles
        this._createStarfield();

        // Handle resize
        this._resizeHandler = () => this._onResize();
        window.addEventListener('resize', this._resizeHandler);

        // Start render loop
        this._rendering = true;
        this._renderLoop();
    }

    _createStarfield() {
        const geo = new THREE.BufferGeometry();
        const count = 500;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 60;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
        });
        this.starfield = new THREE.Points(geo, mat);
        this.scene.add(this.starfield);
    }

    loadCards(cardDataArray, packType = 'starter') {
        // Clear existing cards
        this.cards.forEach(c => c.destroy());
        this.cards = [];

        // Set lighting color based on pack type
        if (packType === 'legendary') {
            this.mainLight.color.setHex(0xf59e0b);
            this.scene.background = new THREE.Color(0x080400);
        } else if (packType === 'arcane') {
            this.mainLight.color.setHex(0x9333ea);
            this.scene.background = new THREE.Color(0x060010);
        } else {
            this.mainLight.color.setHex(0xc9a84c);
            this.scene.background = new THREE.Color(0x04040c);
        }

        const count = cardDataArray.length;
        const spread = Math.min((count - 1) * 1.5, 8);

        cardDataArray.forEach((card, i) => {
            const cardMesh = new CardMesh(card, this.scene);
            const x = count > 1 ? -spread / 2 + (spread / (count - 1)) * i : 0;
            const fanAngle = count > 1 ? (-15 + (30 / (count - 1)) * i) * (Math.PI / 180) : 0;

            cardMesh.setPosition(x, -3, 0);
            cardMesh.setRotation(0, Math.PI, fanAngle * 0.3); // Start face down
            this.cards.push(cardMesh);
        });
    }

    async animatePackReveal() {
        if (this.cards.length === 0) return;

        // Animate cards flying in from below
        const count = this.cards.length;
        const spread = count > 1 ? (count - 1) * 1.5 : 0;
        const targets = this.cards.map((_, i) => ({
            x: count > 1 ? -spread / 2 + (spread / (count - 1)) * i : 0,
            y: 0,
            z: 0,
        }));

        // Fly in animation
        await this._flyIn(targets);

        // Reveal cards one by one
        for (let i = 0; i < this.cards.length; i++) {
            await this._sleep(300);
            const card = this.cards[i];
            await card.flip(0);
            this._burstParticles(card.group.position.clone(), card.cardData.rarity);
        }
    }

    async _flyIn(targets) {
        return new Promise(resolve => {
            const duration = 800;
            const startTime = performance.now();
            const startPositions = this.cards.map(c => c.group.position.clone());

            const animate = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic

                this.cards.forEach((card, i) => {
                    const startY = startPositions[i].y;
                    card.group.position.x = startPositions[i].x + (targets[i].x - startPositions[i].x) * eased;
                    card.group.position.y = startY + (targets[i].y - startY) * eased;
                    card.originalPosition.copy(card.group.position);
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    _burstParticles(position, rarity) {
        const color = RARITY_COLORS[rarity] || 0xc9a84c;
        const count = rarity === 'legendary' ? 80 : rarity === 'epic' ? 50 : 30;

        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            const angle = Math.random() * Math.PI * 2;
            const speed = 0.03 + Math.random() * 0.08;
            velocities.push({
                x: Math.cos(angle) * speed,
                y: (0.02 + Math.random() * 0.06),
                z: (Math.random() - 0.5) * 0.02,
            });
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));

        const mat = new THREE.PointsMaterial({
            color,
            size: rarity === 'legendary' ? 0.12 : 0.08,
            transparent: true,
            opacity: 1,
        });

        const particles = new THREE.Points(geo, mat);
        this.scene.add(particles);

        const startTime = performance.now();
        const lifetime = 1500;

        const system = {
            particles,
            velocities,
            positions: Array.from(positions),
            startTime,
            lifetime,
        };

        this.particleSystems.push(system);
    }

    _updateParticles(now) {
        this.particleSystems = this.particleSystems.filter(sys => {
            const elapsed = now - sys.startTime;
            if (elapsed > sys.lifetime) {
                this.scene.remove(sys.particles);
                sys.particles.geometry.dispose();
                sys.particles.material.dispose();
                return false;
            }

            const progress = elapsed / sys.lifetime;
            const posAttr = sys.particles.geometry.attributes.position;

            for (let i = 0; i < sys.velocities.length; i++) {
                sys.positions[i * 3] += sys.velocities[i].x;
                sys.positions[i * 3 + 1] += sys.velocities[i].y;
                sys.positions[i * 3 + 2] += sys.velocities[i].z;
                sys.velocities[i].y -= 0.001; // gravity
                posAttr.array[i * 3] = sys.positions[i * 3];
                posAttr.array[i * 3 + 1] = sys.positions[i * 3 + 1];
                posAttr.array[i * 3 + 2] = sys.positions[i * 3 + 2];
            }
            posAttr.needsUpdate = true;
            sys.particles.material.opacity = 1 - progress;

            return true;
        });
    }

    _renderLoop() {
        if (!this._rendering) return;
        requestAnimationFrame(() => this._renderLoop());

        const now = performance.now();

        // Rotate starfield slowly
        if (this.starfield) {
            this.starfield.rotation.y += 0.0001;
            this.starfield.rotation.x += 0.00005;
        }

        // Pulse main light
        this.mainLight.intensity = 2 + Math.sin(now * 0.002) * 0.3;

        // Update particles
        this._updateParticles(now);

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

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    destroy() {
        this._rendering = false;
        window.removeEventListener('resize', this._resizeHandler);
        this.cards.forEach(c => c.destroy());
        this.particleSystems.forEach(sys => {
            this.scene.remove(sys.particles);
            sys.particles.geometry.dispose();
            sys.particles.material.dispose();
        });
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
}
