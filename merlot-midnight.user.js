// ==UserScript==
// @name         Merlot Midnight
// @namespace    coldspyy.merlotmidnight
// @version      3.1
// @description  A burgundy night-sky theme for ChatGPT: magnetic stars, catchable shooting stars, star orbs, meteor showers, constellations, aurora and a crescent moon
// @author       ColdSpyy
// @homepageURL  https://github.com/ColdSpyy/merlot-midnight
// @downloadURL  https://raw.githubusercontent.com/ColdSpyy/merlot-midnight/main/merlot-midnight.user.js
// @updateURL    https://raw.githubusercontent.com/ColdSpyy/merlot-midnight/main/merlot-midnight.user.js
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==

(() => {
  'use strict';
  const PAGE = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  if (PAGE.__merlotMidnight) return;
  PAGE.__merlotMidnight = true;

  /* ======================= SETTINGS (edit these) ======================= */
  const CFG = {
    // 'overlay' = sky drawn on top of the page, blended so text stays readable (always visible)
    // 'behind'  = sky drawn behind the page (only shows where ChatGPT's panels are see-through)
    layer: 'overlay',
    overlayOpacity: 0.95,
    onlyInDark: true,           // hide the sky in light mode

    density: 2600,              // px² per star. Smaller = more stars
    heroEvery: 700000,          // px² per bright "hero" star (the big glowing one in your photo)
    streaks: true,              // tiny long-exposure trails like the reference photo
    streakAngle: -62,           // trail direction in degrees
    drift: { x: -4, y: 1.2 },   // px/sec slow drift

    mouseMode: 'magnet',        // 'magnet' (stars gather + orbit your cursor) or 'repel'
    mouseRadius: 190,           // how far the cursor reaches
    mouseStrength: 1,           // 0.5 = gentle, 2 = strong
    ringRadius: 38,             // how close magnetised stars orbit the cursor
    swirl: 1,                   // orbit speed (0 = no orbit)
    magnetLines: true,          // faint constellation lines around the cursor
    clickBurst: true,           // clicking sends a little shockwave through the stars

    shootingEveryMs: [6000, 14000],
    rainbowEveryMs: 300000,     // one rainbow shooting star every 5 minutes

    // these can also be changed live in the settings panel (Alt + Shift + M)
    starAmount: 1,              // multiplies the number of stars
    shootingFreq: 1,            // multiplies how often shooting stars appear
    rainbowMagnet: false,       // triple tap toggles this
    typingShimmer: true,        // typing ripples the stars, Enter launches a shooting star
    aurora: true,               // aurora when ChatGPT finishes an answer
    moon: true,                 // crescent moon that crosses the sky over the night
    nightMode: 'auto',          // 'auto' (dim + slow after midnight), 'always', 'off'
    showers: true,              // random meteor showers, about once an hour
  };

  // settings from the panel are remembered in this browser
  const SKEY = 'merlotMidnight.settings';
  const SAVE_KEYS = ['starAmount', 'overlayOpacity', 'shootingFreq', 'streaks', 'showers', 'mouseStrength', 'mouseRadius',
    'swirl', 'magnetLines', 'rainbowMagnet', 'clickBurst', 'typingShimmer', 'aurora', 'moon', 'nightMode'];
  const DEFAULTS = {};
  SAVE_KEYS.forEach((k) => { DEFAULTS[k] = CFG[k]; });
  try {
    const saved = JSON.parse(localStorage.getItem(SKEY) || '{}');
    SAVE_KEYS.forEach((k) => { if (k in saved && typeof saved[k] === typeof CFG[k]) CFG[k] = saved[k]; });
  } catch (_) { /* storage blocked: use defaults */ }
  function saveSettings() {
    try {
      const out = {};
      SAVE_KEYS.forEach((k) => { out[k] = CFG[k]; });
      localStorage.setItem(SKEY, JSON.stringify(out));
    } catch (_) { /* ignore */ }
  }
  /* ===================================================================== */

  /* ---------------- BURGUNDY THEME (dark mode only) ---------------- */
  const D = ':is(html.dark, html[data-theme="dark"])';
  const themeCSS = `
    ${D}, ${D} * {
      --bg-primary: #32111c !important;
      --bg-secondary: #3d1624 !important;
      --bg-tertiary: #4a1b2c !important;
      --bg-secondary-surface: #260c15 !important;
      --bg-elevated-primary: #32111c !important;
      --bg-elevated-secondary: #3d1624 !important;
      --main-surface-primary: #32111c !important;
      --main-surface-secondary: #3d1624 !important;
      --main-surface-tertiary: #4a1b2c !important;
      --color-surface: #32111c !important;
      --color-surface-secondary: #260c15 !important;
      --color-surface-elevated-secondary: #3d1624 !important;
      --color-background-panel: #32111c !important;
      --color-background-control-opaque: #4a1b2c !important;
      --color-background-composer-surface: #3d1624 !important;
      --color-background-composer-action-bar: #3d1624 !important;
      --sidebar-surface: #260c15 !important;
      --sidebar-surface-primary: #260c15 !important;
      --surface-hover: #4a1b2c !important;
      --interactive-bg-secondary-hover: #55203a !important;
      --interactive-bg-secondary-press: #4a1b2c !important;
      --border-light: #4a1b2c !important;
      --border-default: #5e2a3d !important;
      --border-medium: #7a3a55 !important;
      --gray-0: #1d0a10 !important;
      --gray-50: #260c15 !important;
      --gray-100: #2b1019 !important;
      --gray-150: #32111c !important;
      --gray-200: #32111c !important;
      --gray-250: #3d1624 !important;
      --gray-300: #3d1624 !important;
      --gray-350: #4a1b2c !important;
      --gray-400: #4a1b2c !important;
      --gray-500: #5e2a3d !important;
      --color-background-primary-solid: #873D59 !important;
      --color-background-composer-primary: #873D59 !important;
      --theme-user-msg-bg: #1a080e !important;
      --user-message-bubble-color: #1a080e !important;
      --interactive-bg-accent-default: #873D59 !important;
      --interactive-bg-accent-hover: #9a4767 !important;
      --interactive-bg-accent-press: #6e3048 !important;
      --interactive-label-accent-default: #ffb3cf !important;
      --text-accent: #ffb3cf !important;
      --icon-accent: #ffb3cf !important;
      --theme-accent: #873D59 !important;
      --theme-submit-btn-text: #ffffff !important;
      --theme-user-msg-text: #fff0f4 !important;
      --theme-entity-accent: #ff9ec4 !important;
      --theme-user-selection-bg: #873D59 !important;
      --theme-secondary: #ff9ec4 !important;
      --theme-attribution-highlight-bg: #4a1b2c !important;
      --interactive-bg-primary-default: #873D59 !important;
      --interactive-bg-primary-hover: #9a4767 !important;
      --interactive-bg-primary-press: #6e3048 !important;
      --interactive-bg-primary-inactive: #4a1b2c !important;
      --interactive-label-primary-default: #ffffff !important;
      --interactive-bg-accent-muted-hover: #55203a !important;
      --interactive-bg-accent-muted-press: #4a1b2c !important;
      --interactive-bg-accent-inactive: #4a1b2c !important;
      --interactive-border-focus: #ff9ec4 !important;
      --link: #ff9ec4 !important;
      --link-hover: #ffc2da !important;
      --theme-submit-btn-bg: #873D59 !important;
      --text-primary: #fff0f4 !important;
      --color-text: #fff0f4 !important;
    }
    ${D} {
      background: radial-gradient(ellipse at 35% 40%, #2a0c16 0%, #1d0810 55%, #12050a 100%) fixed !important;
    }
    ${D} body, ${D} #root { background: transparent !important; }
    ${D} .bg-token-bg-primary, ${D} .bg-token-main-surface-primary { background-color: transparent !important; }
    ${D} .bg-token-sidebar-surface, ${D} aside, ${D} nav { background-color: #260c15 !important; }
    /* your sent messages: black-cherry bubble with a soft burgundy rim */
    ${D} .user-message-bubble-color,
    ${D} [data-message-author-role="user"] .user-message-bubble-color,
    ${D} [data-message-author-role="user"] [class*="bg-token-message-surface"] {
      background: #1a080e !important;
      color: #fff0f4 !important;
      border: 1px solid #5e2a3d !important;
      box-shadow: 0 0 18px rgba(135, 61, 89, 0.28) !important;
    }
    ${D} #composer-submit-button, ${D} button[data-testid="send-button"], ${D} form button[aria-label="Send"],
    ${D} button[data-testid="stop-button"], ${D} form button[aria-label^="Stop"] { background-color: #873D59 !important; color: #fff !important; }
    ${D} #prompt-textarea, ${D} .ProseMirror { background-color: transparent !important; }
    ${D} ::selection { background: #873D59 !important; color: #fff !important; }
  `;

  // GM_addStyle gets around ChatGPT's security policy, which can block normal <style> tags
  let themeEl = null, themeAdded = false;
  function addTheme() {
    if (themeAdded && (!themeEl || themeEl.isConnected)) return;
    if (typeof GM_addStyle === 'function') {
      themeEl = GM_addStyle(themeCSS) || null;
    } else {
      themeEl = document.createElement('style');
      themeEl.textContent = themeCSS;
      (document.head || document.documentElement).appendChild(themeEl);
    }
    themeAdded = true;
  }
  addTheme();

  function isDark() {
    const h = document.documentElement;
    if (h.classList.contains('dark') || h.getAttribute('data-theme') === 'dark') return true;
    if (h.classList.contains('light') || h.getAttribute('data-theme') === 'light') return false;
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* ---------------------------- SKY ---------------------------- */
  function start() {
    // remove skies left behind by older versions of this script if they're still installed
    const killOld = () => {
      document.querySelectorAll('body > canvas, html > canvas').forEach((c) => {
        if (c.id !== 'merlot-midnight-sky' && c.style.position === 'fixed' && c.style.pointerEvents === 'none') c.remove();
      });
      const oldTheme = document.getElementById('aman-burgundy-theme');
      if (oldTheme) oldTheme.remove();
    };
    killOld();
    setTimeout(killOld, 3000);

    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behind = CFG.layer === 'behind';

    // ChatGPT keeps renaming its composer, so try every known version of the message box and buttons
    const EDITOR_SEL = '#prompt-textarea, .ProseMirror[contenteditable="true"], [contenteditable="true"][aria-label*="Ask"], form textarea';
    const SEND_SEL = 'button[data-testid="send-button"], #composer-submit-button, button[aria-label="Send"], button[aria-label="Send prompt"], button[aria-label="Send message"]';
    const findEditor = () => document.querySelector('#prompt-textarea')
      || document.querySelector('.ProseMirror[contenteditable="true"]')
      || document.querySelector('[contenteditable="true"][aria-label*="Ask"]')
      || document.querySelector('form textarea');
    const findSend = (ed) => {
      const form = ed && ed.closest('form');
      return document.querySelector(SEND_SEL) || (form && form.querySelector('button[type="submit"]'));
    };

    const canvas = document.createElement('canvas');
    canvas.id = 'merlot-midnight-sky';
    Object.assign(canvas.style, {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      pointerEvents: 'none',
      zIndex: behind ? '-1' : '2147483000',
      mixBlendMode: behind ? 'normal' : 'screen',
      opacity: behind ? '1' : String(CFG.overlayOpacity),
    });
    // mounted on <html>, not <body>, so ChatGPT re-rendering the page can't wipe it
    const mount = () => { if (!canvas.isConnected) document.documentElement.appendChild(canvas); };
    mount();
    const ctx = canvas.getContext('2d');

    // star colours sampled from the reference photo: white, icy blue, amber, orange + a burgundy-pink
    const TINTS = [
      ['255,255,255', 0.42], ['185,215,255', 0.24], ['255,205,150', 0.18],
      ['255,170,120', 0.07], ['255,215,230', 0.09],
    ];
    const pickTint = () => {
      let r = Math.random();
      for (const [t, w] of TINTS) if ((r -= w) <= 0) return t;
      return TINTS[0][0];
    };

    // pre-rendered glow sprites (much faster than shadowBlur on every star)
    const sprites = {};
    function sprite(rgb) {
      if (sprites[rgb]) return sprites[rgb];
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, `rgba(${rgb},1)`);
      gr.addColorStop(0.15, `rgba(${rgb},0.55)`);
      gr.addColorStop(0.4, `rgba(${rgb},0.12)`);
      gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
      return (sprites[rgb] = c);
    }

    const ang = CFG.streakAngle * Math.PI / 180;
    const SX = Math.cos(ang), SY = Math.sin(ang);

    let W = 0, H = 0, stars = [], shooters = [], sparks = [], glints = [];
    let rainbow = !!CFG.rainbowMagnet;   // triple-tap toggles rainbow magnet mode

    // 4-point sparkle shape
    function drawGlint(x, y, r, rot, color) {
      const w = r * 0.22;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(w, -w, r, 0);
      ctx.quadraticCurveTo(w, w, 0, r);
      ctx.quadraticCurveTo(-w, w, -r, 0);
      ctx.quadraticCurveTo(-w, -w, 0, -r);
      ctx.fill();
      ctx.restore();
    }

    function spawnSparkleBurst(x, y, big) {
      glints.push({ x, y, vx: 0, vy: 0, t: 0, life: big ? 0.8 : 0.55, size: big ? 46 : 30, rot: Math.random() * 0.6, spin: 1.5, flare: true, hue: rainbow ? Math.random() * 360 : null });
      const n = big ? 28 : 14;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
        const sp = (big ? 260 : 160) + Math.random() * 180;
        glints.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0,
          life: 0.5 + Math.random() * 0.5,
          size: 2.5 + Math.random() * 4,
          rot: Math.random() * Math.PI, spin: (Math.random() - 0.5) * 8,
          tint: Math.random() < 0.5 ? '255,255,255' : '255,170,205',
          hue: rainbow || big ? Math.random() * 360 : null,
        });
      }
    }

    function makeStar(hero) {
      const r = Math.random();
      const big = hero || r > 0.985, mid = !big && r > 0.9;
      const size = hero ? 2.2 + Math.random() * 0.8
        : big ? 1.5 + Math.random() * 0.6
        : mid ? 1.0 + Math.random() * 0.4
        : 0.5 + Math.random() * 0.45;
      return {
        hx: Math.random() * W, hy: Math.random() * H,
        ox: 0, oy: 0, vx: 0, vy: 0, e: 0, flash: 0, ang: 0,
        size,
        base: hero ? 1 : big ? 0.95 : mid ? 0.85 : 0.35 + Math.random() * 0.45,
        glow: hero ? 1 : big ? 0.6 : mid ? 0.25 : 0,
        len: CFG.streaks ? size * (hero ? 1.2 : 1.6 + Math.random() * 1.8) : 0,
        tint: hero ? (Math.random() < 0.5 ? '255,255,255' : '200,225,255') : pickTint(),
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.4 + Math.random() * 1.6,
        depth: 0.3 + Math.random() * 0.7,
        hero,
      };
    }

    function build() {
      stars = [];
      const n = Math.round((W * H) / (CFG.density / Math.max(0.1, CFG.starAmount)));
      for (let i = 0; i < n; i++) stars.push(makeStar(false));
      const heroes = Math.max(1, Math.round((W * H) / CFG.heroEvery));
      for (let i = 0; i < heroes; i++) stars.push(makeStar(true));
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    /* ---------- cursor ---------- */
    const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, vx: 0, vy: 0, on: 0, inside: false };
    addEventListener('pointermove', (e) => {
      if (mouse.sx < -9000) { mouse.sx = e.clientX; mouse.sy = e.clientY; }
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true;
    }, { passive: true });
    document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) mouse.inside = false; });
    addEventListener('blur', () => { mouse.inside = false; });

    const bursts = [];
    const taps = [];

    // when a tap is used by the sky (catching a star / tapping the orb), stop it clicking the page underneath
    let swallow = false;
    const swallowIfFlag = (e) => {
      if (!swallow || !e.isTrusted) return;   // never block clicks the script makes itself (like pressing Send)
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (e.type === 'click') swallow = false;
    };
    ['mousedown', 'mouseup', 'click'].forEach((t) => addEventListener(t, swallowIfFlag, true));
    const consume = (e) => {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      swallow = true;
      setTimeout(() => { swallow = false; }, 600);
    };

    addEventListener('pointerdown', (e) => {
      if (!visible || ask.contains(e.target) || isOurUI(e.target)) return;
      const x = e.clientX, y = e.clientY, t = performance.now();

      if (askOpen()) { closeAsk(); return; }
      if (panel.style.display !== 'none') togglePanel(false);

      // Shift + drag = draw a constellation
      if (e.shiftKey && e.button === 0) { consume(e); startConstellation(x, y); return; }

      if (orb) {
        if (orb.state === 'ball') {
          if (Math.hypot(x - orb.x, y - orbY()) < ORB_R * 1.3) { consume(e); openAsk(); }
          else explodeOrb(x, y);   // tap anywhere else = BOOM from that spot
        }
        return;
      }

      const caught = shooterAt(x, y);
      if (caught) {
        consume(e);
        shooters.splice(shooters.indexOf(caught), 1);
        catchShooter(caught, x, y);
        return;
      }

      // triple tap (3 taps within 650ms, close together) toggles rainbow mode
      taps.push({ t, x, y });
      while (taps.length && t - taps[0].t > 650) taps.shift();
      if (taps.length >= 3 && Math.hypot(x - taps[0].x, y - taps[0].y) < 80) {
        taps.length = 0;
        rainbow = !rainbow;
        CFG.rainbowMagnet = rainbow;
        saveSettings();
        spawnSparkleBurst(x, y, true);
        return;
      }

      if (CFG.clickBurst) {
        bursts.push({ x, y });
        spawnSparkleBurst(x, y, false);
      }
    }, true);

    /* ---------- shooting stars ---------- */
    function spawnShooter(rainbow = false, opts = null) {
      const fromRight = Math.random() < 0.5;
      const a = (18 + Math.random() * 25) * Math.PI / 180;
      const speed = rainbow ? 700 + Math.random() * 200 : 800 + Math.random() * 600;
      const dir = fromRight ? -1 : 1;
      shooters.push({
        x: fromRight ? W * (0.4 + Math.random() * 0.6) : W * Math.random() * 0.6,
        y: -10 + Math.random() * H * 0.35,
        vx: Math.cos(a) * speed * dir,
        vy: Math.sin(a) * speed,
        len: rainbow ? 320 + Math.random() * 120 : 170 + Math.random() * 150,
        age: 0,
        rainbow,
        gold: false,
      });
      if (opts) Object.assign(shooters[shooters.length - 1], opts);
    }

    function scheduleShooter() {
      const [a, b] = CFG.shootingEveryMs;
      setTimeout(() => {
        if (!document.hidden && visible && !reduceMotion) spawnShooter();
        scheduleShooter();
      }, (a + Math.random() * (b - a)) / Math.max(0.1, CFG.shootingFreq * motion));
    }

    function drawShooter(s) {
      const sp = Math.hypot(s.vx, s.vy);
      const ux = s.vx / sp, uy = s.vy / sp;
      const tx = s.x - ux * s.len, ty = s.y - uy * s.len;
      const fade = Math.min(1, s.age / 0.15);

      const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
      if (s.rainbow) {
        g.addColorStop(0, `rgba(255,255,255,${fade})`);
        [0, 30, 55, 125, 185, 230, 285].forEach((h, i) => {
          g.addColorStop(0.1 + i * 0.12, `hsla(${h},100%,60%,${0.9 * fade * (1 - i * 0.08)})`);
        });
        g.addColorStop(1, 'rgba(160,80,255,0)');
      } else if (s.gold) {
        g.addColorStop(0, `rgba(255,255,240,${fade})`);
        g.addColorStop(0.2, `rgba(255,215,120,${0.9 * fade})`);
        g.addColorStop(0.55, `rgba(240,150,40,${0.5 * fade})`);
        g.addColorStop(1, 'rgba(160,90,20,0)');
      } else {
        g.addColorStop(0, `rgba(255,255,255,${fade})`);
        g.addColorStop(0.2, `rgba(255,170,205,${0.85 * fade})`);
        g.addColorStop(0.55, `rgba(235,40,105,${0.5 * fade})`);
        g.addColorStop(1, 'rgba(135,61,89,0)');
      }

      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = g;
      ctx.shadowColor = s.rainbow ? 'rgba(255,255,255,0.7)' : s.gold ? 'rgba(255,170,40,0.95)' : 'rgba(255,50,130,0.95)';
      ctx.shadowBlur = s.rainbow ? 16 : 14;
      ctx.lineWidth = s.rainbow ? 3.2 : 2.2;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.restore();

      const hs = s.rainbow ? 34 : 26;
      ctx.globalAlpha = fade;
      ctx.drawImage(sprite('255,255,255'), s.x - hs / 2, s.y - hs / 2, hs, hs);
      ctx.drawImage(sprite(s.rainbow ? '255,255,255' : s.gold ? '255,180,60' : '255,90,150'), s.x - hs, s.y - hs, hs * 2, hs * 2);
      ctx.globalAlpha = 1;
    }

    /* ================= THE ORB: a caught shooting star, spun into a ball ================= */
    // There is no drawn sphere. The ball is ONLY the caught star's own trail:
    // it whips around so fast, on a plane that keeps tumbling, that its loops wrap into a ball of light.
    const ORB_R = 74;     // ball radius in px
    const FOCAL = 3.2;    // 3D perspective strength
    const FORM_TIME = 2.2;

    function rot3(p, ax, ay) {
      const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
      const y1 = p[1] * cx - p[2] * sx, z1 = p[1] * sx + p[2] * cx;
      return [p[0] * cy + z1 * sy, y1, -p[0] * sy + z1 * cy];
    }
    // 3D point (in ball-radius units) -> screen [x, y, depth]
    function proj(p, cx, cy, R) {
      const s = FOCAL / (FOCAL - p[2]);
      return [cx + p[0] * R * s, cy + p[1] * R * s, p[2]];
    }

    // a circle tilted by `a` and turned by `b` (rotations only, so the path never jumps)
    function orbitPoint(ang, r, a, b) {
      const x = Math.cos(ang) * r, y0 = Math.sin(ang) * r;
      const y = y0 * Math.cos(a), z = y0 * Math.sin(a);
      const cb = Math.cos(b), sb = Math.sin(b);
      return [x * cb - y * sb, x * sb + y * cb, z];
    }

    let orb = null;
    const frags = [];   // shattered light threads after the blast
    const bombs = [];   // blast shockwaves

    const orbY = () => orb.y + (orb.state === 'orbit' ? 0 : Math.sin(orb.t * 1.3) * 4);

    function catchShooter(s, x, y) {
      orb = {
        state: 'orbit', x, y, t: 0,
        ang: Math.atan2(s.y - y, s.x - x),   // start the loop from where the star was
        pa: 0, pb: 0,                         // tumble phases of the orbit plane
        ax: 0, ay: 0,                         // whole-ball rotation
        r: 2.1, trail: [], pulse: 0, boomAt: 0, lastPts: null, gold: !!s.gold,
      };
      spawnSparkleBurst(s.x, s.y, false);
    }

    function shooterAt(x, y) {
      for (const s of shooters) {
        const sp = Math.hypot(s.vx, s.vy), ux = s.vx / sp, uy = s.vy / sp;
        const L = s.len * 0.6, tx = s.x - ux * L, ty = s.y - uy * L;
        const tt = Math.max(0, Math.min(1, ((x - tx) * ux + (y - ty) * uy) / L));
        if (Math.hypot(x - (tx + ux * L * tt), y - (ty + uy * L * tt)) < 48) return s;
      }
      return null;
    }

    function updateOrb(dt) {
      if (!orb) return;
      orb.t += dt;
      orb.pulse = Math.max(0, orb.pulse - dt * 1.2);

      // forming: follow the cursor while the star winds up
      if (orb.state === 'orbit') {
        const k = 1 - Math.exp(-dt * 8);
        if (mouse.inside) { orb.x += (mouse.sx - orb.x) * k; orb.y += (mouse.sy - orb.y) * k; }
      }

      const f = Math.min(1, orb.t / FORM_TIME);
      const e = f * f * (3 - 2 * f);
      let spin, rTarget, ta, tb, keep;
      if (orb.state === 'orbit') {
        spin = 7 + 53 * e * e;          // faster and faster
        rTarget = 1 + 1.1 * (1 - e);    // spiralling in to ball size
        ta = 2.3 * e;                   // the loop starts flat, then begins to tumble
        tb = 9.5 * e;
        keep = 0.18 + 0.92 * e;         // longer trail = more loops = the ball fills in
        if (f >= 1) orb.state = 'ball';
      } else if (orb.state === 'launch') {
        spin = 80; rTarget = 0.4; ta = 4; tb = 16; keep = 0.5;   // implode before the blast
      } else {
        spin = 60; rTarget = 1 + 0.04 * Math.sin(orb.t * 1.8); ta = 2.3; tb = 9.5; keep = 1.1;
      }
      orb.r += (rTarget - orb.r) * (1 - Math.exp(-dt * (orb.state === 'launch' ? 9 : 5)));

      // sample the star's path finely so the loops stay smooth at high speed
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const sdt = dt / steps;
        orb.ang += spin * sdt;
        orb.pa += ta * sdt;
        orb.pb += tb * sdt;
        const a = 1.57 + 1.25 * Math.sin(orb.pa);   // tilt sweeps nearly pole to pole
        orb.trail.push({ p: orbitPoint(orb.ang, orb.r, a, orb.pb), t: orb.t - dt + sdt * (i + 1) });
      }
      while (orb.trail.length && orb.t - orb.trail[0].t > keep) orb.trail.shift();

      // the whole ball slowly rolls in 3D
      orb.ax += dt * (orb.state === 'orbit' ? 0.3 : 0.7);
      orb.ay += dt * (orb.state === 'orbit' ? 0.5 : 1.6);

      if (orb.state === 'launch' && orb.t >= orb.boomAt) explodeOrb(orb.x, orbY());
    }

    function drawOrb() {
      if (!orb) return;
      const cx = orb.x, cy = orbY();
      const tr = orb.trail;
      if (tr.length < 2) return;
      const R = ORB_R * (1 + orb.pulse * 0.15);
      const fill = orb.state === 'orbit' ? Math.min(1, orb.t / FORM_TIME) : 1;
      const P = orb.gold ? PAL.gold : PAL.pink;

      // soft inner haze so it reads as a glowing ball
      ctx.globalAlpha = (0.15 + 0.35 * fill) * (1 + orb.pulse);
      const cg = R * 3.4 * Math.max(0.5, orb.r);
      ctx.drawImage(sprite(P.haze), cx - cg / 2, cy - cg / 2, cg, cg);
      ctx.globalAlpha = 1;

      // project the trail, bucketed by age (fades out) and depth (back loops dimmer)
      const AB = 4, DB = 3;
      const paths = [];
      for (let i = 0; i < AB * DB; i++) paths.push(new Path2D());
      const first = tr[0].t, span = Math.max(0.001, orb.t - first);
      const pts = new Array(tr.length);
      for (let i = 0; i < tr.length; i++) pts[i] = proj(rot3(tr[i].p, orb.ax, orb.ay), cx, cy, R);
      orb.lastPts = pts;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const age = (tr[i].t - first) / span;                                  // 0 old -> 1 new
        const ai = Math.min(AB - 1, (age * AB) | 0);
        const z = (a[2] + b[2]) / 2 / Math.max(0.3, orb.r);                      // -1 back -> 1 front
        const di = Math.max(0, Math.min(DB - 1, ((z + 1) / 2 * DB) | 0));
        const p = paths[ai * DB + di];
        p.moveTo(a[0], a[1]);
        p.lineTo(b[0], b[1]);
      }
      for (let ai = 0; ai < AB; ai++) {
        for (let di = 0; di < DB; di++) {
          const A = (0.15 + 0.85 * (ai + 1) / AB) * (0.3 + 0.7 * (di + 1) / DB);
          const p = paths[ai * DB + di];
          ctx.strokeStyle = `rgba(${P.glow},${0.26 * A})`;
          ctx.lineWidth = 4.5;
          ctx.stroke(p);
          ctx.strokeStyle = `rgba(${P.core},${0.9 * A})`;
          ctx.lineWidth = 1.3;
          ctx.stroke(p);
        }
      }

      // the star itself, at the head of its trail
      const h = pts[pts.length - 1];
      ctx.drawImage(sprite('255,255,255'), h[0] - 11, h[1] - 11, 22, 22);
      ctx.drawImage(sprite(P.head), h[0] - 24, h[1] - 24, 48, 48);
    }

    function explodeOrb(x, y) {
      const cx = orb.x, cy = orbY();
      const pts = orb.lastPts;
      if (pts && pts.length > 8) {
        // the light threads snap into pieces and fly apart
        const step = Math.max(5, Math.floor(pts.length / 90));
        for (let i = 0; i + step < pts.length; i += step) {
          const A = pts[i], B = pts[i + step - 1];
          const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
          const d = Math.hypot(mx - cx, my - cy) || 1;
          const sp = 250 + Math.random() * 550;
          frags.push({
            x: mx, y: my, dx: (B[0] - A[0]) / 2, dy: (B[1] - A[1]) / 2,
            vx: (mx - cx) / d * sp, vy: (my - cy) / d * sp,
            rot: 0, spin: (Math.random() - 0.5) * 14, t: 0, life: 0.8 + Math.random() * 0.6, gold: orb.gold,
          });
        }
      }
      spawnSparkleBurst(cx, cy, true);
      bombs.push({ x, y, r: 0, prev: 0, t: 0, gold: orb.gold });
      closeAsk();
      orb = null;
    }

    /* ---------- ask through the orb ---------- */
    const ask = document.createElement('div');
    ask.id = 'merlot-orb-ask';
    Object.assign(ask.style, {
      position: 'fixed', zIndex: '2147483001', display: 'none', alignItems: 'center', gap: '10px',
      padding: '10px 16px', borderRadius: '999px', background: 'rgba(26,8,14,0.92)',
      border: '1px solid rgba(255,170,205,0.55)',
      boxShadow: '0 0 22px rgba(255,110,180,0.45), inset 0 0 12px rgba(255,110,180,0.15)',
      backdropFilter: 'blur(8px)', fontFamily: 'inherit',
    });
    const askIn = document.createElement('input');
    askIn.type = 'text';
    askIn.placeholder = 'Ask through the orb…';
    Object.assign(askIn.style, {
      width: '280px', background: 'transparent', border: 'none', outline: 'none',
      color: '#fff0f4', fontSize: '15px', fontFamily: 'inherit', caretColor: '#ff9ec4',
    });
    const askGo = document.createElement('span');
    askGo.textContent = '↵';
    Object.assign(askGo.style, { color: '#ff9ec4', cursor: 'pointer', fontSize: '17px', userSelect: 'none' });
    ask.append(askIn, askGo);
    const mountAsk = () => { if (!ask.isConnected) document.documentElement.appendChild(ask); };
    mountAsk();

    const askOpen = () => ask.style.display !== 'none';
    function placeAsk() {
      if (!orb) return;
      const cy = orbY();
      const left = Math.max(12, Math.min(W - 350, orb.x - 160));
      const top = cy + ORB_R + 80 > H ? cy - ORB_R - 70 : cy + ORB_R + 24;
      ask.style.left = left + 'px';
      ask.style.top = top + 'px';
    }
    function openAsk() {
      orb.state = 'ask';
      orb.pulse = 0.6;
      placeAsk();
      ask.style.display = 'flex';
      setTimeout(() => askIn.focus(), 0);
    }
    function closeAsk() {
      ask.style.display = 'none';
      askIn.value = '';
      if (orb && orb.state === 'ask') orb.state = 'ball';
    }

    function sendToChat(text) {
      const ed = findEditor();
      if (!ed) { console.warn('[Merlot Midnight] could not find the message box'); return; }
      ed.focus();
      if (ed.tagName === 'TEXTAREA') {
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ed, text);
        ed.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // replace whatever is in the box with the question
        const sel = getSelection();
        sel.selectAllChildren(ed);
        if (!document.execCommand('insertText', false, text)) {
          ed.textContent = text;
          ed.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
        }
      }
      // the send button only appears once ChatGPT notices the text, so keep looking for a moment
      let tries = 0;
      const trySend = () => {
        const btn = findSend(ed);
        if (btn && !btn.disabled) { btn.click(); return; }
        if (++tries < 20) { setTimeout(trySend, 100); return; }
        const form = ed.closest('form');
        if (form && form.requestSubmit) form.requestSubmit();
        else ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      };
      setTimeout(trySend, 120);
    }

    function submitAsk() {
      const q = askIn.value.trim();
      if (!q) return;
      sendToChat(q);
      closeAsk();
      // question sent: the orb winds up, collapses, then blows up
      if (orb) { orb.state = 'launch'; orb.pulse = 1; orb.boomAt = orb.t + 0.45; }
    }
    // keep ChatGPT from stealing the keystrokes typed into the orb box
    askIn.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); submitAsk(); }
      else if (e.key === 'Escape') closeAsk();
    });
    ['keyup', 'keypress'].forEach((t) => askIn.addEventListener(t, (e) => e.stopPropagation()));
    askGo.addEventListener('click', submitAsk);

    /* ============================ EXTRAS ============================ */
    const TAU = Math.PI * 2;
    const ourUI = [];   // our own boxes/panels: taps on them are ignored by the sky
    const isOurUI = (t) => ourUI.some((el) => el.contains(t));
    const mountUI = () => ourUI.forEach((el) => { if (!el.isConnected) document.documentElement.appendChild(el); });
    const shieldKeys = (el) => ['keydown', 'keyup', 'keypress'].forEach((t) => el.addEventListener(t, (e) => e.stopPropagation()));

    // tiny DOM builder (no innerHTML, so ChatGPT's security rules can't block it)
    function h(tag, style, props, kids) {
      const el = document.createElement(tag);
      if (style) Object.assign(el.style, style);
      if (props) for (const k in props) el[k] = props[k];
      if (kids) for (const c of [].concat(kids)) el.append(c);
      return el;
    }

    /* ---------- colours: pink (normal) vs gold (caught during a meteor shower) ---------- */
    const PAL = {
      pink: { glow: '255,100,172', core: '255,222,238', haze: '255,120,185', head: '255,90,150', flash: '255,200,225', ring: '255,90,160', ring2: '255,228,242', ring3: '255,160,205' },
      gold: { glow: '255,170,50', core: '255,240,200', haze: '255,190,90', head: '255,170,50', flash: '255,225,160', ring: '255,170,60', ring2: '255,245,215', ring3: '255,205,120' },
    };

    /* ---------- night mode: dim + slow after midnight, brighten again in the morning ---------- */
    let night = 0, motion = 1, nightT = 0, nightCache = 0, lastOpacity = -1;
    function nightTarget() {
      if (CFG.nightMode === 'off') return 0;
      if (CFG.nightMode === 'always') return 1;
      const d = new Date(), hr = d.getHours() + d.getMinutes() / 60;
      if (hr >= 23.5) return (hr - 23.5) / 0.5;   // 23:30 -> 00:00 eases in
      if (hr < 5) return 1;
      if (hr < 7) return 1 - (hr - 5) / 2;        // 05:00 -> 07:00 brightens back up
      return 0;
    }
    function updateNight(dt, now) {
      if (now - nightT > 1000) { nightT = now; nightCache = nightTarget(); }
      night += (nightCache - night) * (1 - Math.exp(-dt * 0.8));
      motion = 1 - 0.55 * night;
      const op = +(CFG.overlayOpacity * (1 - 0.42 * night)).toFixed(3);
      if (op !== lastOpacity && CFG.layer !== 'behind') { lastOpacity = op; canvas.style.opacity = String(op); }
    }

    /* ---------- crescent moon that crosses the sky over the night ---------- */
    const moonImg = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(54, 70, 6, 64, 64, 44);
      gr.addColorStop(0, '#fffafc');
      gr.addColorStop(1, '#ffcfe2');
      g.fillStyle = gr;
      g.beginPath(); g.arc(64, 64, 40, 0, TAU); g.fill();
      g.fillStyle = 'rgba(214,140,175,0.22)';
      [[44, 58, 7], [52, 86, 5], [38, 76, 4], [60, 98, 3]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = '#000';
      g.beginPath(); g.arc(78, 55, 38, 0, TAU); g.fill();
      return c;
    })();
    const moonGlow = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,190,215,0.22)');
      gr.addColorStop(0.35, 'rgba(255,170,205,0.09)');
      gr.addColorStop(1, 'rgba(255,170,205,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
      return c;
    })();
    function moonPos() {
      const d = new Date(), hr = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
      const n = hr >= 18 ? hr - 18 : hr < 6 ? hr + 6 : -1;   // hours since 6pm, across a 12h night
      if (n < 0) return { x: W - 64, y: 58, a: 0.45 };        // daytime: resting in the corner
      const p = n / 12;
      return { x: W * (0.07 + 0.86 * p), y: 56 + H * 0.2 * (1 - Math.sin(Math.PI * p)), a: 1 };
    }
    function drawMoon(now) {
      if (!CFG.moon) return;
      const m = moonPos();
      const bob = Math.sin(now / 2200) * 1.5;
      ctx.save();
      ctx.translate(m.x, m.y + bob);
      ctx.rotate(-0.35);
      ctx.globalAlpha = m.a;
      ctx.drawImage(moonGlow, -14 - 110, 6 - 110, 220, 220);   // soft halo around the lit edge only
      ctx.globalAlpha = 0.97 * m.a;
      ctx.drawImage(moonImg, -32, -32, 64, 64);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    /* ---------- aurora when ChatGPT finishes an answer ---------- */
    let aurora = null;
    function startAurora() { if (CFG.aurora && visible) aurora = { t: 0, life: 7.5 }; }
    const BANDS = [
      { base: 0.15, hh: 0.14, c1: '255,80,165', c2: '185,70,255', sp: 0.6, ph: 0 },
      { base: 0.21, hh: 0.10, c1: '255,150,205', c2: '255,95,180', sp: 0.9, ph: 2.1 },
      { base: 0.11, hh: 0.09, c1: '230,60,140', c2: '150,110,255', sp: 0.45, ph: 4.2 },
    ];
    function drawAurora(dt, now) {
      if (!aurora) return;
      aurora.t += dt;
      if (aurora.t >= aurora.life) { aurora = null; return; }
      const env = Math.min(1, aurora.t / 1.4) * Math.min(1, (aurora.life - aurora.t) / 2.2) * (1 - 0.35 * night);
      const T = now / 1000;
      const sweep = Math.min(1, aurora.t / 2.2) * (W + 400);   // ripples in from the left
      for (let bi = 0; bi < BANDS.length; bi++) {
        const b = BANDS[bi];
        const baseY = H * b.base;
        const bot = (x) => baseY + 16 * Math.sin(x * 0.006 + T * b.sp * 1.6 + b.ph) + 8 * Math.sin(x * 0.017 - T * b.sp * 2.3);
        const top = (x) => baseY - H * b.hh * (0.55 + 0.45 * Math.sin(x * 0.004 + T * b.sp + b.ph));
        const xEnd = Math.min(W, sweep);
        if (xEnd <= 0) continue;
        const path = new Path2D();
        path.moveTo(0, bot(0));
        for (let x = 24; x <= xEnd + 24; x += 24) path.lineTo(Math.min(x, xEnd), bot(Math.min(x, xEnd)));
        const ceil = baseY - H * b.hh * 1.25;
        path.lineTo(xEnd, ceil);
        path.lineTo(0, ceil);
        path.closePath();
        const g = ctx.createLinearGradient(0, ceil, 0, baseY + 26);
        g.addColorStop(0, `rgba(${b.c2},0)`);
        g.addColorStop(0.35, `rgba(${b.c2},${0.07 * env})`);
        g.addColorStop(0.7, `rgba(${b.c2},${0.2 * env})`);
        g.addColorStop(0.9, `rgba(${b.c1},${0.36 * env})`);
        g.addColorStop(1, `rgba(${b.c1},0)`);
        ctx.fillStyle = g;
        ctx.fill(path);
        // shimmering curtain rays
        if (bi < 2) {
          ctx.lineWidth = 2;
          for (let x = 4; x < xEnd; x += 9) {
            const k = 0.5 + 0.5 * Math.sin(x * 0.031 + T * 2.2 * b.sp + b.ph) * Math.sin(x * 0.012 - T * b.sp * 1.3);
            if (k < 0.62) continue;
            const yb = bot(x), yt = top(x);
            const rg = ctx.createLinearGradient(0, yt, 0, yb);
            rg.addColorStop(0, `rgba(${b.c2},0)`);
            rg.addColorStop(0.6, `rgba(${b.c2},${0.16 * env * (k - 0.6) * 2.5})`);
            rg.addColorStop(1, `rgba(${b.c1},${0.34 * env * (k - 0.6) * 2.5})`);
            ctx.strokeStyle = rg;
            ctx.beginPath(); ctx.moveTo(x, yt); ctx.lineTo(x, yb); ctx.stroke();
          }
        }
      }
    }
    // ChatGPT shows a stop button while answering; when it disappears, the answer is done
    let wasStreaming = false, streamSince = 0;
    const STOP_SEL = 'button[data-testid="stop-button"], button[aria-label="Stop streaming"], button[aria-label="Stop generating"], button[aria-label="Stop answering"], form button[aria-label^="Stop"]';
    setInterval(() => {
      const streaming = !!document.querySelector(STOP_SEL);
      if (streaming && !wasStreaming) streamSince = performance.now();
      if (!streaming && wasStreaming && performance.now() - streamSince > 600) startAurora();
      wasStreaming = streaming;
    }, 300);

    /* ---------- typing shimmer + Enter launches a shooting star ---------- */
    const ripples = [];
    const editorOf = (t) => t && t.closest && t.closest(EDITOR_SEL);
    function caretPoint(ed) {
      try {
        const sel = getSelection();
        if (sel.rangeCount) {
          const rs = sel.getRangeAt(0).getClientRects();
          const rc = rs[rs.length - 1];
          if (rc && (rc.left || rc.top)) return [rc.right, rc.top + rc.height / 2];
        }
      } catch (_) { /* ignore */ }
      const b = ed.getBoundingClientRect();
      return [b.left + Math.min(b.width, 60), b.top + b.height / 2];
    }
    let lastLaunch = 0;
    function launchFromSend() {
      const t = performance.now();
      if (t - lastLaunch < 600 || !visible || reduceMotion) return;
      lastLaunch = t;
      const btn = findSend(findEditor());
      let x = W * 0.6, y = H - 50;
      if (btn) { const b = btn.getBoundingClientRect(); if (b.width) { x = b.left + b.width / 2; y = b.top + b.height / 2; } }
      const a = (-112 + (Math.random() * 30 - 15)) * Math.PI / 180;   // up and to the left
      const sp = 1150 + Math.random() * 300;
      spawnShooter(false, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, len: 230 });
      spawnSparkleBurst(x, y, false);
    }
    document.addEventListener('keydown', (e) => {
      if (!visible || !CFG.typingShimmer || isOurUI(e.target)) return;
      const ed = editorOf(e.target);
      if (!ed) return;
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { launchFromSend(); return; }
      if (e.key.length !== 1 && e.key !== 'Backspace') return;
      requestAnimationFrame(() => {
        const [x, y] = caretPoint(ed);
        ripples.push({ x, y, r: 0, prev: 0, max: 160 });
        glints.push({ x, y, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 30, t: 0, life: 0.55, size: 4 + Math.random() * 2, rot: 0, spin: 4, tint: '255,190,220', hue: rainbow ? Math.random() * 360 : null });
      });
    }, true);
    document.addEventListener('click', (e) => {
      if (!visible || !CFG.typingShimmer) return;
      if (e.target.closest && e.target.closest(SEND_SEL)) launchFromSend();
    }, true);

    /* ---------- meteor shower (rare, or Alt + Shift + W) ---------- */
    let shower = null;
    function startShower() {
      if (reduceMotion || !visible) return;
      shower = { t: 0, n: 0, total: 26 + ((Math.random() * 6) | 0), dur: 7, banner: 0 };
    }
    function updateShower(dt) {
      if (!shower) return;
      shower.t += dt;
      const want = Math.floor(shower.total * Math.min(1, shower.t / shower.dur));
      while (shower.n < want) {
        shower.n++;
        const a = (138 + Math.random() * 14) * Math.PI / 180;    // all streaming down-left, like a real shower
        const sp = 950 + Math.random() * 450;
        spawnShooter(false, {
          x: W * (0.35 + Math.random() * 0.75), y: -30 + Math.random() * H * 0.25,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, len: 160 + Math.random() * 130, gold: true,
        });
      }
      if (shower.t > shower.dur + 3) shower = null;
    }
    function drawShowerBanner() {
      if (!shower) return;
      const a = Math.min(1, shower.t / 0.6) * Math.min(1, (shower.dur + 1 - shower.t) / 1.2);
      if (a <= 0) return;
      ctx.save();
      ctx.font = '600 14px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,220,150,${0.9 * a})`;
      ctx.shadowColor = `rgba(255,170,60,${a})`;
      ctx.shadowBlur = 14;
      ctx.fillText('✦  meteor shower — catch a gold one  ✦', W / 2, 34);
      ctx.restore();
    }
    // about once an hour, at random
    setInterval(() => {
      if (CFG.showers && visible && !document.hidden && !shower && Math.random() < 1 / 60) startShower();
    }, 60000);

    /* ---------- constellation drawing (hold Shift + drag) ---------- */
    const constellations = [];
    let drawing = null;
    function nearestStar(x, y, maxD) {
      let best = null, bd = maxD * maxD;
      for (const s of stars) {
        const dx = s.hx + s.ox - x, dy = s.hy + s.oy - y, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = s; }
      }
      return best;
    }
    function addToConstellation(x, y) {
      const s = nearestStar(x, y, 36);
      if (!s) return;
      const arr = drawing.stars;
      if (arr[arr.length - 1] === s) return;
      if (arr.includes(s) && !(arr[0] === s && arr.length > 2)) return;   // returning to the first star closes the shape
      arr.push(s);
      s.flash = 1;
      glints.push({ x: s.hx + s.ox, y: s.hy + s.oy, vx: 0, vy: 0, t: 0, life: 0.5, size: 9, rot: Math.random(), spin: 2, tint: '255,235,245', hue: rainbow ? Math.random() * 360 : null });
    }
    function startConstellation(x, y) {
      drawing = { stars: [], t: 0, life: 40, name: '', done: false };
      constellations.push(drawing);
      if (constellations.length > 6) constellations.shift();
      document.documentElement.style.userSelect = 'none';
      addToConstellation(x, y);
    }
    function finishConstellation() {
      if (!drawing) return;
      const c = drawing;
      drawing = null;
      document.documentElement.style.userSelect = '';
      c.done = true;
      if (c.stars.length < 2) { constellations.splice(constellations.indexOf(c), 1); return; }
      if (c.stars.length >= 3) openNameBox(c);
    }
    addEventListener('pointermove', (e) => { if (drawing) addToConstellation(e.clientX, e.clientY); }, { passive: true });
    addEventListener('pointerup', finishConstellation, true);
    addEventListener('blur', finishConstellation);

    const nameIn = h('input', {
      width: '220px', background: 'transparent', border: 'none', outline: 'none', color: '#fff0f4',
      fontSize: '14px', fontFamily: 'inherit', caretColor: '#ff9ec4',
    }, { type: 'text', placeholder: 'Name your constellation…', maxLength: 32 });
    const nameBox = h('div', {
      position: 'fixed', zIndex: '2147483001', display: 'none', padding: '8px 14px', borderRadius: '999px',
      background: 'rgba(26,8,14,0.92)', border: '1px solid rgba(255,170,205,0.55)',
      boxShadow: '0 0 18px rgba(255,110,180,0.4)', backdropFilter: 'blur(8px)',
    }, null, nameIn);
    ourUI.push(nameBox);
    shieldKeys(nameIn);
    let naming = null;
    function constellationBox(c) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const s of c.stars) {
        const x = s.hx + s.ox, y = s.hy + s.oy;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      return { cx: (x0 + x1) / 2, bottom: y1, top: y0 };
    }
    function openNameBox(c) {
      naming = c;
      const b = constellationBox(c);
      nameBox.style.left = Math.max(12, Math.min(W - 270, b.cx - 125)) + 'px';
      nameBox.style.top = Math.min(H - 60, b.bottom + 22) + 'px';
      nameBox.style.display = 'block';
      nameIn.value = '';
      setTimeout(() => nameIn.focus(), 0);
    }
    function closeNameBox(save) {
      if (naming && save) naming.name = nameIn.value.trim();
      naming = null;
      nameBox.style.display = 'none';
    }
    nameIn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); closeNameBox(true); }
      else if (e.key === 'Escape') closeNameBox(false);
    });
    nameIn.addEventListener('blur', () => closeNameBox(true));

    function drawConstellations(dt, now) {
      for (let i = constellations.length - 1; i >= 0; i--) {
        const c = constellations[i];
        if (c.done && c !== naming) c.t += dt;
        if (c.t >= c.life) { constellations.splice(i, 1); continue; }
        const a = Math.min(1, (c.life - c.t) / 6);
        const pts = c.stars.map((s) => [s.hx + s.ox, s.hy + s.oy]);
        if (!c.done && mouse.inside) pts.push([mouse.sx, mouse.sy]);
        if (pts.length < 2) continue;
        for (let j = 1; j < pts.length; j++) {
          const live = !c.done && j === pts.length - 1;
          const hue = (now * 0.08 + j * 40) % 360;
          ctx.setLineDash(live ? [4, 6] : []);
          ctx.strokeStyle = rainbow ? `hsla(${hue},100%,65%,${0.3 * a})` : `rgba(255,110,180,${0.28 * a})`;
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(pts[j - 1][0], pts[j - 1][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke();
          ctx.strokeStyle = rainbow ? `hsla(${hue},100%,82%,${0.85 * a})` : `rgba(255,228,242,${0.85 * a})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.setLineDash([]);
        for (const s of c.stars) {
          const x = s.hx + s.ox, y = s.hy + s.oy;
          ctx.globalAlpha = 0.8 * a;
          ctx.drawImage(sprite('255,200,225'), x - 10, y - 10, 20, 20);
          ctx.globalAlpha = 1;
        }
        if (c.name) {
          const b = constellationBox(c);
          ctx.save();
          ctx.font = 'italic 600 13px ui-serif, Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(255,214,232,${0.9 * a})`;
          ctx.shadowColor = `rgba(255,110,180,${a})`;
          ctx.shadowBlur = 10;
          ctx.fillText(c.name, b.cx, b.bottom + 24);
          ctx.restore();
        }
      }
    }

    /* ---------- settings panel (Alt + Shift + M) ---------- */
    const panel = h('div', {
      position: 'fixed', top: '64px', right: '20px', width: '300px', maxHeight: 'calc(100vh - 90px)', overflowY: 'auto',
      zIndex: '2147483002', display: 'none', padding: '14px 18px 16px', borderRadius: '16px',
      background: 'rgba(26,8,14,0.95)', border: '1px solid rgba(255,170,205,0.4)',
      boxShadow: '0 0 28px rgba(255,110,180,0.3), inset 0 0 16px rgba(135,61,89,0.25)',
      backdropFilter: 'blur(10px)', color: '#fff0f4', fontSize: '13px',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif', lineHeight: '1.3',
    });
    ourUI.push(panel);
    shieldKeys(panel);
    const panelSync = [];   // functions that refresh each control from CFG

    function heading(text) {
      return h('div', { margin: '14px 0 6px', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ff9ec4', opacity: '0.85' }, { textContent: text });
    }
    function slider(label, key, min, max, step, fmt, onChange) {
      const val = h('span', { color: '#ffc2da', fontVariantNumeric: 'tabular-nums' });
      const inp = h('input', { width: '100%', accentColor: '#ff9ec4', margin: '4px 0 0' }, { type: 'range', min, max, step });
      const sync = () => { inp.value = CFG[key]; val.textContent = fmt(+CFG[key]); };
      inp.addEventListener('input', () => { CFG[key] = +inp.value; val.textContent = fmt(+inp.value); if (onChange) onChange(false); });
      inp.addEventListener('change', () => { if (onChange) onChange(true); saveSettings(); });
      panelSync.push(sync);
      return h('label', { display: 'block', margin: '8px 0' }, null, [
        h('div', { display: 'flex', justifyContent: 'space-between' }, null, [h('span', null, { textContent: label }), val]), inp,
      ]);
    }
    function toggle(label, key, onChange) {
      const inp = h('input', { accentColor: '#ff9ec4', width: '15px', height: '15px', margin: '0' }, { type: 'checkbox' });
      panelSync.push(() => { inp.checked = !!CFG[key]; });
      inp.addEventListener('change', () => { CFG[key] = inp.checked; if (onChange) onChange(); saveSettings(); });
      return h('label', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '7px 0', cursor: 'pointer' }, null, [h('span', null, { textContent: label }), inp]);
    }
    function button(label, fn) {
      const b = h('button', {
        flex: '1', padding: '7px 8px', borderRadius: '10px', border: '1px solid rgba(255,170,205,0.45)',
        background: '#3d1624', color: '#fff0f4', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
      }, { type: 'button', textContent: label });
      b.addEventListener('click', fn);
      return b;
    }

    const nightSel = h('select', {
      background: '#3d1624', color: '#fff0f4', border: '1px solid #5e2a3d', borderRadius: '8px', padding: '3px 6px', fontFamily: 'inherit', fontSize: '12px',
    });
    [['auto', 'After midnight'], ['always', 'Always on'], ['off', 'Off']].forEach(([v, t]) => nightSel.append(h('option', null, { value: v, textContent: t })));
    nightSel.addEventListener('change', () => { CFG.nightMode = nightSel.value; nightT = 0; saveSettings(); });
    panelSync.push(() => { nightSel.value = CFG.nightMode; });

    const closeBtn = h('button', { background: 'none', border: 'none', color: '#ff9ec4', fontSize: '18px', cursor: 'pointer', padding: '0 2px', lineHeight: '1' }, { type: 'button', textContent: '×', title: 'Close (Esc)' });
    closeBtn.addEventListener('click', () => togglePanel(false));

    panel.append(
      h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, null, [
        h('div', { fontSize: '15px', fontWeight: '600', letterSpacing: '0.02em' }, { textContent: '✦ Merlot Midnight' }), closeBtn,
      ]),
      heading('Sky'),
      slider('Star amount', 'starAmount', 0.3, 2.5, 0.1, (v) => v.toFixed(1) + '×', (done) => { if (done) build(); }),
      slider('Brightness', 'overlayOpacity', 0.3, 1, 0.05, (v) => Math.round(v * 100) + '%', () => { lastOpacity = -1; }),
      slider('Shooting stars', 'shootingFreq', 0.25, 4, 0.25, (v) => v + '×'),
      toggle('Long-exposure trails', 'streaks', () => build()),
      toggle('Random meteor showers', 'showers'),
      heading('Cursor'),
      slider('Magnet strength', 'mouseStrength', 0, 2.5, 0.1, (v) => v.toFixed(1)),
      slider('Magnet reach', 'mouseRadius', 80, 320, 10, (v) => v + 'px'),
      slider('Orbit speed', 'swirl', 0, 3, 0.1, (v) => v.toFixed(1)),
      toggle('Magnet lines', 'magnetLines'),
      toggle('Rainbow magnet', 'rainbowMagnet', () => { rainbow = CFG.rainbowMagnet; }),
      toggle('Tap sparkles', 'clickBurst'),
      heading('Effects'),
      toggle('Typing shimmer + launch on send', 'typingShimmer'),
      toggle('Aurora when an answer finishes', 'aurora'),
      toggle('Crescent moon', 'moon'),
      h('label', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }, null, [h('span', null, { textContent: 'Night mode' }), nightSel]),
      h('div', { display: 'flex', gap: '8px', marginTop: '12px' }, null, [
        button('☄ Meteor shower', () => startShower()), button('✧ Aurora', () => { aurora = { t: 0, life: 7.5 }; }),
      ]),
      h('div', { display: 'flex', gap: '8px', marginTop: '8px' }, null, [
        button('Reset to defaults', () => { Object.assign(CFG, DEFAULTS); rainbow = CFG.rainbowMagnet; saveSettings(); build(); lastOpacity = -1; nightT = 0; panelSync.forEach((f) => f()); }),
      ]),
      h('div', { marginTop: '14px', fontSize: '11px', color: '#d9a3b8', lineHeight: '1.6' }, null, [
        h('div', null, { textContent: 'Shift + drag: draw a constellation' }),
        h('div', null, { textContent: 'Triple tap: rainbow magnet' }),
        h('div', null, { textContent: 'Click a shooting star: catch it' }),
        h('div', null, { textContent: 'Alt + Shift + W: meteor shower' }),
        h('div', null, { textContent: 'Alt + Shift + S: sky on / off' }),
      ]),
    );
    function togglePanel(force) {
      const open = force != null ? force : panel.style.display === 'none';
      if (open) panelSync.forEach((f) => f());
      panel.style.display = open ? 'block' : 'none';
    }
    panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') togglePanel(false); });

    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.style.display !== 'none') { togglePanel(false); return; }
      if (!(e.altKey && e.shiftKey)) return;
      if (e.code === 'KeyM') { e.preventDefault(); togglePanel(); }
      else if (e.code === 'KeyW') { e.preventDefault(); startShower(); }
    }, true);

    mountUI();

    /* ---------- main loop ---------- */
    let visible = true;
    let last = performance.now();

    function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || dt <= 0) return;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      updateNight(dt, now);
      drawAurora(dt, now);
      drawMoon(now);
      updateShower(dt);

      // smoothed cursor + its velocity
      const k = 1 - Math.exp(-dt * 16);
      const px = mouse.sx, py = mouse.sy;
      mouse.sx += (mouse.x - mouse.sx) * k;
      mouse.sy += (mouse.y - mouse.sy) * k;
      const clamp = (v) => Math.max(-2500, Math.min(2500, v));
      mouse.vx = clamp((mouse.sx - px) / dt);
      mouse.vy = clamp((mouse.sy - py) / dt);
      mouse.on += ((mouse.inside ? 1 : 0) - mouse.on) * (1 - Math.exp(-dt * 6));

      const R = CFG.mouseRadius, R2 = R * R;
      const magnet = CFG.mouseMode !== 'repel';
      const S = (drawing ? 0 : CFG.mouseStrength) * mouse.on;   // magnet pauses while drawing a constellation
      const burst = bursts.length ? bursts.splice(0) : null;
      const near = [];

      // blast shockwaves expand across the screen
      const maxR = Math.hypot(W, H) + 60;
      for (let i = bombs.length - 1; i >= 0; i--) {
        const b = bombs[i];
        b.t += dt;
        b.prev = b.r;
        b.r += 1500 * dt;
        if (b.prev > maxR) bombs.splice(i, 1);
      }
      // small typing shimmers
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.prev = r.r;
        r.r += 480 * dt;
        if (r.prev > r.max) ripples.splice(i, 1);
      }
      const hueBase = now * 0.12;   // rainbow keeps cycling
      const rhue = (s) => ((hueBase + s.ang * 57.2958) % 360 + 360) % 360;

      for (const s of stars) {
        if (!reduceMotion) {
          s.hx += CFG.drift.x * s.depth * dt * motion;
          s.hy += CFG.drift.y * s.depth * dt * motion;
          if (s.hx < -10) s.hx = W + 10; else if (s.hx > W + 10) s.hx = -10;
          if (s.hy < -10) s.hy = H + 10; else if (s.hy > H + 10) s.hy = -10;
        }

        let x = s.hx + s.ox, y = s.hy + s.oy;
        let e = 0;

        if (S > 0.01) {
          const dx = mouse.sx - x, dy = mouse.sy - y, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            const d = Math.sqrt(d2), t = 1 - d / R;
            e = t * t * (3 - 2 * t) * S;               // smooth falloff
            const nx = dx / d, ny = dy / d;
            s.ang = Math.atan2(dy, dx);
            if (magnet) {
              const ring = CFG.ringRadius * (0.6 + s.depth * 0.8);
              const pull = (d - ring) * 16 * e;          // pulled onto a ring around the cursor
              const sw = 260 * CFG.swirl * e * s.depth;  // and gently orbit it
              s.vx += (nx * pull - ny * sw) * dt;
              s.vy += (ny * pull + nx * sw) * dt;
              s.vx += (mouse.vx - s.vx) * 2.5 * e * dt;  // dragged along when you move
              s.vy += (mouse.vy - s.vy) * 2.5 * e * dt;
            } else {
              const f = 3400 * e * s.depth;
              s.vx -= nx * f * dt;
              s.vy -= ny * f * dt;
            }
          }
        }
        s.e = e;
        if (CFG.magnetLines && magnet && e > 0.15) near.push(s);

        if (burst) {
          for (const b of burst) {
            const bx = x - b.x, by = y - b.y, bd = Math.hypot(bx, by);
            if (bd < 280 && bd > 0.5) {
              const f = (1 - bd / 280) * 900 * s.depth;
              s.vx += (bx / bd) * f;
              s.vy += (by / bd) * f;
              s.flash = 1;
            }
          }
        }

        // the wave front hits each star as it passes, flinging it away from the blast point
        for (const b of bombs) {
          const bx = x - b.x, by = y - b.y, bd = Math.hypot(bx, by) || 1;
          if (bd >= b.prev && bd < b.r) {
            const f = 2400 / (1 + bd / 260) * (0.5 + s.depth * 0.7);
            s.vx += (bx / bd) * f;
            s.vy += (by / bd) * f;
            s.flash = 1;
          }
        }

        for (const r of ripples) {
          const rx = x - r.x, ry = y - r.y, rd = Math.hypot(rx, ry) || 1;
          if (rd >= r.prev && rd < r.r) {
            const f = 170 * (1 - r.r / r.max) * (0.5 + s.depth);
            s.vx += (rx / rd) * f;
            s.vy += (ry / rd) * f;
            s.flash = Math.max(s.flash, 0.7);
          }
        }

        // elastic return home (weaker while magnetised so the magnet wins)
        const spring = 10 * (1 - e * 0.9);
        s.vx += -s.ox * spring * dt;
        s.vy += -s.oy * spring * dt;
        const damp = Math.exp(-(4 + e * 2) * dt);
        s.vx *= damp; s.vy *= damp;
        s.ox += s.vx * dt; s.oy += s.vy * dt;
        x = s.hx + s.ox; y = s.hy + s.oy;

        // draw
        s.tw += s.twSpeed * dt * motion;
        if (s.flash) s.flash = Math.max(0, s.flash - dt * 1.5);
        const a = Math.min(1, s.base * (0.72 + 0.28 * Math.sin(s.tw)) + e * 0.55 + s.flash * 0.5);
        const sc = 1 + e * 0.7;

        if (s.glow || e > 0.3) {
          const gs = s.size * (s.hero ? 16 : 11) * sc;
          ctx.globalAlpha = Math.min(1, a * (s.glow + e * 0.5));
          ctx.drawImage(sprite(s.tint), x - gs / 2, y - gs / 2, gs, gs);
          ctx.globalAlpha = 1;
        }
        const hl = s.len * 0.5 * (1 - e * 0.6); // trails tighten into dots when magnetised
        const rb = rainbow && e > 0.15;
        if (rb) {
          const gs = s.size * 12 * sc;
          ctx.fillStyle = `hsla(${rhue(s)},100%,60%,${0.35 * e})`;
          ctx.beginPath(); ctx.arc(x, y, gs * 0.35, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = rb ? `hsla(${rhue(s)},100%,75%,${a})` : `rgba(${s.tint},${a})`;
        ctx.lineWidth = s.size * sc;
        ctx.beginPath();
        ctx.moveTo(x - SX * hl, y - SY * hl);
        ctx.lineTo(x + SX * hl + 0.01, y + SY * hl);
        ctx.stroke();
      }

      // constellation lines around the cursor
      if (near.length) {
        near.sort((p, q) => q.e - p.e);
        const pts = near.slice(0, 16);
        ctx.lineWidth = rainbow ? 1.2 : 0.6;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i], pxx = p.hx + p.ox, pyy = p.hy + p.oy;
          if (rainbow) {
            // gradient from the cursor out to each star, colours spinning around the ring
            const h = rhue(p);
            const g = ctx.createLinearGradient(mouse.sx, mouse.sy, pxx, pyy);
            g.addColorStop(0, `hsla(${(h + 180) % 360},100%,70%,${0.15 * p.e})`);
            g.addColorStop(1, `hsla(${h},100%,65%,${0.7 * p.e})`);
            ctx.strokeStyle = g;
          } else {
            ctx.strokeStyle = `rgba(255,190,215,${0.22 * p.e})`;
          }
          ctx.beginPath(); ctx.moveTo(mouse.sx, mouse.sy); ctx.lineTo(pxx, pyy); ctx.stroke();
          for (let j = i + 1; j < pts.length; j++) {
            const q = pts[j], qx = q.hx + q.ox, qy = q.hy + q.oy;
            const dd = Math.hypot(pxx - qx, pyy - qy);
            if (dd < 70) {
              const k2 = Math.min(p.e, q.e) * (1 - dd / 70);
              ctx.strokeStyle = rainbow
                ? `hsla(${(rhue(p) + rhue(q)) / 2},100%,70%,${0.5 * k2})`
                : `rgba(255,220,235,${0.18 * k2})`;
              ctx.beginPath(); ctx.moveTo(pxx, pyy); ctx.lineTo(qx, qy); ctx.stroke();
            }
          }
        }
      }

      drawConstellations(dt, now);

      // tap sparkle bursts (central star flare + glitter flying out)
      for (let i = glints.length - 1; i >= 0; i--) {
        const g = glints[i];
        g.t += dt;
        const p = g.t / g.life;
        if (p >= 1) { glints.splice(i, 1); continue; }
        const drag = Math.exp(-3.2 * dt);
        g.vx *= drag; g.vy *= drag;
        g.x += g.vx * dt; g.y += g.vy * dt;
        g.rot += g.spin * dt;
        const alpha = 1 - p * p;
        if (g.flare) {
          const r = g.size * (0.35 + 0.65 * Math.sin(Math.min(1, p * 2) * Math.PI / 2)) * (1 - p * 0.4);
          ctx.globalAlpha = alpha * 0.8;
          ctx.drawImage(sprite('255,140,190'), g.x - r * 1.4, g.y - r * 1.4, r * 2.8, r * 2.8);
          ctx.globalAlpha = 1;
          drawGlint(g.x, g.y, r, g.rot, g.hue != null ? `hsla(${(g.hue + now * 0.3) % 360},100%,80%,${alpha})` : `rgba(255,235,245,${alpha})`);
          drawGlint(g.x, g.y, r * 0.55, g.rot + Math.PI / 4, `rgba(255,255,255,${alpha * 0.8})`);
        } else {
          const tw = 0.6 + 0.4 * Math.sin(g.t * 30 + i);   // glitter flicker
          const col = g.hue != null ? `hsla(${(g.hue + now * 0.3) % 360},100%,72%,${alpha * tw})` : `rgba(${g.tint},${alpha * tw})`;
          drawGlint(g.x, g.y, g.size * (1 - p * 0.5), g.rot, col);
        }
      }

      // shooting stars + the sparkles they shed
      for (let i = shooters.length - 1; i >= 0; i--) {
        const s = shooters[i];
        // bullet-time: shooting stars slow down near your cursor so you can catch them
        const hd = Math.hypot(s.x - mouse.sx, s.y - mouse.sy);
        const slow = !orb && mouse.inside && hd < 170 ? 0.3 + 0.7 * (hd / 170) : 1;
        s.x += s.vx * dt * slow; s.y += s.vy * dt * slow; s.age += dt;
        if (Math.random() < dt * 45) {
          sparks.push({
            x: s.x, y: s.y,
            vx: (Math.random() - 0.5) * 60 + s.vx * 0.05,
            vy: (Math.random() - 0.5) * 60 + s.vy * 0.05,
            life: 1,
            tint: s.rainbow ? `${150 + Math.random() * 105 | 0},${150 + Math.random() * 105 | 0},255` : s.gold ? '255,210,130' : '255,170,205',
          });
        }
        drawShooter(s);
        if (s.x < -s.len * 1.5 || s.x > W + s.len * 1.5 || s.y > H + s.len * 1.5 || s.y < -s.len * 1.5) shooters.splice(i, 1);
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life -= dt * 1.6;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.fillStyle = `rgba(${p.tint},${p.life})`;
        ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);
      }

      // the orb
      updateOrb(dt);
      drawOrb();
      if (orb && askOpen()) placeAsk();

      // shattered orb struts flying apart
      for (let i = frags.length - 1; i >= 0; i--) {
        const f = frags[i];
        f.t += dt;
        const p = f.t / f.life;
        if (p >= 1) { frags.splice(i, 1); continue; }
        const drag = Math.exp(-2 * dt);
        f.vx *= drag; f.vy *= drag;
        f.x += f.vx * dt; f.y += f.vy * dt;
        f.rot += f.spin * dt;
        const c = Math.cos(f.rot), s = Math.sin(f.rot);
        const dx = f.dx * c - f.dy * s, dy = f.dx * s + f.dy * c;
        const a = 1 - p;
        const FP = f.gold ? PAL.gold : PAL.pink;
        ctx.strokeStyle = `rgba(${FP.glow},${0.35 * a})`;
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(f.x - dx, f.y - dy); ctx.lineTo(f.x + dx, f.y + dy); ctx.stroke();
        ctx.strokeStyle = `rgba(${FP.core},${0.95 * a})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(f.x - dx, f.y - dy); ctx.lineTo(f.x + dx, f.y + dy); ctx.stroke();
      }

      // blast flash + shockwave
      for (const b of bombs) {
        const BP = b.gold ? PAL.gold : PAL.pink;
        if (b.t < 0.45) {
          const fa = 1 - b.t / 0.45, fs = 140 + b.t * 700;
          ctx.globalAlpha = fa;
          ctx.drawImage(sprite(BP.flash), b.x - fs / 2, b.y - fs / 2, fs, fs);
          ctx.globalAlpha = 1;
        }
        const a = Math.max(0, 1 - b.r / maxR);
        ctx.strokeStyle = `rgba(${BP.ring},${0.2 * a})`;
        ctx.lineWidth = 16 * a + 3;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(${BP.ring2},${0.75 * a})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
        if (b.r > 140) {
          ctx.strokeStyle = `rgba(${BP.ring3},${0.3 * a})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.72, 0, Math.PI * 2); ctx.stroke();
        }
      }

      drawShowerBanner();
      ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------- show only in dark mode ---------- */
    let forced = false;
    function syncTheme() {
      visible = forced || !CFG.onlyInDark || isDark();
      canvas.style.display = visible ? 'block' : 'none';
    }
    new MutationObserver(syncTheme).observe(document.documentElement, {
      attributes: true, attributeFilter: ['class', 'data-theme', 'style'],
    });
    const mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', syncTheme);

    // Alt + Shift + S = force the sky on/off (handy if dark-mode detection ever misses)
    addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && e.code === 'KeyS') { forced = !forced; syncTheme(); }
    });

    addEventListener('resize', resize);

    // Repaint anything blue in YOUR sent messages (and the composer) to the theme.
    // ChatGPT uses modern colour formats (oklch etc.), so every colour is read back through a
    // tiny canvas to get plain RGB before checking if it's blue.
    const colCtx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const colCache = new Map();
    function toRGBA(c) {
      if (!c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)') return null;
      if (colCache.has(c)) return colCache.get(c);
      colCtx.clearRect(0, 0, 1, 1);
      colCtx.fillStyle = '#000';
      colCtx.fillStyle = c;
      colCtx.fillRect(0, 0, 1, 1);
      const d = colCtx.getImageData(0, 0, 1, 1).data;
      const v = [d[0], d[1], d[2], d[3] / 255];
      colCache.set(c, v);
      return v;
    }
    const blueRGBA = (v) => v && v[3] > 0.15 && v[2] > v[0] + 30 && v[2] >= v[1];
    const COLOR_RE = /(rgba?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|lch\([^)]*\)|hsla?\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8}\b)/gi;
    const hasBlueGradient = (img) => img && img !== 'none' && (img.match(COLOR_RE) || []).some((c) => blueRGBA(toRGBA(c)));

    const USER_SEL = '[data-message-author-role="user"], [data-turn="user"], .user-message-bubble-color';
    const inUser = (el) => !!el.closest(USER_SEL);

    function paint(el, cs) {
      const small = el.offsetWidth < 90 && el.offsetHeight < 60;
      if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || small || !inUser(el)) {
        // buttons, send/stop/voice circles, badges: burgundy
        el.style.setProperty('background', '#873D59', 'important');
      } else {
        // your sent message bubble: black-cherry
        el.style.setProperty('background', '#1a080e', 'important');
        el.style.setProperty('border', '1px solid #5e2a3d', 'important');
        el.style.setProperty('box-shadow', '0 0 18px rgba(135,61,89,0.28)', 'important');
      }
      el.style.setProperty('color', '#fff0f4', 'important');
      if (blueRGBA(toRGBA(cs.borderTopColor))) el.style.setProperty('border-color', '#7a3a55', 'important');
    }

    function check(el) {
      if (el.id === 'merlot-midnight-sky' || el.id === 'merlot-orb-ask') return;
      const cs = getComputedStyle(el);
      if (blueRGBA(toRGBA(cs.backgroundColor)) || hasBlueGradient(cs.backgroundImage)) paint(el, cs);
      else if (blueRGBA(toRGBA(cs.borderTopColor)) && cs.borderTopWidth !== '0px') {
        el.style.setProperty('border-color', '#7a3a55', 'important');
      }
      // blue icons (send arrow etc.)
      if (el instanceof SVGElement) {
        if (blueRGBA(toRGBA(cs.fill))) el.style.setProperty('fill', '#ff9ec4', 'important');
        if (blueRGBA(toRGBA(cs.stroke))) el.style.setProperty('stroke', '#ff9ec4', 'important');
      }
      // blue text, but leave links in ChatGPT's answers alone
      if (blueRGBA(toRGBA(cs.color)) && el.tagName !== 'A') el.style.setProperty('color', '#fff0f4', 'important');
    }

    // scan the whole page except ChatGPT's answers (keeps it fast)
    function fixBlue() {
      if (!isDark() || !document.body) return;
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (n) => n.matches('[data-message-author-role="assistant"], canvas, #merlot-orb-ask, script, style')
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      let n;
      while ((n = w.nextNode())) check(n);
    }

    // hover / press colours only exist while hovering, so check those live
    const hoverCheck = (e) => {
      let el = e.target;
      for (let i = 0; el && el.nodeType === 1 && i < 5; i++, el = el.parentElement) check(el);
    };
    ['pointerover', 'pointerdown', 'focusin'].forEach((t) =>
      document.addEventListener(t, (e) => {
        if (!isDark()) return;
        hoverCheck(e);
        setTimeout(() => hoverCheck(e), 60);
        setTimeout(() => hoverCheck(e), 260);   // after colour transitions finish
      }, true));

    // re-check right after anything changes (new message, send button appearing, etc.)
    let blueQueued = false;
    new MutationObserver(() => {
      if (blueQueued) return;
      blueQueued = true;
      setTimeout(() => { blueQueued = false; fixBlue(); }, 50);
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled', 'data-state'] });

    // watchdog: put the sky + theme back if the page ever removes them, and keep everything on-theme
    setInterval(() => { mount(); mountAsk(); mountUI(); addTheme(); fixBlue(); }, 1500);

    syncTheme();
    resize();
    requestAnimationFrame(frame);
    if (!reduceMotion) {
      setTimeout(() => spawnShooter(false), 1500); // one right away so you can see it works
      scheduleShooter();
      setInterval(() => { if (!document.hidden && visible) spawnShooter(true); }, CFG.rainbowEveryMs);
    }

    // Console helpers (F12): merlotRainbow()  merlotShoot()
    PAGE.merlotRainbow = () => spawnShooter(true);
    PAGE.merlotShoot = () => spawnShooter(false);
    // Console helpers: merlot.shower()  merlot.aurora()  merlot.settings()
    PAGE.merlot = {
      shower: startShower,
      aurora: () => { aurora = { t: 0, life: 7.5 }; },
      settings: () => togglePanel(true),
      shoot: () => spawnShooter(false),
      rainbow: () => spawnShooter(true),
    };
    console.log('%c✦ Merlot Midnight running — Alt + Shift + M for settings', 'color:#ff9ec4');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
