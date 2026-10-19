/* ============================================================
   提瓦特 · 小小枪战 2D
   Procedural pixel sprite renderer
   ============================================================ */
(function () {
  'use strict';

  const EL = window.ELEMENTS;
  const ROSTER = window.TEYVAT_ROSTER;

  const DEFAULT_HAIR = [
    '#efd477', '#6b4030', '#d98d68', '#c9d7df', '#6e78a8',
    '#b99be0', '#dd91b4', '#5d403c', '#e9e4d2', '#8cc9ba',
    '#d86755', '#f0c6a2', '#8499d8', '#be8f4c'
  ];
  const SKIN = ['#f3c69d', '#eab888', '#f5d0ac', '#ddb08a', '#f8d7b8'];

  // Hand-tuned palettes for recognisable characters. Everyone else receives
  // a stable, element-tinted palette generated from their name.
  const PALETTES = {
    'Aether':       { hair:'#f2d474', outfit:'#34343e', accent:'#e7bd55', cape:'#c9a33e', eye:'#dfb548', style:0, accessory:0 },
    'Lumine':       { hair:'#f5d987', outfit:'#f2eee2', accent:'#86bdd0', cape:'#d7e5e7', eye:'#d9ad49', style:1, accessory:2 },
    'Paimon':       { hair:'#f4e8d0', outfit:'#f0e8da', accent:'#b58edb', cape:'#d6c9e9', eye:'#9a6bd0', style:2, accessory:3 },
    'Amber':        { hair:'#713f2e', outfit:'#b93f3b', accent:'#f7e8c8', cape:'#772d2c', eye:'#e5a13b', style:3, accessory:1 },
    'Kaeya':        { hair:'#284c74', outfit:'#1e3654', accent:'#71c7df', cape:'#122947', eye:'#70cfdf', style:2, accessory:6 },
    'Lisa':         { hair:'#7b523c', outfit:'#664184', accent:'#e8cc8d', cape:'#43265c', eye:'#9ad56f', style:0, accessory:2 },
    'Barbara':      { hair:'#f0d273', outfit:'#f4f0e5', accent:'#64a7d8', cape:'#a8d5ea', eye:'#65b8df', style:1, accessory:1 },
    'Razor':        { hair:'#b7c2c4', outfit:'#655850', accent:'#b9d6dc', cape:'#3e3733', eye:'#b64650', style:2, accessory:0 },
    'Bennett':      { hair:'#d6c5a4', outfit:'#d1d0b3', accent:'#d35342', cape:'#4e6b4e', eye:'#c35c47', style:3, accessory:4 },
    'Noelle':       { hair:'#d9dce0', outfit:'#4b4d55', accent:'#d8c4a0', cape:'#a9363b', eye:'#9cae8e', style:1, accessory:1 },
    'Fischl':       { hair:'#f0d47c', outfit:'#3e2c5b', accent:'#bd8bdf', cape:'#221835', eye:'#d45d74', style:1, accessory:6 },
    'Sucrose':      { hair:'#8bc8ce', outfit:'#e6e0c7', accent:'#79b7bf', cape:'#608b8c', eye:'#d7c04f', style:4, accessory:2 },
    'Ningguang':    { hair:'#ece5da', outfit:'#d5b9a4', accent:'#e1b861', cape:'#8f6239', eye:'#d75953', style:3, accessory:3 },
    'Beidou':       { hair:'#674539', outfit:'#4a3330', accent:'#b73f3a', cape:'#722727', eye:'#d65f50', style:0, accessory:6 },
    'Xiangling':    { hair:'#41312c', outfit:'#b64639', accent:'#f3c35b', cape:'#782b2d', eye:'#e0a844', style:1, accessory:1 },
    'Xingqiu':      { hair:'#335e86', outfit:'#506fa2', accent:'#e3dfc6', cape:'#2b476d', eye:'#8cc7d6', style:2, accessory:2 },
    'Chongyun':     { hair:'#b8d8e7', outfit:'#e6e8df', accent:'#6eacd0', cape:'#85b4c7', eye:'#699cc2', style:2, accessory:3 },
    'Jean':         { hair:'#f0d582', outfit:'#efeee5', accent:'#7194be', cape:'#b5c8d9', eye:'#70a9c6', style:3, accessory:1 },
    'Diluc':        { hair:'#9b3731', outfit:'#25262e', accent:'#bb443d', cape:'#11131a', eye:'#c3453d', style:2, accessory:0 },
    'Mona':         { hair:'#3d4270', outfit:'#292b4e', accent:'#8d86da', cape:'#15162f', eye:'#8fa3dc', style:1, accessory:3 },
    'Keqing':       { hair:'#76538e', outfit:'#4a356c', accent:'#d7c6e8', cape:'#8b6dad', eye:'#d4a8de', style:1, accessory:2 },
    'Qiqi':         { hair:'#b9b5d2', outfit:'#5b4774', accent:'#e3d596', cape:'#342645', eye:'#a98dd0', style:2, accessory:3 },
    'Venti':        { hair:'#29483d', outfit:'#4d836f', accent:'#d9c77d', cape:'#2d5a4a', eye:'#7ec6ac', style:1, accessory:2 },
    'Klee':         { hair:'#e9c36d', outfit:'#bb3e38', accent:'#f1dfb0', cape:'#6d2429', eye:'#d34a45', style:4, accessory:1 },
    'Diona':        { hair:'#cdd9db', outfit:'#43435d', accent:'#b8d7dd', cape:'#25263e', eye:'#7bd0d6', style:1, accessory:4 },
    'Zhongli':      { hair:'#4b382e', outfit:'#443b35', accent:'#d6a64b', cape:'#261f1b', eye:'#c79a3a', style:0, accessory:0 },
    'Ganyu':        { hair:'#4e7ea0', outfit:'#e4e6df', accent:'#ad8cd1', cape:'#8fb6cc', eye:'#d7819f', style:0, accessory:5 },
    'Hu Tao':       { hair:'#48312f', outfit:'#2f2a32', accent:'#d34b4e', cape:'#1d181e', eye:'#e57d69', style:1, accessory:3 },
    'Raiden Shogun':{ hair:'#79619d', outfit:'#4f3e76', accent:'#e6c6e7', cape:'#b7a3d7', eye:'#ce9fe0', style:0, accessory:3 },
    'Kaedehara Kazuha':{ hair:'#d7d1c5', outfit:'#d3d3cb', accent:'#b83b3e', cape:'#5a3834', eye:'#b94b50', style:2, accessory:1 },
    'Kamisato Ayaka':{ hair:'#cdd9e2', outfit:'#a9c8df', accent:'#e3edf0', cape:'#6a98b7', eye:'#78abc9', style:3, accessory:2 },
    'Yoimiya':      { hair:'#d7ab69', outfit:'#c7493e', accent:'#f1d194', cape:'#772a2e', eye:'#d14845', style:1, accessory:1 },
    'Sangonomiya Kokomi':{ hair:'#e3b7c5', outfit:'#eef0e9', accent:'#78b9d6', cape:'#a68bc0', eye:'#c27b9b', style:0, accessory:2 },
    'Yae Miko':     { hair:'#e3a5bd', outfit:'#f1ece1', accent:'#a74f7d', cape:'#c47c9e', eye:'#9d4c77', style:3, accessory:4 },
    'Nahida':       { hair:'#e9e9d4', outfit:'#eef1dd', accent:'#88c66e', cape:'#c7dbb7', eye:'#79b875', style:2, accessory:2 },
    'Furina':       { hair:'#dde9e9', outfit:'#f1f1e9', accent:'#4f8dc5', cape:'#83c9dc', eye:'#6db4d9', style:1, accessory:3 },
    'Navia':        { hair:'#e8cf79', outfit:'#6b4654', accent:'#d6b45a', cape:'#3e2b38', eye:'#d4aa44', style:0, accessory:1 },
    'Arlecchino':   { hair:'#e8e4db', outfit:'#3b2c34', accent:'#b9313c', cape:'#1e171c', eye:'#d5565c', style:2, accessory:5 },
    'Mavuika':      { hair:'#e35f46', outfit:'#2a2528', accent:'#f0b756', cape:'#6c1f22', eye:'#f0a044', style:2, accessory:1 }
  };

  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function paletteFor(c) {
    const p = PALETTES[c.en] || {};
    const h = hashString(c.en || c.zh);
    const el = EL[c.element] || EL.anemo;
    return {
      hair: p.hair || DEFAULT_HAIR[h % DEFAULT_HAIR.length],
      outfit: p.outfit || el.dark,
      accent: p.accent || el.color,
      cape: p.cape || el.dark,
      eye: p.eye || el.light,
      skin: p.skin || SKIN[(h >> 3) % SKIN.length],
      style: p.style != null ? p.style : (c.style || 0),
      accessory: p.accessory != null ? p.accessory : (c.accessory || 0)
    };
  }

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawHairBack(ctx, p, style) {
    if (style === 0) {
      px(ctx, -11, -41, 22, 25, p.hair);
      px(ctx, -13, -31, 5, 17, p.hair);
      px(ctx, 8, -31, 5, 17, p.hair);
    } else if (style === 1) {
      px(ctx, -10, -42, 20, 18, p.hair);
      px(ctx, -16, -36, 7, 18, p.hair);
      px(ctx, 9, -36, 7, 18, p.hair);
      px(ctx, -18, -21, 6, 6, p.hair);
      px(ctx, 12, -21, 6, 6, p.hair);
    } else if (style === 3) {
      px(ctx, -6, -49, 9, 10, p.hair);
      px(ctx, 1, -47, 12, 7, p.hair);
      px(ctx, -10, -40, 20, 15, p.hair);
    } else if (style === 4) {
      px(ctx, -11, -42, 22, 16, p.hair);
      px(ctx, -13, -30, 5, 10, p.hair);
      px(ctx, 8, -30, 5, 10, p.hair);
    } else {
      px(ctx, -10, -41, 20, 16, p.hair);
    }
  }

  function drawOutfit(ctx, p, style) {
    // torso
    px(ctx, -9, -28, 18, 15, p.outfit);
    px(ctx, -11, -27, 4, 8, p.outfit);
    px(ctx, 7, -27, 4, 8, p.outfit);
    px(ctx, -8, -14, 16, 5, p.cape);
    // accent trim
    px(ctx, -1, -27, 2, 13, p.accent);
    px(ctx, -9, -20, 18, 2, p.accent);
    if (style === 0) { // dress
      px(ctx, -12, -13, 24, 8, p.outfit);
      px(ctx, -14, -6, 28, 3, p.cape);
      px(ctx, -10, -12, 20, 2, p.accent);
    } else if (style === 1) { // twin-tail / frilled
      px(ctx, -12, -15, 5, 9, p.cape);
      px(ctx, 7, -15, 5, 9, p.cape);
      px(ctx, -9, -13, 18, 4, p.outfit);
    } else if (style === 2) { // coat
      px(ctx, -13, -15, 7, 12, p.cape);
      px(ctx, 6, -15, 7, 12, p.cape);
      px(ctx, -9, -13, 18, 5, p.outfit);
    } else if (style === 3) { // short cape
      px(ctx, 5, -24, 9, 12, p.cape);
      px(ctx, -11, -15, 22, 4, p.cape);
    } else { // short jacket
      px(ctx, -10, -14, 20, 3, p.cape);
      px(ctx, 5, -24, 5, 7, p.accent);
    }
  }

  function drawAccessory(ctx, p, accessory) {
    if (accessory === 1) { // ribbon
      px(ctx, 7, -42, 6, 4, p.accent);
      px(ctx, 11, -44, 4, 3, p.accent);
      px(ctx, 11, -38, 4, 3, p.accent);
    } else if (accessory === 2) { // flower
      px(ctx, -11, -40, 4, 4, p.accent);
      px(ctx, -13, -38, 2, 2, p.accent);
      px(ctx, -9, -37, 2, 2, p.accent);
      px(ctx, -11, -37, 2, 2, p.light || p.accent);
    } else if (accessory === 3) { // halo/crown
      px(ctx, -8, -48, 16, 1, p.accent);
      px(ctx, -2, -50, 4, 2, p.accent);
    } else if (accessory === 4) { // goggles
      px(ctx, -11, -36, 22, 3, p.cape);
      px(ctx, -7, -36, 5, 4, p.accent);
      px(ctx, 2, -36, 5, 4, p.accent);
    } else if (accessory === 5) { // horns/ears
      px(ctx, -12, -43, 3, 6, p.accent);
      px(ctx, 9, -43, 3, 6, p.accent);
    } else if (accessory === 6) { // eyepatch
      px(ctx, -8, -36, 7, 5, p.cape);
      px(ctx, -11, -35, 14, 1, p.accent);
    }
  }

  function drawGun(ctx, p, aim, moving, time) {
    const shoulderY = -22;
    ctx.save();
    ctx.translate(2, shoulderY);
    ctx.rotate(aim);
    // arm
    px(ctx, 0, -2, 8, 4, p.skin);
    px(ctx, 6, -3, 3, 6, p.outfit);
    // barrel / elemental gun
    px(ctx, 8, -3, 13, 5, p.cape);
    px(ctx, 9, -2, 10, 2, p.accent);
    px(ctx, 20, -4, 4, 7, p.accent);
    px(ctx, 10, 1, 6, 2, p.outfit);
    // muzzle glint
    if (moving) px(ctx, 25, -2, 2, 3, p.accent);
    ctx.restore();
  }

  function drawCharacter(ctx, c, x, y, opts) {
    const o = opts || {};
    const t = o.time || 0;
    const scale = o.scale || 1;
    const aim = o.aim == null ? 0 : o.aim;
    const moving = !!o.moving;
    const p = paletteFor(c);
    const walk = moving ? Math.sin(t * 13 + (o.phase || 0)) : 0;
    const bob = moving ? Math.abs(Math.sin(t * 13)) * 1.3 : Math.sin(t * 2.8) * 0.6;
    const flip = Math.cos(aim) < 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // shadow
    ctx.fillStyle = 'rgba(2,8,10,.32)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 14, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // element ground ring
    if (o.aura !== false) {
      const el = EL[c.element];
      ctx.save();
      ctx.globalAlpha = 0.18 + Math.sin(t * 3) * 0.04;
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 3, 19, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // shield
    if (o.shield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(t * 7) * 0.12;
      ctx.strokeStyle = '#f4bd52';
      ctx.fillStyle = 'rgba(244,189,82,.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -22, 25, 34, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    if (o.flash > 0) ctx.filter = 'brightness(2.4) saturate(.4)';

    // body facing
    ctx.save();
    if (flip) ctx.scale(-1, 1);
    ctx.translate(0, -bob);

    // legs
    const legOffset = moving ? walk * 2.4 : 0;
    px(ctx, -7, -8 + legOffset, 5, 8, p.outfit);
    px(ctx, 2, -8 - legOffset, 5, 8, p.outfit);
    px(ctx, -8, -2 + legOffset, 6, 3, p.cape);
    px(ctx, 2, -2 - legOffset, 6, 3, p.cape);

    drawHairBack(ctx, p, p.style);
    drawOutfit(ctx, p, p.style);

    // neck
    px(ctx, -3, -31, 6, 4, p.skin);
    // head
    px(ctx, -9, -43, 18, 14, p.skin);
    // ears
    px(ctx, -11, -37, 2, 4, p.skin);
    px(ctx, 9, -37, 2, 4, p.skin);

    // hair top
    px(ctx, -10, -47, 20, 7, p.hair);
    px(ctx, -11, -43, 4, 10, p.hair);
    px(ctx, 7, -43, 4, 10, p.hair);
    px(ctx, -6, -44, 12, 3, p.hair);
    // side fringe
    px(ctx, -7, -40, 5, 4, p.hair);
    px(ctx, 3, -40, 5, 4, p.hair);

    // eyes / face
    const eyeY = -37;
    if (p.accessory !== 6) {
      px(ctx, -6, eyeY, 2, 3, p.eye);
      px(ctx, 4, eyeY, 2, 3, p.eye);
      px(ctx, -6, eyeY, 2, 1, '#16171a');
      px(ctx, 4, eyeY, 2, 1, '#16171a');
    } else {
      px(ctx, -6, eyeY, 2, 3, p.eye);
      px(ctx, -6, eyeY, 2, 1, '#16171a');
    }
    px(ctx, -1, -32, 3, 1, 'rgba(80,45,45,.55)');
    drawAccessory(ctx, p, p.accessory);
    ctx.restore();

    // weapon uses true screen aim, so it can point anywhere
    drawGun(ctx, p, aim, moving, t);

    if (o.flash > 0) ctx.filter = 'none';
    ctx.restore();
  }

  function drawPortrait(ctx, c, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    const scale = Math.min(w / 62, h / 72);
    drawCharacter(ctx, c, w * 0.5, h * 0.92, {
      scale: scale, time: t || 0, aim: -0.08, moving: false, aura: false, phase: 0
    });
  }

  /* ---------------- enemies ---------------- */
  function enemyColors(enemy) {
    if (enemy.type === 'boss') return { main:'#66506b', dark:'#241c2f', light:'#e36e69', glow:'#ff6860' };
    if (enemy.element && EL[enemy.element]) {
      const el = EL[enemy.element];
      return { main: el.dark, dark: shade(el.dark, -18), light: el.color, glow: el.light };
    }
    if (enemy.type === 'archer') return { main:'#5c4a3d', dark:'#2e251f', light:'#b9a177', glow:'#8fceb0' };
    if (enemy.type === 'brute') return { main:'#544247', dark:'#2b2024', light:'#d7bf8c', glow:'#e7a45f' };
    if (enemy.type === 'mage') return { main:'#463569', dark:'#211936', light:'#b887db', glow:'#b078e3' };
    return { main:'#6d6d69', dark:'#343637', light:'#9e9f95', glow:'#d6c39b' };
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  function drawSlime(ctx, e, t) {
    const c = enemyColors(e);
    const bounce = Math.abs(Math.sin(t * 4 + e.seed)) * 5;
    const squash = 1 + Math.sin(t * 4 + e.seed) * .075;
    ctx.save();
    ctx.translate(e.x, e.y - bounce);
    ctx.scale(1 / squash, squash);
    ctx.fillStyle = c.dark;
    ctx.beginPath(); ctx.ellipse(0, 2, e.r + 4, e.r * .55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.main;
    ctx.beginPath(); ctx.ellipse(0, -3, e.r, e.r * .92, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.light;
    ctx.beginPath(); ctx.ellipse(-4, -9, e.r * .48, e.r * .3, -.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111318';
    ctx.beginPath(); ctx.ellipse(-5, -6, 2.8, 3.8, 0, 0, Math.PI * 2); ctx.ellipse(5, -6, 2.8, 3.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.glow;
    ctx.fillRect(-6, -7, 1.5, 1.5); ctx.fillRect(4.5, -7, 1.5, 1.5);
    ctx.restore();
  }

  function drawArcher(ctx, e, t) {
    const c = enemyColors(e);
    const aim = e.aim || 0;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = 'rgba(2,8,10,.28)';
    ctx.beginPath(); ctx.ellipse(0, 3, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
    const bob = Math.sin(t * 5 + e.seed) * 1.4;
    ctx.translate(0, bob);
    // legs
    px(ctx, -8, -8, 5, 8, c.dark); px(ctx, 3, -8, 5, 8, c.dark);
    px(ctx, -9, -2, 6, 3, '#1c1d21'); px(ctx, 3, -2, 6, 3, '#1c1d21');
    // body / hood
    px(ctx, -10, -27, 20, 17, c.main);
    px(ctx, -11, -24, 4, 10, c.dark); px(ctx, 7, -24, 4, 10, c.dark);
    px(ctx, -10, -14, 20, 4, c.dark);
    px(ctx, -7, -33, 14, 9, c.main);
    px(ctx, -9, -35, 18, 5, c.dark);
    px(ctx, -5, -31, 10, 5, '#27231e');
    px(ctx, -4, -29, 2, 2, c.glow); px(ctx, 2, -29, 2, 2, c.glow);
    // bow
    ctx.save();
    ctx.translate(7, -17);
    ctx.rotate(aim);
    ctx.strokeStyle = c.light;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(8, 0, 11, -1.05, 1.05); ctx.stroke();
    ctx.strokeStyle = 'rgba(230,226,207,.65)';
    ctx.lineWidth = .7;
    ctx.beginPath(); ctx.moveTo(13, -9); ctx.lineTo(5, 0); ctx.lineTo(13, 9); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function drawBrute(ctx, e, t) {
    const c = enemyColors(e);
    const bob = Math.sin(t * 3 + e.seed) * 1.2;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = 'rgba(2,8,10,.34)';
    ctx.beginPath(); ctx.ellipse(0, 5, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(0, bob);
    px(ctx, -15, -12, 10, 13, c.dark); px(ctx, 6, -12, 10, 13, c.dark);
    px(ctx, -17, -2, 11, 4, '#1d1c20'); px(ctx, 7, -2, 11, 4, '#1d1c20');
    px(ctx, -20, -38, 40, 28, c.main);
    px(ctx, -23, -33, 7, 17, c.dark); px(ctx, 16, -33, 7, 17, c.dark);
    px(ctx, -15, -43, 30, 9, c.dark);
    px(ctx, -13, -47, 26, 8, c.light);
    px(ctx, -8, -44, 5, 4, '#2d2022'); px(ctx, 4, -44, 5, 4, '#2d2022');
    px(ctx, -7, -43, 3, 1, c.glow); px(ctx, 5, -43, 3, 1, c.glow);
    // club
    ctx.save();
    ctx.translate(19, -24);
    ctx.rotate((e.aim || 0) + .5);
    px(ctx, 0, -3, 27, 6, c.dark);
    px(ctx, 22, -8, 12, 16, c.main);
    px(ctx, 25, -5, 6, 4, c.light);
    ctx.restore();
    ctx.restore();
  }

  function drawMage(ctx, e, t) {
    const c = enemyColors(e);
    const float = Math.sin(t * 3.2 + e.seed) * 7;
    ctx.save();
    ctx.translate(e.x, e.y - 8 - float);
    ctx.fillStyle = 'rgba(6,2,12,.3)';
    ctx.beginPath(); ctx.ellipse(0, 26 + float, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    // cloak
    ctx.fillStyle = c.main;
    ctx.beginPath(); ctx.moveTo(0, -31); ctx.lineTo(-15, 8); ctx.lineTo(-23, 25); ctx.lineTo(-8, 20); ctx.lineTo(0, 28); ctx.lineTo(9, 20); ctx.lineTo(23, 25); ctx.lineTo(15, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.dark;
    ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(-8, 15); ctx.lineTo(0, 20); ctx.lineTo(8, 15); ctx.closePath(); ctx.fill();
    // mask
    ctx.fillStyle = '#d7cad4';
    ctx.beginPath(); ctx.ellipse(0, -19, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.glow;
    ctx.beginPath(); ctx.arc(-4, -20, 2.4, 0, Math.PI * 2); ctx.arc(4, -20, 2.4, 0, Math.PI * 2); ctx.fill();
    // shield ring
    if (e.shield > 0) {
      ctx.strokeStyle = e.shieldElement && EL[e.shieldElement] ? EL[e.shieldElement].color : c.light;
      ctx.globalAlpha = .42 + Math.sin(t * 5) * .12;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -1, 31, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // orb
    ctx.fillStyle = c.glow;
    ctx.globalAlpha = .8;
    ctx.beginPath(); ctx.arc(17, -4, 5 + Math.sin(t * 5) * 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawBoss(ctx, e, t) {
    const c = enemyColors(e);
    const bob = Math.sin(t * 2.3) * 2;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = 'rgba(4,2,5,.48)';
    ctx.beginPath(); ctx.ellipse(0, 11, 55, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(0, bob);
    // lower armor / legs
    px(ctx, -38, -24, 25, 26, '#2b2632'); px(ctx, 13, -24, 25, 26, '#2b2632');
    px(ctx, -44, -4, 29, 9, c.dark); px(ctx, 15, -4, 29, 9, c.dark);
    px(ctx, -30, -12, 10, 17, c.main); px(ctx, 20, -12, 10, 17, c.main);
    // massive torso
    px(ctx, -46, -78, 92, 57, c.main);
    px(ctx, -54, -70, 12, 36, c.dark); px(ctx, 42, -70, 12, 36, c.dark);
    px(ctx, -38, -84, 76, 12, c.dark);
    px(ctx, -34, -70, 68, 7, '#3a3042');
    px(ctx, -25, -59, 50, 24, '#221c2a');
    // glowing core
    const pulse = .72 + Math.sin(t * 5) * .2;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = c.glow;
    ctx.beginPath(); ctx.arc(0, -56, 12, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = .28;
    ctx.beginPath(); ctx.arc(0, -56, 23, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // head
    px(ctx, -26, -111, 52, 28, c.dark);
    px(ctx, -20, -104, 40, 17, c.light);
    px(ctx, -16, -99, 12, 5, '#201820'); px(ctx, 4, -99, 12, 5, '#201820');
    px(ctx, -13, -98, 5, 2, c.glow); px(ctx, 8, -98, 5, 2, c.glow);
    // horns / antennae
    px(ctx, -31, -121, 5, 16, c.main); px(ctx, 26, -121, 5, 16, c.main);
    px(ctx, -33, -127, 9, 8, c.light); px(ctx, 24, -127, 9, 8, c.light);
    // arms
    px(ctx, -63, -67, 13, 43, c.dark);
    px(ctx, 50, -67, 13, 43, c.dark);
    px(ctx, -69, -30, 22, 14, c.main);
    px(ctx, 47, -30, 22, 14, c.main);
    ctx.restore();
  }

  function drawEnemy(ctx, e, t) {
    if (e.hitFlash > 0) ctx.filter = 'brightness(2) saturate(.35)';
    if (e.type === 'slime') drawSlime(ctx, e, t);
    else if (e.type === 'archer') drawArcher(ctx, e, t);
    else if (e.type === 'brute') drawBrute(ctx, e, t);
    else if (e.type === 'mage') drawMage(ctx, e, t);
    else if (e.type === 'boss') drawBoss(ctx, e, t);
    ctx.filter = 'none';
  }

  function drawEnemyBar(ctx, e) {
    if (e.type === 'boss') return;
    if (e.hp >= e.maxHp && e.type !== 'brute' && e.type !== 'mage') return;
    const w = e.type === 'brute' ? 45 : e.type === 'mage' ? 42 : 28;
    const y = e.y - (e.type === 'brute' ? 58 : e.type === 'mage' ? 51 : 29);
    px(ctx, e.x - w / 2 - 1, y - 1, w + 2, 5, 'rgba(0,0,0,.6)');
    px(ctx, e.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 3, e.type === 'brute' ? '#f0b054' : '#e46a59');
    if (e.aura && EL[e.aura.element]) {
      const el = EL[e.aura.element];
      ctx.fillStyle = el.color;
      ctx.beginPath(); ctx.arc(e.x + w / 2 + 7, y + 1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = .6; ctx.stroke();
    }
  }

  /* ---------------- pickups ---------------- */
  function drawPickup(ctx, p, t) {
    const bob = Math.sin(t * 5 + p.seed) * 3;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    const color = p.kind === 'hp' ? '#7be6a7' : p.kind === 'energy' ? '#f3d376' : '#d79bff';
    ctx.globalAlpha = .2;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, 0, 13 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(4,12,14,.86)';
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    if (p.kind === 'hp') { ctx.fillRect(-1.6, -4.5, 3.2, 9); ctx.fillRect(-4.5, -1.6, 9, 3.2); }
    else if (p.kind === 'energy') { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? 2.2 : 4.8; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  /* ---------------- arena ---------------- */
  function seeded(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function createArenaBackground(w, h) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const rnd = seeded(741923);
    // base field
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1b4b43'); g.addColorStop(.45, '#215847'); g.addColorStop(1, '#153634');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // grass blocks
    for (let y = 0; y < h; y += 32) {
      for (let x = 0; x < w; x += 32) {
        const v = rnd();
        ctx.fillStyle = v > .55 ? 'rgba(104,162,111,.045)' : 'rgba(7,23,27,.12)';
        ctx.fillRect(x, y, 32, 32);
        if (v > .86) {
          ctx.fillStyle = 'rgba(177,212,139,.12)';
          ctx.fillRect(x + 8 + (rnd() * 14 | 0), y + 9 + (rnd() * 12 | 0), 2, 5);
          ctx.fillRect(x + 10 + (rnd() * 10 | 0), y + 7 + (rnd() * 10 | 0), 1, 4);
        }
      }
    }
    // winding stone path
    ctx.save();
    ctx.strokeStyle = 'rgba(201,190,150,.10)'; ctx.lineWidth = 92; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-100, 575); ctx.bezierCurveTo(210, 530, 370, 310, 620, 336); ctx.bezierCurveTo(840, 360, 930, 575, 1390, 590); ctx.stroke();
    ctx.strokeStyle = 'rgba(229,215,170,.045)'; ctx.lineWidth = 64; ctx.stroke();
    ctx.restore();

    // central ley-line circle
    ctx.save();
    ctx.translate(w / 2, h / 2 - 2);
    ctx.globalAlpha = .3;
    ctx.strokeStyle = '#e8d394'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, 0, 82, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = .17;
    ctx.beginPath(); ctx.arc(0, 0, 107, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([7, 13]);
    ctx.beginPath(); ctx.arc(0, 0, 125, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    // star
    ctx.globalAlpha = .22;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const r = i % 2 === 0 ? 64 : 30;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
    // inner glow
    const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, 58);
    rg.addColorStop(0, 'rgba(125,242,214,.14)'); rg.addColorStop(1, 'rgba(125,242,214,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // stone tile patches
    ctx.save();
    ctx.globalAlpha = .2;
    for (let i = 0; i < 28; i++) {
      const x = 110 + rnd() * (w - 220), y = 100 + rnd() * (h - 200);
      const sw = 24 + rnd() * 32, sh = 12 + rnd() * 11;
      ctx.fillStyle = i % 3 === 0 ? '#9c9275' : '#768c78';
      ctx.fillRect(x, y, sw, sh);
      ctx.strokeStyle = 'rgba(7,20,20,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, sw - 1, sh - 1);
    }
    ctx.restore();

    // border stones / cliffs
    drawBorder(ctx, w, h, rnd);

    // trees and ruins outside playable area
    const trees = [
      [54, 110], [62, 600], [1210, 90], [1225, 640], [145, 42], [1060, 35], [110, 690], [1190, 690],
      [25, 315], [1250, 335], [360, 55], [935, 55], [895, 688], [430, 690]
    ];
    for (let i = 0; i < trees.length; i++) drawTree(ctx, trees[i][0], trees[i][1], 12 + (i % 3) * 3, i);

    // floating star motes baked in
    for (let i = 0; i < 44; i++) {
      ctx.globalAlpha = .12 + rnd() * .2;
      ctx.fillStyle = i % 4 === 0 ? '#f4d58d' : '#83e9cf';
      ctx.fillRect(70 + rnd() * (w - 140), 50 + rnd() * (h - 100), 1, 1);
    }
    ctx.globalAlpha = 1;
    return cv;
  }

  function drawBorder(ctx, w, h, rnd) {
    // painting border as chunky ancient stone
    ctx.save();
    for (let x = 0; x < w; x += 34) {
      const v = 20 + rnd() * 20;
      px(ctx, x, 0, 34, 30, `rgb(${40 + v},${52 + v},${47 + v})`);
      px(ctx, x + 3, 2, 28, 20, 'rgba(154,167,135,.12)');
      px(ctx, x, h - 28, 34, 28, `rgb(${32 + v},${44 + v},${41 + v})`);
    }
    for (let y = 0; y < h; y += 34) {
      const v = 16 + rnd() * 18;
      px(ctx, 0, y, 30, 34, `rgb(${37 + v},${49 + v},${46 + v})`);
      px(ctx, w - 30, y, 30, 34, `rgb(${32 + v},${45 + v},${41 + v})`);
    }
    // gold arena rim
    ctx.strokeStyle = 'rgba(234,205,142,.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(31.5, 31.5, w - 63, h - 63);
    ctx.strokeStyle = 'rgba(234,205,142,.08)';
    ctx.strokeRect(38.5, 38.5, w - 77, h - 77);
    ctx.restore();
  }

  function drawTree(ctx, x, y, r, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(2,8,8,.28)';
    ctx.beginPath(); ctx.ellipse(8, 16, r * 1.2, r * .4, 0, 0, Math.PI * 2); ctx.fill();
    px(ctx, -3, -2, 6, r * 1.45, '#574734');
    const colors = ['#245445', '#2d6450', '#39735b', '#1e4b3f'];
    for (let i = 0; i < 5; i++) {
      const a = i * 2.2 + seed;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * .6, -r * .8 + Math.sin(a) * r * .35, r * .9, r * .58, a * .2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(140,212,150,.12)';
    ctx.beginPath(); ctx.ellipse(-r * .4, -r * 1.15, r * .4, r * .18, -.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawObstacle(ctx, o, t) {
    const x = o.x, y = o.y, w = o.w, h = o.h;
    ctx.save();
    // shadow
    ctx.fillStyle = 'rgba(1,7,8,.35)';
    ctx.beginPath(); ctx.ellipse(x + w / 2 + 8, y + h + 8, w * .56, h * .42, 0, 0, Math.PI * 2); ctx.fill();
    // side face
    px(ctx, x, y + 8, w, h, '#4b574d');
    px(ctx, x + 5, y + h + 5, w - 10, 9, '#303a34');
    // top face
    px(ctx, x, y, w, h * .82, '#7f8873');
    px(ctx, x + 5, y + 5, w - 10, h * .82 - 10, '#939a80');
    // moss and cracks
    ctx.globalAlpha = .24;
    ctx.fillStyle = '#75a67a';
    ctx.fillRect(x + 8, y + 7, w * .35, 5);
    ctx.fillRect(x + w * .68, y + h * .28, 12, 3);
    ctx.globalAlpha = .3;
    ctx.strokeStyle = '#343f37'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + w * .35, y + 7); ctx.lineTo(x + w * .48, y + h * .42); ctx.lineTo(x + w * .44, y + h * .76); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w * .72, y + h * .18); ctx.lineTo(x + w * .64, y + h * .45); ctx.stroke();
    // glowing rune
    const a = .18 + Math.sin(t * 2 + x) * .04;
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#e8cc80'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x + w * .5, y + h * .45, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w * .5, y + h * .45 - 14); ctx.lineTo(x + w * .5, y + h * .45 + 14); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawWaypoint(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = .14 + Math.sin(t * 2) * .03;
    ctx.fillStyle = '#72e7cc';
    ctx.beginPath(); ctx.ellipse(0, 0, 36, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = .65 + Math.sin(t * 3) * .08;
    ctx.strokeStyle = '#a4f4df'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const s = 18 + i * 8 + Math.sin(t * 1.5 + i) * 2;
      ctx.beginPath(); ctx.ellipse(0, 0, s, s * .36, t * .4 + i, 0, Math.PI * 2); ctx.stroke();
    }
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
    glow.addColorStop(0, 'rgba(128,255,226,.28)'); glow.addColorStop(1, 'rgba(128,255,226,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  window.Sprites = {
    paletteFor, drawCharacter, drawPortrait, drawEnemy, drawEnemyBar, drawPickup,
    createArenaBackground, drawObstacle, drawWaypoint, drawTree, drawBorder,
    hashString, shade
  };
})();

/* ============================================================
   User-supplied character art integration
   ============================================================ */
(function () {
  'use strict';
  const S = window.Sprites;
  const EL = window.ELEMENTS;
  const oldPortrait = S.drawPortrait;
  const cache = new Map();
  let pending = 0;

  function preload(roster, onReady) {
    pending = 0;
    const done = () => {
      pending--;
      if (pending <= 0 && onReady) onReady();
    };
    roster.forEach(ch => {
      ['img', 'portrait', 'sprite'].forEach(key => {
        if (!ch[key] || cache.has(ch[key])) return;
        pending++;
        const im = new Image();
        im.onload = done;
        im.onerror = done;
        im.src = ch[key];
        cache.set(ch[key], im);
      });
    });
    if (pending === 0 && onReady) onReady();
  }

  function loaded(ch, key) {
    const im = cache.get(ch[key || 'img']);
    return im && im.complete && im.naturalWidth > 0 ? im : null;
  }

  function drawFitted(ctx, im, w, h, bottomPad, alpha, t, breathe) {
    const padX = w * .045, padY = h * .025;
    const scale = Math.min((w - padX * 2) / im.naturalWidth, (h - padY * 2) / im.naturalHeight);
    const dw = im.naturalWidth * scale, dh = im.naturalHeight * scale;
    const bob = breathe ? Math.sin((t || 0) * 2.1) * 1.6 : 0;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(im, (w - dw) / 2, h - dh - (bottomPad || 0) + bob, dw, dh);
    ctx.restore();
  }

  // Keep the generated procedural avatar as fallback, but use the supplied
  // pixel art whenever it is loaded.
  S.drawPortrait = function (ctx, ch, w, h, t) {
    const pim = loaded(ch, 'portrait');
    if (!pim) return oldPortrait(ctx, ch, w, h, t);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    const glow = ctx.createRadialGradient(w / 2, h * .6, 2, w / 2, h * .6, w * .55);
    const col = (EL[ch.element] || EL.anemo).color;
    glow.addColorStop(0, col + '2c');
    glow.addColorStop(1, col + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    drawFitted(ctx, pim, w, h, 1, 1, t, true);
  };

  S.getCharacterImage = function (ch) { return loaded(ch, 'img'); };
  S.preloadCharacters = preload;

  S.drawHero = function (ctx, ch, x, y, opts) {
    const o = opts || {};
    const t = o.time || 0;
    const aim = o.aim == null ? 0 : o.aim;
    const moving = !!o.moving;
    const scale = o.scale || 1;
    const im = loaded(ch, 'img');
    const el = EL[ch.element] || EL.anemo;
    const p = S.paletteFor(ch);
    const bob = moving ? Math.abs(Math.sin(t * 11)) * 2.2 : Math.sin(t * 2.8) * .9;

    ctx.save();
    // shadow
    ctx.fillStyle = 'rgba(2,8,10,.36)';
    ctx.beginPath();
    ctx.ellipse(x, y + 24 * scale, 20 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // element ring
    if (o.aura !== false) {
      ctx.save();
      ctx.globalAlpha = .18 + Math.sin(t * 3) * .04;
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, y + 24 * scale, 24 * scale, 8 * scale, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // shield
    if (o.shield > 0) {
      ctx.save();
      ctx.globalAlpha = .34 + Math.sin(t * 7) * .11;
      ctx.strokeStyle = ch.element === 'cryo' ? '#bdefff' : '#f4bd52';
      ctx.fillStyle = ch.element === 'cryo' ? 'rgba(169,232,255,.07)' : 'rgba(244,189,82,.08)';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.ellipse(x, y - 3 * scale, 28 * scale, 39 * scale, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    if (im) {
      const targetH = 96 * scale * (ch.scale || 1);
      const ratio = im.naturalWidth / im.naturalHeight;
      const targetW = targetH * ratio;
      ctx.save();
      ctx.translate(x, y + bob - (moving ? 1 : 0));
      if (moving) ctx.rotate(Math.sin(t * 11) * .018);
      if (o.flash > 0) ctx.filter = 'brightness(2.25) saturate(.45)';
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
      ctx.drawImage(im, -targetW / 2, 25 * scale - targetH, targetW, targetH);
      ctx.restore();
    } else {
      S.drawCharacter(ctx, ch, x, y + 14, { aim, time: t, moving, flash: o.flash });
    }

    // Elemental sidearm. It rotates independently from the sprite, giving the
    // front-facing pixel portrait a readable twin-stick aim direction.
    ctx.save();
    ctx.translate(x, y - 7 * scale);
    ctx.rotate(aim);
    ctx.fillStyle = 'rgba(2,7,9,.28)';
    ctx.fillRect(3, -2.5, 27 * scale, 5 * scale);
    ctx.fillStyle = p.outfit;
    ctx.fillRect(5, -4 * scale, 22 * scale, 8 * scale);
    ctx.fillStyle = p.accent;
    ctx.fillRect(7, -3 * scale, 15 * scale, 3 * scale);
    ctx.fillStyle = el.color;
    ctx.fillRect(25 * scale, -4.5 * scale, 5 * scale, 9 * scale);
    ctx.globalAlpha = .28;
    ctx.fillStyle = el.light;
    ctx.fillRect(26 * scale, -3 * scale, 8 * scale, 5 * scale);
    ctx.restore();
    ctx.restore();
  };
})();


