/* ============================================================
   提瓦特 · 小小枪战 2D — main game
   ============================================================ */
(function () {
  'use strict';

  const W = 1280, H = 720;
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const roster = window.TEYVAT_ROSTER;
  const EL = window.ELEMENTS;
  const S = window.Sprites;
  const A = window.audioEngine;

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;

  const ARENA = { x: 42, y: 42, w: W - 84, h: H - 84 };
  const OBSTACLES = [
    { x: 190, y: 218, w: 158, h: 66 },
    { x: 912, y: 168, w: 82, h: 154 },
    { x: 238, y: 492, w: 164, h: 60 },
    { x: 892, y: 500, w: 148, h: 58 }
  ];
  const SPAWNS = [
    { x: 105, y: 104 }, { x: 640, y: 92 }, { x: 1168, y: 104 },
    { x: 112, y: 620 }, { x: 638, y: 626 }, { x: 1160, y: 620 },
    { x: 90, y: 360 }, { x: 1188, y: 360 }
  ];
  const WAYPOINT = { x: 640, y: 356 };

  const EL_STATS = {
    pyro:    { cooldown: .275, damage: 24, speed: 620, count: 1, spread: 0,    radius: 4.5, pierce: 0, explode: 10 },
    hydro:   { cooldown: .185, damage: 13, speed: 660, count: 2, spread: .052, radius: 3.7, pierce: 0, heal: 1.2 },
    cryo:    { cooldown: .305, damage: 27, speed: 690, count: 1, spread: 0,    radius: 4.2, pierce: 0, slow: true },
    electro: { cooldown: .245, damage: 20, speed: 710, count: 1, spread: 0,    radius: 4.0, pierce: 0, chain: 8 },
    anemo:   { cooldown: .22,  damage: 18, speed: 770, count: 1, spread: 0,    radius: 4.0, pierce: 1, knock: 150 },
    geo:     { cooldown: .39,  damage: 37, speed: 560, count: 1, spread: 0,    radius: 6.5, pierce: 0, heavy: true },
    dendro:  { cooldown: .265, damage: 17, speed: 650, count: 1, spread: 0,    radius: 4.0, pierce: 0, poison: true }
  };
  const WEAPON_TEXT = {
    pyro: '爆裂弹 · 小范围爆炸',
    hydro: '双生水弹 · 命中回复',
    cryo: '寒霜狙击 · 减速附着',
    electro: '紫电连射 · 感电连锁',
    anemo: '风息穿透弹 · 击退',
    geo: '岩晶重炮 · 高伤慢速',
    dendro: '草种弹 · 持续侵蚀'
  };
  const PASSIVE_TEXT = {
    pyro: '火元素会与冰、水元素产生融化或蒸发，提高本次伤害。',
    hydro: '水元素会与火、雷元素产生蒸发或感电，并强化续航能力。',
    cryo: '冰元素会与火、雷元素产生融化或超导，并减缓敌人移动。',
    electro: '雷元素会与水、冰、草元素产生感电、超导或激化。',
    anemo: '风元素命中会扩散敌人已有附着，并对周围敌人造成连锁伤害。',
    geo: '岩元素命中会结晶出护盾碎片，提高玩家的生存能力。',
    dendro: '草元素会与水、火、雷元素产生绽放、燃烧或激化反应。'
  };
  const REACTION_LABEL = {
    vaporize: ['蒸发', 'VAPORIZE'], melt: ['融化', 'MELT'],
    electrocharged: ['感电', 'ELECTRO-CHARGED'], superconduct: ['超导', 'SUPERCONDUCT'],
    swirl: ['扩散', 'SWIRL'], crystallize: ['结晶', 'CRYSTALLIZE'],
    bloom: ['绽放', 'BLOOM'], burning: ['燃烧', 'BURNING'], quicken: ['激化', 'QUICKEN']
  };

  const UPGRADE_POOL = [
    { id:'damage', icon:'✹', name:'高压弹匣', color:'#ff9b6d', max:6, desc:'所有造成的伤害提高 20%。' },
    { id:'fireRate', icon:'⌁', name:'超频扳机', color:'#f2d18b', max:6, desc:'攻击速度提高 15%。' },
    { id:'speed', icon:'»', name:'疾风步', color:'#67e3c1', max:5, desc:'移动速度提高 12%。' },
    { id:'maxHp', icon:'✚', name:'生命回路', color:'#7be6a7', max:5, desc:'最大生命提高 20，并立刻回复 20 点生命。' },
    { id:'reaction', icon:'✧', name:'元素共振', color:'#cd9bff', max:5, desc:'元素反应造成的伤害和效果提高 25%。' },
    { id:'dash', icon:'↠', name:'冲刺核心', color:'#8de7ff', max:4, desc:'冲刺冷却减少 20%。' },
    { id:'crit', icon:'◎', name:'鹰眼瞄具', color:'#ffd36e', max:5, desc:'暴击率提高 10%，暴击伤害为 2 倍。' },
    { id:'shield', icon:'◇', name:'护盾发生器', color:'#f1c266', max:4, desc:'每波开始时获得 18 点护盾。' },
    { id:'magnet', icon:'∿', name:'拾取磁铁', color:'#b9e87a', max:3, desc:'拾取范围提高 60%，能量掉落概率提高。' }
  ];

  let selectedIndex = 0;
  let currentFilter = 'all';
  let searchQuery = '';
  let G = null;
  let lastTime = performance.now();
  let rafId = 0;
  let detailAnimTime = 0;
  let titleAnimTime = 0;
  let isMobile = matchMedia('(pointer: coarse)').matches || window.innerWidth < 700;
  let controls = { up:false, down:false, left:false, right:false };
  let touchMove = { active:false, id:null, x:0, y:0 };
  let touchAim = { active:false, id:null, sx:0, sy:0, x:0, y:0 };
  let mouse = { x: W * .7, y: H * .45, down:false, inside:false };
  let lastReactionBanner = 0;
  let toastTimer = 0;

  const bg = S.createArenaBackground(W, H);
  const el = {
    title: $('title-screen'), select: $('select-screen'), hud: $('hud'),
    upgrade: $('upgrade-screen'), pause: $('pause-screen'), result: $('result-screen'),
    how: $('how-screen'), canvas, mobile: $('mobile-controls')
  };

  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function elementStats(char) {
    return EL_STATS[char.element] || EL_STATS.anemo;
  }

  function elementColor(char) {
    return (EL[char.element] || EL.anemo).color;
  }

  function toast(text, ms) {
    const t = $('toast');
    t.textContent = text;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), ms || 1600);
  }

  function showError(msg) {
    const b = $('error-box');
    b.textContent = '运行错误：' + msg;
    b.classList.remove('hidden');
  }
  window.addEventListener('error', (e) => showError(e.message || '未知错误'));

  function drawIntoCanvas(cv, char, t) {
    const c = cv.getContext('2d');
    S.drawPortrait(c, char, cv.width, cv.height, t);
  }

  function populateRoster() {
    const grid = $('roster-grid');
    grid.innerHTML = '';
    const q = searchQuery.trim().toLowerCase();
    const filtered = roster.filter(c => {
      const passEl = currentFilter === 'all' || c.element === currentFilter;
      const hay = (c.zh + ' ' + c.en + ' ' + c.element).toLowerCase();
      return passEl && (!q || hay.includes(q));
    });
    filtered.forEach((c) => {
      const card = document.createElement('button');
      card.className = 'char-card' + (c.id - 1 === selectedIndex ? ' selected' : '');
      card.style.setProperty('--card-color', elementColor(c));
      card.dataset.id = String(c.id - 1);
      const cv = document.createElement('canvas');
      const isShowcase = roster.length <= 2;
      cv.width = isShowcase ? 190 : 70;
      cv.height = isShowcase ? 212 : 80;
      drawIntoCanvas(cv, c, 0);
      const name = document.createElement('span');
      name.className = 'char-card-name'; name.textContent = c.zh;
      const en = document.createElement('span');
      en.className = 'char-card-en'; en.textContent = c.en;
      const dot = document.createElement('span');
      dot.className = 'char-card-dot';
      card.appendChild(cv); card.appendChild(name); card.appendChild(en); card.appendChild(dot);
      card.addEventListener('click', () => selectCharacter(c.id - 1, true));
      grid.appendChild(card);
    });
    grid.classList.toggle('two', roster.length <= 2);
    const empty = $('roster-empty');
    empty.classList.toggle('hidden', filtered.length > 0);
  }

  function selectCharacter(index, fromCard) {
    selectedIndex = clamp(index, 0, roster.length - 1);
    const c = roster[selectedIndex];
    if (fromCard) A.ui();
    document.querySelectorAll('.char-card').forEach(card => {
      card.classList.toggle('selected', Number(card.dataset.id) === selectedIndex);
    });
    const color = elementColor(c);
    const panel = document.querySelector('.detail-panel');
    panel.style.setProperty('--detail-color', color);
    const orb = $('detail-element');
    orb.style.background = color;
    orb.style.color = '#061014';
    orb.textContent = EL[c.element].name;
    $('detail-en').textContent = c.en.toUpperCase();
    $('detail-name').textContent = c.zh;
    $('detail-role').textContent = EL[c.element].role;
    $('detail-frames').textContent = '像素立绘 · 双角色';
        $('detail-desc').textContent = c.desc || PASSIVE_TEXT[c.element];
    $('detail-weapon').textContent = WEAPON_TEXT[c.element];
    $('detail-skill').textContent = EL[c.element].skill;
    $('detail-burst').textContent = EL[c.element].burst;
    $('element-passive').style.setProperty('--detail-color', color);
    document.querySelector('.passive-key').textContent = EL[c.element].name;
    document.querySelector('.element-passive p').textContent = PASSIVE_TEXT[c.element];
    $('enter-name').textContent = c.zh;
    drawIntoCanvas($('detail-avatar'), c, detailAnimTime);
    if (isMobile && fromCard) panel.classList.add('mobile-open');
  }

  function openSelect() {
    A.ensure();
    hideAllScreens();
    el.select.classList.remove('hidden');
    A.setMusicMode('menu');
    populateRoster();
    selectCharacter(selectedIndex, false);
  }

  function hideAllScreens() {
    ['title','select','hud','upgrade','pause','result','how'].forEach(k => { if (el[k]) el[k].classList.add('hidden'); });
    $('boss-wrap').classList.add('hidden');
  }

  function showTitle() {
    G = null;
    hideAllScreens();
    el.title.classList.remove('hidden');
    el.mobile.classList.add('hidden');
    A.setMusicMode('menu');
  }

  /* ---------------- collision helpers ---------------- */
  function resolveCircleRect(e, o) {
    const cx = clamp(e.x, o.x, o.x + o.w);
    const cy = clamp(e.y, o.y, o.y + o.h);
    let dx = e.x - cx, dy = e.y - cy;
    let d = Math.hypot(dx, dy);
    if (d < e.r) {
      if (d < .0001) {
        // centre is inside: push out via shortest side
        const left = e.x - o.x, right = o.x + o.w - e.x;
        const top = e.y - o.y, bottom = o.y + o.h - e.y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) e.x = o.x - e.r;
        else if (m === right) e.x = o.x + o.w + e.r;
        else if (m === top) e.y = o.y - e.r;
        else e.y = o.y + o.h + e.r;
      } else {
        const push = e.r - d;
        e.x += dx / d * push;
        e.y += dy / d * push;
      }
      return true;
    }
    return false;
  }

  function resolveObstacles(e) {
    for (const o of OBSTACLES) resolveCircleRect(e, o);
    e.x = clamp(e.x, ARENA.x + e.r, ARENA.x + ARENA.w - e.r);
    e.y = clamp(e.y, ARENA.y + e.r, ARENA.y + ARENA.h - e.r);
  }

  function moveEntity(e, dx, dy) {
    e.x += dx; resolveObstacles(e);
    e.y += dy; resolveObstacles(e);
  }

  function pointInObstacle(x, y, pad) {
    const p = pad || 0;
    for (const o of OBSTACLES) {
      if (x > o.x - p && x < o.x + o.w + p && y > o.y - p && y < o.y + o.h + p) return true;
    }
    return false;
  }

  function segRect(x1, y1, x2, y2, r) {
    const minX = Math.min(x1, x2) - r, maxX = Math.max(x1, x2) + r;
    const minY = Math.min(y1, y2) - r, maxY = Math.max(y1, y2) + r;
    for (const o of OBSTACLES) {
      if (maxX < o.x || minX > o.x + o.w || maxY < o.y || minY > o.y + o.h) continue;
      const dx = x2 - x1, dy = y2 - y1;
      let t0 = 0, t1 = 1;
      const p = [-dx, dx, -dy, dy];
      const q = [x1 - o.x, o.x + o.w - x1, y1 - o.y, o.y + o.h - y1];
      let hit = true;
      for (let i = 0; i < 4; i++) {
        if (Math.abs(p[i]) < 1e-8) { if (q[i] < 0) { hit = false; break; } }
        else {
          const t = q[i] / p[i];
          if (p[i] < 0) { if (t > t1) { hit = false; break; } if (t > t0) t0 = t; }
          else { if (t < t0) { hit = false; break; } if (t < t1) t1 = t; }
        }
      }
      if (hit) return true;
    }
    return false;
  }

  function lineBlocked(x1, y1, x2, y2) {
    return segRect(x1, y1, x2, y2, 2);
  }

  function segCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-8) return (x1 - cx) ** 2 + (y1 - cy) ** 2 <= r * r;
    let t = ((cx - x1) * dx + (cy - y1) * dy) / len2;
    t = clamp(t, 0, 1);
    const px = x1 + dx * t, py = y1 + dy * t;
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
  }

  /* ---------------- input ---------------- */
  function updateMouseWorld(ev) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = clamp((ev.clientX - rect.left) / rect.width * W, 0, W);
    mouse.y = clamp((ev.clientY - rect.top) / rect.height * H, 0, H);
  }

  window.addEventListener('keydown', (ev) => {
    const k = ev.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) ev.preventDefault();
    if (k === 'w' || k === 'arrowup') controls.up = true;
    if (k === 's' || k === 'arrowdown') controls.down = true;
    if (k === 'a' || k === 'arrowleft') controls.left = true;
    if (k === 'd' || k === 'arrowright') controls.right = true;
    if (!G) return;
    if (k === ' ' && G.state === 'playing') dash();
    if (k === 'e' && G.state === 'playing') castSkill();
    if (k === 'q' && G.state === 'playing') castBurst();
    if (k === 'p' || k === 'escape') {
      if (G.state === 'playing') pauseGame();
      else if (G.state === 'paused') resumeGame();
    }
  });
  window.addEventListener('keyup', (ev) => {
    const k = ev.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') controls.up = false;
    if (k === 's' || k === 'arrowdown') controls.down = false;
    if (k === 'a' || k === 'arrowleft') controls.left = false;
    if (k === 'd' || k === 'arrowright') controls.right = false;
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'mouse') updateMouseWorld(ev);
    if (ev.pointerType === 'touch' && touchAim.active && ev.pointerId === touchAim.id) {
      touchAim.x = ev.clientX; touchAim.y = ev.clientY;
      const dx = touchAim.x - touchAim.sx, dy = touchAim.y - touchAim.sy;
      if (Math.hypot(dx, dy) > 7 && G && G.player) G.player.aim = Math.atan2(dy, dx);
    }
  });
  canvas.addEventListener('pointerdown', (ev) => {
    A.ensure();
    if (!G || G.state !== 'playing') return;
    if (ev.pointerType === 'mouse') {
      if (ev.button !== 0) return;
      updateMouseWorld(ev);
      mouse.down = true;
      mouse.inside = true;
    } else if (ev.pointerType === 'touch' && ev.clientX > window.innerWidth * .46) {
      ev.preventDefault();
      touchAim.active = true; touchAim.id = ev.pointerId;
      touchAim.sx = ev.clientX; touchAim.sy = ev.clientY;
      touchAim.x = ev.clientX; touchAim.y = ev.clientY;
      G.player.firing = true;
    }
  });
  canvas.addEventListener('pointerup', (ev) => {
    if (ev.pointerType === 'mouse') mouse.down = false;
    if (ev.pointerType === 'touch' && touchAim.active && ev.pointerId === touchAim.id) {
      touchAim.active = false; touchAim.id = null;
      if (G && G.player) G.player.firing = false;
    }
  });
  canvas.addEventListener('pointercancel', () => { mouse.down = false; touchAim.active = false; if (G && G.player) G.player.firing = false; });
  canvas.addEventListener('pointerleave', () => { mouse.down = false; mouse.inside = false; });
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  function bindMobileJoystick() {
    const base = $('joy-base'), knob = $('joy-knob');
    let id = null;
    function setFromEvent(ev) {
      const r = base.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = ev.clientX - cx, dy = ev.clientY - cy;
      const max = r.width * .38;
      const d = Math.hypot(dx, dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      touchMove.x = dx / max; touchMove.y = dy / max;
    }
    base.addEventListener('pointerdown', ev => {
      ev.preventDefault(); A.ensure();
      id = ev.pointerId; touchMove.active = true;
      base.setPointerCapture(id); setFromEvent(ev);
    });
    base.addEventListener('pointermove', ev => {
      if (ev.pointerId !== id) return;
      ev.preventDefault(); setFromEvent(ev);
    });
    const end = ev => {
      if (ev.pointerId !== id) return;
      id = null; touchMove.active = false; touchMove.x = 0; touchMove.y = 0;
      knob.style.transform = 'translate(-50%,-50%)';
    };
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
  }

  function bindUI() {
    bindMobileJoystick();
    $('btn-start').addEventListener('click', () => { A.ensure(); A.ui(); openSelect(); });
    $('btn-how').addEventListener('click', () => { A.ensure(); A.ui(); el.how.classList.remove('hidden'); });
    $('btn-close-how').addEventListener('click', () => { A.ui(); el.how.classList.add('hidden'); });
    $('btn-how-ok').addEventListener('click', () => { A.ui(); el.how.classList.add('hidden'); });
    $('btn-back-title').addEventListener('click', () => { A.ui(); showTitle(); });
    $('btn-enter-arena').addEventListener('click', () => startGame(roster[selectedIndex]));
    $('btn-pause').addEventListener('click', pauseGame);
    $('btn-resume').addEventListener('click', resumeGame);
    $('btn-quit').addEventListener('click', () => {
      A.ui(); G = null; hideAllScreens(); el.select.classList.remove('hidden');
      el.mobile.classList.add('hidden'); A.setMusicMode('menu'); populateRoster(); selectCharacter(selectedIndex, false);
    });
    $('btn-retry').addEventListener('click', () => { if (G && G.char) startGame(G.char); });
    $('btn-result-select').addEventListener('click', () => {
      hideAllScreens(); el.select.classList.remove('hidden'); G = null;
      el.mobile.classList.add('hidden'); A.setMusicMode('menu'); populateRoster(); selectCharacter(selectedIndex, false);
    });
    $('btn-sound-title').addEventListener('click', toggleSound);
    $('btn-sound-select').addEventListener('click', toggleSound);
    $('btn-sound-game').addEventListener('click', toggleSound);
    $('mob-dash').addEventListener('pointerdown', ev => { ev.preventDefault(); if (G && G.state === 'playing') dash(); });
    $('mob-skill').addEventListener('pointerdown', ev => { ev.preventDefault(); if (G && G.state === 'playing') castSkill(); });
    $('mob-burst').addEventListener('pointerdown', ev => { ev.preventDefault(); if (G && G.state === 'playing') castBurst(); });
    $('mob-pause').addEventListener('pointerdown', ev => { ev.preventDefault(); if (G && G.state === 'playing') pauseGame(); });
    $('filter-tabs').querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        A.ui();
        currentFilter = btn.dataset.filter;
        $('filter-tabs').querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
        populateRoster();
      });
    });
    $('roster-search').addEventListener('input', ev => { searchQuery = ev.target.value; populateRoster(); });
    window.addEventListener('resize', () => {
      isMobile = matchMedia('(pointer: coarse)').matches || window.innerWidth < 700;
      updateOrientationHint();
    });
    window.addEventListener('orientationchange', () => setTimeout(updateOrientationHint, 250));
  }

  function updateOrientationHint() {
    const show = isMobile && window.innerHeight > window.innerWidth && window.innerWidth < 900;
    const hint = document.getElementById('rotate-hint');
    if (hint) hint.classList.toggle('hidden', !show);
  }

  function toggleSound() {
    A.ensure();
    const muted = A.toggleMute();
    toast(muted ? '声音已关闭' : '声音已开启', 900);
  }

  function showWaveBanner(n, sub) {
    const b = $('wave-banner');
    $('wave-banner-num').textContent = String(n).padStart(2, '0');
    $('wave-banner-sub').textContent = sub || (n === 5 ? '深渊气息逼近' : '敌潮逼近');
    b.classList.remove('hidden');
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    setTimeout(() => b.classList.add('hidden'), 2350);
    A.wave();
  }

  function showReaction(name, enName) {
    const now = performance.now();
    if (now - lastReactionBanner < 520) return;
    lastReactionBanner = now;
    const r = $('reaction-banner');
    $('reaction-name').textContent = name;
    $('reaction-sub').textContent = enName || '';
    r.classList.remove('show'); void r.offsetWidth; r.classList.add('show');
  }

  window.GameDebug = {
    get state() { return G ? G.state : null; },
    get game() { return G; },
    start: (i) => startGame(roster[i || 0]),
    spawn: (type) => { if (G) spawnEnemy(type || 'slime'); },
    win: () => { if (G) queueVictory(); }
  };



  /* ============================================================
     Game lifecycle
     ============================================================ */
  let nextEnemyId = 1;

  function makePlayer(ch) {
    return {
      char: ch, x: 640, y: 530, r: 15,
      hp: 100, maxHp: 100, speed: 238,
      aim: -Math.PI / 2, firing: false,
      fireTimer: 0, skillCd: 0, dashCd: 0,
      dashTimer: 0, dashDirX: 0, dashDirY: 0,
      energy: 0, invuln: 0, hurtFlash: 0,
      shield: 0, shieldTimer: 0,
      moving: false, moveX: 0, moveY: 0,
      walkSeed: Math.random() * 10
    };
  }

  function blankUpgrades() {
    return { damage:0, fireRate:0, speed:0, maxHp:0, reaction:0, dash:0, crit:0, shield:0, magnet:0 };
  }

  function damageMultiplier() { return 1 + G.upgrades.damage * .2; }
  function fireRateMultiplier() { return 1 + G.upgrades.fireRate * .15; }
  function critChance() { return .05 + G.upgrades.crit * .1; }
  function reactionMultiplier() { return 1 + G.upgrades.reaction * .25; }

  function startGame(ch) {
    A.ensure();
    hideAllScreens();
    G = {
      char: ch, state: 'playing', player: makePlayer(ch),
      enemies: [], bullets: [], enemyBullets: [], pickups: [],
      particles: [], floaters: [], rings: [], beams: [], zones: [],
      warnings: [], spawnQueue: [], pendingSpawns: 0, spawnTimer: 0,
      wave: 0, score: 0, kills: 0, combo: 1, comboTimer: 0,
      upgrades: blankUpgrades(), playTime: 0, shake: 0, flash: 0,
      boss: null, bossSpawned: false, resolved: false,
      endTimer: 0, resultVictory: false, waveClearLock: false,
      startGrace: 1.2, screenFlash: 0, hitStop: 0,
      upgradeChoices: [], lastHitAt: 0
    };
    nextEnemyId = 1;
    mouse.down = false; touchAim.active = false; touchAim.id = null;
    A.setMusicMode('battle');
    el.hud.classList.remove('hidden');
    el.mobile.classList.toggle('hidden', !isMobile);
    $('hud-name').textContent = ch.zh;
    $('hud-role').textContent = EL[ch.element].role;
    $('hud-element-dot').style.background = elementColor(ch);
    $('hud-element-dot').style.color = elementColor(ch);
    $('skill-name').textContent = EL[ch.element].skill;
    $('burst-name').textContent = EL[ch.element].burst;
    $('skill-icon').textContent = ch.element === 'pyro' ? '✦' : ch.element === 'cryo' ? '❄' : EL[ch.element].name;
    $('burst-icon').textContent = '✹';
    drawIntoCanvas($('hud-avatar'), ch, 0);
    startWave(1);
    updateHUD(true);
    updateOrientationHint();
  }

  function buildWave(wave) {
    const q = [];
    const add = (type, n) => { for (let i = 0; i < n; i++) q.push({ type, element: pick(['pyro','hydro','cryo','electro','anemo','geo','dendro']) }); };
    if (wave === 1) add('slime', 7);
    else if (wave === 2) { add('slime', 7); add('archer', 3); }
    else if (wave === 3) { add('slime', 7); add('archer', 3); add('brute', 1); }
    else if (wave === 4) { add('slime', 8); add('archer', 4); add('brute', 2); add('mage', 1); }
    else if (wave === 5) { q.push({ type:'boss', element:'electro' }); add('slime', 4); add('archer', 2); }
    return q;
  }

  function startWave(n) {
    hideAllScreens();
    el.hud.classList.remove('hidden');
    el.mobile.classList.toggle('hidden', !isMobile);
    G.state = 'playing';
    G.wave = n;
    G.waveClearLock = false;
    G.spawnQueue = buildWave(n);
    G.pendingSpawns = G.spawnQueue.length;
    G.spawnTimer = n === 1 ? 1.35 : 1.05;
    G.boss = null;
    G.bossSpawned = false;
    G.enemyBullets = [];
    G.warnings = [];
    G.resolved = false;
    G.endTimer = 0;
    const p = G.player;
    const shieldAmount = G.upgrades.shield * 18;
    if (shieldAmount > 0) {
      p.shield = Math.max(p.shield, shieldAmount);
      p.shieldTimer = 12;
    }
    showWaveBanner(n, n === 5 ? '深渊遗迹苏醒' : '敌潮逼近');
    A.setMusicMode(n === 5 ? 'boss' : 'battle');
    updateHUD(true);
  }

  function pauseGame() {
    if (!G || G.state !== 'playing') return;
    G.state = 'paused';
    mouse.down = false;
    if (G.player) G.player.firing = false;
    el.pause.classList.remove('hidden');
    A.ui();
  }

  function resumeGame() {
    if (!G || G.state !== 'paused') return;
    G.state = 'playing';
    el.pause.classList.add('hidden');
    A.ui();
  }

  function queueVictory() {
    if (!G || G.state !== 'playing') return;
    G.state = 'victoryPending';
    G.resultVictory = true;
    G.endTimer = 1.8;
    G.enemyBullets = [];
    mouse.down = false;
    if (G.player) G.player.firing = false;
    G.flash = .65;
    G.shake = 8;
    A.victory();
  }

  function queueDefeat() {
    if (!G || G.state !== 'playing') return;
    G.state = 'defeatPending';
    G.resultVictory = false;
    G.endTimer = 1.35;
    mouse.down = false;
    if (G.player) G.player.firing = false;
    G.flash = .45;
    G.shake = 6;
    A.defeat();
  }

  function showResult(victory) {
    if (!G) return;
    G.state = 'result';
    el.mobile.classList.add('hidden');
    const rs = el.result;
    rs.classList.toggle('defeat', !victory);
    $('result-eyebrow').textContent = victory ? 'VICTORY' : 'DEFEAT';
    $('result-title').textContent = victory ? '深渊已净化' : '本次出击结束';
    $('result-sub').textContent = victory
      ? '提瓦特的夜晚重新安静下来，但下一场战斗仍在等待。'
      : '敌潮越过了防线。调整元素搭配与走位，再次出击。';
    $('result-emblem').textContent = victory ? '✦' : '◇';
    $('result-score').textContent = Math.round(G.score).toString();
    $('result-kills').textContent = G.kills.toString();
    $('result-time').textContent = fmtTime(G.playTime);
    $('result-wave').textContent = G.wave.toString();
    rs.classList.remove('hidden');
    $('boss-wrap').classList.add('hidden');
  }

  /* ============================================================
     Wave spawning
     ============================================================ */
  function pickSpawn() {
    const p = G.player;
    let best = SPAWNS[0], bestD = -1;
    for (let i = 0; i < 9; i++) {
      const s = pick(SPAWNS);
      const d = dist(s.x, s.y, p.x, p.y);
      if (d > bestD && !pointInObstacle(s.x, s.y, 18)) { bestD = d; best = s; }
      if (d > 260) break;
    }
    return best;
  }

  function updateSpawning(dt) {
    if (G.spawnQueue.length > 0) {
      G.spawnTimer -= dt;
      if (G.spawnTimer <= 0) {
        const def = G.spawnQueue.shift();
        const point = def.type === 'boss' ? { x: 640, y: 148 } : pickSpawn();
        G.warnings.push({
          x: point.x, y: point.y, t: def.type === 'boss' ? 1.8 : .85,
          total: def.type === 'boss' ? 1.8 : .85, type: def.type, element: def.element
        });
        G.spawnTimer = def.type === 'boss' ? 2.2 : rand(.35, .62);
      }
    }
    for (let i = G.warnings.length - 1; i >= 0; i--) {
      const w = G.warnings[i];
      w.t -= dt;
      if (w.t <= 0) {
        spawnEnemy(w.type, w.element, w.x, w.y);
        G.pendingSpawns = Math.max(0, G.pendingSpawns - 1);
        G.warnings.splice(i, 1);
      }
    }
  }

  function spawnEnemy(type, element, x, y) {
    if (!G) return null;
    const wave = Math.max(1, G.wave);
    const base = {
      slime:  { hp: 46 + wave * 9,  r: 17, speed: 92 + wave * 2, damage: 10, score: 75 },
      archer: { hp: 55 + wave * 11, r: 18, speed: 72, damage: 9, score: 120 },
      brute:  { hp: 175 + wave * 34, r: 28, speed: 57, damage: 20, score: 280 },
      mage:   { hp: 110 + wave * 22, r: 23, speed: 65, damage: 13, score: 250 },
      boss:   { hp: 3200, r: 58, speed: 50, damage: 22, score: 5000 }
    }[type] || {};
    const e = {
      id: nextEnemyId++, type: type, element: element || 'anemo',
      x: x, y: y, r: base.r, hp: base.hp, maxHp: base.hp,
      speed: base.speed, damage: base.damage, score: base.score,
      aim: Math.atan2(G.player.y - y, G.player.x - x),
      fireCd: rand(.7, 1.8), attackCd: rand(.3, .9), teleCd: 4,
      hitFlash: 0, aura: null, reactionCd: 0, slowTimer: 0,
      rootTimer: 0, dotTimer: 0, dotDps: 0, dotElement: null, dotTick: 0,
      windup: 0, bindup: 0, dead: false, seed: Math.random() * 10,
      phase: 1, phaseTriggered: { 2:false, 3:false }, bossTimer: 0
    };
    if (type === 'boss') {
      G.boss = e; G.bossSpawned = true;
      $('boss-wrap').classList.remove('hidden');
      toast('警告：深渊遗迹 · 侵蚀核心苏醒', 2200);
      A.explode();
    }
    G.enemies.push(e);
    for (let i = 0; i < 15; i++) addParticle(x, y + rand(-8, 8), rand(-70, 70), rand(-90, -20), 1.2, 2 + rand(0, 3), elementColor({ element: element || 'anemo' }), 90);
    return e;
  }

  /* ============================================================
     Player actions
     ============================================================ */
  function dash() {
    const p = G.player;
    if (!p || G.state !== 'playing' || p.dashCd > 0) return;
    let dx = p.moveX || Math.cos(p.aim);
    let dy = p.moveY || Math.sin(p.aim);
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    p.dashTimer = .17;
    p.dashDirX = dx; p.dashDirY = dy;
    p.dashCd = Math.max(.75, 2.15 * (1 - G.upgrades.dash * .2));
    p.invuln = Math.max(p.invuln, .28);
    G.shake = Math.max(G.shake, 2);
    A.dash();
    for (let i = 0; i < 12; i++) addParticle(p.x, p.y + rand(-12, 12), -dx * rand(40, 130) + rand(-40, 40), -dy * rand(40, 130) + rand(-40, 40), .35, rand(1, 3), elementColor(p.char), 120);
  }

  function enemiesWithin(x, y, radius) {
    return G.enemies.filter(e => !e.dead && dist(x, y, e.x, e.y) <= radius + e.r);
  }

  function castSkill() {
    if (!G || G.state !== 'playing') return;
    const p = G.player;
    if (p.skillCd > 0) return;
    p.skillCd = 7.0;
    p.invuln = Math.max(p.invuln, .18);
    G.flash = Math.max(G.flash, .08);
    A.skill(p.char.element);
    const element = p.char.element;
    const col = elementColor(p.char);
    addRing(p.x, p.y, 22, element === 'geo' ? 210 : 175, .55, col, 4);
    G.shake = Math.max(G.shake, 3);
    const dmgMul = damageMultiplier();
    if (element === 'pyro') {
      enemiesWithin(p.x, p.y, 165).forEach(e => hitEnemy(e, 46 * dmgMul, 'pyro', { source:'skill' }));
      for (let i = 0; i < 34; i++) addParticle(p.x, p.y, rand(-240, 240), rand(-240, 240), rand(.25, .65), rand(2, 5), i % 3 ? '#ff8f58' : '#ffd38a', 10);
    } else if (element === 'hydro') {
      p.hp = Math.min(p.maxHp, p.hp + 24);
      G.zones.push({ kind:'heal', x:p.x, y:p.y, r:112, t:5.2, total:5.2 });
      enemiesWithin(p.x, p.y, 118).forEach(e => hitEnemy(e, 16 * dmgMul, 'hydro', { source:'skill' }));
      floatText(p.x, p.y - 44, '+24', '#7be6a7');
      for (let i = 0; i < 28; i++) addParticle(p.x + rand(-80, 80), p.y + rand(-62, 42), rand(-35, 35), rand(-100, -25), rand(.5, 1.1), rand(1, 4), '#79ddff', 30);
    } else if (element === 'cryo') {
      enemiesWithin(p.x, p.y, 185).forEach(e => {
        hitEnemy(e, 28 * dmgMul, 'cryo', { source:'skill' });
        e.slowTimer = Math.max(e.slowTimer, 3.4);
      });
      for (let i = 0; i < 42; i++) {
        const a = rand(0, TAU), r = rand(30, 180);
        addParticle(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * .7, Math.cos(a) * rand(-70, 70), Math.sin(a) * rand(-50, 50), rand(.35, .8), rand(1, 4), i % 2 ? '#bdefff' : '#7ac9e8', 18);
      }
    } else if (element === 'electro') {
      const list = G.enemies.filter(e => !e.dead && dist(p.x, p.y, e.x, e.y) < 430)
        .sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y)).slice(0, 5);
      list.forEach((e, i) => {
        const fromX = i === 0 ? p.x : list[i - 1].x;
        const fromY = i === 0 ? p.y : list[i - 1].y;
        G.beams.push({ x1:fromX, y1:fromY, x2:e.x, y2:e.y, life:.18, maxLife:.18, color:'#c58cff', width:3 });
        hitEnemy(e, 40 * dmgMul, 'electro', { source:'skill' });
      });
      if (!list.length) G.beams.push({ x1:p.x, y1:p.y, x2:p.x + Math.cos(p.aim) * 350, y2:p.y + Math.sin(p.aim) * 350, life:.16, maxLife:.16, color:'#c58cff', width:2 });
    } else if (element === 'anemo') {
      const list = enemiesWithin(p.x, p.y, 270);
      list.forEach(e => {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        const d = Math.min(140, dist(p.x, p.y, e.x, e.y) * .42);
        moveEntity(e, Math.cos(a) * d, Math.sin(a) * d);
        hitEnemy(e, 26 * dmgMul, 'anemo', { source:'skill' });
      });
      for (let i = 0; i < 35; i++) {
        const a = rand(0, TAU), r = rand(20, 210);
        addParticle(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * .7, -Math.cos(a) * rand(40, 150), -Math.sin(a) * rand(30, 100), rand(.3, .8), rand(1, 4), '#6feac6', 12);
      }
    } else if (element === 'geo') {
      p.shield = Math.max(p.shield, 55);
      p.shieldTimer = 8;
      enemiesWithin(p.x, p.y, 120).forEach(e => hitEnemy(e, 22 * dmgMul, 'geo', { source:'skill' }));
      for (let i = 0; i < 26; i++) addParticle(p.x, p.y + 12, rand(-160, 160), rand(-100, 20), rand(.4, .9), rand(2, 5), i % 2 ? '#f4bd52' : '#e5c47b', 130);
    } else {
      enemiesWithin(p.x, p.y, 175).forEach(e => {
        hitEnemy(e, 33 * dmgMul, 'dendro', { source:'skill' });
        e.rootTimer = Math.max(e.rootTimer, 1.7);
      });
      p.hp = Math.min(p.maxHp, p.hp + 10);
      for (let i = 0; i < 30; i++) {
        const a = rand(0, TAU), r = rand(20, 170);
        addParticle(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * .8, rand(-50, 50), rand(-40, 50), rand(.4, .9), rand(1, 4), i % 2 ? '#9adf58' : '#d9ffab', 80);
      }
    }
    G.flash = Math.max(G.flash, .12);
    updateHUD();
  }

  function castBurst() {
    if (!G || G.state !== 'playing') return;
    const p = G.player;
    if (p.energy < 100) { toast('元素能量不足 · 继续攻击积攒能量', 1100); return; }
    p.energy = 0;
    const element = p.char.element;
    const col = elementColor(p.char);
    G.flash = .95;
    G.shake = 10;
    A.burst();
    addRing(p.x, p.y, 10, 360, .9, col, 7);
    addRing(p.x, p.y, 5, 260, 1.2, '#fff2cf', 2);
    for (let i = 0; i < 70; i++) {
      const a = rand(0, TAU);
      addParticle(p.x, p.y, Math.cos(a) * rand(80, 480), Math.sin(a) * rand(80, 480), rand(.3, 1.2), rand(1, 5), i % 3 ? col : '#fff2cf', 5);
    }
    if (element === 'pyro') {
      for (let i = 0; i < 24; i++) spawnPlayerBullet(p.aim + i / 24 * TAU, { damage: 30 * damageMultiplier(), speed: 480, radius: 5, pierce: 1, element, life: 1.6, explode: 18 });
      enemiesWithin(p.x, p.y, 220).forEach(e => hitEnemy(e, 52 * damageMultiplier(), 'pyro', { source:'burst' }));
    } else if (element === 'hydro') {
      p.hp = Math.min(p.maxHp, p.hp + 45);
      for (let i = 0; i < 20; i++) spawnPlayerBullet(p.aim + i / 20 * TAU, { damage: 21 * damageMultiplier(), speed: 430, radius: 5, pierce: 2, element, life: 1.8, heal: 2 });
      enemiesWithin(p.x, p.y, 250).forEach(e => { e.slowTimer = Math.max(e.slowTimer, 2.5); });
      floatText(p.x, p.y - 48, '+45', '#7be6a7');
    } else if (element === 'cryo') {
      G.enemies.forEach(e => {
        if (!e.dead) {
          e.rootTimer = Math.max(e.rootTimer, 2.1);
          hitEnemy(e, 58 * damageMultiplier(), 'cryo', { source:'burst' });
        }
      });
      for (let i = 0; i < 12; i++) spawnPlayerBullet(p.aim + i / 12 * TAU, { damage: 26 * damageMultiplier(), speed: 460, radius: 5, pierce: 1, element, life: 1.7 });
    } else if (element === 'electro') {
      const list = G.enemies.filter(e => !e.dead).slice(0, 10);
      list.forEach((e, i) => {
        G.beams.push({ x1:p.x, y1:p.y, x2:e.x, y2:e.y, life:.28, maxLife:.28, color:'#d6a7ff', width:5 });
        hitEnemy(e, 76 * damageMultiplier(), 'electro', { source:'burst' });
      });
    } else if (element === 'anemo') {
      const list = G.enemies.filter(e => !e.dead && dist(p.x, p.y, e.x, e.y) < 430);
      list.forEach(e => {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        moveEntity(e, Math.cos(a) * 150, Math.sin(a) * 150);
        hitEnemy(e, 48 * damageMultiplier(), 'anemo', { source:'burst' });
      });
      for (let i = 0; i < 10; i++) spawnPlayerBullet(p.aim + i / 10 * TAU, { damage: 22 * damageMultiplier(), speed: 500, radius: 5, pierce: 2, element, life: 1.5 });
    } else if (element === 'geo') {
      let tx, ty;
      if (isMobile) { tx = p.x + Math.cos(p.aim) * 220; ty = p.y + Math.sin(p.aim) * 220; }
      else { tx = clamp(mouse.x, ARENA.x + 20, ARENA.x + ARENA.w - 20); ty = clamp(mouse.y, ARENA.y + 20, ARENA.y + ARENA.h - 20); }
      G.rings.push({ x:tx, y:ty, r:8, maxR:190, t:.9, maxT:.9, color:'#f4bd52', width:9 });
      enemiesWithin(tx, ty, 195).forEach(e => hitEnemy(e, 142 * damageMultiplier(), 'geo', { source:'burst' }));
      p.shield = Math.max(p.shield, 35); p.shieldTimer = 9;
      for (let i = 0; i < 45; i++) addParticle(tx, ty, rand(-230, 230), rand(-160, 150), rand(.35, 1.1), rand(2, 6), i % 2 ? '#f4bd52' : '#c58d49', 160);
    } else {
      p.hp = Math.min(p.maxHp, p.hp + 35);
      G.enemies.forEach(e => {
        if (!e.dead && dist(p.x, p.y, e.x, e.y) < 280) {
          e.rootTimer = Math.max(e.rootTimer, 2.6);
          hitEnemy(e, 70 * damageMultiplier(), 'dendro', { source:'burst' });
        }
      });
      for (let i = 0; i < 16; i++) spawnPlayerBullet(p.aim + i / 16 * TAU, { damage: 24 * damageMultiplier(), speed: 430, radius: 5, pierce: 1, element, life: 1.5, poison: true });
      floatText(p.x, p.y - 48, '+35', '#7be6a7');
    }
    updateHUD();
  }

  function spawnPlayerBullet(angle, opts) {
    const p = G.player;
    const ox = p.x + Math.cos(angle) * 22;
    const oy = p.y - 7 + Math.sin(angle) * 22;
    G.bullets.push({
      x: ox, y: oy, prevX: ox, prevY: oy,
      vx: Math.cos(angle) * opts.speed, vy: Math.sin(angle) * opts.speed,
      r: opts.radius || 4, damage: opts.damage, element: opts.element,
      life: opts.life || 1.35, maxLife: opts.life || 1.35,
      pierce: opts.pierce || 0, hitIds: [], explode: opts.explode || 0,
      heal: opts.heal || 0, poison: !!opts.poison
    });
    if (G.bullets.length > 260) G.bullets.splice(0, G.bullets.length - 260);
  }

  function shoot() {
    const p = G.player;
    const st = elementStats(p.char);
    if (p.fireTimer > 0) return;
    const cooldown = st.cooldown / fireRateMultiplier();
    p.fireTimer = cooldown;
    const count = st.count;
    const dmg = st.damage * damageMultiplier();
    for (let i = 0; i < count; i++) {
      const offset = count > 1 ? (i - (count - 1) / 2) * st.spread : 0;
      const angle = p.aim + offset + rand(-.008, .008);
      spawnPlayerBullet(angle, {
        damage: dmg + rand(-1, 1), speed: st.speed * rand(.96, 1.04),
        radius: st.radius, pierce: st.pierce, element: p.char.element,
        life: 1.45, explode: st.explode || 0, heal: st.heal || 0, poison: st.poison
      });
    }
    G.shake = Math.max(G.shake, .9);
    G.flash = Math.max(G.flash, .02);
    A.shoot(p.char.element);
    const col = elementColor(p.char);
    for (let i = 0; i < 5; i++) {
      addParticle(p.x + Math.cos(p.aim) * 29, p.y - 7 + Math.sin(p.aim) * 29,
        Math.cos(p.aim) * rand(20, 90) + rand(-20, 20),
        Math.sin(p.aim) * rand(20, 90) + rand(-20, 20),
        rand(.08, .25), rand(1, 3), i % 2 ? col : '#fff0c8', 10);
    }
  }

  /* ============================================================
     Damage & elemental reactions
     ============================================================ */
  function auraName(e) {
    return e.aura && EL[e.aura.element] ? EL[e.aura.element].name : '';
  }

  function tryReaction(e, incoming) {
    if (!e.aura || e.aura.time <= 0) {
      e.aura = { element: incoming, time: 4.2 };
      return null;
    }
    if (e.aura.element === incoming) {
      e.aura.time = 4.2;
      return null;
    }
    if (e.reactionCd > 0) {
      e.aura = { element: incoming, time: 4.2 };
      return null;
    }
    const old = e.aura.element;
    const pair = [old, incoming].sort().join('+');
    let reaction = null;
    if (pair === 'cryo+pyro') reaction = { key:'melt', name:'融化', en:'MELT', mult:1.75 };
    else if (pair === 'hydro+pyro') reaction = { key:'vaporize', name:'蒸发', en:'VAPORIZE', mult:1.75 };
    else if (pair === 'electro+hydro') reaction = { key:'electrocharged', name:'感电', en:'ELECTRO-CHARGED', mult:1.2 };
    else if (pair === 'cryo+electro') reaction = { key:'superconduct', name:'超导', en:'SUPERCONDUCT', mult:1.15 };
    else if (old === 'anemo' || incoming === 'anemo') reaction = { key:'swirl', name:'扩散', en:'SWIRL', mult:1.2, carry: old === 'anemo' ? incoming : old };
    else if (old === 'geo' || incoming === 'geo') reaction = { key:'crystallize', name:'结晶', en:'CRYSTALLIZE', mult:1.12, carry: old === 'geo' ? incoming : old };
    else if (pair === 'dendro+hydro') reaction = { key:'bloom', name:'绽放', en:'BLOOM', mult:1.4 };
    else if (pair === 'dendro+pyro') reaction = { key:'burning', name:'燃烧', en:'BURNING', mult:1.15 };
    else if (pair === 'dendro+electro') reaction = { key:'quicken', name:'激化', en:'QUICKEN', mult:1.35 };
    if (!reaction) { e.aura = { element: incoming, time: 4.2 }; return null; }
    e.reactionCd = .38;
    e.aura = null;
    return reaction;
  }

  function triggerReaction(e, reaction) {
    if (!reaction) return;
    const p = G.player;
    const rb = reactionMultiplier();
    if (reaction.key === 'swirl') {
      const list = G.enemies.filter(o => !o.dead && o.id !== e.id && dist(e.x, e.y, o.x, o.y) < 115).slice(0, 4);
      list.forEach(o => directDamage(o, 14 * rb, reaction.carry || 'anemo', '#83eacb'));
      addRing(e.x, e.y, 8, 105, .4, '#83eacb', 3);
    } else if (reaction.key === 'electrocharged') {
      const list = G.enemies.filter(o => !o.dead && o.id !== e.id && dist(e.x, e.y, o.x, o.y) < 130).slice(0, 3);
      list.forEach(o => {
        directDamage(o, 16 * rb, 'electro', '#c58cff');
        G.beams.push({ x1:e.x, y1:e.y, x2:o.x, y2:o.y, life:.2, maxLife:.2, color:'#c58cff', width:2.5 });
      });
    } else if (reaction.key === 'superconduct') {
      e.slowTimer = Math.max(e.slowTimer, 2.2);
      G.enemies.filter(o => !o.dead && o.id !== e.id && dist(e.x, e.y, o.x, o.y) < 90).forEach(o => directDamage(o, 10 * rb, 'cryo', '#bdefff'));
      addRing(e.x, e.y, 6, 92, .38, '#bdefff', 3);
    } else if (reaction.key === 'crystallize') {
      p.shield = Math.max(p.shield, 12 + 4 * G.upgrades.reaction);
      p.shieldTimer = Math.max(p.shieldTimer, 5.5);
      floatText(p.x, p.y - 40, '结晶护盾', '#f4bd52');
    } else if (reaction.key === 'bloom') {
      G.enemies.filter(o => !o.dead && dist(e.x, e.y, o.x, o.y) < 98).forEach(o => directDamage(o, 24 * rb, 'dendro', '#9adf58'));
      addRing(e.x, e.y, 6, 100, .45, '#9adf58', 4);
      A.explode();
    } else if (reaction.key === 'burning') {
      e.dotTimer = Math.max(e.dotTimer, 3);
      e.dotDps = 7 * rb;
      e.dotElement = 'pyro';
      e.dotTick = 0;
    } else if (reaction.key === 'quicken') {
      directDamage(e, 21 * rb, 'dendro', '#b9ef76');
    }
  }

  function hitEnemy(e, baseDamage, element, opts) {
    if (!e || e.dead) return 0;
    const o = opts || {};
    const reaction = tryReaction(e, element);
    let mult = reaction ? reaction.mult : 1;
    if (reaction) mult = 1 + (mult - 1) * (1 + G.upgrades.reaction * .18);
    let crit = Math.random() < critChance();
    let total = baseDamage * mult * (crit ? 2 : 1);
    e.hp -= total;
    e.hitFlash = .1;
    G.score += 2;
    G.player.energy = Math.min(100, G.player.energy + (crit ? 2.5 : 1.5));
    const col = (EL[element] || EL.anemo).color;
    floatText(e.x + rand(-8, 8), e.y - (e.type === 'boss' ? 112 : e.r + 30), (crit ? '✦ ' : '') + Math.round(total), crit ? '#ffe28e' : col, crit ? 17 : 13);
    if (crit) A.crit(); else A.hit();
    for (let i = 0; i < (crit ? 11 : 6); i++) addParticle(e.x, e.y, rand(-100, 100), rand(-100, 30), rand(.15, .42), rand(1, 3), i % 2 ? col : '#fff1c5', 0);
    if (reaction) {
      showReaction(reaction.name, reaction.en);
      floatText(e.x, e.y - (e.type === 'boss' ? 130 : e.r + 46), reaction.name, '#ffe5a8', 15);
      triggerReaction(e, reaction);
      if (reaction.key === 'bloom' || reaction.key === 'vaporize' || reaction.key === 'melt') {
        addRing(e.x, e.y, 4, 55, .28, (EL[element] || EL.anemo).color, 2);
      }
    }
    if (o.source === 'skill' || o.source === 'burst') {
      G.player.energy = Math.min(100, G.player.energy + 1.2);
    }
    if (e.hp <= 0) killEnemy(e);
    updateHUD();
    return total;
  }

  function directDamage(e, amount, element, color) {
    if (!e || e.dead) return;
    e.hp -= amount;
    e.hitFlash = .07;
    floatText(e.x, e.y - (e.type === 'boss' ? 105 : e.r + 24), Math.round(amount), color || '#fff0c0', 11);
    for (let i = 0; i < 6; i++) addParticle(e.x, e.y, rand(-70, 70), rand(-80, 20), rand(.12, .35), rand(1, 3), color || '#fff0c0', 0);
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    if (!e || e.dead) return;
    e.dead = true;
    G.kills++;
    const bonus = e.type === 'boss' ? 5000 : e.score;
    G.score += bonus;
    G.player.energy = Math.min(100, G.player.energy + (e.type === 'boss' ? 20 : e.type === 'brute' || e.type === 'mage' ? 10 : 4));
    const col = e.type === 'boss' ? '#ff7d6d' : e.type === 'mage' ? '#c18ae8' : e.type === 'brute' ? '#f0b054' : '#e9d6a6';
    for (let i = 0; i < (e.type === 'boss' ? 90 : 24); i++) {
      const a = rand(0, TAU), sp = rand(30, e.type === 'boss' ? 420 : 170);
      addParticle(e.x, e.y - (e.type === 'boss' ? 52 : 12), Math.cos(a) * sp, Math.sin(a) * sp, rand(.35, 1.3), rand(1, e.type === 'boss' ? 6 : 4), i % 3 ? col : '#fff2cb', 50);
    }
    addRing(e.x, e.y, 4, e.type === 'boss' ? 260 : 58, e.type === 'boss' ? 1.2 : .36, col, e.type === 'boss' ? 7 : 2);
    if (e.type === 'boss') {
      G.flash = .9; G.shake = 14; A.explode(); queueVictory(); return;
    }
    const dropChance = .42 + G.upgrades.magnet * .08;
    if (Math.random() < .18) spawnPickup(e.x + rand(-8, 8), e.y + rand(-8, 8), 'hp');
    else if (Math.random() < dropChance) spawnPickup(e.x + rand(-8, 8), e.y + rand(-8, 8), 'energy');
    if (Math.random() < .13) spawnPickup(e.x + rand(-12, 12), e.y + rand(-12, 12), 'star');
    A.explode();
  }

  function cleanupDeadEnemies() {
    if (!G) return;
    G.enemies = G.enemies.filter(e => !e.dead);
    updateHUD();
  }

  function damagePlayer(amount, sourceX, sourceY) {
    if (!G || G.state !== 'playing') return;
    const p = G.player;
    if (p.invuln > 0) return;
    let dmg = amount;
    if (p.shield > 0) {
      const absorbed = Math.min(p.shield, dmg);
      p.shield -= absorbed; dmg -= absorbed;
      for (let i = 0; i < 8; i++) addParticle(p.x, p.y, rand(-80, 80), rand(-80, 30), .25, 2, '#f4bd52', 80);
      if (p.shield <= 0) p.shield = 0;
    }
    if (dmg > 0) {
      p.hp = Math.max(0, p.hp - dmg);
      p.hurtFlash = .3;
      p.invuln = .7;
      G.shake = Math.max(G.shake, 6);
      G.flash = Math.max(G.flash, .3);
      A.hurt();
      floatText(p.x, p.y - 44, '-' + Math.round(dmg), '#ff836e', 16);
      for (let i = 0; i < 18; i++) addParticle(p.x, p.y, rand(-150, 150), rand(-130, 40), rand(.2, .55), rand(1, 4), i % 2 ? '#ff6b58' : '#ffd0b5', 50);
      if (sourceX != null) {
        const a = Math.atan2(p.y - sourceY, p.x - sourceX);
        moveEntity(p, Math.cos(a) * 9, Math.sin(a) * 9);
      }
    }
    if (p.hp <= 0) queueDefeat();
    updateHUD();
  }

  /* ============================================================
     Simulation
     ============================================================ */
  function updatePlayer(dt) {
    const p = G.player;
    p.fireTimer = Math.max(0, p.fireTimer - dt);
    p.skillCd = Math.max(0, p.skillCd - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt);
    if (p.shield > 0) {
      p.shieldTimer -= dt;
      if (p.shieldTimer <= 0) p.shield = 0;
    }

    let mx = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
    let my = (controls.down ? 1 : 0) - (controls.up ? 1 : 0);
    if (isMobile) { mx += touchMove.x; my += touchMove.y; }
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    p.moveX = mx; p.moveY = my;
    p.moving = len > .12;

    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      moveEntity(p, p.dashDirX * 780 * dt, p.dashDirY * 780 * dt);
      if (Math.random() < .7) addParticle(p.x, p.y, -p.dashDirX * rand(20, 80) + rand(-20, 20), -p.dashDirY * rand(20, 80) + rand(-20, 20), .28, rand(1, 3), elementColor(p.char), 20);
    } else {
      const spd = p.speed * (1 + G.upgrades.speed * .12);
      moveEntity(p, mx * spd * dt, my * spd * dt);
    }

    // Aim
    if (isMobile) {
      if (touchAim.active) {
        const dx = touchAim.x - touchAim.sx, dy = touchAim.y - touchAim.sy;
        if (Math.hypot(dx, dy) > 7) p.aim = Math.atan2(dy, dx);
      } else {
        const target = nearestEnemy(p.x, p.y, 560);
        if (target) {
          const dx = target.x - p.x, dy = target.y - (p.y - 8);
          p.aim = Math.atan2(dy, dx);
        }
      }
      // light aim assist for touch
      const assist = nearestEnemy(p.x, p.y, 460);
      if (assist) {
        const desired = Math.atan2(assist.y - (p.y - 8), assist.x - p.x);
        let diff = ((desired - p.aim + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        if (Math.abs(diff) < .12) p.aim += diff * .55;
      }
    } else {
      p.aim = Math.atan2(mouse.y - (p.y - 8), mouse.x - p.x);
    }

    p.firing = mouse.down || (isMobile && touchAim.active);
    if (p.firing) shoot();

    // heal zones
    for (const z of G.zones) {
      if (z.kind === 'heal' && dist(p.x, p.y, z.x, z.y) < z.r) {
        p.hp = Math.min(p.maxHp, p.hp + 5.5 * dt);
        if (Math.random() < dt * 4) addParticle(p.x + rand(-20, 20), p.y + rand(-8, 20), rand(-10, 10), rand(-45, -20), .8, 2, '#7be6a7', 0);
      }
    }
  }

  function nearestEnemy(x, y, maxD) {
    let best = null, bd = maxD || Infinity;
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = dist(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  function updatePlayerBullets(dt) {
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.prevX = b.x; b.prevY = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      let remove = false;
      if (b.life <= 0 || b.x < ARENA.x - 20 || b.x > ARENA.x + ARENA.w + 20 || b.y < ARENA.y - 20 || b.y > ARENA.y + ARENA.h + 20) remove = true;
      if (!remove && segRect(b.prevX, b.prevY, b.x, b.y, b.r)) {
        for (let j = 0; j < 9; j++) addParticle(b.x, b.y, rand(-70, 70), rand(-70, 20), rand(.12, .32), rand(1, 3), (EL[b.element] || EL.anemo).color, 100);
        remove = true;
      }
      if (!remove) {
        for (const e of G.enemies) {
          if (e.dead || b.hitIds.includes(e.id)) continue;
          if (segCircle(b.prevX, b.prevY, b.x, b.y, e.x, e.y, e.r + b.r)) {
            const primaryX = e.x, primaryY = e.y;
            hitEnemy(e, b.damage, b.element, { source: 'bullet' });
            b.hitIds.push(e.id);
            if (b.heal) {
              const p = G.player; p.hp = Math.min(p.maxHp, p.hp + b.heal);
            }
            if (b.explode > 0) {
              G.enemies.filter(o => !o.dead && o.id !== e.id && dist(primaryX, primaryY, o.x, o.y) < 58).forEach(o => directDamage(o, b.explode * damageMultiplier(), b.element, (EL[b.element] || EL.anemo).color));
              addRing(primaryX, primaryY, 4, 58, .3, (EL[b.element] || EL.anemo).color, 2);
            }
            if (b.element === 'cryo' && !e.dead) e.slowTimer = Math.max(e.slowTimer, .9);
            if (b.element === 'anemo' && !e.dead) {
              const a = Math.atan2(b.vy, b.vx);
              moveEntity(e, Math.cos(a) * 10, Math.sin(a) * 10);
            }
            if (b.element === 'electro' && !e.dead) {
              const chain = G.enemies.filter(o => !o.dead && o.id !== e.id && dist(e.x, e.y, o.x, o.y) < 125).slice(0, 2);
              chain.forEach(o => {
                directDamage(o, 8 * damageMultiplier(), 'electro', '#c58cff');
                G.beams.push({ x1:e.x, y1:e.y, x2:o.x, y2:o.y, life:.14, maxLife:.14, color:'#c58cff', width:2 });
              });
            }
            if (b.poison && !e.dead) {
              e.dotTimer = Math.max(e.dotTimer, 2.8);
              e.dotDps = Math.max(e.dotDps, 5);
              e.dotElement = 'dendro';
            }
            if (b.pierce > 0) { b.pierce--; }
            else { remove = true; break; }
          }
        }
      }
      if (remove) G.bullets.splice(i, 1);
    }
  }

  function updateEnemyBullets(dt) {
    const p = G.player;
    for (let i = G.enemyBullets.length - 1; i >= 0; i--) {
      const b = G.enemyBullets[i];
      const px = b.x, py = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      let remove = b.life <= 0 || b.x < ARENA.x || b.x > ARENA.x + ARENA.w || b.y < ARENA.y || b.y > ARENA.y + ARENA.h;
      if (!remove && segRect(px, py, b.x, b.y, b.r)) remove = true;
      if (!remove && segCircle(px, py, b.x, b.y, p.x, p.y, p.r + b.r + 3)) {
        damagePlayer(b.damage, b.x, b.y);
        remove = true;
      }
      if (remove) G.enemyBullets.splice(i, 1);
    }
  }

  function updateEnemies(dt) {
    const p = G.player;
    for (const e of G.enemies) {
      if (e.dead) continue;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.reactionCd = Math.max(0, e.reactionCd - dt);
      e.slowTimer = Math.max(0, e.slowTimer - dt);
      e.rootTimer = Math.max(0, e.rootTimer - dt);
      e.fireCd -= dt;
      e.attackCd -= dt;
      e.teleCd -= dt;
      if (e.aura) { e.aura.time -= dt; if (e.aura.time <= 0) e.aura = null; }
      if (e.dotTimer > 0) {
        e.dotTimer -= dt; e.dotTick -= dt;
        if (e.dotTick <= 0) {
          e.dotTick = .55;
          directDamage(e, e.dotDps * .55, e.dotElement || 'pyro', '#ffb36e');
          if (e.dead) continue;
        }
      }
      if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0) {
          if (dist(e.x, e.y, p.x, p.y) < 138) damagePlayer(24, e.x, e.y);
          addRing(e.x, e.y, 12, 150, .38, '#ff795e', 5);
          G.shake = Math.max(G.shake, 5);
          A.explode();
          e.attackCd = 2.2;
        }
        continue;
      }
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const nx = dx / d, ny = dy / d;
      const slowMul = e.slowTimer > 0 ? .52 : 1;
      const canMove = e.rootTimer <= 0;
      e.aim = Math.atan2(dy, dx);
      if (e.type === 'slime') {
        if (canMove) moveEntity(e, nx * e.speed * slowMul * dt, ny * e.speed * slowMul * dt);
        if (d < e.r + p.r + 2 && e.attackCd <= 0) {
          damagePlayer(e.damage, e.x, e.y); e.attackCd = 1.2;
        }
      } else if (e.type === 'archer') {
        if (canMove) {
          if (d < 155) moveEntity(e, -nx * e.speed * slowMul * dt, -ny * e.speed * slowMul * dt);
          else if (d > 285) moveEntity(e, nx * e.speed * slowMul * dt, ny * e.speed * slowMul * dt);
          else {
            const side = Math.sin(e.id + G.playTime * .7) > 0 ? 1 : -1;
            moveEntity(e, -ny * e.speed * .7 * slowMul * dt * side, nx * e.speed * .7 * slowMul * dt * side);
          }
        }
        if (e.fireCd <= 0 && d < 500 && !lineBlocked(e.x, e.y, p.x, p.y)) {
          e.fireCd = 1.85 + Math.random() * .5;
          const aim = Math.atan2(p.y - e.y, p.x - e.x) + rand(-.055, .055);
          spawnEnemyBullet(e.x + Math.cos(aim) * 18, e.y + Math.sin(aim) * 18, aim, 235, 9, '#d7b68d', 5);
          A.enemyShoot();
        }
        if (d < e.r + p.r + 2 && e.attackCd <= 0) { damagePlayer(8, e.x, e.y); e.attackCd = 1.4; }
      } else if (e.type === 'brute') {
        if (canMove) moveEntity(e, nx * e.speed * slowMul * dt, ny * e.speed * slowMul * dt);
        if (d < 105 && e.attackCd <= 0) {
          e.windup = .72; e.bindup = 0;
          e.attackCd = 2.5;
          addRing(e.x, e.y, 8, 145, .72, '#ff8d6e', 2);
        }
        if (d < e.r + p.r + 5 && e.attackCd <= 0) { damagePlayer(e.damage, e.x, e.y); e.attackCd = 1.5; }
      } else if (e.type === 'mage') {
        if (canMove) {
          if (d < 160) moveEntity(e, -nx * e.speed * slowMul * dt, -ny * e.speed * slowMul * dt);
          else if (d > 310) moveEntity(e, nx * e.speed * slowMul * dt, ny * e.speed * slowMul * dt);
          else {
            const side = Math.sin(e.id * 2 + G.playTime) > 0 ? 1 : -1;
            moveEntity(e, -ny * e.speed * .6 * slowMul * dt * side, nx * e.speed * .6 * slowMul * dt * side);
          }
        }
        if (e.teleCd <= 0 && d < 125) {
          e.teleCd = 4.2;
          for (let i = 0; i < 22; i++) addParticle(e.x, e.y - 10, rand(-120, 120), rand(-150, 40), .5, 2, '#c18ae8', 0);
          const s = pickSpawn();
          e.x = s.x; e.y = s.y; resolveObstacles(e);
          for (let i = 0; i < 22; i++) addParticle(e.x, e.y - 10, rand(-120, 120), rand(-150, 40), .5, 2, '#c18ae8', 0);
        }
        if (e.fireCd <= 0 && d < 520 && !lineBlocked(e.x, e.y, p.x, p.y)) {
          e.fireCd = 2.1;
          const aim = Math.atan2(p.y - e.y, p.x - e.x);
          for (let k = -1; k <= 1; k++) {
            spawnEnemyBullet(e.x, e.y - 8, aim + k * .13, 195, 12, '#c89cf0', 6);
          }
          A.enemyShoot();
        }
      } else if (e.type === 'boss') {
        const hpFrac = e.hp / e.maxHp;
        e.phase = hpFrac > .66 ? 1 : hpFrac > .33 ? 2 : 3;
        if (e.phase >= 2 && !e.phaseTriggered[2]) {
          e.phaseTriggered[2] = true;
          toast('Boss 进入第二阶段 · 召唤眷属', 1400);
          for (let k = 0; k < 2; k++) spawnEnemy('slime', 'electro', clamp(e.x + rand(-110, 110), ARENA.x + 50, ARENA.x + ARENA.w - 50), clamp(e.y + rand(45, 95), ARENA.y + 50, ARENA.y + ARENA.h - 50));
        }
        if (e.phase >= 3 && !e.phaseTriggered[3]) {
          e.phaseTriggered[3] = true;
          toast('Boss 进入第三阶段 · 侵蚀加速', 1400);
          for (let k = 0; k < 3; k++) spawnEnemy('slime', 'pyro', clamp(e.x + rand(-120, 120), ARENA.x + 50, ARENA.x + ARENA.w - 50), clamp(e.y + rand(45, 100), ARENA.y + 50, ARENA.y + ARENA.h - 50));
        }
        if (canMove) {
          if (d > 280) moveEntity(e, nx * e.speed * slowMul * dt, ny * e.speed * slowMul * dt);
          else if (d < 190) moveEntity(e, -nx * e.speed * .7 * slowMul * dt, -ny * e.speed * .7 * slowMul * dt);
          else {
            const side = Math.sin(e.id + G.playTime * .6) > 0 ? 1 : -1;
            moveEntity(e, -ny * e.speed * .35 * slowMul * dt * side, nx * e.speed * .35 * slowMul * dt * side);
          }
        }
        if (e.fireCd <= 0) {
          e.fireCd = e.phase === 1 ? 2.1 : e.phase === 2 ? 1.65 : 1.25;
          const n = e.phase === 1 ? 10 : e.phase === 2 ? 14 : 18;
          for (let k = 0; k < n; k++) {
            const a = k / n * TAU + G.playTime * .25;
            spawnEnemyBullet(e.x, e.y - 14, a, e.phase === 1 ? 165 : e.phase === 2 ? 185 : 205, 13, e.phase === 3 ? '#ff8e82' : '#d68aff', 7);
          }
          if (e.phase >= 2) {
            const aim = Math.atan2(p.y - e.y, p.x - e.x);
            for (let k = -2; k <= 2; k++) spawnEnemyBullet(e.x, e.y - 14, aim + k * .12, 245, 15, '#ffb281', 6);
          }
          G.shake = Math.max(G.shake, 2.5);
          A.enemyShoot();
        }
        if (d < e.r + p.r + 4 && e.attackCd <= 0) { damagePlayer(e.damage, e.x, e.y); e.attackCd = 1.1; }
      }
    }
    separateEnemies();
    cleanupDeadEnemies();
  }

  function separateEnemies() {
    const arr = G.enemies;
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i]; if (a.dead) continue;
      for (let j = i + 1; j < arr.length; j++) {
        const b = arr[j]; if (b.dead) continue;
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        const min = (a.r + b.r) * .72;
        if (d > 0 && d < min) {
          const push = (min - d) * .5;
          dx /= d; dy /= d;
          if (a.type !== 'boss') { a.x -= dx * push; a.y -= dy * push; }
          if (b.type !== 'boss') { b.x += dx * push; b.y += dy * push; }
        }
      }
      resolveObstacles(a);
    }
  }

  function spawnEnemyBullet(x, y, angle, speed, damage, color, radius) {
    G.enemyBullets.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      r: radius || 5, damage, life: 4.5, color: color || '#ff9c78'
    });
    if (G.enemyBullets.length > 220) G.enemyBullets.splice(0, G.enemyBullets.length - 220);
  }

  function spawnPickup(x, y, kind) {
    G.pickups.push({ x, y, kind, seed: Math.random() * 10, r: 8, vx: rand(-35, 35), vy: rand(-45, -15), life: 24 });
    if (G.pickups.length > 70) G.pickups.splice(0, G.pickups.length - 70);
  }

  function updatePickups(dt) {
    const p = G.player;
    const magnetR = 70 + G.upgrades.magnet * 42;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const o = G.pickups[i];
      o.life -= dt;
      o.vx *= .92; o.vy *= .92;
      o.x += o.vx * dt; o.y += o.vy * dt;
      const d = dist(o.x, o.y, p.x, p.y);
      if (d < magnetR) {
        const sp = 240 + (magnetR - d) * 3;
        o.x += (p.x - o.x) / (d || 1) * sp * dt;
        o.y += (p.y - o.y) / (d || 1) * sp * dt;
      }
      if (d < p.r + 14 || (d < 55 && G.upgrades.magnet > 0)) {
        if (o.kind === 'hp') { p.hp = Math.min(p.maxHp, p.hp + 13); floatText(p.x, p.y - 44, '+13 HP', '#7be6a7'); }
        else if (o.kind === 'energy') { p.energy = Math.min(100, p.energy + 11); floatText(p.x, p.y - 44, '+11 能量', '#f3d376'); }
        else { p.energy = Math.min(100, p.energy + 6); G.score += 120; floatText(p.x, p.y - 44, '+120', '#d79bff'); }
        A.pickup();
        for (let k = 0; k < 10; k++) addParticle(o.x, o.y, rand(-80, 80), rand(-100, 20), .35, 2, o.kind === 'hp' ? '#7be6a7' : o.kind === 'energy' ? '#f3d376' : '#d79bff', 60);
        G.pickups.splice(i, 1);
      } else if (o.life <= 0) {
        G.pickups.splice(i, 1);
      }
    }
  }

  function updateEffects(dt) {
    for (let i = G.particles.length - 1; i >= 0; i--) {
      const p = G.particles[i];
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= p.drag || .98; p.vy *= p.drag || .98;
      p.vy += (p.gravity || 0) * dt;
      if (p.life <= 0) G.particles.splice(i, 1);
    }
    for (let i = G.rings.length - 1; i >= 0; i--) {
      const r = G.rings[i]; r.t -= dt;
      r.r = lerp(r.r, r.maxR, Math.min(1, dt * 7));
      if (r.t <= 0) G.rings.splice(i, 1);
    }
    for (let i = G.floaters.length - 1; i >= 0; i--) {
      const f = G.floaters[i]; f.life -= dt; f.y += f.vy * dt;
      if (f.life <= 0) G.floaters.splice(i, 1);
    }
    for (let i = G.beams.length - 1; i >= 0; i--) {
      G.beams[i].life -= dt;
      if (G.beams[i].life <= 0) G.beams.splice(i, 1);
    }
    for (let i = G.zones.length - 1; i >= 0; i--) {
      G.zones[i].t -= dt;
      if (G.zones[i].t <= 0) G.zones.splice(i, 1);
    }
    G.shake = Math.max(0, G.shake - dt * 22);
    G.flash = Math.max(0, G.flash - dt * 3.2);
    G.screenFlash = Math.max(0, G.screenFlash - dt * 3.5);
  }

  function addParticle(x, y, vx, vy, life, size, color, gravity) {
    if (!G) return;
    G.particles.push({ x, y, vx, vy, life, maxLife: life, size, color, gravity: gravity || 0, drag: .975 });
    if (G.particles.length > 650) G.particles.splice(0, G.particles.length - 650);
  }
  function addRing(x, y, r, maxR, life, color, width) {
    if (!G) return;
    G.rings.push({ x, y, r, maxR, t: life, maxT: life, color, width: width || 2 });
  }
  function floatText(x, y, text, color, size) {
    if (!G) return;
    G.floaters.push({ x, y, text: String(text), color: color || '#fff0c0', size: size || 12, life: .9, maxLife: .9, vy: -31 });
    if (G.floaters.length > 145) G.floaters.splice(0, G.floaters.length - 145);
  }

  function updateSpawningAndWaves(dt) {
    updateSpawning(dt);
    if (G.waveClearLock) return;
    if (G.pendingSpawns <= 0 && G.enemies.filter(e => !e.dead).length === 0) {
      G.waveClearLock = true;
      if (G.wave >= 5) {
        if (!G.resultVictory) queueVictory();
      } else {
        onWaveClear();
      }
    }
  }

  function onWaveClear() {
    G.state = 'upgrade';
    mouse.down = false;
    if (G.player) G.player.firing = false;
    G.enemyBullets = [];
    G.score += 250 * G.wave;
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + 18);
    A.levelup();
    showUpgradeChoices();
  }

  function showUpgradeChoices() {
    const available = UPGRADE_POOL.filter(u => (G.upgrades[u.id] || 0) < u.max);
    const shuffled = available.slice().sort(() => Math.random() - .5).slice(0, 3);
    G.upgradeChoices = shuffled;
    const box = $('upgrade-cards');
    box.innerHTML = '';
    shuffled.forEach((u, idx) => {
      const level = G.upgrades[u.id] || 0;
      const card = document.createElement('button');
      card.className = 'upgrade-card';
      card.style.setProperty('--up-color', u.color);
      card.innerHTML = `<span class="upgrade-icon">${u.icon}</span><h3>${u.name}</h3><p>${u.desc}</p><span class="upgrade-level">LV ${level} → ${level + 1}</span>`;
      card.addEventListener('click', () => chooseUpgrade(u.id));
      box.appendChild(card);
    });
    el.upgrade.classList.remove('hidden');
    updateHUD();
  }

  function chooseUpgrade(id) {
    const u = UPGRADE_POOL.find(x => x.id === id);
    if (!u || !G) return;
    G.upgrades[id] = (G.upgrades[id] || 0) + 1;
    if (id === 'maxHp') { G.player.maxHp += 20; G.player.hp = Math.min(G.player.maxHp, G.player.hp + 20); }
    if (id === 'shield') { G.player.shield = Math.max(G.player.shield, 18 * G.upgrades.shield); G.player.shieldTimer = 10; }
    if (id === 'magnet') { /* drop chance is computed live */ }
    el.upgrade.classList.add('hidden');
    G.state = 'playing';
    G.waveClearLock = false;
    G.wave += 1;
    startWave(G.wave);
    toast(`${u.name} · LV ${G.upgrades[id]}`, 1300);
  }

  function updateHUD(force) {
    if (!G || !G.player) return;
    const p = G.player;
    $('hud-hp-fill').style.width = Math.max(0, p.hp / p.maxHp * 100) + '%';
    $('hud-hp-text').textContent = Math.ceil(p.hp) + ' / ' + Math.round(p.maxHp);
    $('hud-energy-fill').style.width = Math.min(100, p.energy) + '%';
    $('hud-energy-text').textContent = Math.floor(p.energy) + ' / 100';
    $('wave-number').textContent = String(Math.max(1, G.wave)).padStart(2, '0');
    $('wave-enemies').textContent = '敌人 ' + (G.enemies.filter(e => !e.dead).length + G.pendingSpawns);
    $('score-value').textContent = Math.round(G.score).toString();
    $('timer-value').textContent = fmtTime(G.playTime);
    const skillPct = p.skillCd > 0 ? Math.ceil(p.skillCd) : '';
    $('skill-cd').textContent = skillPct;
    $('skill-cd').classList.toggle('show', p.skillCd > 0.05);
    $('dash-cd').textContent = p.dashCd > 0 ? Math.ceil(p.dashCd) : '';
    $('dash-cd').classList.toggle('show', p.dashCd > 0.05);
    $('burst-cd').textContent = p.energy >= 100 ? '' : Math.floor(p.energy) + '%';
    $('burst-cd').classList.toggle('show', p.energy < 100);
    $('ability-skill').classList.toggle('ready', p.skillCd <= 0);
    $('ability-dash').classList.toggle('ready', p.dashCd <= 0);
    $('ability-burst').classList.toggle('charging', p.energy >= 100);
    $('ability-burst').classList.toggle('ready', p.energy >= 100);
    if (G.boss && !G.boss.dead) {
      $('boss-wrap').classList.remove('hidden');
      const frac = clamp(G.boss.hp / G.boss.maxHp, 0, 1);
      $('boss-hp-fill').style.width = frac * 100 + '%';
      $('boss-hp-text').textContent = Math.ceil(frac * 100) + '%';
      $('boss-phase').textContent = G.boss.phase === 1 ? 'PHASE I' : G.boss.phase === 2 ? 'PHASE II' : 'PHASE III';
    } else {
      if (force || G.state === 'playing') $('boss-wrap').classList.add('hidden');
      if (G.state === 'upgrade') $('boss-wrap').classList.add('hidden');
    }
    const combo = Math.max(1, 1 + G.kills * .01);
    $('combo-value').textContent = '× ' + combo.toFixed(2);
    $('combo-display').classList.toggle('show', G.kills > 0 && G.state === 'playing');
  }

  /* ============================================================
     Main update & render
     ============================================================ */
  function updateGame(dt) {
    if (!G) return;
    G.playTime += dt;
    if (G.state === 'playing') {
      updateSpawningAndWaves(dt);
      if (G.state === 'playing') updatePlayer(dt);
      if (G.state === 'playing') updatePlayerBullets(dt);
      cleanupDeadEnemies();
      if (G.state === 'playing') updateEnemies(dt);
      if (G.state === 'playing') updateEnemyBullets(dt);
      if (G.state === 'playing') updatePickups(dt);
      updateEffects(dt);
      if (G.state === 'playing') updateSpawningAndWaves(dt);
      updateHUD();
    } else if (G.state === 'victoryPending' || G.state === 'defeatPending') {
      updateEffects(dt);
      G.endTimer -= dt;
      updateHUD();
      if (G.endTimer <= 0) showResult(G.resultVictory);
    }
  }

  function drawTitleBackdrop(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.drawImage(bg, 0, 0);
    ctx.fillStyle = 'rgba(3,10,13,.74)';
    ctx.fillRect(0, 0, W, H);
    // giant elemental sigil
    ctx.save();
    ctx.translate(940, 380);
    ctx.rotate(t * .035);
    ctx.strokeStyle = 'rgba(242,209,139,.16)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, 230, 0, TAU); ctx.stroke();
    ctx.setLineDash([12, 24]);
    ctx.strokeStyle = 'rgba(92,224,193,.15)';
    ctx.beginPath(); ctx.arc(0, 0, 280, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(242,209,139,.1)';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const r = i % 2 ? 110 : 225;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
    ctx.restore();
    // character silhouettes / portraits from the supplied art
    const im1 = S.getCharacterImage(roster[0]);
    const im2 = S.getCharacterImage(roster[1]);
    if (im1) {
      const h = 470, w = h * im1.naturalWidth / im1.naturalHeight;
      ctx.globalAlpha = .18;
      ctx.drawImage(im1, 720 - w / 2 + Math.sin(t * .8) * 5, 250 + Math.sin(t * 1.3) * 4, w, h);
    }
    if (im2) {
      const h = 420, w = h * im2.naturalWidth / im2.naturalHeight;
      ctx.globalAlpha = .12;
      ctx.drawImage(im2, 1110 - w / 2 + Math.sin(t * .9 + 1) * 6, 300 + Math.sin(t * 1.2 + 2) * 4, w, h);
    }
    ctx.globalAlpha = 1;
    // drifting embers
    for (let i = 0; i < 38; i++) {
      const seed = i * 91.7;
      const x = (seed * 7 + t * (12 + i % 7) * .6) % W;
      const y = (seed * 13 - t * (8 + i % 5) * .45 + H * 2) % H;
      const a = .08 + (i % 5) * .035;
      ctx.fillStyle = i % 3 === 0 ? `rgba(242,209,139,${a})` : `rgba(92,224,193,${a})`;
      ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
    }
    ctx.restore();
  }

  function drawGame(t) {
    if (!G) { drawTitleBackdrop(t); return; }
    const p = G.player;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    const shx = G.shake > .2 ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake > .2 ? rand(-G.shake, G.shake) : 0;
    ctx.translate(shx, shy);

    ctx.drawImage(bg, 0, 0);
    S.drawWaypoint(ctx, WAYPOINT.x, WAYPOINT.y, t);
    for (const o of OBSTACLES) S.drawObstacle(ctx, o, t);

    drawZones(t);
    drawWarnings(t);
    for (const o of G.pickups) S.drawPickup(ctx, o, t);

    // y-sorted actors
    const actors = [];
    for (const e of G.enemies) if (!e.dead) actors.push({ kind:'enemy', y:e.y, e });
    actors.push({ kind:'player', y:p.y, p });
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) {
      if (a.kind === 'player') {
        S.drawHero(ctx, p.char, p.x, p.y + (p.dashTimer > 0 ? Math.sin(t * 35) * 2 : 0), {
          time: t, aim: p.aim, moving: p.moving, flash: p.hurtFlash,
          shield: p.shield, scale: 1
        });
      } else {
        const e = a.e;
        const yOff = e.type === 'slime' ? 4 : e.type === 'archer' ? 18 : e.type === 'brute' ? 30 : e.type === 'mage' ? 11 : 61;
        const er = Object.assign({}, e, { y: e.y + yOff, aim: e.aim, hitFlash: e.hitFlash });
        S.drawEnemy(ctx, er, t);
      }
    }
    // health bars and auras, drawn above actors
    for (const e of G.enemies) {
      if (e.dead) continue;
      const yOff = e.type === 'slime' ? 4 : e.type === 'archer' ? 18 : e.type === 'brute' ? 30 : e.type === 'mage' ? 11 : 61;
      S.drawEnemyBar(ctx, Object.assign({}, e, { y:e.y + yOff }));
      if (e.rootTimer > 0) {
        ctx.strokeStyle = 'rgba(165,238,110,.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 7, e.r + 7, e.r * .35, 0, 0, TAU); ctx.stroke();
      }
    }

    drawPlayerBullets(t);
    drawEnemyBullets(t);
    drawBeams();
    drawRings();
    drawParticles();
    drawFloaters();

    // mobile aiming guide
    if (isMobile && G.state === 'playing') {
      ctx.save();
      ctx.globalAlpha = .2;
      ctx.strokeStyle = elementColor(p.char);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 7); ctx.lineTo(p.x + Math.cos(p.aim) * 95, p.y - 7 + Math.sin(p.aim) * 95); ctx.stroke();
      ctx.restore();
    }

    // crosshair
    if (!isMobile && mouse.inside && G.state === 'playing') drawCrosshair(p);
    ctx.restore();

    // damage vignette
    if (p && p.hp / p.maxHp < .32) {
      const a = (.32 - p.hp / p.maxHp) * 1.4 + Math.sin(t * 7) * .025;
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .76);
      vg.addColorStop(0, 'rgba(120,10,9,0)');
      vg.addColorStop(1, `rgba(128,12,10,${Math.max(0, a)})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }
    if (G.flash > 0) {
      ctx.fillStyle = `rgba(255,244,218,${Math.min(.55, G.flash)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (G.hitStop > 0) G.hitStop = Math.max(0, G.hitStop - .016);
  }

  function drawZones(t) {
    for (const z of G.zones) {
      if (z.kind !== 'heal') continue;
      const alpha = Math.min(1, z.t / .6) * .32;
      const rg = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r);
      rg.addColorStop(0, `rgba(126,240,194,${alpha * .42})`);
      rg.addColorStop(.7, `rgba(86,195,180,${alpha * .18})`);
      rg.addColorStop(1, 'rgba(86,195,180,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
      ctx.save();
      ctx.globalAlpha = .35 + Math.sin(t * 3) * .07;
      ctx.strokeStyle = '#83efc9'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r * .92, 0, TAU); ctx.stroke();
      ctx.setLineDash([6, 10]); ctx.rotate ? null : null;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r * .67, t * .4, t * .4 + Math.PI * 1.5); ctx.stroke();
      ctx.restore();
    }
  }

  function drawWarnings(t) {
    for (const w of G.warnings) {
      const progress = 1 - w.t / w.total;
      const big = w.type === 'boss';
      const radius = (big ? 62 : 25) + progress * (big ? 34 : 7);
      ctx.save();
      ctx.globalAlpha = .3 + progress * .55;
      ctx.fillStyle = big ? 'rgba(255,84,63,.12)' : 'rgba(255,144,95,.18)';
      ctx.strokeStyle = big ? '#ff705c' : '#ffb078';
      ctx.lineWidth = big ? 3 : 1.4;
      ctx.beginPath(); ctx.arc(w.x, w.y, radius, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.setLineDash([5, 8]);
      ctx.beginPath(); ctx.arc(w.x, w.y, radius + 9 + Math.sin(t * 5) * 3, t * .8, t * .8 + Math.PI * 1.4); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = .1 + progress * .25;
      ctx.fillStyle = big ? '#ff705c' : '#ffbe82';
      ctx.fillRect(w.x - (big ? 4 : 2), w.y - 150 * progress, big ? 8 : 4, 150 * progress);
      ctx.restore();
    }
  }

  function drawPlayerBullets(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of G.bullets) {
      const el = EL[b.element] || EL.anemo;
      ctx.strokeStyle = el.color;
      ctx.globalAlpha = .22;
      ctx.lineWidth = b.r * 2.4;
      ctx.beginPath(); ctx.moveTo(b.prevX, b.prevY); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.globalAlpha = .85;
      ctx.fillStyle = el.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 2.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff6d8';
      ctx.beginPath(); ctx.arc(b.x - 1, b.y - 1, b.r * .55, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemyBullets(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of G.enemyBullets) {
      ctx.globalAlpha = .18;
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.6 + Math.sin(t * 9 + b.x) * 1.2, 0, TAU); ctx.fill();
      ctx.globalAlpha = .9;
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff3e3';
      ctx.beginPath(); ctx.arc(b.x - b.r * .25, b.y - b.r * .25, b.r * .38, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawBeams() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of G.beams) {
      const a = Math.max(0, b.life / b.maxLife);
      ctx.globalAlpha = a;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width;
      ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
      ctx.globalAlpha = a * .35;
      ctx.lineWidth = b.width * 4;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRings() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of G.rings) {
      const a = Math.max(0, r.t / r.maxT);
      ctx.globalAlpha = a * .7;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of G.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      const s = Math.max(1, p.size * Math.min(1, p.life / p.maxLife * 1.8));
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.restore();
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of G.floaters) {
      const a = Math.max(0, f.life / f.maxLife);
      ctx.globalAlpha = a;
      ctx.font = `700 ${f.size}px "Microsoft YaHei", sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(2,8,10,.72)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function drawCrosshair(p) {
    const col = elementColor(p.char);
    const x = mouse.x, y = mouse.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = .82;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
    ctx.globalAlpha = .45;
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.stroke();
    ctx.globalAlpha = .9;
    ctx.beginPath();
    ctx.moveTo(-18, 0); ctx.lineTo(-7, 0); ctx.moveTo(7, 0); ctx.lineTo(18, 0);
    ctx.moveTo(0, -18); ctx.lineTo(0, -7); ctx.moveTo(0, 7); ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.fillStyle = '#fff3cd';
    ctx.fillRect(-1.5, -1.5, 3, 3);
    ctx.restore();
  }

  function render(t) {
    if (!G) drawTitleBackdrop(t);
    else drawGame(t);
  }

  function tick(now) {
    const dt = Math.min(.034, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    titleAnimTime = now / 1000;
    detailAnimTime = now / 1000;
    if (G) updateGame(dt);
    if (!el.select.classList.contains('hidden') && now - (tick._lastDetail || 0) > 90) {
      tick._lastDetail = now;
      drawIntoCanvas($('detail-avatar'), roster[selectedIndex], detailAnimTime);
    }
    render(titleAnimTime);
    rafId = requestAnimationFrame(tick);
  }

  /* ============================================================
     Boot
     ============================================================ */
  function boot() {
    bindUI();
    updateOrientationHint();
    S.preloadCharacters(roster, () => {
      if (!el.select.classList.contains('hidden')) {
        populateRoster();
        selectCharacter(selectedIndex, false);
      }
    });
    updateHUD(true);
    requestAnimationFrame(tick);
    const params = new URLSearchParams(location.search);
    const mode = params.get('test');
    if (mode === 'select') setTimeout(openSelect, 220);
    if (mode === 'play') setTimeout(() => startGame(roster[0]), 220);
    if (mode === 'boss') {
      setTimeout(() => {
        startGame(roster[0]);
        setTimeout(() => {
          G.spawnQueue = [{ type:'boss', element:'electro' }];
          G.pendingSpawns = 1;
          G.wave = 5;
          G.spawnTimer = .1;
        }, 500);
      }, 220);
    }
  }

  boot();
})();






