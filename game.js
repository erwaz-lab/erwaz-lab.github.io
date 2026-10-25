/*
 * NUIT DE L’HORREUR — jeu de tir 3D d’Halloween (three.js r128)
 * ---------------------------------------------------------------------------
 * Ce fichier contient toute la logique du jeu. Il est chargé par index.html
 * APRÈS three.js. Les sections sont dans l’ordre d’exécution :
 *   1. Outils de base, rendu 3D, lumières        8. Boutique, armes, ennemis, histoire
 *   2. Décor procédural et collisions            9. Brouillard et contrôles tactiles
 *   3. Munitions, soins, viseur                 10. Paramètres, dialogues, mort
 *   4. Arène fermée, bâtiments, pathfinding     11. Étapes, boss et attaques
 *   5. Ennemis                                  12. Vagues
 *   6. Armes (modèles 3D)                       13. Début / fin de partie
 *   7. État du jeu, sons, effets                14. Entrées et boucle principale
 *
 * Abréviations utilisées dans le code
 *   R()            nombre aléatoire (Math.random)     P      Math.PI
 *   cl(v,a,b)      borne v entre a et b                V(x,y,z)  nouveau Vector3
 *   $(id)          document.getElementById            bx(...)   crée un cube coloré
 *   M(c,e)         matériau (couleur, émissif)        sc / cam / rd  scène / caméra / rendu
 *   pl             joueur {x,z,yaw,pitch,hp}          en     ennemis vivants
 *   W              tableau des armes                  T      types d’ennemis
 *   MG,RT,RV,MX,PA chargeur, rechargement, réserve, réserve max, ammo ramassée (par arme)
 *   own, pw, wu    armes possédées, pouvoirs passifs, améliorations
 *   st             état : 0 menu, 1 jeu, 2 fin, 3 boutique, 4 histoire, 5 pause, 6 dialogue
 *   wave / stg     niveau (1-10) / étape (1-5)         gold   médailles citrouilles
 *   gh(x,z)        hauteur du terrain                  AB     murs (boîtes de collision)
 *   RM             pièces (maisons, grottes)           CFG    paramètres du joueur
 */

const $ = i => document.getElementById(i);
const R = Math.random;
const P = Math.PI;
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const rd = new THREE.WebGLRenderer({ canvas: $('c') });
rd.setPixelRatio(Math.min(devicePixelRatio, 1.5));
const sc = new THREE.Scene();
sc.background = new THREE.Color(0x0a0618);
sc.fog = new THREE.FogExp2(0x0a0618, .04);
const cam = new THREE.PerspectiveCamera(75, 1, .1, 200);
cam.rotation.order = 'YXZ';
sc.add(cam);
const PT = () => false;
const W_ = () => PT() ? innerHeight : innerWidth;
const H_ = () => PT() ? innerWidth : innerHeight;
const tx = t => PT() ? t.clientY : t.clientX;
const ty = t => PT() ? innerWidth - t.clientX : t.clientY;
const rs = () => {
    rd.setSize(W_(), H_(), false);
    cam.aspect = W_() / H_();
    cam.updateProjectionMatrix();
};
addEventListener('resize', rs);
rs();
const M = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || 0 });
const bx = (w, h, d, c, x, y, z, e) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, e));
    m.position.set(x, y, z);
    return m;
};

// ==========================================================================
// 1. OUTILS DE BASE, RENDU 3D, LUMIÈRES ET DÉCOR DE DÉPART
// ==========================================================================
sc.add(new THREE.HemisphereLight(0x6677cc, 0x221133, .75));
const ml = new THREE.DirectionalLight(0xaabbff, .6);
ml.position.set(-30, 50, -40);
sc.add(ml);
const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false }));
moon.position.set(-60, 45, -80);
sc.add(moon);
const gr = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), M(0x1b1426));
gr.rotation.x = -P / 2;
sc.add(gr);
const A = 40;
const tg = new THREE.BoxGeometry(1, 1.4, .3);
const tmat = M(0x555566);
for (let i = 0; i < 0; i++) {
    const t = new THREE.Mesh(tg, tmat);
    const a = R() * P * 2;
    const r = 6 + R() * 34;
    t.position.set(Math.cos(a) * r, .6, Math.sin(a) * r);
    t.rotation.set((R() - .5) * .3, R() * 6, (R() - .5) * .3);
    sc.add(t);
}
const tk = new THREE.CylinderGeometry(.12, .3, 5, 6);
const tkm = M(0x2a1a14);
for (let i = 0; i < 0; i++) {
    const g = new THREE.Group();
    const a = R() * P * 2;
    const r = 10 + R() * 30;
    const t = new THREE.Mesh(tk, tkm);
    t.position.y = 2.5;
    g.add(t);
    [-1, 1].forEach(k => {
        const b = new THREE.Mesh(tk, tkm);
        b.scale.set(.6, .5, .6);
        b.position.set(k * .7, 4.2, 0);
        b.rotation.z = -k * .8;
        g.add(b);
    });
    g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    g.rotation.y = R() * 6;
    sc.add(g);
}
for (let i = 0; i < 2; i++) {
    const a = i * 3.14 + .7;
    const p = new THREE.Mesh(new THREE.SphereGeometry(.6, 10, 8), M(0xff6a00, 0x772200));
    p.scale.y = .8;
    p.position.set(Math.cos(a) * 13, .5, Math.sin(a) * 13);
    const l = new THREE.PointLight(0xff7a1a, 1.3, 15);
    l.position.set(p.position.x, 1.6, p.position.z);
    sc.add(p, l);
}
var stars;
{
    const s = [];
    for (let i = 0; i < 300; i++)
        s.push((R() - .5) * 300, 40 + R() * 60, (R() - .5) * 300);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(s, 3));
    stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: .8, fog: false }));
    sc.add(stars);
}

// ==========================================================================
// 2. DÉCOR PROCÉDURAL (CIMETIÈRE : TOMBES, ARBRES, ROCHERS) ET COLLISIONS
// ==========================================================================
const CS = 32;
const CH = {};
const gRk = new THREE.DodecahedronGeometry(1, 0);
const gPk = new THREE.SphereGeometry(.5, 8, 6);
const mRk = M(0x3a3646);
const mPk = M(0xff6a00, 0x602000);
let WS = 1;
const sd = (a, b) => {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ 1274126177;
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return (h ^ h >>> 16) >>> 0;
};
const rn = a => () => {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
function mkC(cx, cz) {
    const g = new THREE.Group();
    const r = rn(sd(cx + WS, cz));
    const cols = [];
    const ty = Math.floor(r() * 5);
    const pk = [
        ['g', 'g', 'g', 'g', 't', 'r'], ['t', 't', 't', 't', 't', 'r', 'r'], ['p', 'p', 'p', 'p', 'p', 'p', 'g'], ['g', 'g', 'r', 't'], ['r', 'r', 'r', 't']
    ][ty];
    const add = (m, x, z, d) => {
        if (Math.abs(x) > H - 4 || Math.abs(z) > H - 4 || FL.some(f => Math.hypot(x - f.x, z - f.z) < f.r + 2))
            return;
        m.position.x = x;
        m.position.z = z;
        m.position.y += gh(x, z);
        g.add(m);
        cols.push({ x, z, r: d });
    };
    for (let i = 0, n = ty == 4 ? 7 : 11; i < n; i++) {
        const x = (cx + r()) * CS;
        const z = (cz + r()) * CS;
        const k = pk[Math.floor(r() * pk.length)];
        let m;
        let d = .6;
        if (k == 'g') {
            m = new THREE.Mesh(tg, tmat);
            m.position.y = .6;
            m.rotation.set((r() - .5) * .3, r() * 6, (r() - .5) * .3);
        }
        else if (k == 't') {
            m = new THREE.Group();
            const t = new THREE.Mesh(tk, tkm);
            t.position.y = 2.5;
            m.add(t);
            [-1, 1].forEach(s => {
                const b = new THREE.Mesh(tk, tkm);
                b.scale.set(.6, .5, .6);
                b.position.set(s * .7, 4.2, 0);
                b.rotation.z = -s * .8;
                m.add(b);
            });
            m.rotation.y = r() * 6;
            d = .5;
        }
        else if (k == 'r') {
            m = new THREE.Mesh(gRk, mRk);
            m.scale.set(1 + r() * 1.4, .6 + r(), 1 + r() * 1.4);
            m.position.y = .4;
            d = m.scale.x * .9;
        }
        else {
            m = new THREE.Mesh(gPk, mPk);
            const s = 1 + r() * 1.2;
            m.scale.setScalar(s);
            m.position.y = .4 * s;
            d = .5 * s;
        }
        add(m, x, z, d);
    }
    if (0) {
        const h = new THREE.Group();
        const ro = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.8, 4), M(0x1c1226));
        h.add(bx(5, 3, 4, 0x2c2236, 0, 1.5, 0), bx(.9, 1.1, .1, 0xffaa33, -1.2, 1.6, 2.05, 0xffaa33), bx(.9, 1.1, .1, 0xffaa33, 1.2, 1.6, 2.05, 0xffaa33));
        ro.position.y = 3.9;
        ro.rotation.y = P / 4;
        h.add(ro);
        h.rotation.y = r() * 6;
        add(h, (cx + .5) * CS, (cz + .5) * CS, 3.4);
    }
    sc.add(g);
    return { g, cols, cx, cz };
}
function chunks() {
    const cx = Math.floor(pl.x / CS);
    const cz = Math.floor(pl.z / CS);
    for (let i = -2; i <= 2; i++)
        for (let j = -2; j <= 2; j++) {
            const k = (cx + i) + ',' + (cz + j);
            if (!CH[k])
                CH[k] = mkC(cx + i, cz + j);
        }
    for (const k in CH) {
        const c = CH[k];
        if (Math.abs(c.cx - cx) > 3 || Math.abs(c.cz - cz) > 3) {
            sc.remove(c.g);
            delete CH[k];
        }
    }
}
function clearW() {
    for (const k in CH) {
        sc.remove(CH[k].g);
        delete CH[k];
    }
}
function coll(Q = pl, rr = .4) {
    AB.forEach(b => {
        const nx = cl(Q.x, b.x0, b.x1);
        const nz = cl(Q.z, b.z0, b.z1);
        const dx = Q.x - nx;
        const dz = Q.z - nz;
        const d = Math.hypot(dx, dz);
        if (d < rr) {
            if (d > 1e-4) {
                Q.x = nx + dx / d * rr;
                Q.z = nz + dz / d * rr;
            }
            else
                Q.x = b.x0 - rr;
        }
    });
    Q.x = cl(Q.x, -H + .9, H - .9);
    Q.z = cl(Q.z, -H + .9, H - .9);
    const cx = Math.floor(Q.x / CS);
    const cz = Math.floor(Q.z / CS);
    for (let i = -1; i <= 1; i++)
        for (let j = -1; j <= 1; j++) {
            const c = CH[(cx + i) + ',' + (cz + j)];
            if (c)
                c.cols.forEach(o => {
                    const dx = Q.x - o.x;
                    const dz = Q.z - o.z;
                    const d = Math.hypot(dx, dz);
                    const m = o.r + rr;
                    if (d < m && d > 0) {
                        Q.x = o.x + dx / d * m;
                        Q.z = o.z + dz / d * m;
                    }
                });
        }
}
function reload() {
    if (rl > 0 || ammo[wi] >= MG[wi] || rv[wi] <= 0)
        return;
    rl = RT[wi] * (1 - .2 * pw[6]);
    snd(200, .15, 'triangle', .06);
}

