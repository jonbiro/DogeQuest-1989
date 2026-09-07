import { createWorld, update, WORLDS } from "./world.js";
import { draw, dog } from "./render.js";

const $ = (id) => document.getElementById(id);
const canvas = $("world"),
  ctx = canvas.getContext("2d");
function resize() {
  canvas.width = window.innerWidth <= 600 ? 640 : 960;
  ctx.imageSmoothingEnabled = false;
}
resize();
window.addEventListener("resize", resize);
let world = createWorld(0),
  index = 0,
  state = "menu",
  clock = 0,
  last = 0,
  accumulator = 0,
  particles = [],
  audio = null,
  sound = true;
let keys = new Set(),
  jumpPressed = false,
  jumpReleased = false;
let records = [];
try {
  const saved = JSON.parse(localStorage.getItem("puppy-quest-v3") || "[]");
  if (Array.isArray(saved)) records = saved.slice(0, 5);
} catch {
  /* Storage is optional. */
}
function tone(freq, duration = 0.1) {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.045, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    /* Silent play remains available. */
  }
}
function announce(text) {
  $("status").textContent = text;
}
function clearInput() {
  keys.clear();
  jumpPressed = false;
  jumpReleased = false;
}
function showPanel(which) {
  $("hud").inert = which !== null;
  for (const id of ["menu", "pause", "result"]) $(id).hidden = id !== which;
  $("hud").hidden = which === "menu";
  $("touch").hidden = which !== null;
  $("world").inert = which !== null;
}
function start(n = 0) {
  index = n;
  world = createWorld(n);
  particles = [];
  clearInput();
  state = "playing";
  showPanel(null);
  $("world-name").textContent = WORLDS[n].name;
  $("world-number").textContent = `${String(n + 1).padStart(2, "0")} / 05`;
  $("world").focus({ preventScroll: true });
  announce(WORLDS[n].name + ". Reach the doghouse. Bones are optional.");
  tone(440);
}
function pause() {
  if (state !== "playing") return;
  state = "paused";
  clearInput();
  showPanel("pause");
  $("resume").focus();
}
function resume() {
  state = "playing";
  showPanel(null);
  clearInput();
  $("world").focus();
}
function menu() {
  state = "menu";
  clearInput();
  world = createWorld(0);
  showPanel("menu");
  refreshProgress();
  $("hint").textContent = "Made for a little break in your day.";
  $("play").focus();
}
function finish() {
  state = "result";
  clearInput();
  tone(880, 0.4);
  const stars =
    1 +
    (world.collected >= Math.ceil(world.bones.length * 0.65) ? 1 : 0) +
    (world.deaths === 0 ? 1 : 0);
  const old = records[index];
  records[index] = {
    stars: Math.max(stars, Number(old?.stars) || 0),
    time: Math.min(world.time, Number(old?.time) || Infinity),
  };
  try {
    localStorage.setItem("puppy-quest-v3", JSON.stringify(records));
  } catch {
    /* Storage is optional. */
  }
  $("result-title").textContent =
    index === 4 ? "Welcome home, good dog." : "Very good adventuring.";
  $("result-copy").textContent =
    index === 4
      ? "Five little journeys. One very happy puppy."
      : "Take a breath. There is more world to sniff.";
  $("stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
  $("stars").setAttribute("aria-label", `${stars} of 3 stars earned`);
  $("result-bones").textContent = `${world.collected} / ${world.bones.length}`;
  $("result-time").textContent = `${world.time.toFixed(1)}s`;
  $("result-retries").textContent = world.deaths;
  $("next").textContent =
    index === 4 ? "Back to the backyard →" : "On to the next adventure →";
  showPanel("result");
  $("next").focus();
  announce("Course complete. " + stars + " stars.");
}
$("play").onclick = () => start();
$("resume").onclick = resume;
$("restart").onclick = () => start(index);
$("quit").onclick = menu;
$("pause-button").onclick = pause;
$("next").onclick = () => start((index + 1) % 5);
$("replay").onclick = () => start(index);
$("result-menu").onclick = menu;
$("sound").onclick = () => {
  sound = !sound;
  $("sound").textContent = sound ? "Sound on" : "Sound off";
  $("sound").setAttribute("aria-pressed", String(sound));
  if (sound) tone(500);
};
window.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && (state === "paused" || state === "result")) {
    const panel = state === "paused" ? $("pause") : $(state);
    const buttons = [...panel.querySelectorAll("button")];
    if (e.shiftKey && document.activeElement === buttons[0]) {
      e.preventDefault();
      buttons.at(-1).focus();
    } else if (!e.shiftKey && document.activeElement === buttons.at(-1)) {
      e.preventDefault();
      buttons[0].focus();
    }
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    if (state === "playing") pause();
    else if (state === "paused") resume();
    return;
  }
  if (
    state === "menu" &&
    e.key === "Enter" &&
    document.activeElement?.tagName !== "BUTTON"
  ) {
    e.preventDefault();
    start();
    return;
  }
  if (state !== "playing") return;
  if (
    [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "Space",
      "KeyA",
      "KeyD",
      "KeyW",
      "ShiftLeft",
      "ShiftRight",
    ].includes(e.code)
  ) {
    e.preventDefault();
    if (
      ["ArrowUp", "Space", "KeyW"].includes(e.code) &&
      !e.repeat &&
      !keys.has(e.code)
    )
      jumpPressed = true;
    keys.add(e.code);
  }
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
  if (["ArrowUp", "Space", "KeyW"].includes(e.code)) jumpReleased = true;
});
window.addEventListener("blur", () => {
  clearInput();
  pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
for (const button of document.querySelectorAll("[data-key]")) {
  const key = button.dataset.key;
  button.onpointerdown = (e) => {
    if (state !== "playing") return;
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    keys.add(key);
    if (key === "Space") jumpPressed = true;
  };
  const release = () => {
    keys.delete(key);
    if (key === "Space") jumpReleased = true;
  };
  button.onpointerup = release;
  button.onpointercancel = release;
  button.onlostpointercapture = release;
}
function frame(time) {
  const dt = Math.min(0.05, (time - last) / 1000 || 0);
  last = time;
  clock += dt;
  if (state === "playing") {
    accumulator += dt;
    while (accumulator >= 1 / 120) {
      update(
        world,
        {
          direction:
            (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) -
            (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0),
          run: keys.has("ShiftLeft") || keys.has("ShiftRight"),
          jumpPressed,
          jumpReleased,
        },
        1 / 120,
      );
      jumpPressed = false;
      jumpReleased = false;
      accumulator -= 1 / 120;
      if (world.finished) break;
    }
    for (const event of world.events) {
      const color =
        event.type === "bone"
          ? "#fff8d5"
          : event.type === "gold"
            ? "#efb43f"
            : "#e37d59";
      for (let i = 0; i < 10; i++)
        particles.push({
          x: event.x + 15,
          y: event.y,
          vx: (Math.random() - 0.5) * 130,
          vy: -Math.random() * 140,
          life: 0.55,
          size: 3,
          color,
        });
      if (event.type === "checkpoint") {
        announce("Checkpoint! Your next retry starts here.");
        $("hint").textContent = "Checkpoint saved. Keep going, good dog.";
        tone(660, 0.2);
      }
      if (event.type === "respawn") {
        announce("Try again. Unlimited retries.");
        tone(180, 0.15);
      }
      if (event.type === "bone" || event.type === "gold")
        tone(event.type === "gold" ? 990 : 740);
      if (event.type === "jump") tone(330, 0.055);
    }
    world.events = [];
    for (const part of particles) {
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vy += 350 * dt;
      part.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
    $("bones").textContent = `${world.collected} / ${world.bones.length}`;
    $("timer").textContent = `${Math.floor(world.time)}s`;
    $("progress").value = world.player.x / world.spec.length;
    if (!world.checkpoint)
      $("hint").textContent =
        world.player.x < 400
          ? "Move with A / D · Jump with Space · Jump again in the air"
          : world.player.x < 950
            ? "Hold Shift to run. You can jump twice."
            : "Find the flag for a checkpoint. The doghouse is your goal.";
    if (world.finished) finish();
  } else accumulator = 0;
  draw(ctx, world, clock, particles, state === "menu");
  requestAnimationFrame(frame);
}
const portrait = $("portrait").getContext("2d");
dog(portrait, 62, 54, 1, 0, false, 3);
function refreshProgress() {
  const completed = records.filter(
    (record) => Number(record?.stars) > 0,
  ).length;
  $("continue").hidden = completed === 0;
  $("saved-progress").hidden = completed === 0;
  $("saved-progress").textContent =
    `${completed} / 5 trails explored · ${records.reduce((sum, record) => sum + Math.min(3, Math.max(0, Number(record?.stars) || 0)), 0)} / 15 stars`;
}
$("continue").onclick = () => {
  const next = WORLDS.findIndex((_, i) => !(Number(records[i]?.stars) > 0));
  start(next < 0 ? 0 : next);
};
refreshProgress();
$("play").focus({ preventScroll: true });
requestAnimationFrame(frame);
