/**
 * Realm Wars - Three.js Game Board (board + heroes only, no hand)
 */

import * as THREE from 'three';

const CARD_W       = 0.9;
const CARD_H       = 1.35;
const CARD_D       = 0.04;
const SLOT_SPACING = 1.1;
const MAX_SLOTS    = 7;

const CLASS_COLORS = {
    warrior: 0xb45309, mage: 0x3b82f6, ranger: 0x16a34a,
    paladin: 0xfcd34d, druid: 0x15803d, neutral: 0x6b7280,
};
const RARITY_COLORS = {
    common: 0x9ca3af, rare: 0x3b82f6, epic: 0xa855f7, legendary: 0xf59e0b,
};

/* ── card canvas texture ─────────────────────────────────── */
function makeCardTexture(card) {
    const W = 192, H = 288;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');

    const cls   = (card.hero_class || 'neutral').toLowerCase();
    const pHex  = '#' + (CLASS_COLORS[cls]    || 0x6b7280).toString(16).padStart(6,'0');
    const rHex  = '#' + (RARITY_COLORS[card.rarity] || 0x9ca3af).toString(16).padStart(6,'0');

    /* bg */
    const bg = c.createLinearGradient(0,0,0,H);
    bg.addColorStop(0, '#0c0c1a');
    bg.addColorStop(1, pHex + '55');
    c.fillStyle = bg;
    c.roundRect(0,0,W,H,10); c.fill();

    /* rarity border */
    c.strokeStyle = rHex; c.lineWidth = 4;
    c.shadowColor = rHex; c.shadowBlur = 10;
    c.roundRect(3,3,W-6,H-6,9); c.stroke();
    c.shadowBlur = 0;

    /* art area */
    const art = c.createLinearGradient(0,30,0,130);
    art.addColorStop(0, pHex + 'cc');
    art.addColorStop(1, pHex + '33');
    c.fillStyle = art;
    c.roundRect(8,28,W-16,96,6); c.fill();

    /* class emoji */
    const emojis = { warrior:'⚔️', mage:'🔮', ranger:'🏹', paladin:'🛡️', druid:'🌿', neutral:'⭐' };
    c.font = '52px serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(emojis[cls] || '⭐', W/2, 76);

    /* mana gem */
    const mg = c.createRadialGradient(22,22,4,22,22,14);
    mg.addColorStop(0, '#93c5fd'); mg.addColorStop(1, '#1e3a5f');
    c.fillStyle = mg;
    c.beginPath(); c.arc(22,22,14,0,Math.PI*2); c.fill();
    c.strokeStyle = '#60a5fa'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; c.font = 'bold 14px Georgia';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(card.mana_cost, 22, 22);

    /* name */
    /* name band */
    c.fillStyle = 'rgba(0,0,0,0.65)';
    c.roundRect(6,128,W-12,22,4); c.fill();
    c.fillStyle = '#f8fafc'; c.font = 'bold 11px Inter,sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const nm = card.name;
    c.fillText(nm.length>16 ? nm.slice(0,14)+'…' : nm, W/2, 139);

    /* description */
    c.fillStyle = '#cbd5e1'; c.font = '9px Inter,sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'top';
    const desc = card.description || '';
    const words = desc.split(' ');
    let line = '', y = 154;
    for (const w of words) {
        const test = line ? line+' '+w : w;
        if (c.measureText(test).width > W-20) { c.fillText(line, W/2, y); line=w; y+=12; if(y>240) break; }
        else line = test;
    }
    if (line && y<=240) c.fillText(line, W/2, y);

    /* atk / hp */
    if (card.card_type !== 'spell') {
        /* attack */
        const atkG = c.createRadialGradient(20,H-20,4,20,H-20,14);
        atkG.addColorStop(0,'#fbbf24'); atkG.addColorStop(1,'#92400e');
        c.fillStyle = atkG;
        c.beginPath(); c.arc(20,H-20,14,0,Math.PI*2); c.fill();
        c.strokeStyle='#f59e0b'; c.lineWidth=2; c.stroke();
        c.fillStyle='#fff'; c.font='bold 14px Georgia';
        c.textAlign='center'; c.textBaseline='middle';
        c.fillText(card.attack??0, 20, H-20);

        /* health */
        const hpG = c.createRadialGradient(W-20,H-20,4,W-20,H-20,14);
        hpG.addColorStop(0,'#f87171'); hpG.addColorStop(1,'#7f1d1d');
        c.fillStyle = hpG;
        c.beginPath(); c.arc(W-20,H-20,14,0,Math.PI*2); c.fill();
        c.strokeStyle='#ef4444'; c.lineWidth=2; c.stroke();
        c.fillStyle='#fff'; c.font='bold 14px Georgia';
        c.textAlign='center'; c.textBaseline='middle';
        c.fillText(card.health??0, W-20, H-20);
    }

    return new THREE.CanvasTexture(cv);
}