// ==========================================================================
// 3. MUNITIONS, SOINS RAMASSABLES ET VISEUR DYNAMIQUE
// ==========================================================================
let cg = 8;
let hm = 0;
let aimE = 0;
function toast(s) {
    const b = $('ts');
    b.textContent = s;
    b.style.opacity = 1;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => b.style.opacity = 0, 1300);
}
function drop(x, z, L) {
    const h = R() < .2 || !own.some((v, i) => v && i);
    const w = pickW();
    const m = new THREE.Group();
    if (h)
        m.add(bx(.6, .2, .2, 0xe02030, 0, 0, 0, 0xaa1020), bx(.2, .6, .2, 0xe02030, 0, 0, 0, 0xaa1020));
    else
        m.add(bx(.55, .34, .34, 0x4a3a1a, 0, 0, 0, 0x2a1a00), bx(.2, .36, .36, W[w].col, 0, 0, 0, W[w].col));
    m.position.set(x, .6, z);
    sc.add(m);
    PK.push({ m, w: h ? -1 : w, l: L || 40, b: gh(x, z) });
}
function pks(dt) {
    PK = PK.filter(p => {
        p.l -= dt;
        p.m.rotation.y += dt * 2;
        p.m.position.y = p.b + .6 + Math.sin(p.l * 4) * .12;
        if (Math.hypot(p.m.position.x - pl.x, p.m.position.z - pl.z) < 1.7) {
            if (p.w < 0) {
                pl.hp = Math.min(hpMax, pl.hp + 25);
                toast('+25 vie');
            }
            else {
                rv[p.w] = Math.min(MX[p.w], rv[p.w] + PA[p.w]);
                toast('+' + PA[p.w] + ' munitions · ' + W[p.w].n);
            }
            snd(660, .12, 'triangle', .08);
            sc.remove(p.m);
            return false;
        }
        if (p.l <= 0) {
            sc.remove(p.m);
            return false;
        }
        return true;
    });
}
function aim() {
    aimE = 0;
    const f = V(0, 0, 0);
    cam.getWorldDirection(f);
    en.forEach(e => {
        const c = e.m.position.clone();
        c.y += e.t.c;
        c.sub(cam.position);
        const t = c.dot(f);
        if (t > 0 && t < W[wi].rng && c.lengthSq() - t * t < e.t.r * e.t.r)
            aimE = 1;
    });
}
function xh(dt, mv) {
    $('cx').style.opacity = Math.max(0, 1 - ad * 2);
    const w = W[wi];
    const ring = W[wi].pel > 1 || W[wi].fire || W[wi].aoe;
    cg += (4 + w.spr * 260 + mv * 7 + rec * 10 + (rl > 0 ? 9 : 0) + (W[wi].aoe ? 16 : 0) - cg) * Math.min(1, dt * 14);
    hm = Math.max(0, hm - dt);
    const c = hm > 0 ? '#ff3030' : aimE ? '#ff7a3a' : '#fff';
    const g = cg;
    const x = $('cx').children;
    const ln = [
        [-1, -g - 9, 2, 9], [-1, g, 2, 9], [-g - 9, -1, 9, 2], [g, -1, 9, 2]
    ];
    for (let i = 0; i < 4; i++) {
        const a = ln[i];
        x[i].style.cssText = 'left:' + a[0] + 'px;top:' + a[1] + 'px;width:' + a[2] + 'px;height:' + a[3] + 'px;background:' + c + ';display:' + (ring && !W[wi].aoe ? 'none' : 'block');
    }
    const s = 2 * g + 6;
    const k = hm > 0 ? 8 : 4;
    x[4].style.cssText = 'display:' + (ring ? 'block' : 'none') + ';left:' + (-s / 2) + 'px;top:' + (-s / 2) + 'px;width:' + s + 'px;height:' + s + 'px;border-color:' + c;
    x[5].style.cssText = 'left:' + (-k / 2) + 'px;top:' + (-k / 2) + 'px;width:' + k + 'px;height:' + k + 'px;background:' + c;
}

// ==========================================================================
// 4. ARÈNE FERMÉE : RELIEF, MURS GÉANTS, BÂTIMENTS, GROTTES ET PATHFINDING
// ==========================================================================
const H = 60;
const TS = 2 * H + 16;
const NS = 72;
const tgm = new THREE.PlaneGeometry(TS, TS, NS, NS);
tgm.rotateX(-P / 2);
tgm.setAttribute('color', new THREE.BufferAttribute(new Float32Array((NS + 1) * (NS + 1) * 3), 3));
sc.add(new THREE.Mesh(tgm, new THREE.MeshLambertMaterial({ vertexColors: true })));
gr.visible = false;
moon.scale.setScalar(2.2);
let ph = [1, 2, 3, 4];
let TN = [.12, .09, .17];
const AB = [];
const RM = [];
const FL = [{ x: 0, z: 0, r: 17 }];
const WM = M(0x2a2236);
const RKm = M(0x2b2832);
const CRm = M(0x5a3a1a, 0x1a0e00);
const BG = new THREE.BoxGeometry(1, 1, 1);
function gh(x, z) {
    let h = Math.sin(x * .07 + ph[0]) * Math.cos(z * .06 + ph[1]) * 3.4 + Math.sin(x * .13 + z * .09 + ph[2]) * 1.8 + Math.sin(z * .21 + ph[3]) * Math.cos(x * .17) * .9 + 2;
    for (const f of FL)
        h *= cl((Math.hypot(x - f.x, z - f.z) - f.r) / 9, 0, 1);
    return h;
}
function relief() {
    const p = tgm.attributes.position;
    const c = tgm.attributes.color;
    for (let i = 0; i < p.count; i++) {
        const h = gh(p.getX(i), p.getZ(i));
        const k = .04 + Math.max(0, h) * .012 + (i % 7) * .002;
        p.setY(i, h);
        c.setXYZ(i, TN[0] + k * 1.2, TN[1] + k, TN[2] + k * 1.1);
    }
    p.needsUpdate = c.needsUpdate = true;
    tgm.computeVertexNormals();
}
const in_ = (r, x, z, m = 0) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
function tgt(p, t) {
    if (t.k == 'ghost' || t.k == 'bat')
        return pl;
    for (const r of RM) {
        const a = in_(r, p.x, p.z);
        const b = in_(r, pl.x, pl.z);
        if (a != b) {
            if (a)
                return r.o;
            return Math.hypot(p.x - r.o.x, p.z - r.o.z) > 1.6 ? r.o : r.i;
        }
    }
    return pl;
}
function seg(ax, az, bx, bz, x0, z0, x1, z1, m) {
    x0 -= m;
    z0 -= m;
    x1 += m;
    z1 += m;
    let t0 = 0;
    let t1 = 1;
    const dx = bx - ax;
    const dz = bz - az;
    for (const [p, q] of [
        [-dx, ax - x0], [dx, x1 - ax], [-dz, az - z0], [dz, z1 - az]
    ]) {
        if (p == 0) {
            if (q < 0)
                return false;
        }
        else {
            const u = q / p;
            if (p < 0) {
                if (u > t1)
                    return false;
                if (u > t0)
                    t0 = u;
            }
            else {
                if (u < t0)
                    return false;
                if (u < t1)
                    t1 = u;
            }
        }
    }
    return true;
}
function tgt2(p, t) {
    if (t.k == 'ghost' || t.k == 'bat')
        return pl;
    for (const r of RM) {
        const a = in_(r, p.x, p.z);
        const b = in_(r, pl.x, pl.z);
        if (a == b)
            continue;
        const X = r.ax ? 'x' : 'z';
        const Y = r.ax ? 'z' : 'x';
        const lo = Math.min(r.o[X], r.i[X]) - .5;
        const hi = Math.max(r.o[X], r.i[X]) + .5;
        if (Math.abs(p[Y] - r.o[Y]) < 1.3 && p[X] > lo && p[X] < hi)
            return a ? r.o : r.i;
        if (a)
            return r.W.some(w => seg(p.x, p.z, r.o.x, r.o.z, w.x0, w.z0, w.x1, w.z1, .6)) ? r.i : r.o;
        const o = r.o;
        const L = (u, v) => !seg(u.x, u.z, v.x, v.z, r.x0 - .7, r.z0 - .7, r.x1 + .7, r.z1 + .7, .45);
        if (L(p, o))
            return o;
        let best = o;
        let bc = 1e9;
        for (const c of r.C) {
            if (!L(p, c))
                continue;
            const dp = Math.hypot(p.x - c.x, p.z - c.z);
            let k = 1e9;
            if (L(c, o))
                k = dp + Math.hypot(c.x - o.x, c.z - o.z);
            else
                for (const c2 of r.C)
                    if (c2 !== c && L(c, c2) && L(c2, o))
                        k = Math.min(k, dp + Math.hypot(c.x - c2.x, c.z - c2.z) + Math.hypot(c2.x - o.x, c2.z - o.z));
            if (k < bc) {
                bc = k;
                best = c;
            }
        }
        return best;
    }
    return pl;
}
function wd(o, f) {
    let m = 1e9;
    AB.forEach(b => {
        let a = 0;
        let e = 1e9;
        [
            ['x', b.x0, b.x1], ['y', -1, b.y1], ['z', b.z0, b.z1]
        ].forEach(([k, lo, hi]) => {
            const d = f[k];
            if (Math.abs(d) < 1e-6) {
                if (o[k] < lo || o[k] > hi)
                    e = -1;
            }
            else {
                let t1 = (lo - o[k]) / d;
                let t2 = (hi - o[k]) / d;
                if (t1 > t2) {
                    const q = t1;
                    t1 = t2;
                    t2 = q;
                }
                a = Math.max(a, t1);
                e = Math.min(e, t2);
            }
        });
        if (a <= e && e > 0 && a < m)
            m = a;
    });
    return m;
}
function wl_(x0, z0, x1, z1, h, m) {
    const b = new THREE.Mesh(BG, m);
    b.scale.set(x1 - x0, h + 12, z1 - z0);
    b.position.set((x0 + x1) / 2, h / 2 - 6, (z0 + z1) / 2);
    sc.add(b);
    AB.push({ x0, x1, z0, z1, y1: h });
}
function bld(cx, cz, w, d, side, rock, lt) {
    const n0 = AB.length;
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const z0 = cz - d / 2;
    const z1 = cz + d / 2;
    const t = .7;
    const h = rock ? 5 : 4;
    const m = rock ? RKm : WM;
    const g = 1.4;
    const lc = rock ? 0x2b2832 : 0x2a2236;
    [
        [x0 - t, z1, x1 + t, z1 + t, 0], [x0 - t, z0 - t, x1 + t, z0, 0], [x1, z0, x1 + t, z1, 1], [x0 - t, z0, x0, z1, 1]
    ].forEach((r, s) => {
        if (s != side) {
            wl_(r[0], r[1], r[2], r[3], h, m);
            return;
        }
        if (r[4] == 0) {
            wl_(r[0], r[1], cx - g, r[3], h, m);
            wl_(cx + g, r[1], r[2], r[3], h, m);
            sc.add(bx(2 * g, h - 3, r[3] - r[1], lc, cx, 3 + (h - 3) / 2, (r[1] + r[3]) / 2));
        }
        else {
            wl_(r[0], r[1], r[2], cz - g, h, m);
            wl_(r[0], cz + g, r[2], r[3], h, m);
            sc.add(bx(r[2] - r[0], h - 3, 2 * g, lc, (r[0] + r[2]) / 2, 3 + (h - 3) / 2, cz));
        }
    });
    if (rock) {
        for (let k = 0; k < 10; k++) {
            const s = 3 + R() * 3;
            const r = new THREE.Mesh(gRk, RKm);
            r.scale.set(s * w / 11, s * .8, s * d / 11);
            r.position.set(cx + (R() - .5) * w * .9, h + s * .3, cz + (R() - .5) * d * .9);
            r.rotation.y = R() * 6;
            sc.add(r);
        }
        sc.add(bx(w + 2, .6, d + 2, 0x1a1820, cx, h + .3, cz));
    }
    else {
        const g2 = new THREE.Group();
        const c = new THREE.Mesh(new THREE.ConeGeometry((w + 2) / 1.414, 2.6, 4), M(0x1c1226));
        c.rotation.y = P / 4;
        g2.add(c);
        g2.scale.z = (d + 2) / (w + 2);
        g2.position.set(cx, h + 1.6, cz);
        sc.add(g2, bx(w + 2, .4, d + 2, 0x1c1226, cx, h + .2, cz));
    }
    sc.add(bx(w, .1, d, rock ? 0x1a1820 : 0x3a2a1a, cx, .03, cz));
    for (let k = 0; k < 3; k++) {
        const x = k == 1 ? x1 - 1.5 : x0 + 1.5;
        const z = k == 2 ? z1 - 1.5 : z0 + 1.5;
        wl_(x - .6, z - .6, x + .6, z + .6, 1.2, CRm);
    }
    if (rock)
        for (let k = 0; k < 6; k++) {
            const c = bx(.45, 1 + R() * 1.4, .45, 0x77ffd0, cx + (R() - .5) * (w - 4), .8, cz + (R() - .5) * (d - 4), 0x33ccaa);
            c.rotation.set((R() - .5) * .5, R() * 3, (R() - .5) * .5);
            sc.add(c);
        }
    else
        sc.add(bx(.5, .5, .5, 0xffaa33, cx, h - .8, cz, 0xffaa33), bx(1.4, 1.2, .12, 0xffaa33, cx - w / 4, 2.2, z0 - t - .03, 0xffaa33), bx(1.4, 1.2, .12, 0xffaa33, cx + w / 4, 2.2, z0 - t - .03, 0xffaa33));
    if (lt) {
        const l = new THREE.PointLight(lt, 1.5, 16);
        l.position.set(cx, 2.8, cz);
        sc.add(l);
    }
    RM.push({ x0, x1, z0, z1, ax: side > 1 ? 1 : 0, W: AB.slice(n0), C: [{ x: x0 - t - 1.8, z: z0 - t - 1.8 }, { x: x1 + t + 1.8, z: z0 - t - 1.8 }, { x: x0 - t - 1.8, z: z1 + t + 1.8 }, { x: x1 + t + 1.8, z: z1 + t + 1.8 }], o: [{ x: cx, z: z1 + t + 1.8 }, { x: cx, z: z0 - t - 1.8 }, { x: x1 + t + 1.8, z: cz }, { x: x0 - t - 1.8, z: cz }][side], i: [{ x: cx, z: z1 - 1.3 }, { x: cx, z: z0 + 1.3 }, { x: x1 - 1.3, z: cz }, { x: x0 + 1.3, z: cz }][side] });
    FL.push({ x: cx, z: cz, r: Math.hypot(w, d) / 2 + 4 });
}
bld(-34, -26, 16, 11, 0, 0, 0xffaa55);
bld(34, -30, 11, 17, 3, 0, 0);
bld(-38, 30, 14, 12, 2, 1, 0x66ffd0);
bld(30, 34, 12, 14, 1, 1, 0);
{
    const Q = H + 2;
    const L = 2 * Q + 4;
    const pg2 = new THREE.BoxGeometry(5, 100, 5);
    const pm = M(0x2c2240);
    const tm = M(0xff7a1a, 0xff6a00);
    const tg2 = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    [
        [0, -Q, L, 4], [0, Q, L, 4], [-Q, 0, 4, L], [Q, 0, 4, L]
    ].forEach(a => sc.add(bx(a[2], 120, a[3], 0x1a1522, a[0], 18, a[1], 0x080410)));
    for (let k = -2; k <= 2; k++)
        [
            [k * 24, -H - 2.3], [k * 24, H + 2.3], [-H - 2.3, k * 24], [H + 2.3, k * 24]
        ].forEach(a => {
            const p = new THREE.Mesh(pg2, pm);
            const l = new THREE.Mesh(tg2, tm);
            p.position.set(a[0], -10, a[1]);
            l.position.set(a[0], 41, a[1]);
            sc.add(p, l);
        });
}
relief();
for (let i = -2; i < 2; i++)
    for (let j = -2; j < 2; j++)
        CH[i + ',' + j] = mkC(i, j);

