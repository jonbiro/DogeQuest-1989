function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
function oval(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}
export function dog(c, x, y, face = 1, time = 0, moving = false, scale = 1, crouch = false) {
  c.save();
  // A tuck squashes vertically about planted feet: the head drops below the
  // vine line while the paws stay on the ground. Math: feet at local +19 must
  // land on the hitbox bottom, so the origin shifts down and Y compresses.
  c.translate(Math.round(x + 15), Math.round(y + (crouch ? 8.5 : 17)));
  c.scale(face * scale, scale * (crouch ? 0.5 : 1));
  const step = moving ? Math.sin(time * 22) * 3 : 0;
  rect(c, -17, 0, 28, 15, "#c47c3e");
  rect(c, -15, -3, 26, 13, "#e9ac65");
  rect(c, -14, 12 + step, 7, 7, "#fff1d7");
  rect(c, 5, 12 - step, 7, 7, "#fff1d7");
  rect(c, -23, -8, 7, 14, "#e9ac65");
  rect(c, -25, -10, 7, 6, "#fff1d7");
  rect(c, 0, -15, 21, 22, "#e9ac65");
  rect(c, 0, -23, 7, 12, "#c47c3e");
  rect(c, 15, -23, 7, 12, "#c47c3e");
  rect(c, 2, -20, 3, 6, "#e7a08a");
  rect(c, 17, -20, 3, 6, "#e7a08a");
  rect(c, 7, -2, 18, 9, "#fff1d7");
  rect(c, 21, -3, 5, 5, "#283b34");
  // A slow blink keeps the buddy alive between adventures. Eyelid, not glint.
  if ((time % 3.7) < 0.12) {
    rect(c, 14, -8, 4, 1, "#283b34");
  } else {
    rect(c, 14, -10, 4, 5, "#283b34");
    rect(c, 14, -10, 2, 2, "#fff");
  }
  rect(c, -1, 5, 18, 5, "#e35e45");
  rect(c, -6, 8, 8, 9, "#e35e45");
  c.restore();
}
export function draw(c, world, t, particles, attract = false, reducedMotion = false) {
  const { spec, player: p } = world;
  const width = c.canvas.width,
    height = 540;
  const target = Math.max(0, Math.min(spec.length - width, p.x - width * 0.32));
  world.camera = attract ? 0 : world.camera + (target - world.camera) * 0.12;
  const cam = world.camera;
  // A vertical grade gives each world depth the flat fill lacked; night
  // worlds get deterministic stars above the hills.
  const grade = c.createLinearGradient(0, 0, 0, height);
  grade.addColorStop(0, spec.sky);
  grade.addColorStop(1, spec.horizon || spec.sky);
  c.fillStyle = grade;
  c.fillRect(0, 0, width, height);
  oval(c, 780 - cam * 0.04, 96, 44, 44, spec.sun || "#fff0be");
  if (spec.stars) {
    for (let i = 0; i < 40; i++) {
      const x = (((i * 197 - cam * 0.02) % (width + 40)) + width + 40) % (width + 40) - 20;
      const y = (i * 131) % 210 + 8;
      const twinkle = 0.45 + 0.4 * Math.sin(t * 2 + i * 1.7);
      c.globalAlpha = Math.max(0.1, Math.min(1, twinkle));
      rect(c, x, y, 2, 2, "#f4f1de");
    }
    c.globalAlpha = 1;
  }
  for (let i = 0; i < 8; i++) {
    const x = ((((i * 251 - cam * 0.12) % 1200) + 1200) % 1200) - 100;
    oval(c, x, 75 + (i % 3) * 31, 50, 13, "#edf2df");
    oval(c, x + 30, 68 + (i % 3) * 31, 32, 20, "#edf2df");
  }
  for (let i = 0; i < 10; i++) {
    const x = i * 220 - cam * 0.22;
    oval(c, x, 405, 180, 130 + (i % 3) * 25, spec.far);
  }
  for (let i = 0; i < 18; i++) {
    const x = i * 240 - cam * 0.55;
    rect(c, x, 267, 14, 165, "#3d5147");
    oval(c, x + 7, 265, 49, 67, spec.far);
    oval(c, x - 22, 292, 37, 44, spec.far);
  }
  c.save();
  c.translate(-Math.round(cam), 0);
  for (const s of world.solids) {
    if (s.x + s.w < cam || s.x > cam + width) continue;
    rect(c, s.x, s.y, s.w, s.h, spec.dirt);
    rect(c, s.x, s.y, s.w, 9, spec.grass);
    rect(c, s.x, s.y + 9, s.w, 5, "#47684f");
    for (let x = s.x + 13; x < s.x + s.w - 6; x += 29) {
      rect(c, x, s.y - 4, 3, 6, spec.grass);
      rect(c, x + 8, s.y + 23, 5, 3, "#9d7357");
    }
    if (s.y === 430)
      for (let x = s.x + 40; x < s.x + s.w - 20; x += 101) {
        rect(c, x, s.y - 12, 2, 12, spec.grass);
        rect(c, x - 3, s.y - 14, 8, 5, x % 2 ? "#f6d778" : "#fff1d7");
      }
  }
  // Moving platforms share the plank look with a pale rim so the motion reads
  // before the ferry does.
  for (const m of world.movers || []) {
    if (m.x + m.w < cam || m.x > cam + width) continue;
    rect(c, m.x, m.y, m.w, m.h, spec.dirt);
    rect(c, m.x, m.y, m.w, 9, "#e8e4c8");
    rect(c, m.x, m.y + 9, m.w, 5, "#47684f");
  }
  // Fences and hand-painted signs give the opening a readable direction.
  for (let x = 20; x < 240; x += 26) {
    rect(c, x, 400, 7, 30, "#efe4c4");
    rect(c, x, 407, 26, 5, "#efe4c4");
  }
  rect(c, 295, 380, 6, 50, "#805d45");
  rect(c, 263, 361, 78, 28, "#fff1d7");
  c.fillStyle = "#385a46";
  c.font = "bold 16px monospace";
  c.fillText("HOME →", 270, 380);
  for (const sign of world.signs || []) {
    rect(c, sign.x + 29, 380, 6, 50, "#805d45");
    rect(c, sign.x, 361, 64, 28, "#fff1d7");
    c.fillStyle = "#385a46";
    c.font = "bold 13px monospace";
    c.fillText(sign.text, sign.x + 7, 380);
  }
  // Hanging vines: thin strands a tucked puppy slips under. They read as
  // hazards, never footing, so they dangle without a branch to stand on.
  for (const v of world.vines || []) {
    if (v.x + v.w < cam || v.x > cam + width) continue;
    for (const dx of [4, 12, 20]) {
      rect(c, v.x + dx, 322, 3, 82, "#47684f");
      oval(c, v.x + dx + 1, 326 + ((v.x + dx) % 23), 6, 9, spec.grass);
    }
    rect(c, v.x, 398, 26, 6, "#3d5147");
  }
  const flagX = spec.checkpoint;
  rect(c, flagX, 350, 5, 80, "#fff1d7");
  rect(c, flagX + 5, 351, 34, 23, world.checkpoint ? "#e35e45" : "#829486");
  for (const b of world.bones) {
    if (b.taken || b.x < cam - 30 || b.x > cam + width + 30) continue;
    const y = b.y + Math.sin(t * 3 + b.x) * 3,
      color = b.gold ? "#f4ba47" : "#fff9df";
    oval(c, b.x + 10, y + 8, 16, 13, b.gold ? "#e9c87666" : "#ffffff22");
    // Dark edge keeps bones legible on bright Honeyhill paving.
    rect(c, b.x + 2, y + 4, 17, 8, "#5b341b");
    rect(c, b.x + 3, y + 5, 15, 6, color);
    for (const [x, dy] of [
      [0, 1],
      [0, 9],
      [17, 1],
      [17, 9],
    ]) {
      rect(c, b.x + x - 1, y + dy - 1, 8, 8, "#5b341b");
      rect(c, b.x + x, y + dy, 6, 6, color);
    }
  }
  for (const e of world.enemies)
    if (e.alive) {
      // One silhouette, three coats: patrols rust, hoppers moss, chargers dusk
      // purple. All three read against every dirt palette in the five worlds.
      const coat = e.kind === 'hopper' ? '#7a9e43' : e.kind === 'charger' ? '#8a4f6d' : '#ae614c';
      const bounce = e.kind === 'hopper' && e.y < 406 ? -3 : 0;
      oval(c, e.x + 15, e.y + 15, 19, 13, "#283b34");
      oval(c, e.x + 15, e.y + 15 + bounce, 18, 12, coat);
      rect(c, e.x, e.y + 18, 30, 6, "#3d2b23");
      rect(c, e.x + 5, e.y + 5, 4, 5, "#fff1d7");
      rect(c, e.x + 20, e.y + 5, 4, 5, "#fff1d7");
    }
  // A real destination: the doghouse is always open, bones are optional.
  const home = spec.length - 120;
  rect(c, home - 10, 354, 84, 76, "#c87854");
  c.fillStyle = "#744b44";
  c.beginPath();
  c.moveTo(home - 25, 360);
  c.lineTo(home + 32, 313);
  c.lineTo(home + 89, 360);
  c.fill();
  oval(c, home + 32, 402, 19, 29, "#3d5147");
  rect(c, home + 13, 402, 38, 28, "#3d5147");
  rect(c, home + 6, 361, 53, 17, "#fff1d7");
  c.fillStyle = "#49624a";
  c.font = "bold 11px monospace";
  c.fillText("HOME", home + 18, 374);
  oval(c, p.x + 15, 430, 21, 4, "#263c3322");
  if (p.invincible <= 0 || Math.floor(t * 12) % 2 === 0)
    dog(c, p.x, p.y, p.face, t, Math.abs(p.vx) > 20 && !reducedMotion, 1, p.ducking);
  for (const part of particles)
    rect(c, part.x, part.y, part.size, part.size, part.color);
  c.restore();
  if (!attract) {
    const remaining = spec.length - p.x;
    if (remaining > 800) {
      c.fillStyle = "#35564a";
      c.font = "bold 13px monospace";
      c.textAlign = "right";
      c.fillText("HOME →", width - 33, 509);
      c.textAlign = "left";
    }
  }
}