function makeBoardCard(card) {
    const geo = new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D);
    const tex = makeCardTexture(card);
    const front = new THREE.MeshPhongMaterial({ map: tex });
    const side  = new THREE.MeshPhongMaterial({ color: 0x1c1c35 });
    // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z (back)
    // Camera is at z=9 so the +z face (index 4) faces the viewer
    const mesh  = new THREE.Mesh(geo, [side,side,side,side,front,side]);
    mesh.userData.cardId = card.id;
    return mesh;
}

/* ── GameBoard ───────────────────────────────────────────── */
export class GameBoard {
    constructor(container) {
        this.container      = container;
        this.playerMeshes   = {};   // cardId → mesh (player board)
        this.opponentMeshes = {};   // cardId → mesh (opponent board)
        this.selectedAttacker = null;
        this.onCardClickCb  = null;
        this.onTargetSelectCb = null;
        this.gameState      = null;
        this.playerId       = null;
        this._rendering     = false;
        this._dropZoneEl    = document.getElementById('board-drop-zone');
        this._init();
    }

    /* ── setup ───────────────────────────── */
    _init() {
        const W = this.container.clientWidth  || window.innerWidth;
        const H = this.container.clientHeight || window.innerHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x06060f);
        this.scene.fog = new THREE.FogExp2(0x06060f, 0.035);

        this.camera = new THREE.PerspectiveCamera(50, W/H, 0.1, 100);
        this.camera.position.set(0, 7, 9);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
        this.renderer.setSize(W, H);
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        /* lights */
        this.scene.add(new THREE.AmbientLight(0x3344aa, 1.8));
        const sun = new THREE.DirectionalLight(0xfff8e8, 1.4);
        sun.position.set(4, 10, 6); sun.castShadow = true;
        this.scene.add(sun);
        const fill = new THREE.PointLight(0x7c3aed, 1.2, 18);
        fill.position.set(-5, 4, 0);
        this.scene.add(fill);
        const rimLight = new THREE.PointLight(0xf59e0b, 0.6, 12);
        rimLight.position.set(5, 3, -5);
        this.scene.add(rimLight);

        this._buildBoard();
        this._buildHeroes();
        this._buildDropHighlight();

        /* interaction */
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this._clickCb = e => this._onClick(e);
        this._moveCb  = e => this._onMove(e);
        this.renderer.domElement.addEventListener('click',     this._clickCb);
        this.renderer.domElement.addEventListener('mousemove', this._moveCb);
        this._resizeCb = () => this._onResize();
        window.addEventListener('resize', this._resizeCb);