// ==========================================================================
// 5. ENNEMIS (MODÈLES ET CARACTÉRISTIQUES)
// ==========================================================================
const eyes = (g, y, z, c, s) => [-1, 1].forEach(k => g.add(bx(s, s, s, c, k * s * 1.4, y, z, c)));
const mk = {
    pump() {
        const g = new THREE.Group();
        const b = new THREE.Mesh(new THREE.SphereGeometry(.8, 12, 9), M(0xff6a00, 0x401800));
        b.scale.y = .85;
        b.position.y = .8;
        g.add(b, bx(.15, .3, .15, 0x2a7a22, 0, 1.55, 0), bx(.7, .14, .1, 0xffee00, 0, .5, .75, 0xffee00));
        eyes(g, .95, .72, 0xffee00, .2);
        return g;
    },
    zomb() {
        const g = new THREE.Group();
        const c = 0x6f9a5c;
        g.add(bx(.7, 1, .4, 0x3d5a3a, 0, 1.1, 0), bx(.5, .5, .5, c, 0, 1.85, 0), bx(.2, .2, .9, c, -.5, 1.5, .5), bx(.2, .2, .9, c, .5, 1.5, .5), bx(.25, .7, .25, 0x2c2c44, -.2, .35, 0), bx(.25, .7, .25, 0x2c2c44, .2, .35, 0));
        eyes(g, 1.9, .26, 0xff2020, .08);
        return g;
    },
    skel() {
        const g = new THREE.Group();
        const c = 0xe8e4d0;
        g.add(bx(.5, .9, .25, c, 0, 1.2, 0), bx(.45, .45, .45, c, 0, 1.9, 0), bx(.12, .12, .8, c, -.38, 1.4, .45), bx(.12, .12, .8, c, .38, 1.4, .45), bx(.12, .8, .12, c, -.15, .4, 0), bx(.12, .8, .12, c, .15, .4, 0));
        eyes(g, 1.95, .23, 0, .1);
        return g;
    },
    ghost() {
        const g = new THREE.Group();
        const m = new THREE.MeshLambertMaterial({ color: 0xddeeff, emissive: 0x6688aa, transparent: true, opacity: .75 });
        const b = new THREE.Mesh(new THREE.CylinderGeometry(.5, .8, 1.6, 10), m);
        const h = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), m);
        b.position.y = 1.1;
        h.position.y = 2.1;
        g.add(b, h);
        eyes(g, 2.15, .45, 0, .12);
        return g;
    },
    bat() {
        const g = new THREE.Group();
        const c = 0x2a1a38;
        g.add(bx(.4, .3, .6, c, 0, 0, 0), bx(.9, .05, .4, c, -.65, 0, 0), bx(.9, .05, .4, c, .65, 0, 0));
        g.wl = g.children[1];
        g.wr = g.children[2];
        eyes(g, .05, .31, 0xff0000, .06);
        return g;
    },
    were() {
        const g = new THREE.Group();
        const c = 0x4a3020;
        g.add(bx(.9, 1.4, .6, c, 0, 1.5, 0), bx(.6, .6, .7, 0x5a3a26, 0, 2.5, .1), bx(.3, .3, .5, 0x3a2418, 0, 2.4, .6), bx(.16, .3, .1, c, -.22, 2.95, 0), bx(.16, .3, .1, c, .22, 2.95, 0), bx(.22, .22, 1.1, c, -.65, 1.9, .5), bx(.22, .22, 1.1, c, .65, 1.9, .5), bx(.3, .9, .3, c, -.25, .45, 0), bx(.3, .9, .3, c, .25, .45, 0));
        eyes(g, 2.62, .47, 0xff0000, .1);
        return g;
    }
};
const T = [
    { k: 'pump', hp: 30, sp: 5.2, r: .9, c: .8, h: 0, d: 8, s: 10, col: 0xff6a00 },
    { k: 'zomb', hp: 60, sp: 2.3, r: .85, c: 1.2, h: 0, d: 12, s: 15, col: 0x6f9a5c },
    { k: 'skel', hp: 45, sp: 3.3, r: .8, c: 1.2, h: 0, d: 10, s: 15, col: 0xe8e4d0 },
    { k: 'ghost', hp: 40, sp: 2.8, r: .95, c: 1.6, h: .2, d: 10, s: 20, col: 0xaaccff },
    { k: 'bat', hp: 15, sp: 7, r: .7, c: 0, h: 1.6, d: 5, s: 10, col: 0x7a4a99 },
    { k: 'were', hp: 170, sp: 4.6, r: 1.2, c: 1.6, h: 0, d: 20, s: 40, col: 0x8a5a3a }
];

// ==========================================================================
// 6. ARMES (MODÈLES 3D VUE À LA PREMIÈRE PERSONNE)
// ==========================================================================
const W = [
    { n: 'Pistolet', dmg: 25, rate: .35, pel: 1, spr: .004, rng: 60, col: 0xffee88, gc: 0x444444, L: .8, f: 520, sd: .12, wt: 'square' },
    { n: 'Fusil à pompe', dmg: 14, rate: .9, pel: 9, spr: .07, rng: 25, col: 0xffaa44, gc: 0x6a4a2a, L: 1.4, f: 170, sd: .3, wt: 'sawtooth' },
    { n: 'Mitraillette', dmg: 10, rate: .08, pel: 1, spr: .03, rng: 60, col: 0xffee88, gc: 0x2a3a2a, L: 1.1, f: 420, sd: .06, wt: 'square' },
    { n: 'Arbalète à pieux', dmg: 90, rate: 1.1, pel: 1, spr: 0, rng: 70, pierce: 1, col: 0xcc9966, gc: 0x7a5a30, L: 1.3, f: 300, sd: .2, wt: 'triangle' },
    { n: 'Lance-flammes', dmg: 5, rate: .04, pel: 1, spr: .12, rng: 9, pierce: 1, fire: 1, col: 0xff5500, gc: 0xb02a10, L: 1.3, f: 110, sd: .05, wt: 'sawtooth' },
    { n: 'Canon à citrouilles', dmg: 80, rate: 1.4, pel: 1, spr: 0, rng: 60, aoe: 5, col: 0xff7a1a, gc: 0xff7a1a, L: 1.6, f: 90, sd: .4, wt: 'sawtooth' }
];
const gun = new THREE.Group();
const sk = 0xd9b08c;
gun.position.set(.28, -.26, -.7);
cam.add(gun);
const cy = (r, l, c, x, y, z, e) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 10), M(c, e));
    m.rotation.x = P / 2;
    m.position.set(x, y, z);
    return m;
};
const sp = (r, c, x, y, z, e) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), M(c, e));
    m.position.set(x, y, z);
    return m;
};
const mg = (...a) => {
    const g = new THREE.Group();
    g.add(...a);
    gun.add(g);
    return g;
};
const GM = [
    mg(bx(.06, .05, .3, 0x2a2a30, 0, -.01, -.1), bx(.07, .08, .38, 0x6a7080, 0, .04, -.15), cy(.018, .1, 0x15151a, 0, .04, -.37), bx(.06, .15, .07, 0x4a2c14, 0, -.1, .04), bx(.015, .025, .015, 0xffcc44, 0, .095, -.32, 0xffaa00), bx(.012, .03, .012, 0xffcc44, -.03, .095, .02, 0xffaa00), bx(.012, .03, .012, 0xffcc44, .03, .095, .02, 0xffaa00)),
    mg(cy(.03, .85, 0x3a3a42, 0, .045, -.45), cy(.026, .7, 0x26262c, 0, -.015, -.38), bx(.09, .075, .3, 0x6a4a2a, 0, -.03, -.3), bx(.085, .11, .32, 0x2a2a2f, 0, .01, 0), bx(.07, .13, .42, 0x6a4a2a, 0, -.04, .32), bx(.07, .08, .1, sk, 0, -.03, -.3), cy(.034, .03, 0xffaa44, 0, .045, -.88, 0x884400)),
    mg(bx(.08, .12, .5, 0x2e3a2e, 0, 0, -.05), cy(.02, .35, 0x111114, 0, .03, -.45), cy(.03, .06, 0x222226, 0, .03, -.65), bx(.05, .22, .07, 0x1c1c20, 0, -.16, -.08), bx(.06, .14, .06, 0x1c1c20, 0, -.1, .12), bx(.05, .05, .3, 0x1c1c20, 0, 0, .32), bx(.05, .1, .05, 0x1c1c20, 0, -.1, -.32), bx(.07, .07, .09, sk, 0, -.11, -.32), bx(.02, .04, .02, 0xffcc44, 0, .085, -.2, 0xffaa00)),
    mg(bx(.06, .07, .7, 0x7a5a30, 0, 0, -.05), bx(.5, .03, .05, 0x3a2a18, -.22, .03, -.38), bx(.5, .03, .05, 0x3a2a18, .22, .03, -.38), bx(.58, .01, .01, 0xddddcc, 0, .03, -.26), cy(.012, .5, 0xcccccc, 0, .05, -.35), bx(.035, .035, .07, 0xb8b8b8, 0, .05, -.62), bx(.05, .05, .05, 0x222226, 0, .065, 0), bx(.07, .07, .09, sk, 0, -.04, -.3)),
    mg(cy(.07, .38, 0xb02a10, -.13, -.05, .1, 0x300800), cy(.075, .04, 0x222226, -.13, -.05, -.08), cy(.025, .62, 0x44444c, 0, .02, -.35), cy(.035, .08, 0x222226, 0, .02, -.66), bx(.06, .14, .06, 0x1c1c20, 0, -.1, .04), bx(.05, .04, .3, 0x1c1c20, -.07, -.03, 0), bx(.07, .07, .09, sk, 0, -.04, -.2), sp(.025, 0xff8800, 0, .02, -.7, 0xff6600)),
    mg(cy(.09, .7, 0x2f2f36, 0, 0, -.35), cy(.11, .08, 0xff7a1a, 0, 0, -.72, 0x883300), cy(.1, .05, 0xff7a1a, 0, 0, -.05, 0x883300), bx(.07, .15, .07, 0x4a2c14, 0, -.12, 0), bx(.05, .06, .3, 0x2f2f36, .1, -.06, -.2), bx(.07, .07, .09, sk, .1, -.06, -.3), sp(.075, 0xff6a00, -.14, .04, -.1, 0x602000), bx(.03, .06, .03, 0x1c7a22, -.14, .11, -.1))
];
GM[4].fl = GM[4].children[GM[4].children.length - 1];
const FS = (i, y, z) => GM[i].add(bx(.012, .035, .012, 0xffcc44, 0, y, z, 0xffaa00));
const RS = (i, y, z) => GM[i].add(bx(.012, .035, .012, 0xffcc44, -.03, y, z, 0xffaa00), bx(.012, .035, .012, 0xffcc44, .03, y, z, 0xffaa00));
const SY = [.11, .105, .1, .095, .08, .125];
const AF = [58, 64, 56, 40, 64, 56];
FS(1, .09, -.86);
RS(1, .085, -.05);
RS(2, .08, .12);
FS(3, .075, -.55);
RS(3, .08, -.1);
FS(4, .065, -.62);
RS(4, .065, -.1);
FS(5, .115, -.66);
RS(5, .115, -.12);
const MF = bx(.14, .14, .02, 0xffdd66, 0, .03, -.5, 0xffdd66);
const TZ = [-.45, -.92, -.7, -.7, -.72, -.8];
gun.add(MF, bx(.1, .1, .6, 0x3a2250, .03, -.2, .45), bx(.075, .09, .1, sk, 0, -.12, .03));

// ==========================================================================
// 7. ÉTAT DU JEU, SONS ET EFFETS
// ==========================================================================
const MG = [12, 6, 30, 1, 80, 1];
const RT = [1.1, 1.6, 1.8, 1.4, 2, 2.2];
const RV = [1 / 0, 18, 90, 6, 120, 4];
const MX = [1 / 0, 48, 240, 16, 300, 12];
const PA = [0, 12, 60, 4, 100, 3];
let st = 0;
let wi = 0;
let cd = 0;
let rec = 0;
let en = [];
let FX = [];
let wave = 0;
let q = 0;
let spt = 0;
let wt = 0;
let score = 0;
let mf = 0;
let tfire = 0;
let gpad;
let gf = 0;
let ammo = MG.slice();
let rv = RV.slice();
let PK = [];
let rl = 0;
let ad = 0;
let ss = 1;
let adsOn = 0;
let tads = 0;
let gl = 0;
let gold = 0;
let pal = 1;
let own = [1];
let pw = [0, 0, 0, 0, 0, 0, 0, 0];
let hpMax = 100;
let act = -1;
let acd = 0;
let shd = 0;
let slw = 0;
const pl = { x: 0, z: 0, yaw: 0, pitch: 0, hp: 100 };
const K = {};
const tmv = { x: 0, y: 0 };
const gm = { x: 0, y: 0 };
const gb = {};
const tc = {};
const hpb = $('hp').firstChild;
function sw(i) {
    rl = 0;
    const d = i < wi ? -1 : 1;
    i = (i + W.length) % W.length;
    for (let n = 0; n < W.length && !own[i]; n++)
        i = (i + d + W.length) % W.length;
    wi = i;
    GM.forEach((g, i) => g.visible = i == wi);
    $('wp').textContent = (wi + 1) + '/' + W.length + '  ' + W[wi].n;
}

// ==========================================================================
// 8. BOUTIQUE, 20 ARMES, 20 ENNEMIS, POUVOIRS, CARTES ET HISTOIRE
// ==========================================================================
const PR = [0, 120, 220, 320, 420, 600];
const WT = [1, 1, 1, 1, 2, 2];
const own2 = [0, 0, 0];
const POW = [
    ['Cœur de citrouille', '+25 PV max', 4, 80], ['Bottes de sorcière', '+12 % vitesse', 3, 70], ['Dégâts sombres', '+15 % dégâts', 5, 100], ['Régénération', '+1 PV/s', 3, 90], ['Chapeau chanceux', '+25 % médailles', 3, 110], ['Armure d’os', '−10 % dégâts reçus', 3, 100], ['Mains vives', '−20 % rechargement', 3, 70], ['Vampirisme', '+2 PV par mort', 3, 90]
];
const AC = [
    ['Nova de feu', 'dégâts autour de vous', 150], ['Bouclier d’âme', 'invulnérable 6 s', 200], ['Sablier', 'ennemis ralentis 7 s', 180]
];
const MAP = [{ n: 'Le cimetière maudit', fg: 0x0a0618, tn: [.12, .09, .17], t: 'Léa, votre petite sœur, a été enlevée par le Roi-Citrouille. Ses gardiens rôdent déjà entre les tombes.' },
    { n: 'La forêt des pendus', fg: 0x06140c, tn: [.07, .14, .09], t: 'Des traces de pas minuscules mènent plus loin dans la forêt. Araignées et rats ont pris possession des lieux.' },
    { n: 'Les marais brumeux', fg: 0x0b1a1a, tn: [.07, .14, .15], t: 'Dans la brume, un petit ruban de Léa flotte sur l’eau. Elle est passée par ici, il faut continuer.' },
    { n: 'Le domaine du vampire', fg: 0x1c0610, tn: [.2, .07, .09], t: 'Le comte vampire sert le Roi-Citrouille. Léa a été vue derrière ses murs. Redoublez de prudence.' },
    { n: 'Le château du Roi-Citrouille', fg: 0x1c0c04, tn: [.22, .1, .04], t: 'Le château est devant vous. Léa est prisonnière de la salle du trône : abattez le Roi-Citrouille à la fin de l’étape pour la libérer.' }];