        this._rendering = true;
        this._loop();
    }

    _buildBoard() {
        const boardGeo = new THREE.BoxGeometry(13, 0.25, 9);
        const cv = document.createElement('canvas');
        cv.width=1024; cv.height=512;
        const c = cv.getContext('2d');

        /* dark stone bg */
        const bg = c.createLinearGradient(0,0,0,512);
        bg.addColorStop(0,'#0e1520'); bg.addColorStop(.5,'#182030'); bg.addColorStop(1,'#0e1520');
        c.fillStyle=bg; c.fillRect(0,0,1024,512);

        /* subtle grid */
        c.strokeStyle='rgba(245,158,11,0.04)'; c.lineWidth=1;
        for(let x=0;x<1024;x+=64){c.beginPath();c.moveTo(x,0);c.lineTo(x,512);c.stroke();}
        for(let y=0;y<512;y+=64){c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();}

        /* rune circles */
        [[256,256],[512,256],[768,256]].forEach(([cx,cy])=>{
            c.strokeStyle='rgba(124,58,237,0.18)'; c.lineWidth=2;
            c.beginPath(); c.arc(cx,cy,70,0,Math.PI*2); c.stroke();
            c.beginPath(); c.arc(cx,cy,110,0,Math.PI*2); c.stroke();
        });

        /* center line */
        c.fillStyle='rgba(245,158,11,0.25)'; c.fillRect(0,246,1024,20);

        const tex = new THREE.CanvasTexture(cv);
        const mat = new THREE.MeshPhongMaterial({ map:tex, shininess:15 });
        const mesh = new THREE.Mesh(boardGeo, mat);
        mesh.receiveShadow = true;
        mesh.position.y = -0.125;
        this.scene.add(mesh);

        /* gold border */
        const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(13.1,0.3,9.1));
        const edgeMat = new THREE.LineBasicMaterial({ color:0xf59e0b, transparent:true, opacity:0.35 });
        this.scene.add(new THREE.LineSegments(edgeGeo, edgeMat));

        /* center divider */
        const divGeo = new THREE.BoxGeometry(13,0.02,0.06);
        const divMat = new THREE.MeshBasicMaterial({ color:0xf59e0b, transparent:true, opacity:0.45 });
        const div = new THREE.Mesh(divGeo, divMat);
        div.position.y = 0.01;
        this.scene.add(div);

        /* battle slots */
        this._playerSlots   = [];
        this._opponentSlots = [];
        const sGeo = new THREE.BoxGeometry(CARD_W+0.18, 0.02, CARD_H+0.18);
        const pMat = new THREE.MeshBasicMaterial({ color:0x1e3a5f, transparent:true, opacity:0.35 });
        const oMat = new THREE.MeshBasicMaterial({ color:0x5f1e1e, transparent:true, opacity:0.35 });
        for (let i=0; i<MAX_SLOTS; i++) {
            const x = (i-(MAX_SLOTS-1)/2)*SLOT_SPACING;
            const ps = new THREE.Mesh(sGeo, pMat);
            ps.position.set(x,0.01,2); this.scene.add(ps); this._playerSlots.push(ps);
            const os = new THREE.Mesh(sGeo, oMat);
            os.position.set(x,0.01,-2); this.scene.add(os); this._opponentSlots.push(os);
        }
    }

    _buildHeroes() {
        this._buildHeroPad(new THREE.Vector3(0, 0, 4.2), false);
        this._buildHeroPad(new THREE.Vector3(0, 0, -4.2), true);
    }

    /* Simple glowing altar pad — no humanoid figures */
    _buildHeroPad(pos, isOpp) {
        const g = new THREE.Group();

        /* flat octagonal base */
        const baseG = new THREE.CylinderGeometry(1.05, 1.15, 0.12, 8);
        const baseC = isOpp ? 0x3b0a0a : 0x0a1a3b;
        const base  = new THREE.Mesh(baseG, new THREE.MeshPhongMaterial({ color:baseC, shininess:80 }));
        g.add(base);

        /* glowing ring on top */
        const ringG = new THREE.TorusGeometry(0.9, 0.05, 8, 32);
        const ringC = isOpp ? 0xef4444 : 0x60a5fa;
        const ring  = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color:ringC }));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.07;
        g.add(ring);

        /* inner rune disc */
        const discG = new THREE.CylinderGeometry(0.75, 0.75, 0.02, 32);
        const discC = isOpp ? 0x7f1d1d : 0x1e3a5f;
        const disc  = new THREE.Mesh(discG, new THREE.MeshPhongMaterial({ color:discC, shininess:120, emissive:ringC, emissiveIntensity:0.15 }));
        disc.position.y = 0.07;
        g.add(disc);

        /* point light so the pad glows onto the board */
        const light = new THREE.PointLight(ringC, 0.8, 4);
        light.position.y = 0.5;
        g.add(light);

        g.position.copy(pos);
        this.scene.add(g);

        /* store group & ring for pulse animation */
        if (isOpp) { this.opponentHeroGroup = g; this._oppRing = ring; this._oppLight = light; }
        else        { this.playerHeroGroup  = g; this._plyRing = ring; this._plyLight = light; }
    }

    /* invisible plane used for drop-zone feedback */
    _buildDropHighlight() {
        const geo = new THREE.PlaneGeometry(12, 3.5);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x22c55e, transparent:true, opacity:0, side:THREE.DoubleSide
        });
        this._dropPlane = new THREE.Mesh(geo, mat);
        this._dropPlane.rotation.x = -Math.PI/2;
        this._dropPlane.position.set(0, 0.05, 2);
        this.scene.add(this._dropPlane);
    }

    /* ── public API ──────────────────────── */

    highlightDropZone(on) {
        if (!this._dropPlane) return;
        this._dropPlane.material.opacity = on ? 0.18 : 0;
    }

    updateFromGameState(state, myId) {
        this.gameState = state;
        this.playerId  = myId;
        const oppKey   = Object.keys(state.players).find(k => parseInt(k) !== myId);
        this.opponentId = oppKey;

        const my  = state.players[String(myId)];
        const opp = state.players[oppKey];

        if (my)  this._syncBoard(my.board  || [], false);
        if (opp) this._syncBoard(opp.board || [], true);

        /* hp orb colours */
        if (my  && this.playerHpOrb)   this.playerHpOrb.material.color.setHex(
            my.hero_hp  > 15 ? 0x44ee88 : my.hero_hp  > 8 ? 0xffaa00 : 0xff3333);
        if (opp && this.opponentHpOrb) this.opponentHpOrb.material.color.setHex(
            opp.hero_hp > 15 ? 0x44ee88 : opp.hero_hp > 8 ? 0xffaa00 : 0xff3333);
    }

    _syncBoard(boardData, isOpp) {
        const map  = isOpp ? this.opponentMeshes : this.playerMeshes;
        const zPos = isOpp ? -2 : 2;

        /* clear old */
        Object.values(map).forEach(m => { this.scene.remove(m); this._disposeMesh(m); });
        if (isOpp) this.opponentMeshes = {};
        else       this.playerMeshes   = {};

        const n = boardData.length;
        boardData.forEach((ci, i) => {
            const card = (window._cardCache && window._cardCache[ci.id]) || {
                id:ci.id, name:`Card #${ci.id}`, mana_cost:0,
                attack:ci.attack||0, health:ci.health||0,
                card_type:'minion', rarity:'common', hero_class:'neutral'
            };
            const mesh = makeBoardCard(card);
            const x = n>1 ? (i-(n-1)/2)*SLOT_SPACING : 0;
            // Lay nearly flat — π/2 tilts card horizontal, small offset faces camera
            const FLAT = -Math.PI / 2 + 0.18;
            mesh.position.set(x, 0.1, zPos);
            mesh.rotation.x = isOpp ? -FLAT : FLAT;
            mesh.userData = { cardId:ci.id, isOpp, boardIndex:i };
            (isOpp ? this.opponentMeshes : this.playerMeshes)[ci.id] = mesh;
            this.scene.add(mesh);
        });
    }

    /* ── attack / death animations ───────── */

    attackAnimation(attackerId, targetCardId) {
        const attacker = this.playerMeshes[attackerId];
        if (!attacker) return Promise.resolve();
        const target = targetCardId
            ? (this.opponentMeshes[targetCardId] || null)
            : null;
        const origin = attacker.position.clone();
        const dest   = target
            ? target.position.clone()
            : new THREE.Vector3(0, 0.5, -2);
        return this._animateTo(attacker, dest, 0.22).then(() => {
            this._flashImpact(dest);
            return this._animateTo(attacker, origin, 0.28);
        });
    }

    deathAnimation(cardId, isOpp) {
        const map  = isOpp ? this.opponentMeshes : this.playerMeshes;
        const mesh = map[cardId]; if (!mesh) return;
        delete map[cardId];
        const t0 = performance.now();
        const origY = mesh.position.y;
        const tick  = now => {
            const p = Math.min((now-t0)/600, 1);
            mesh.position.y = origY - p*2.5;
            mesh.scale.setScalar(1-p);
            if (mesh.material) {
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                mats.forEach(m => { m.transparent=true; m.opacity=1-p; });
            }
            if (p < 1) requestAnimationFrame(tick);
            else       { this.scene.remove(mesh); this._disposeMesh(mesh); }
        };
        requestAnimationFrame(tick);
    }

    /* ── interaction ─────────────────────── */

    _onClick(e) {
        this._setMouse(e);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        /* opponent board → target select */
        const oppList = Object.values(this.opponentMeshes);
        const oppHit  = this.raycaster.intersectObjects(oppList);
        if (oppHit.length) {
            this.onTargetSelectCb?.(oppHit[0].object.userData.cardId, 'minion');
            return;
        }
        /* opponent hero → hero attack */
        if (this.opponentHeroGroup) {
            const heroMeshes = [];
            this.opponentHeroGroup.traverse(c => { if(c.isMesh) heroMeshes.push(c); });
            if (this.raycaster.intersectObjects(heroMeshes).length) {
                this.onTargetSelectCb?.(null, 'hero'); return;
            }
        }
        /* own board card → select attacker */
        const ownList = Object.values(this.playerMeshes);
        const ownHit  = this.raycaster.intersectObjects(ownList);
        if (ownHit.length) {
            this.onCardClickCb?.(ownHit[0].object.userData.cardId, 'board');
        }
    }

    _onMove(e) {
        this._setMouse(e);
        this.raycaster.setFromCamera(this.mouse, this.camera);
        /* hover: lift card straight up off the board */
        [...Object.values(this.playerMeshes), ...Object.values(this.opponentMeshes)].forEach(m => {
            const hit = this.raycaster.intersectObject(m).length > 0;
            m.position.y = hit ? 0.55 : 0.1;
        });
    }

    _setMouse(e) {
        const r = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x =  ((e.clientX - r.left) / r.width)  * 2 - 1;
        this.mouse.y = -((e.clientY - r.top)  / r.height) * 2 + 1;
    }

    onCardClick(cb)    { this.onCardClickCb    = cb; }
    onTargetSelect(cb) { this.onTargetSelectCb = cb; }

    /* ── helpers ─────────────────────────── */

    _flashImpact(pos) {
        const geo = new THREE.SphereGeometry(0.28, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color:0xf59e0b, transparent:true, opacity:0.9 });
        const f   = new THREE.Mesh(geo, mat);
        f.position.copy(pos);
        this.scene.add(f);
        const t0 = performance.now();
        const tick = now => {
            const p = Math.min((now-t0)/350, 1);
            f.scale.setScalar(1+p*2.5);
            f.material.opacity = 0.9*(1-p);
            if (p<1) requestAnimationFrame(tick);
            else { this.scene.remove(f); geo.dispose(); mat.dispose(); }
        };
        requestAnimationFrame(tick);
    }

    _animateTo(mesh, target, sec) {
        return new Promise(res => {
            const src = mesh.position.clone();
            const t0  = performance.now();
            const ms  = sec * 1000;
            const tick = now => {
                const p = Math.min((now-t0)/ms, 1);
                const e = 1 - Math.pow(1-p, 3);
                mesh.position.lerpVectors(src, target, e);
                if (p<1) requestAnimationFrame(tick); else res();
            };
            requestAnimationFrame(tick);
        });
    }

    _disposeMesh(m) {
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach(mt => { mt?.map?.dispose(); mt?.dispose(); });
    }

    /* ── render loop ─────────────────────── */

    _loop() {
        if (!this._rendering) return;
        requestAnimationFrame(() => this._loop());
        const t = performance.now();
        /* subtle ring pulse on hero pads */
        if (this._plyLight)  this._plyLight.intensity  = 0.8 + Math.sin(t*0.002)*0.25;
        if (this._oppLight)  this._oppLight.intensity  = 0.8 + Math.sin(t*0.002+1)*0.25;
        this.renderer.render(this.scene, this.camera);
    }

    _onResize() {
        if (!this.container || !this.renderer) return;
        const W = this.container.clientWidth  || window.innerWidth;
        const H = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = W / H;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(W, H);
    }

    destroy() {
        this._rendering = false;
        window.removeEventListener('resize', this._resizeCb);
        this.renderer.domElement.removeEventListener('click',     this._clickCb);
        this.renderer.domElement.removeEventListener('mousemove', this._moveCb);
        this.renderer.dispose();
        this.renderer.domElement.parentNode?.removeChild(this.renderer.domElement);
    }
}