[1, 1, 1, 2, 2, 3].forEach((v, i) => T[i].tr = v);
['Citrouille', 'Zombie', 'Squelette', 'Fantôme', 'Chauve-souris', 'Loup-garou'].forEach((n, i) => T[i].nm = n);
[
    ['imp', 'Lutin des tombes', 'bip', .55, 'horn', 0x8a3a2a, 0xffee00, 14, 6.2, .55, .7, 0, 4, 8, 1], ['spid', 'Araignée', 'spid', .6, '', 0x1a1a22, 0xff2020, 18, 6.8, .6, .4, 0, 5, 10, 2], ['rat', 'Rat des caveaux', 'quad', .6, '', 0x5a4a44, 0xff3030, 16, 7.2, .55, .35, 0, 4, 8, 2],
    ['witch', 'Nain sorcier', 'bip', .7, 'hat', 0x4a2a6a, 0x66ff66, 38, 3.8, .65, .8, 0, 9, 18, 3], ['bat', 'Corbeau maudit', 'wing', .55, '', 0x15151c, 0xff4400, 12, 8.5, .5, 0, 1.7, 5, 10, 3], ['slim', 'Limace des marais', 'blob', .8, '', 0x5aa84a, 0xffff66, 50, 2.4, .8, .5, 0, 8, 14, 3],
    ['mummy', 'Momie', 'bip', 1, 'wrap', 0xd8cfae, 0xff3030, 90, 2.9, .8, 1.2, 0, 14, 24, 4], ['vamp', 'Vampire', 'bip', 1, 'cape', 0xb8a8c8, 0xff0000, 80, 4.4, .8, 1.2, 0, 14, 28, 4], ['ghost', 'Banshee', 'flt', .9, '', 0x88ffee, 0, 60, 3.8, .9, 1.6, .2, 12, 26, 4], ['bat', 'Gargouille', 'wing', 1.2, '', 0x55555e, 0xff5500, 110, 5, 1, 0, 1.7, 16, 34, 4],
    ['ghost', 'Spectre', 'flt', 1.3, '', 0xff88aa, 0, 140, 4.2, 1.1, 2, .2, 18, 40, 5], ['demon', 'Démon cornu', 'bip', 1.5, 'horn', 0xa02020, 0xffdd00, 260, 3.6, 1.2, 1.8, 0, 24, 55, 5], ['knight', 'Chevalier maudit', 'bip', 1.4, 'armor', 0x9a9aa8, 0x66ddff, 200, 3.2, 1.1, 1.7, 0, 22, 48, 5],
    ['boss', 'Roi-Citrouille', 'blob', 3, 'crown', 0xff6a00, 0xffee00, 2400, 2.6, 2.6, 2.2, 0, 35, 500, 5, 1]
].forEach(a => T.push({ k: a[0], nm: a[1], sh: a[2], sz: a[3], x: a[4], col: a[5], ey: a[6], hp: a[7], sp: a[8], r: a[9], c: a[10], h: a[11], d: a[12], s: a[13], tr: a[14], b: 1, bs: a[15] }));
function mkG(t) {
    const g = new THREE.Group();
    const n = new THREE.Group();
    const c = t.col;
    const e = t.ey || 0xff2020;
    const x = t.x || '';
    const A = (...a) => n.add(...a);
    const L = (w, h, d, k, px, py, pz, r) => {
        const m = bx(w, h, d, k, px, py, pz);
        m.rotation.z = r || 0;
        A(m);
    };
    n.scale.setScalar(t.sz);
    g.add(n);
    if (t.sh == 'blob') {
        const b = new THREE.Mesh(new THREE.SphereGeometry(.7, 10, 8), M(c, 0x101010));
        b.position.y = .6;
        A(b);
        eyes(n, .8, .58, e, .14);
        if (x == 'crown')
            for (let i = -2; i <= 2; i++)
                A(bx(.14, .35, .14, 0xffd040, i * .28, 1.45 - Math.abs(i) * .06, 0, 0x886600));
    }
    else if (t.sh == 'spid') {
        A(sp(.33, c, 0, .45, 0), sp(.2, c, 0, .5, .35));
        eyes(n, .55, .5, e, .07);
        for (const i of [-1, 1])
            for (let j = 0; j < 4; j++)
                L(.8, .05, .05, c, i * .5, .35, (j - 1.5) * .2, -i * .6);
    }
    else if (t.sh == 'quad')
        A(bx(.4, .3, .8, c, 0, .35, 0), bx(.28, .25, .3, c, 0, .4, .5), bx(.05, .05, .6, c, 0, .3, -.6), bx(.1, .2, .1, c, -.15, .1, .25), bx(.1, .2, .1, c, .15, .1, .25), bx(.1, .2, .1, c, -.15, .1, -.25), bx(.1, .2, .1, c, .15, .1, -.25), bx(.06, .06, .06, e, -.08, .47, .66, e), bx(.06, .06, .06, e, .08, .47, .66, e));
    else if (t.sh == 'wing') {
        g.wl = bx(.9, .05, .4, c, -.65, 0, 0);
        g.wr = bx(.9, .05, .4, c, .65, 0, 0);
        A(bx(.4, .3, .6, c, 0, 0, 0), g.wl, g.wr);
        eyes(n, .05, .31, e, .06);
    }
    else if (t.sh == 'flt') {
        const m = new THREE.MeshLambertMaterial({ color: c, emissive: c & 0x555555, transparent: true, opacity: .72 });
        const b = new THREE.Mesh(new THREE.CylinderGeometry(.5, .85, 1.7, 10), m);
        const h = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), m);
        b.position.y = 1.1;
        h.position.y = 2.1;
        A(b, h);
        eyes(n, 2.15, .45, 0, .12);
    }
    else {
        A(bx(.6, .9, .35, c, 0, 1, 0), bx(.45, .45, .45, c, 0, 1.7, 0), bx(.15, .15, .7, c, -.4, 1.25, .4), bx(.15, .15, .7, c, .4, 1.25, .4), bx(.18, .6, .18, 0x2c2c44, -.15, .3, 0), bx(.18, .6, .18, 0x2c2c44, .15, .3, 0));
        eyes(n, 1.75, .23, e, .08);
        if (x == 'horn')
            A(bx(.1, .3, .1, 0xe8e0c0, -.2, 2.05, 0), bx(.1, .3, .1, 0xe8e0c0, .2, 2.05, 0));
        if (x == 'hat') {
            const h = new THREE.Mesh(new THREE.ConeGeometry(.35, .8, 8), M(0x201030));
            h.position.y = 2.35;
            A(h, bx(.9, .06, .9, 0x201030, 0, 1.95, 0));
        }
        if (x == 'wrap')
            for (let i = 0; i < 4; i++)
                A(bx(.64, .08, .39, 0xb8b090, 0, .7 + i * .22, 0));
        if (x == 'cape')
            A(bx(.8, 1.2, .1, 0x3a0a18, 0, 1.1, -.25));
        if (x == 'armor')
            A(bx(.7, .5, .45, 0x70707e, 0, 1.15, 0), bx(.5, .5, .5, 0x70707e, 0, 1.8, 0), bx(.1, .9, .1, 0xdddddd, .5, 1.2, .8));
    }
    return g;
}
function mkW(c, L, br, bl, ex, ec) {
    const z0 = .1 - L;
    const p = [bx(.08, .11, L, c, 0, 0, .1 - L / 2), cy(br, bl, 0x1c1c22, 0, .02, z0 - bl / 2), bx(.06, .14, .06, 0x4a2c14, 0, -.1, .04), bx(.07, .07, .09, sk, 0, -.04, z0 - .1)];
    const h = k => ex.includes(k);
    if (h('s'))
        p.push(bx(.06, .1, .3, c, 0, 0, .3));
    if (h('m'))
        p.push(bx(.05, .2, .07, 0x1c1c20, 0, -.15, -L / 3));
    if (h('d'))
        p.push(cy(.07, .14, 0x555a66, 0, 0, -.05));
    if (h('c'))
        p.push(cy(.03, .32, 0x111114, 0, .13, -L / 2), cy(.04, .03, 0x66aaff, 0, .13, -L / 2 - .17, 0x2255aa));
    if (h('t'))
        p.push(cy(br, bl, 0x1c1c22, .05, -.02, z0 - bl / 2), cy(br, bl, 0x1c1c22, -.05, -.02, z0 - bl / 2));
    if (h('D'))
        p.push(cy(br, bl, 0x1c1c22, 0, -.035, z0 - bl / 2));
    if (h('f'))
        p.push(cy(br * 1.5, .05, 0xff7a1a, 0, .02, z0 - bl + .1, 0x883300));
    if (h('e'))
        p.push(sp(.045, ec, 0, .02, z0 - bl + .05, ec));
    if (h('w'))
        p.push(bx(.02, .12, .6, 0xcccccc, 0, .02, z0 - .3), bx(.03, .03, .6, 0x333333, 0, .1, z0 - .3));
    if (h('g'))
        p.push(bx(.05, .1, .05, 0x1c1c20, 0, -.1, z0 - .2));
    return mg(...p);
}
[
    ['Revolver maudit', 62, .5, 1, .004, 70, {}, 0xffdd88, 6, 1.5, 36, 18, 300, 2, 520, [0x6a7080, .28, .022, .22, 'd']], ['Double canon', 13, 1.1, 12, .075, 28, {}, 0xffaa44, 2, 1.8, 20, 8, 450, 2, 150, [0x6a4a2a, .4, .03, .6, 'sD']],
    ['Faucheuse', 18, .09, 1, .025, 80, {}, 0xffee88, 30, 1.8, 120, 60, 700, 3, 380, [0x2e3a2e, .5, .02, .3, 'msg']], ['Lune d’argent', 240, 1.3, 1, 0, 160, { pierce: 1, af: 20 }, 0xccddff, 5, 2.2, 20, 5, 900, 3, 260, [0x2a2a30, .55, .017, .55, 'cs']],
    ['Cloueuse à pieux', 30, .12, 1, .02, 60, {}, 0xcc9966, 40, 1.8, 160, 40, 650, 3, 330, [0x7a5a30, .38, .02, .2, 'mg']], ['Tesla des tombes', 11, .05, 1, .06, 28, { pierce: 1 }, 0x66ddff, 100, 2.2, 300, 100, 1100, 3, 200, [0x226688, .34, .03, .25, 'ge', 0x66ddff]],
    ['Mitrailleuse du diable', 12, .04, 1, .05, 70, {}, 0xffcc66, 150, 3.2, 450, 150, 1600, 4, 300, [0x3a3a40, .3, .015, .55, 'tg']], ['Lance-bonbons', 75, .7, 1, 0, 60, { aoe: 6 }, 0xff66cc, 6, 2.4, 18, 6, 1500, 4, 110, [0xaa3377, .3, .07, .3, 'f']],
    ['Fusil à plasma', 50, .22, 1, .006, 90, { pierce: 1 }, 0x66ff88, 24, 2, 96, 24, 1800, 4, 480, [0x226644, .4, .03, .3, 'ems', 0x66ff88]], ['Rayon spectral', 6, .03, 1, .02, 45, { pierce: 1 }, 0xaa88ff, 200, 2.6, 600, 200, 1700, 4, 600, [0x443366, .3, .025, .4, 'eg', 0xaa88ff]],
    ['Roquette-sorcière', 170, 1.5, 1, 0, 80, { aoe: 9 }, 0xff4400, 2, 3, 10, 4, 2600, 5, 80, [0x4a5a3a, .35, .085, .5, 'fs']], ['Tronçonneuse', 14, .05, 1, .3, 3.6, { pierce: 1 }, 0xffaa66, 120, 2.5, 360, 120, 2200, 5, 100, [0xb02a10, .3, .02, .1, 'w']],
    ['Canon des âmes', 130, 1, 1, 0, 70, { aoe: 12 }, 0x88ffee, 4, 2.5, 16, 4, 3200, 5, 70, [0x224455, .4, .09, .45, 'fe', 0x88ffee]], ['Sceptre du Roi', 320, .9, 1, 0, 70, { aoe: 14 }, 0xff7a1a, 3, 3, 12, 3, 5000, 5, 60, [0xff7a1a, .3, .05, .5, 'fe', 0xffcc44]]
].forEach(a => {
    W.push(Object.assign({ n: a[0], dmg: a[1], rate: a[2], pel: a[3], spr: a[4], rng: a[5], col: a[7], f: a[14], wt: 'sawtooth', sd: Math.min(.25, .05 + a[2] * .25) }, a[6]));
    MG.push(a[8]);
    RT.push(a[9]);
    RV.push(a[10]);
    MX.push(Math.round(a[10] * 3));
    PA.push(a[11]);
    PR.push(a[12]);
    WT.push(a[13]);
    AF.push(a[6].af || 60);
    const i = W.length - 1;
    const m = a[15];
    const y = Math.max(.085, m[2] + .06);
    GM.push(mkW(m[0], m[1], m[2], m[3], m[4], m[5]));
    FS(i, y, .1 - m[1] - m[3] + .12);
    RS(i, y, -.02);
    SY.push(y + .017);
    TZ.push(.1 - m[1] - m[3] - .05);
});
own = W.map((_, i) => i == 0 ? 1 : 0);
function pickW() {
    const o = [];
    own.forEach((v, i) => {
        if (v && i)
            o.push(i);
    });
    return o.length ? o[Math.floor(R() * o.length)] : 0;
}
function mapSet(p) {
    const m = MAP[p - 1];
    pal = p;
    sc.background.setHex(m.fg);
    sc.fog.color.setHex(m.fg);
    sc.fog.density = FD[p - 1] * CFG.fog;
    MS.forEach(s => s.material.color.set(m.fg).lerp(new THREE.Color(1, 1, 1), .55));
    TN = m.tn;
    WS = Math.floor(R() * 1e9);
    clearW();
    ph = [R() * 9, R() * 9, R() * 9, R() * 9];
    relief();
    for (let i = -2; i < 2; i++)
        for (let j = -2; j < 2; j++)
            CH[i + ',' + j] = mkC(i, j);
    clr();
    PK.forEach(q => sc.remove(q.m));
    PK = [];
    en.forEach(e => sc.remove(e.m));
    en = [];
    pl.x = pl.z = 0;
    pl.hp = hpMax;
    RM.forEach(r => {
        const x = (r.x0 + r.x1) / 2;
        const z = (r.z0 + r.z1) / 2;
        drop(x + 2, z + 1, 1e9);
        drop(x - 2, z - 1, 1e9);
    });
}
function shopUI() {
    const y = $('sl') ? $('sl').scrollTop : 0;
    const bt = (m, c, l) => `<button data-m="${m}"${gold < c ? ' disabled' : ''}>${l || c + ' 🎃'}</button>`;
    let h = `<h1>${dd ? '💀 Défaite' : '🎃 Boutique'} · ${gold} médailles</h1><p>${dd ? 'Dépensez vos médailles puis retentez le niveau ' + wave : 'Étape ' + stg + ' · niveau ' + wave + '/10 terminé'} · ${MAP[pal - 1].n}</p><div id="sl"><h3>Armes</h3>`;
    W.forEach((w, i) => {
        if (WT[i] > pal)
            return;
        h += `<div class="it"><b>${w.n}</b><small>${w.dmg * w.pel} dég · ${(1 / w.rate).toFixed(1)}/s${w.aoe ? ' · zone' : ''}${w.pierce ? ' · perce' : ''}</small>` + (own[i] ? (PA[i] ? bt('a' + i, Math.ceil(PR[i] / 10), 'Munitions +' + PA[i] + ' · ' + Math.ceil(PR[i] / 10) + ' 🎃') : '<small>illimité</small>') : bt('w' + i, PR[i])) + '</div>';
    });
    h += '<h3>Pouvoirs passifs</h3>';
    POW.forEach((p, i) => {
        h += `<div class="it"><b>${p[0]} ${pw[i]}/${p[2]}</b><small>${p[1]}</small>` + (pw[i] < p[2] ? bt('p' + i, p[3] * (pw[i] + 1)) : '<small>max</small>') + '</div>';
    });
    h += '<h3>Pouvoirs actifs (touche F)</h3>';
    AC.forEach((p, i) => {
        h += `<div class="it"><b>${p[0]}${act == i ? ' ✓' : ''}</b><small>${p[1]}</small>` + (own2[i] ? (act == i ? '' : `<button data-m="s${i}">Équiper</button>`) : bt('s' + i, p[2])) + '</div>';
    });
    $('shop').innerHTML = h + `</div><button data-m="go">${dd ? 'Réessayer le niveau ' + wave : wave >= 10 ? 'Étape ' + (stg + 1) : 'Niveau ' + (wave + 1)} ▶</button>${dd ? '<button data-m="qt">Abandonner</button>' : ''}`;
    $('sl').scrollTop = y;
}
function buy(m) {
    const t = m[0];
    const i = +m.slice(1);
    if (t == 'w' && !own[i] && gold >= PR[i]) {
        gold -= PR[i];
        own[i] = 1;
        ammo[i] = MG[i];
        rv[i] = RV[i];
        sw(i);
    }
    else if (t == 'a' && own[i]) {
        const c = Math.ceil(PR[i] / 10);
        if (gold >= c && rv[i] < MX[i]) {
            gold -= c;
            rv[i] = Math.min(MX[i], rv[i] + PA[i]);
        }
    }
    else if (t == 'p') {
        const p = POW[i];
        const c = p[3] * (pw[i] + 1);
        if (pw[i] < p[2] && gold >= c) {
            gold -= c;
            pw[i]++;
            hpMax = 100 + 25 * pw[0];
            if (i == 0)
                pl.hp += 25;
        }
    }
    else if (t == 's') {
        if (own2[i])
            act = i;
        else if (gold >= AC[i][2]) {
            gold -= AC[i][2];
            own2[i] = 1;
            act = i;
        }
    }
    shopUI();
}
$('shop').onclick = e => {
    const m = e.target.dataset && e.target.dataset.m;
    if (!m)
        return;
    if (m == 'go')
        nextLvl();
    else if (m == 'qt')
        quit();
    else
        buy(m);
};
$('st3').onclick = () => storyGo();
function shop() {
    st = 3;
    try {
        document.exitPointerLock();
    }
    catch (x) {
    }
    mf = tfire = 0;
    shopUI();
    $('shop').style.display = 'flex';
}
function story(np) {
    st = 4;
    $('st1').textContent = MAP[np - 1].n;
    $('st2').textContent = MAP[np - 1].t + ' Nouveaux ennemis : ' + T.filter(t => t.tr == np && !t.bs).map(t => t.nm).join(', ') + '. Nouvelles armes en boutique : ' + W.filter((w, i) => WT[i] == np).map(w => w.n).join(', ') + '.';
    $('sty').style.display = 'flex';
}
function storyGo() {
    $('sty').style.display = 'none';
    st = 1;
    nextWave();
    try {
        $('c').requestPointerLock();
    }
    catch (x) {
    }
}
function nextLvl() {
    if (dd) {
        retry();
        return;
    }
    $('shop').style.display = 'none';
    try {
        $('c').requestPointerLock();
    }
    catch (x) {
    }
    if (wave >= 10) {
        stg++;
        wave = 0;
        mapSet(stg);
        story(stg);
    }
    else {
        st = 1;
        nextWave();
    }
}
function win() {
    talk(OUTRO, fin);
}
function fin() {
    st = 2;
    try {
        document.exitPointerLock();
    }
    catch (x) {
    }
    try {
        localStorage.bestHW = Math.max(+localStorage.bestHW || 0, score);
    }
    catch (x) {
    }
    $('t').textContent = '🎃 Léa est libérée !';
    $('msg').textContent = 'Le Roi-Citrouille s’effondre et la malédiction se brise. Vous retrouvez Léa saine et sauve. Score ' + score + ' · médailles ' + gold;
    $('go').textContent = 'REJOUER';
    $('menu').style.display = 'flex';
}
function use() {
    if (st != 1 || act < 0 || acd > 0)
        return;
    acd = 22;
    snd(300, .4, 'sawtooth', .12);
    if (act == 0) {
        en.slice().forEach(e => {
            if (Math.hypot(e.m.position.x - pl.x, e.m.position.z - pl.z) < 14)
                hurt(e, 150);
        });
        for (let i = 0; i < 50; i++) {
            const a = R() * 6.28;
            fx(R() < .5 ? 0xff7a1a : 0xffdd44, V(pl.x, gh(pl.x, pl.z) + 1, pl.z), V(Math.cos(a) * 14, R() * 4, Math.sin(a) * 14), .6, .5, 1);
        }
    }
    else if (act == 1)
        shd = 6;
    else
        slw = 7;
}

// ==========================================================================
// 9. BROUILLARD ET CONTRÔLES TACTILES
// ==========================================================================
const FD = [.04, .045, .058, .042, .05];
const MS = [];
{
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    for (let i = 0; i < 40; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: .2 + R() * .15, depthWrite: false, color: 0xbbaadd }));
        const k = 14 + R() * 14;
        s.scale.set(k, k * .45, 1);
        s.position.set((R() - .5) * H * 2, 0, (R() - .5) * H * 2);
        s.userData.v = .4 + R() * .8;
        MS.push(s);
        sc.add(s);
    }
}
function mist(dt) {
    const t = performance.now() / 3000;
    MS.forEach((s, i) => {
        const p = s.position;
        p.x += s.userData.v * dt;
        if (p.x > H)
            p.x = -H;
        p.y = gh(p.x, p.z) + 1.4 + Math.sin(t + i) * .4;
    });
}
let tcOn = true;
try {
    tcOn = localStorage.tcOn != '0';
}
catch (x) {
}
function tcSet(v) {
    tcOn = v;
    document.body.classList.toggle('nt', !v);
    $('tg').textContent = 'Tactile : ' + (v ? 'ON' : 'OFF');
    tfire = 0;
    tmv.x = tmv.y = 0;
    for (const k in tc)
        delete tc[k];
    try {
        localStorage.tcOn = v ? 1 : 0;
    }
    catch (x) {
    }
}
$('tg').onclick = () => tcSet(!tcOn);
tcSet(tcOn);

// ==========================================================================
// 10. PARAMÈTRES, DIALOGUES ET BOUTIQUE APRÈS LA MORT
// ==========================================================================
let CFG = { vol: .7, sens: 1, fog: 1, q: 1, fov: 75, dlg: 1, vib: 1 };
let dd = 0;
let introDone = 0;
let dq = [];
let di = 0;
let dtx = '';
let dp = 0;
let dcb = null;
let dtm;
try {
    Object.assign(CFG, JSON.parse(localStorage.cfgHW || '{}'));
}
catch (x) {
}
const QL = [.7, 1.1, 1.7];
const QN = ['Bas', 'Moyen', 'Élevé'];
function cfgApply() {
    const pr = Math.min(devicePixelRatio, QL[CFG.q]);
    if (rd.getPixelRatio() != pr) {
        rd.setPixelRatio(pr);
        rs();
    }
    sc.fog.density = FD[pal - 1] * CFG.fog;
    MS.forEach(s => s.visible = CFG.fog > 0);
    try {
        localStorage.cfgHW = JSON.stringify(CFG);
    }
    catch (x) {
    }
}
function cfgUI() {
    const r = (k, l, mn, mx, sp) => `<div class="it"><b>${l}</b><input type="range" data-k="${k}" min="${mn}" max="${mx}" step="${sp}" value="${CFG[k]}"></div>`;
    const t = (k, l, v) => `<div class="it"><b>${l}</b><button data-t="${k}">${v}</button></div>`;
    $('cf').innerHTML = '<h1>⚙ Paramètres</h1><div style="overflow:auto;width:min(560px,100%);max-height:62vh;text-align:left">' + r('vol', 'Volume', 0, 1, .05) + r('sens', 'Sensibilité de visée', .4, 2.5, .1) + r('fov', 'Champ de vision', 60, 100, 1) + r('fog', 'Brouillard', 0, 1.6, .1) + t('q', 'Qualité graphique', QN[CFG.q]) + t('tc', 'Contrôles tactiles', tcOn ? 'ON' : 'OFF') + t('vib', 'Vibrations', CFG.vib ? 'ON' : 'OFF') + t('dlg', 'Dialogues d’histoire', CFG.dlg ? 'ON' : 'OFF') + t('rep', 'Revoir l’intro au prochain départ', '▶') + '</div><button data-t="x">Fermer</button>';
}
function cfgOpen(o) {
    const v = $('cf').style.display == 'flex';
    if (o === undefined)
        o = !v;
    if (o == v)
        return;
    if (o) {
        if (st == 1)
            st = 5;
        try {
            document.exitPointerLock();
        }
        catch (x) {
        }
        cfgUI();
        $('cf').style.display = 'flex';
    }
    else {
        $('cf').style.display = 'none';
        if (st == 5) {
            st = 1;
            try {
                $('c').requestPointerLock();
            }
            catch (x) {
            }
        }
    }
}
$('gb').onclick = () => cfgOpen();
$('cf').oninput = e => {
    const k = e.target.dataset.k;
    if (k) {
        CFG[k] = +e.target.value;
        cfgApply();
    }
};
$('cf').onclick = e => {
    const t = e.target.dataset.t;
    if (!t)
        return;
    if (t == 'x')
        cfgOpen(0);
    else {
        if (t == 'q')
            CFG.q = (CFG.q + 1) % 3;
        else if (t == 'tc')
            tcSet(!tcOn);
        else if (t == 'rep') {
            introDone = 0;
            CFG.dlg = 1;
        }
        else
            CFG[t] = CFG[t] ? 0 : 1;
        cfgApply();
        cfgUI();
    }
};
cfgApply();
const INTRO = [
    ['👵', 'Mamie Odile', 'Te voilà enfin ! Cette nuit d’Halloween, quelque chose de terrible est arrivé…'], ['🧑', 'Vous', 'Mamie ? Où est Léa ? Sa chambre est vide !'], ['👵', 'Mamie Odile', 'Le Roi-Citrouille l’a enlevée. Il règne sur cinq domaines maudits, au-delà du cimetière.'], ['🧑', 'Vous', 'Alors j’irai la chercher. Je ne reviendrai pas sans elle !'], ['👵', 'Mamie Odile', 'Prends le vieux pistolet de ton grand-père. Chaque monstre vaincu te rapportera des médailles citrouilles 🎃.'], ['👵', 'Mamie Odile', 'Entre deux niveaux, un marchand t’échangera ces médailles contre des armes et des pouvoirs.'], ['🧑', 'Vous', 'Cinq domaines de dix niveaux chacun… Le Roi-Citrouille n’a qu’à bien se tenir !'], ['👵', 'Mamie Odile', 'Courage, mon petit. Ramène Léa saine et sauve !']
];
const OUTRO = [
    ['👑', 'Roi-Citrouille', 'Impossible… Moi, le roi des citrouilles… vaincu… Ma malédiction se brise…'], ['👧', 'Léa', 'C’est toi ! Je savais que tu viendrais me chercher !'], ['🧑', 'Vous', 'Tout va bien maintenant, Léa. On rentre à la maison.'], ['👵', 'Mamie Odile', 'Vous voilà sains et saufs ! Cette nuit d’Halloween restera dans la légende. 🎃']
];
function talk(l, cb) {
    dq = l;
    di = 0;
    dcb = cb;
    st = 6;
    mf = tfire = 0;
    $('dl').style.display = 'block';
    dshow();
}
function dshow() {
    const l = dq[di];
    $('dp').textContent = l[0];
    $('dn').textContent = l[1];
    dtx = l[2];
    dp = 0;
    $('dt').textContent = '';
    clearInterval(dtm);
    dtm = setInterval(() => {
        dp++;
        $('dt').textContent = dtx.slice(0, dp);
        if (dp >= dtx.length)
            clearInterval(dtm);
    }, 28);
}
function dnext() {
    if (st != 6)
        return;
    if (dp < dtx.length) {
        dp = dtx.length;
        $('dt').textContent = dtx;
        clearInterval(dtm);
        return;
    }
    di++;
    if (di >= dq.length)
        dend();
    else
        dshow();
}
function dend() {
    clearInterval(dtm);
    $('dl').style.display = 'none';
    const f = dcb;
    dcb = null;
    if (f)
        f();
}
$('dl').onclick = dnext;
$('ds').onclick = e => {
    e.stopPropagation();
    dend();
};

// ==========================================================================
// 11. ÉTAPES, BOSS ET LEURS ATTAQUES
// ==========================================================================
let stg = 1;
let EP = [];
let HZ = [];
const HV = t => t.bs ? t.hp : t.hp * (1 + (stg - 1) * .9 + wave * .1);
const wg = new THREE.CylinderGeometry(1, 1, .12, 24);
const wm_ = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: .35, depthWrite: false });
[
    ['boss1', 'Citrouille titanesque', 'blob', 2.2, '', 0xff6a00, 0xffee00, 900, 3, 2, 1.7, 18, 200, 1, 2], ['boss2', 'Reine des araignées', 'spid', 3.2, '', 0x201a28, 0xff2020, 1800, 4.2, 2.4, 1.4, 22, 300, 2, 3], ['boss3', 'Hydre des marais', 'blob', 3, '', 0x3a8a3a, 0xffff66, 3200, 3, 2.4, 2, 26, 400, 3, 4], ['boss4', 'Comte Dracula', 'bip', 2.4, 'cape', 0xb8a8c8, 0xff0000, 5200, 5, 1.8, 2.8, 30, 450, 4, 5]
].forEach(a => T.push({ k: a[0], nm: a[1], sh: a[2], sz: a[3], x: a[4], col: a[5], ey: a[6], hp: a[7], sp: a[8], r: a[9], c: a[10], h: 0, d: a[11], s: a[12], tr: a[13], b: 1, bs: 1, stg: a[13], na: a[14] }));
Object.assign(T.find(u => u.bs && !u.stg), { stg: 5, na: 6, fin: 1, hp: 12000, sp: 3, d: 42 });
function clr() {
    EP.forEach(p => sc.remove(p.m));
    HZ.forEach(h => sc.remove(h.m));
    EP = [];
    HZ = [];
}
function warn(x, z, r, l, d) {
    const m = new THREE.Mesh(wg, wm_);
    m.scale.set(r, 1, r);
    m.position.set(x, gh(x, z) + .15, z);
    sc.add(m);
    HZ.push({ m, x, z, r, l, d });
}
function eb(p, a, sp, dm) {
    const m = new THREE.Mesh(pg, mat(0xff7a1a));
    m.scale.setScalar(.8);
    m.position.set(p.x, gh(p.x, p.z) + 1.5, p.z);
    sc.add(m);
    EP.push({ m, v: V(Math.cos(a) * sp, 0, Math.sin(a) * sp), l: 3.2, d: dm });
}
function bossAI(e, dt) {
    const p = e.m.position;
    const t = e.t;
    const f = e.hp / e.mx;
    const lv = f > .66 ? 1 : f > .33 ? 2 : 3;
    e.at -= dt;
    e.fr -= dt;
    e.ch -= dt;
    if (e.at > 0)
        return;
    e.at = Math.max(1.2, 3.4 - lv * .6 + R() * 1.2);
    const k = ['fan', 'slam', 'summon', 'charge', 'nova', 'rain'][Math.floor(R() * t.na)];
    const a0 = Math.atan2(pl.z - p.z, pl.x - p.x);
    if (k == 'fan') {
        const n = 2 + lv * 2;
        for (let i = 0; i < n; i++)
            eb(p, a0 + (i - (n - 1) / 2) * .2, 15, t.d * .5);
    }
    else if (k == 'nova') {
        const n = 16 + lv * 6;
        for (let i = 0; i < n; i++)
            eb(p, a0 + i * 6.283 / n, 11, t.d * .45);
    }
    else if (k == 'slam') {
        warn(p.x, p.z, 12, .9, t.d * 1.3);
        e.fr = 1.1;
    }
    else if (k == 'rain') {
        for (let i = 0; i < 4 + lv * 3; i++) {
            const a = R() * 6.283;
            const r = R() * 13;
            warn(pl.x + Math.cos(a) * r, pl.z + Math.sin(a) * r, 3.5, 1 + i * .12, t.d * .8);
        }
    }
    else if (k == 'summon') {
        for (let i = 0; i < 3 + lv; i++)
            spawn(0, p.x + (R() - .5) * 9, p.z + (R() - .5) * 9);
    }
    else
        e.ch = .9;
    snd(70, .4, 'sawtooth', .12);
}
function ebu(dt) {
    EP = EP.filter(p => {
        p.l -= dt;
        const q = p.m.position;
        q.addScaledVector(p.v, dt);
        p.m.rotation.y += dt * 6;
        if (Math.hypot(q.x - pl.x, q.z - pl.z) < 1.1 && Math.abs(q.y - gh(pl.x, pl.z) - 1.3) < 1.7) {
            hurtP(p.d);
            sc.remove(p.m);
            return false;
        }
        if (p.l <= 0 || AB.some(b => q.x > b.x0 && q.x < b.x1 && q.z > b.z0 && q.z < b.z1 && q.y < b.y1)) {
            sc.remove(p.m);
            return false;
        }
        return true;
    });
    HZ = HZ.filter(h => {
        h.l -= dt;
        if (h.l <= 0) {
            if (Math.hypot(pl.x - h.x, pl.z - h.z) < h.r)
                hurtP(h.d);
            for (let i = 0; i < 14; i++)
                fx(0xff5522, V(h.x, gh(h.x, h.z) + .5, h.z), V((R() - .5) * h.r * 2.5, R() * 7, (R() - .5) * h.r * 2.5), .6, .5, 1);
            snd(80, .3, 'sawtooth', .1);
            sc.remove(h.m);
            return false;
        }
        return true;
    });
    const b = en.find(e => e.t.bs);
    $('bb').style.display = b ? 'block' : 'none';
    if (b) {
        $('bbn').textContent = b.t.nm;
        $('bb').lastChild.style.width = Math.max(0, b.hp / b.mx * 100) + '%';
    }
}
function retry() {
    dd = 0;
    clr();
    $('shop').style.display = 'none';
    try {
        $('c').requestPointerLock();
    }
    catch (x) {
    }
    en.forEach(e => sc.remove(e.m));
    en = [];
    PK.forEach(p => sc.remove(p.m));
    PK = [];
    pl.hp = hpMax;
    pl.x = pl.z = 0;
    own.forEach((v, i) => {
        if (v) {
            ammo[i] = MG[i];
            rv[i] = Math.max(rv[i], RV[i]);
        }
    });
    wave--;
    rl = 0;
    shd = acd = 0;
    RM.forEach(r => {
        const x = (r.x0 + r.x1) / 2;
        const z = (r.z0 + r.z1) / 2;
        drop(x + 2, z + 1, 1e9);
        drop(x - 2, z - 1, 1e9);
    });
    st = 1;
    nextWave();
}
sw(0);
let ac;
function snd(f, d, ty, v) {
    try {
        ac = ac || new AudioContext();
        const t = ac.currentTime;
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = ty || 'square';
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(30, f / 3), t + d);
        g.gain.setValueAtTime(Math.max(1e-4, (v || .07) * CFG.vol * 1.4), t);
        g.gain.exponentialRampToValueAtTime(.001, t + d);
        o.connect(g);
        g.connect(ac.destination);
        o.start();
        o.stop(t + d);
    }
    catch (x) {
    }
}
const pg = new THREE.BoxGeometry(1, 1, 1);
const mc = {};
const mat = c => mc[c] || (mc[c] = new THREE.MeshBasicMaterial({ color: c }));
function fx(c, p, v, l, s, k) {
    const m = new THREE.Mesh(pg, mat(c));
    m.position.copy(p);
    m.scale.setScalar(s);
    sc.add(m);
    FX.push({ m, v, l, k });
}
function tr(a, b, c) {
    const m = new THREE.Mesh(pg, mat(c));
    m.scale.set(.03, .03, a.distanceTo(b));
    m.position.copy(a).lerp(b, .5);
    m.lookAt(b);
    sc.add(m);
    FX.push({ m, v: V(0, 0, 0), l: .07, k: 0 });
}
function FXu(dt) {
    FX = FX.filter(f => {
        f.l -= dt;
        if (f.l <= 0) {
            sc.remove(f.m);
            return false;
        }
        f.m.position.addScaledVector(f.v, dt);
        if (f.k == 1)
            f.v.y -= 12 * dt;
        if (f.k == 2)
            f.m.scale.multiplyScalar(1 + dt * 4);
        return true;
    });
}
function hurt(e, d) {
    if (e.hp <= 0)
        return;
    e.hp -= d * (1 + .15 * pw[2]);
    hm = e.hp <= 0 ? .4 : .15;
    e.m.scale.setScalar(1.18);
    if (e.hp <= 0) {
        sc.remove(e.m);
        en = en.filter(x => x != e);
        score += e.t.s;
        gold += Math.ceil(e.t.s / 2 * (1 + .3 * (stg - 1) + .06 * wave) * (1 + .25 * pw[4]));
        pl.hp = Math.min(hpMax, pl.hp + 2 * pw[7]);
        if (e.t.bs) {
            gold += 300 * stg;
            toast('Boss vaincu ! +' + 300 * stg + ' 🎃');
        }
        if (R() < .45)
            drop(e.m.position.x, e.m.position.z);
        const p = e.m.position.clone();
        p.y += e.t.c;
        for (let i = 0; i < 10; i++)
            fx(e.t.col, p, V((R() - .5) * 6, R() * 5, (R() - .5) * 6), .7, .25, 1);
        snd(180, .25, 'triangle', .1);
    }
    else
        snd(260, .05, 'square', .04);
}
function hurtP(d) {
    if (shd > 0)
        return;
    pl.hp -= d * (1 - .1 * pw[5]) * (1 + (stg - 1) * .35 + wave * .04);
    const e = $('dm');
    e.style.opacity = 1;
    setTimeout(() => e.style.opacity = 0, 150);
    snd(90, .2, 'sawtooth', .12);
    if (CFG.vib && navigator.vibrate)
        navigator.vibrate(60);
    try {
        if (CFG.vib)
            gpad.vibrationActuator.playEffect('dual-rumble', { duration: 120, strongMagnitude: .6, weakMagnitude: .6 });
    }
    catch (x) {
    }
    if (pl.hp <= 0)
        over();
}
function shoot() {
    const w = W[wi];
    if (cd > 0 || rl > 0)
        return;
    if (ammo[wi] <= 0) {
        reload();
        return;
    }
    ammo[wi]--;
    cd = w.rate;
    rec = 1;
    snd(w.f, w.sd, w.wt);
    cam.updateMatrixWorld();
    const o = cam.position.clone();
    const g = cam.localToWorld(V(.25, -.25, -.9));
    const f0 = V(0, 0, 0);
    cam.getWorldDirection(f0);
    for (let p = 0; p < w.pel; p++) {
        const s2 = w.spr * 2 * (1 - ad * .7);
        const f = f0.clone().add(V((R() - .5) * s2, (R() - .5) * s2, (R() - .5) * s2)).normalize();
        const hs = [];
        const wl = wd(o, f);
        en.forEach(e => {
            const c = e.m.position.clone();
            c.y += e.t.c;
            c.sub(o);
            const t = c.dot(f);
            if (t > 0 && t < Math.min(w.rng, wl) && c.lengthSq() - t * t < e.t.r * e.t.r)
                hs.push([t, e]);
        });
        hs.sort((a, b) => a[0] - b[0]);
        let end = Math.min(w.rng, wl);
        if (hs.length) {
            if (w.pierce)
                hs.forEach(h => hurt(h[1], w.dmg));
            else {
                hurt(hs[0][1], w.dmg);
                end = hs[0][0];
            }
        }
        if (w.aoe) {
            if (f.y < 0)
                end = Math.min(end, -o.y / f.y);
            const X = o.clone().addScaledVector(f, end);
            X.y = Math.max(X.y, gh(X.x, X.z) + .3);
            en.slice().forEach(e => {
                const c = e.m.position.clone();
                c.y += e.t.c;
                const d = c.distanceTo(X);
                if (d < w.aoe)
                    hurt(e, w.dmg * (1 - d / w.aoe * .6));
            });
            for (let i = 0; i < 26; i++)
                fx(R() < .5 ? 0xff7a1a : 0xffdd44, X, V((R() - .5) * 14, R() * 9, (R() - .5) * 14), .6, .5, 1);
            snd(60, .5, 'sawtooth', .15);
        }
        if (w.fire)
            fx(R() < .5 ? 0xff5500 : 0xffcc33, g, f.clone().multiplyScalar(18), .4, .35, 2);
        else
            tr(g, o.clone().addScaledVector(f, end), w.col);
    }
}

// ==========================================================================
// 12. VAGUES D’ENNEMIS
// ==========================================================================
function nextWave() {
    wave++;
    pal = stg;
    q = wave == 10 ? 14 + stg * 3 : 8 + wave * 2 + stg * 2;
    spt = 0;
    if (wave == 10)
        spawn(1);
    const b = $('bn');
    b.textContent = 'Étape ' + stg + ' · Niveau ' + wave + (wave == 10 ? ' · BOSS' : '');
    b.style.opacity = 1;
    setTimeout(() => b.style.opacity = 0, 1800);
}
function spawn(bs, sx, sz) {
    const pool = T.filter(u => u.tr <= pal && !u.bs);
    const t = bs ? T.find(u => u.bs && u.stg == stg) : pool[Math.floor(R() * pool.length)];
    const g = t.b ? mkG(t) : mk[t.k]();
    const a = R() * P * 2;
    {
        let x;
        let z;
        let n = 0;
        do {
            x = (R() * 2 - 1) * (H - 6);
            z = (R() * 2 - 1) * (H - 6);
        } while (n++ < 12 && (Math.hypot(x - pl.x, z - pl.z) < 24 || RM.some(r => in_(r, x, z, 2))));
        if (sx !== undefined) {
            x = sx;
            z = sz;
        }
        g.position.set(x, gh(x, z) + t.h, z);
    }
    sc.add(g);
    en.push({ m: g, t, hp: HV(t), mx: HV(t), cd: .5, ph: R() * 6, at: 3, fr: 0, ch: 0 });
}
function upd(dt) {
    cd -= dt;
    rec = Math.max(0, rec - dt * 8);
    pks(dt);
    aim();
    ebu(dt);
    acd -= dt;
    shd -= dt;
    slw -= dt;
    pl.hp = Math.min(hpMax, pl.hp + pw[3] * dt);
    if (rl > 0) {
        rl -= dt;
        if (rl <= 0) {
            rl = 0;
            const n = Math.min(MG[wi] - ammo[wi], rv[wi]);
            ammo[wi] += n;
            rv[wi] -= n;
        }
    }
    else if (ammo[wi] <= 0)
        reload();
    const ax = (K.d ? 1 : 0) - (K.q ? 1 : 0) + tmv.x + gm.x;
    const az = (K.s ? 1 : 0) - (K.z ? 1 : 0) + tmv.y + gm.y;
    const l = Math.hypot(ax, az);
    const k = l > 1 ? 1 / l : 1;
    const mx = ax * k;
    const mz = az * k;
    const c = Math.cos(pl.yaw);
    const s = Math.sin(pl.yaw);
    const sv = (6.5 - ad * 3) * (1 + .12 * pw[1]);
    pl.x += (mx * c + mz * s) * sv * dt;
    pl.z += (-mx * s + mz * c) * sv * dt;
    pl.yaw += ((K.arrowleft ? 1 : 0) - (K.arrowright ? 1 : 0)) * 2.2 * dt;
    pl.pitch = cl(pl.pitch + ((K.arrowup ? 1 : 0) - (K.arrowdown ? 1 : 0)) * 1.6 * dt, -1.3, 1.3);
    coll();
    if (K[' '] || mf || tfire || gf)
        shoot();
    spt -= dt;
    if (q > 0 && spt <= 0 && en.length < 14 + wave * 2) {
        spawn();
        q--;
        spt = Math.max(.35, 1.1 - wave * .06);
    }
    if (q == 0 && !en.length && !wt) {
        wt = 2.5;
        pl.hp = Math.min(hpMax, pl.hp + 20);
    }
    if (wt) {
        wt -= dt;
        if (wt <= 0) {
            wt = 0;
            dd = 0;
            wave >= 10 && stg >= 5 ? win() : shop();
        }
    }
    en.forEach(e => {
        const p = e.m.position;
        const t = e.t;
        const T2 = tgt2(p, t);
        const dx = T2.x - p.x;
        const dz = T2.z - p.z;
        const dd = Math.hypot(dx, dz) || 1;
        const d = Math.hypot(pl.x - p.x, pl.z - p.z) || 1;
        const sl = (slw > 0 ? .35 : 1) * (e.ch > 0 ? 3.2 : 1) * (t.bs && e.hp < e.mx * .5 ? 1.3 : 1);
        if (t.bs)
            bossAI(e, dt);
        if (d > 999) {
            const a = R() * P * 2;
            p.x = pl.x + Math.cos(a) * 30;
            p.z = pl.z + Math.sin(a) * 30;
        }
        else if (e.fr > 0) {
        }
        else if (T2 !== pl || d > t.r + .6) {
            const q = e.rt > 0 ? e.sd * 1.2 : 0;
            const cc = Math.cos(q);
            const sn = Math.sin(q);
            p.x += (dx * cc - dz * sn) / dd * t.sp * sl * dt;
            p.z += (dx * sn + dz * cc) / dd * t.sp * sl * dt;
        }
        else {
            e.cd -= dt;
            if (e.cd <= 0) {
                e.cd = 1;
                hurtP(t.d);
            }
        }
        if (t.k != 'ghost' && t.k != 'bat')
            coll(p, Math.min(t.r * .6, .8));
        p.x = cl(p.x, -H + 1, H - 1);
        p.z = cl(p.z, -H + 1, H - 1);
        e.sk = (e.sk || 0) + dt;
        e.rt = (e.rt || 0) - dt;
        if (e.sk > 1) {
            if (Math.hypot(p.x - (e.lx ?? p.x + 9), p.z - (e.lz ?? p.z)) < .7 && d > t.r + 1.2) {
                e.rt = 1;
                e.sd = R() < .5 ? 1 : -1;
            }
            e.lx = p.x;
            e.lz = p.z;
            e.sk = 0;
        }
        e.ph += dt * 6;
        p.y = gh(p.x, p.z) + t.h + (t.k == 'bat' || t.k == 'ghost' ? Math.sin(e.ph * .5) * .3 : Math.abs(Math.sin(e.ph)) * .15);
        e.m.lookAt(pl.x, p.y, pl.z);
        const z = e.m.scale.x;
        if (z > 1)
            e.m.scale.setScalar(Math.max(1, z - dt * 1.5));
        if (e.m.wl) {
            e.m.wl.rotation.z = Math.sin(e.ph * 3) * .6;
            e.m.wr.rotation.z = -e.m.wl.rotation.z;
        }
    });
    hpb.style.width = Math.max(0, pl.hp / hpMax * 100) + '%';
    $('wp').textContent = (wi + 1) + '/' + W.length + '  ' + W[wi].n + '  ' + (rl > 0 ? 'rechargement…' : ammo[wi] + ' / ' + (rv[wi] > 1e9 ? '∞' : rv[wi]));
    xh(dt, Math.min(1, l));
    $('info').textContent = 'Étape ' + stg + ' · Niveau ' + wave + '/10 · 🎃 ' + gold + ' · ' + (en.length + q) + ' ennemis' + (act >= 0 ? ' · ' + AC[act][0] + (acd > 0 ? ' ' + Math.ceil(acd) + 's' : ' (F)') : '');
}

// ==========================================================================
// 13. DÉBUT ET FIN DE PARTIE
// ==========================================================================
function start() {
    WS = Math.floor(R() * 1e9);
    clr();
    stg = 1;
    hpMax = 100;
    gold = 0;
    pw = [0, 0, 0, 0, 0, 0, 0, 0];
    own2.fill(0);
    act = -1;
    acd = shd = slw = 0;
    own = W.map((_, i) => i == 0 ? 1 : 0);
    ammo = MG.slice();
    rv = RV.slice();
    rl = 0;
    tads = 0;
    wi = 0;
    sw(0);
    $('shop').style.display = $('sty').style.display = 'none';
    mapSet(1);
    en.forEach(e => sc.remove(e.m));
    en = [];
    pl.x = pl.z = pl.yaw = pl.pitch = 0;
    pl.hp = hpMax;
    score = 0;
    wave = 0;
    wt = 0;
    q = 0;
    st = 1;
    $('menu').style.display = 'none';
    $('go').blur();
    if (CFG.dlg && !introDone) {
        introDone = 1;
        talk(INTRO, () => {
            st = 1;
            nextWave();
        });
    }
    else
        nextWave();
    try {
        $('c').requestPointerLock();
    }
    catch (x) {
    }
    try {
        document.documentElement.requestFullscreen().then(() => screen.orientation.lock('landscape')).catch(() => {
        });
    }
    catch (x) {
    }
}
function over() {
    dd = 1;
    shop();
}
function quit() {
    st = 2;
    dd = 0;
    try {
        document.exitPointerLock();
    }
    catch (x) {
    }
    let b = 0;
    try {
        b = +localStorage.bestHW || 0;
        if (score > b) {
            b = score;
            localStorage.bestHW = b;
        }
    }
    catch (x) {
    }
    $('t').textContent = 'Vous avez succombé';
    $('msg').textContent = 'Niveau ' + wave + ' · ' + score + ' points · record ' + b;
    $('go').textContent = 'REJOUER';
    $('menu').style.display = 'flex';
}
try {
    const b = +localStorage.bestHW;
    if (b)
        $('msg').textContent = 'Record : ' + b + ' points';
}
catch (x) {
}
$('go').onclick = start;

// ==========================================================================
// 14. ENTRÉES : CLAVIER, SOURIS, TACTILE, MANETTE, BOUCLE PRINCIPALE
// ==========================================================================
addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    K[k] = 1;
    if (st == 6 && (k == ' ' || k == 'enter' || k == 'e')) {
        e.preventDefault();
        dnext();
        return;
    }
    if (k == 'p') {
        cfgOpen();
        return;
    }
    if (/^Digit[1-9]$/.test(e.code)) {
        const n = +e.code[5] - 1;
        if (n < W.length)
            sw(n);
    }
    if (k == 'a')
        sw(wi - 1);
    if (k == 'e')
        sw(wi + 1);
    if (k == 'r')
        reload();
    if (k == 'f')
        use();
    if (k == ' ' || k.startsWith('arrow'))
        e.preventDefault();
});
addEventListener('keyup', e => {
    K[e.key.toLowerCase()] = 0;
});
$('c').addEventListener('click', () => {
    if (st == 1 && !matchMedia('(hover:none)').matches)
        try {
            $('c').requestPointerLock();
        }
        catch (x) {
        }
});
addEventListener('mousemove', e => {
    if (document.pointerLockElement || mf) {
        pl.yaw -= e.movementX * .0025 * ss;
        pl.pitch = cl(pl.pitch - e.movementY * .0025 * ss, -1.3, 1.3);
    }
});
addEventListener('mousedown', e => {
    if (e.button == 0 && st == 1)
        mf = 1;
    if (e.button == 2)
        adsOn = 1;
});
addEventListener('mouseup', e => {
    if (e.button == 2)
        adsOn = 0;
    else
        mf = 0;
});
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('wheel', e => sw(wi + (e.deltaY > 0 ? 1 : -1)));
addEventListener('touchstart', e => {
    if (st != 1 || !tcOn)
        return;
    for (const t of e.changedTouches) {
        const i = t.target.id;
        if (i == 'tg')
            continue;
        if (i == 'f') {
            tfire = 1;
            tc[t.identifier] = { f: 1, x: tx(t), y: ty(t) };
        }
        else if (i == 'r') {
            reload();
            tc[t.identifier] = 'r';
        }
        else if (i == 'a') {
            tads = !tads;
            tc[t.identifier] = 'a';
        }
        else if (i == 'p') {
            use();
            tc[t.identifier] = 'p';
        }
        else if (i == 'w') {
            sw(wi + 1);
            tc[t.identifier] = 'w';
        }
        else
            tc[t.identifier] = { m: tx(t) < W_() / 2, x: tx(t), y: ty(t) };
    }
});
addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
        const s = tc[t.identifier];
        if (typeof s != 'object')
            continue;
        if (s.m) {
            tmv.x = cl((tx(t) - s.x) / 45, -1, 1);
            tmv.y = cl((ty(t) - s.y) / 45, -1, 1);
        }
        else {
            pl.yaw -= (tx(t) - s.x) * .006 * ss;
            pl.pitch = cl(pl.pitch - (ty(t) - s.y) * .006 * ss, -1.3, 1.3);
            s.x = tx(t);
            s.y = ty(t);
        }
    }
});
const te = e => {
    for (const t of e.changedTouches) {
        const s = tc[t.identifier];
        if (s && s.f)
            tfire = 0;
        if (s && s.m)
            tmv.x = tmv.y = 0;
        delete tc[t.identifier];
    }
};
addEventListener('touchend', te);
addEventListener('touchcancel', te);
function pad(dt) {
    gpad = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(x => x && x.connected);
    gm.x = gm.y = gf = gl = 0;
    const g = gpad;
    if (!g)
        return;
    const z = v => Math.abs(v) < .18 ? 0 : v;
    const b = i => g.buttons[i] && g.buttons[i].pressed;
    const ed = i => {
        const n = b(i);
        const r = n && !gb[i];
        gb[i] = n;
        return r;
    };
    gm.x = z(g.axes[0]);
    gm.y = z(g.axes[1]);
    pl.yaw -= z(g.axes[2]) * 3 * ss * dt;
    pl.pitch = cl(pl.pitch - z(g.axes[3]) * 2.2 * ss * dt, -1.3, 1.3);
    gf = b(7) || b(0) ? 1 : 0;
    gl = b(6) ? 1 : 0;
    if (ed(2))
        reload();
    if (ed(3))
        use();
    if (ed(0) && st == 6)
        dnext();
    if (ed(5))
        sw(wi + 1);
    if (ed(4))
        sw(wi - 1);
    if (ed(9)) {
        if (st == 3)
            nextLvl();
        else if (st == 4)
            storyGo();
        else if (st == 6)
            dend();
        else if (st != 1 && st != 5)
            start();
    }
}
let last = 0;
(function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min((t - last) / 1000 || 0, .05);
    last = t;
    pad(dt);
    if (st == 1)
        upd(dt);
    else
        pl.yaw += dt * .15;
    moon.position.set(pl.x - 40, 110, pl.z - 50);
    stars.position.set(pl.x, 0, pl.z);
    cam.position.set(pl.x, 1.6 + gh(pl.x, pl.z), pl.z);
    cam.rotation.set(pl.pitch, pl.yaw, 0);
    ad += ((st == 1 && rl <= 0 && (adsOn || K.shift || gl || tads) ? 1 : 0) - ad) * Math.min(1, dt * 12);
    ss = (1 - ad * .55) * CFG.sens;
    const fv = CFG.fov + (AF[wi] - CFG.fov) * ad;
    if (Math.abs(cam.fov - fv) > .05) {
        cam.fov = fv;
        cam.updateProjectionMatrix();
    }
    $('a').style.background = tads ? '#ff7a1acc' : '';
    gun.position.x = .28 * (1 - ad);
    gun.position.y = -.26 * (1 - ad) - SY[wi] * ad - (rl > 0 ? .18 : 0);
    gun.position.z = -.7 * (1 - ad) - .45 * ad + rec * .12 * (1 - ad * .6);
    gun.rotation.x = rec * .1 * (1 - ad * .5) + (rl > 0 ? -.35 : 0);
    MF.visible = rec > .6 && wi != 3 && wi != 4;
    MF.position.z = TZ[wi];
    MF.scale.setScalar((wi == 5 ? 1.8 : wi == 1 ? 1.4 : 1) * (.6 + R() * .7));
    GM[4].fl.scale.setScalar(.7 + R() * .9);
    FXu(dt);
    mist(dt);
    rd.render(sc, cam);
})(0);
