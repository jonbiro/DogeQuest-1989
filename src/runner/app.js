import { createRun, act, step } from "./world.js";
import { createView } from "./render.js";
import { UPGRADES, levels, price, purchase } from "./progression.js";
import { missionFor, missionProgress } from "./missions.js";
import { bankRun } from "./rewards.js";
import {REGIONS,regionAt} from "./regions.js";
import {preferencesFrom} from "./preferences.js";
import {readStoredProfile,writeStoredProfile} from "./storage.js";
import {CUES,playNotes,stopSound} from "./sound.js";
import { PUPPIES, COSTUMES, PRIZES, collectionFrom, equipOrBuy, prizeProgress } from "./collection.js";
const $ = (id) => document.getElementById(id);
let run = createRun(),
  state = "menu",
  last = 0,
  time = 0,
  accumulator = 0,
  toastUntil = 0,
  sound = false,
  audio = null;
let graphicsReady = false;
let storageAvailable = true;
let profileReadable = true;
let reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
let saved = {
  best: 0,
  bones: 0,
  bestRunBones: 0,
  distance: 0,
  credits: 0,
  challenges: 0,
  upgrades: levels(),
  collection: collectionFrom(),
  preferences: preferencesFrom(null,reducedMotion),
};
try {
  const {value,available} = readStoredProfile(localStorage);
  storageAvailable=available;
  profileReadable=available;
  for (const key of Object.keys(saved))
    if (key !== "upgrades" && Number.isFinite(value?.[key]) && value[key] >= 0)
      saved[key] = value[key];
  saved.upgrades = levels(value?.upgrades);
  saved.collection = collectionFrom(value?.collection);
  saved.preferences = preferencesFrom(value?.preferences,reducedMotion);
  saved.challenges = Math.floor(saved.challenges);
} catch {
  storageAvailable=false;
  profileReadable=false;
}
sound=saved.preferences.sound;
reducedMotion=saved.preferences.reducedMotion;
function updateRecords() {
  updateSaveNotice();
  $("buddy").querySelector("strong").textContent = `${PUPPIES[saved.collection.puppy].name}.`;
  $("buddy").querySelector("p").textContent = PUPPIES[saved.collection.puppy].description;
  $("best").innerHTML =
    `${Math.floor(saved.best).toLocaleString()}<span> pts</span>`;
  $("bank").textContent = Math.floor(saved.bones).toLocaleString();
  $("shop").textContent =
    `Paw upgrades · ${Math.floor(saved.credits).toLocaleString()} pts ↗`;
  const mission = missionFor(saved.challenges);
  $("mission-preview").textContent =
    `${mission.title}: ${mission.target} ${mission.unit} in one run · +${mission.reward} pts`;
}
function kennel() {
  showOverlay("kennel");
  $("overlay-label").textContent = "YOUR VERY GOOD CREW";
  $("overlay-title").textContent = "The puppy clubhouse.";
  $("overlay-copy").textContent = `${Math.floor(saved.credits).toLocaleString()} points · ${saved.collection.gifts} gifts banked. Outfits and puppies are cosmetic; your upgrades work with everyone.`;
  $("overlay-primary").textContent = "Run with your puppy ↗";
  const content = $("collection");
  content.replaceChildren();
  for (const [kind, catalog, title] of [["puppy", PUPPIES, "Meet the puppies"], ["costume", COSTUMES, "Dress for adventure"]]) {
    const heading = document.createElement("h3");
    heading.textContent = title;
    content.append(heading);
    for (const [id, item] of Object.entries(catalog)) {
      const row = document.createElement("div"), copy = document.createElement("p"), button = document.createElement("button");
      const owned = saved.collection[kind === "puppy" ? "puppies" : "costumes"].includes(id);
      copy.textContent = `${item.name}${item.breed ? ` · ${item.breed}` : ""} — ${item.description}`;
      button.dataset[kind] = id;
      button.textContent = saved.collection[kind] === id ? "Equipped" : owned ? "Equip" : item.prize ? "Prize locked" : `${item.cost.toLocaleString()} pts`;
      button.disabled = saved.collection[kind] === id || (!owned && (item.prize || saved.credits < item.cost));
      button.onclick = () => {
        if (equipOrBuy(saved, kind, id)) {
          persist(); updateRecords(); kennel(); tone(880, .15);
        }
      };
      row.append(copy, button); content.append(row);
    }
  }
  const heading = document.createElement("h3"); heading.textContent = "Your prize cabinet"; content.append(heading);
  for (const prize of PRIZES) {
    const progress = prizeProgress(saved, prize);
    const copy = document.createElement("p");
    copy.textContent = `${saved.collection.prizes.includes(prize.id) ? "✓ Earned" : "◇ To discover"} · ${prize.name} — ${prize.description}${prize.points ? ` +${prize.points} pts.` : " Unlocks an outfit."}`;
    const meter = document.createElement("progress");
    meter.max = progress.target; meter.value = progress.current;
    meter.setAttribute("aria-label", `${prize.name}: ${progress.current} of ${progress.target}`);
    meter.style.cssText = "width:100%;accent-color:#d8a641";
    const status = document.createElement("small");
    status.textContent = progress.earned ? "Collected — yours to keep" : `${progress.current} / ${progress.target} ${prize.metric === 'gifts' ? 'banked gifts' : prize.metric === 'bones' ? 'bones in your best run' : 'meters in your best run'}`;
    content.append(copy, meter, status);
  }
}
function persist() {
  // Never overwrite existing progress that was inaccessible at startup.
  if(!profileReadable){updateSaveNotice();return;}
  try {
    storageAvailable=writeStoredProfile(localStorage,saved,profileReadable);
  } catch {
    storageAvailable=false;
  }
  updateSaveNotice();
}
function updateSaveNotice() {
  $("game").dataset.storage=storageAvailable?"available":"unavailable";
  for(const id of ["menu-save-notice","overlay-save-notice"])$(id).hidden=storageAvailable;
}
function shop() {
  showOverlay("shop");
  $("overlay-label").textContent = "EARNED ON THE TRAIL. YOURS TO KEEP.";
  $("overlay-title").textContent = "Upgrade your paws.";
  $("overlay-copy").textContent =
    `${Math.floor(saved.credits).toLocaleString()} points to spend · Earn your full score after each completed run.`;
  $("overlay-primary").textContent = "Run with your upgrades ↗";
  $("upgrades").replaceChildren();
  for (const [key, upgrade] of Object.entries(UPGRADES)) {
    const level = saved.upgrades[key],
      cost = price(level);
    const row = document.createElement("div"),
      copy = document.createElement("p"),
      button = document.createElement("button");
    copy.textContent = `${upgrade.name} · ${level}/3 — ${upgrade.description}`;
    button.textContent =
      cost === null ? "Maxed" : `${cost.toLocaleString()} pts`;
    button.disabled = cost === null || saved.credits < cost;
    button.dataset.upgrade = key;
    button.onclick = () => {
      if (purchase(saved, key)) {
        persist();
        updateRecords();
        shop();
        tone(880, 0.2);
      }
    };
    row.append(copy, button);
    $("upgrades").append(row);
  }
}
updateRecords();
function tone(frequency, duration = 0.08) {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    playNotes(audio,typeof frequency==="string"?CUES[frequency]:[{from:frequency,duration}]);
  } catch {
    /* Sound is optional. */
  }
}
function toast(message, duration = 3) {
  $("toast").textContent = message;
  toastUntil = time + duration;
}
function setState(next) {
  state = next;
  $("game").dataset.state = state;
  $("menu").hidden = state !== "menu";
  $("buddy").hidden = state !== "menu";
  $("footer").hidden = state !== "menu";
  $("hud").hidden = ["menu", "help", "shop", "kennel", "graphics-error"].includes(state);
  $("controls").hidden = state !== "playing";
  $("pause-button").hidden = state !== "playing";
  $("overlay").hidden = !["paused", "ended", "help", "shop", "kennel", "graphics-error"].includes(state);
  const modal = !$("overlay").hidden;
  $("scene").inert = state !== "playing";
  document.querySelector("header").inert = modal;
  if (modal) $("overlay-primary").focus();
  accumulator = 0;
  pointer = null;
}
function start() {
  if(!graphicsReady){graphicsError();return;}
  run = createRun(Date.now(), saved.upgrades);
  run.appearance = { ...saved.collection };
  currentMission = missionFor(saved.challenges);
  missionAnnounced = false;
  taughtObstacles = false;
  setState("playing");
  $("scene").focus({ preventScroll: true });
  toast("Stay sharp: bones can lead into obstacles. Watch the trail.", 5);
  tone("yip");
}
function showOverlay(kind) {
  $("graphics-recovery").hidden = kind !== "graphics-error";
  $("home").hidden = kind === "graphics-error";
  $("collection").hidden = kind !== "kennel";
  $("upgrades").hidden = kind !== "shop";
  $("results").hidden = kind !== "ended";
  $("instructions").hidden = kind !== "help";
  $("overlay-label").textContent =
    kind === "ended"
      ? "EVERY GOOD DOG GETS ANOTHER GO"
      : kind === "help"
        ? "FOUR MOVES. ENDLESS POSSIBILITIES."
        : "TAKE A BREATHER";
  $("overlay-title").textContent =
    kind === "ended"
      ? "That was a good run."
      : kind === "help"
        ? "Trust your paws."
        : "Paws for a moment.";
  $("overlay-copy").textContent =
    kind === "ended"
      ? run.score > saved.best
        ? "New personal best. Very good dog!"
        : "The next great run is one tap away."
      : kind === "help"
        ? "Swipe anywhere on the trail, or use the buttons."
        : "The jungle can wait.";
  $("overlay-primary").textContent =
    kind === "ended"
      ? "Run it back ↗"
      : kind === "help"
        ? "Let’s run ↗"
        : "Keep running →";
  $("toast").textContent = "";
  setState(kind);
}
function pause() {
  if (state === "playing") showOverlay("paused");
}
function finish() {
  const receipt = bankRun(saved, run, currentMission);
  if (!receipt) return;
  showOverlay("ended");
  $("overlay-copy").textContent = receipt.personalBest
    ? "New personal best. Very good dog!" : "The next great run is one tap away.";
  $("final-score").textContent = run.score.toLocaleString();
  $("final-distance").textContent = `${Math.floor(run.distance)} m`;
  $("final-bones").textContent = run.bones;
  const {missionPoints: reward, prizes} = receipt;
  $("overlay-copy").textContent +=
    ` +${run.score.toLocaleString()} upgrade points earned. Spend them at camp.`;
  if (reward)
    $("overlay-copy").textContent +=
      ` Challenge complete: +${reward} extra points!`;
  if (run.gifts) $("overlay-copy").textContent += ` ${run.gifts} gift boxes banked.`;
  if (run.ziplines) $("overlay-copy").textContent += ` ${run.ziplines} zipline ${run.ziplines === 1 ? "ride" : "rides"} completed (+${run.ziplines * 250} points included in your score).`;
  if (prizes.length) $("overlay-copy").textContent += ` Prizes earned: ${prizes.map(p => p.name).join(", ")}! Visit the clubhouse.`;
  persist();
  updateRecords();
  tone("finish");
}
$("play").onclick = start;
$("help").onclick = () => showOverlay("help");
$("shop").onclick = shop;
$("kennel").onclick = kennel;
$("pause-button").onclick = pause;
$("home").onclick = () => {
  setState("menu");
  $("play").focus();
};
$("overlay-primary").onclick = () => {
  if (state === "paused") {
    setState("playing");
    $("scene").focus();
  } else start();
};
$("audio").onclick = () => {
  sound = !sound;
  if(!sound && audio)stopSound(audio);
  saved.preferences.sound=sound;
  persist();
  $("audio").setAttribute("aria-pressed", String(sound));
  $("audio").setAttribute("aria-label", sound ? "Mute sound" : "Enable sound");
  tone(660);
};
$("audio").setAttribute("aria-pressed", String(sound));
$("audio").setAttribute("aria-label", sound ? "Mute sound" : "Enable sound");
$("motion").setAttribute("aria-pressed", String(reducedMotion));
$("motion").textContent = reducedMotion ? "Less motion: on" : "Less motion";
$("motion").onclick = () => {
  reducedMotion = !reducedMotion;
  saved.preferences.reducedMotion=reducedMotion;
  persist();
  $("motion").setAttribute("aria-pressed", String(reducedMotion));
  $("motion").textContent = reducedMotion ? "Less motion: on" : "Less motion";
};
const keyActions = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  Space: "jump",
  ArrowDown: "slide",
  KeyS: "slide",
};
window.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && !$("overlay").hidden) {
    const buttons = [
      ...$("overlay").querySelectorAll("button:not(:disabled), a[href]"),
    ].filter((button) => !button.closest("[hidden]"));
    if (event.shiftKey && document.activeElement === buttons[0]) {
      event.preventDefault();
      buttons.at(-1).focus();
    }
    if (!event.shiftKey && document.activeElement === buttons.at(-1)) {
      event.preventDefault();
      buttons[0].focus();
    }
  }
  if (event.code === "Escape") {
    event.preventDefault();
    if (event.repeat) return;
    if (state === "playing") pause();
    else if (state === "paused") {
      setState("playing");
      $("scene").focus();
    } else if (["help", "shop", "kennel"].includes(state)) {
      const opener = state;
      setState("menu");
      $(opener).focus({preventScroll:true});
    }
    return;
  }
  if (state === "playing" && keyActions[event.code]) {
    event.preventDefault();
    if (!event.repeat) act(run, keyActions[event.code]);
  }
  if (
    state === "menu" &&
    event.code === "Enter" &&
    document.activeElement?.tagName !== "BUTTON" &&
    document.activeElement?.tagName !== "A" &&
    !$("play").disabled
  )
    start();
});
let pointer = null;
$("scene").addEventListener("pointerdown", (event) => {
  if (state !== "playing" || pointer) return;
  pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
  $("scene").setPointerCapture(event.pointerId);
});
$("scene").addEventListener("pointermove", (event) => {
  if (
    !pointer ||
    pointer.id !== event.pointerId ||
    pointer.consumed ||
    state !== "playing"
  )
    return;
  const dx = event.clientX - pointer.x,
    dy = event.clientY - pointer.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  pointer.consumed = true;
  act(
    run,
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? "right"
        : "left"
      : dy < 0
        ? "jump"
        : "slide",
  );
});
$("scene").addEventListener("pointerup", (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  if (pointer.consumed) {
    pointer = null;
    return;
  }
  const dx = event.clientX - pointer.x,
    dy = event.clientY - pointer.y;
  pointer = null;
  if (state !== "playing") return;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) act(run, "jump");
  else if (Math.abs(dx) > Math.abs(dy)) act(run, dx > 0 ? "right" : "left");
  else act(run, dy < 0 ? "jump" : "slide");
});
$("scene").addEventListener("pointercancel", () => {
  pointer = null;
});
for (const button of document.querySelectorAll("[data-action]")) {
  button.onpointerdown = (event) => {
    if (state === "playing") {
      event.preventDefault();
      act(run, button.dataset.action);
    }
  };
  button.onclick = (event) => {
    if (state === "playing" && event.detail === 0)
      act(run, button.dataset.action);
  };
}
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
$("scene").addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  graphicsError();
});
function graphicsError() {
  if(audio)stopSound(audio);
  graphicsReady=false;
  $("play").disabled=true;
  showOverlay("graphics-error");
  $("overlay-label").textContent="LET’S GET YOUR PAWS BACK ON THE TRAIL";
  $("overlay-title").textContent="The 3D trail needs a restart.";
  $("overlay-copy").textContent =
    "Graphics are unavailable or were interrupted. Reload to try again. Saved puppies, outfits and points stay in this browser; the unfinished run is not banked.";
  $("overlay-primary").textContent = "Reload trail";
  $("overlay-primary").onclick = () => window.location.reload();
}
let view;
try {
  view = createView($("scene"));
  graphicsReady=true;
  $("play").disabled = false;
  $("play").textContent = "Let’s run ↗";
} catch {
  graphicsError();
}
let milestone = 0,
  taughtObstacles = false;
let currentMission = missionFor(saved.challenges),
  missionAnnounced = false;
let lastHud = -1;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  time += dt;
  if (state === "playing") {
    accumulator += dt;
    while (accumulator >= 1 / 120 && !run.ended) {
      step(run, 1 / 120);
      accumulator -= 1 / 120;
    }
    for (const event of run.events) {
      if (event === "bone") tone(740 + Math.min(run.combo, 12) * 28, 0.055);
      if (event === "streak") {
        toast(`${run.combo} bones in a row! +100 points`);
        tone("reward");
      }
      if (event === "clear") tone(540, 0.08);
      if (event === "jump") tone("jump");
      if (event === "magnet") {
        toast(
          `Bone magnet! ${10 + run.upgrades.magnet * 3} seconds of snack magic.`,
        );
        tone(900, 0.25);
      }
      if (event === "shield") {
        toast("Shield ready. Your next bump is covered.");
        tone(650, 0.25);
      }
      if (event === "shield-break") toast("Shield saved you. Keep running!");
      if (event === "gem") {
        toast("Treasure gem! +250 points");
        tone(990, 0.2);
      }
      if (event === "gift") { toast("Puppy present! +100 points. Finish this run to bank your gift."); tone("reward"); }
      if (event === "zoomies") { toast("ZOOMIES! 6 seconds of speed. Smash obstacles for +40 points!"); tone("zoomies"); }
      if (event === "smash") tone(260,.08);
      if (event === "zoomies-end") toast("Zoomies finished. Back to jumping and sliding!",2);
      if(event==="route-scenic")toast("Scenic trail: fewer obstacles for the next 220 meters.",4);
      if(event==="route-challenge")toast("Challenge trail! More jump/slide rows. Clean clears earn +60 points.",4);
      if(event==="zipline-start") { toast("Sky paws! Steer left and right to fetch airborne bones.",3); tone("zoomies"); }
      if(event==="zipline-end") { toast("Perfect delivery! Zipline complete · +250 points.",3); tone("reward"); }
      if (event === "double") {
        toast("Golden bonus! Double bone points for 10 seconds.");
        tone(880, 0.2);
      }
      if (event === "heart") {
        toast("A little love! Heart restored (maximum 3).");
        tone(660, 0.2);
      }
      if (event === "hit") {
        toast("Jump logs, blocks and gaps. Slide under overhead obstacles.");
        tone(120, 0.2);
      }
    }
    run.events = [];
    $("scene").dataset.lane = String(run.lane + 1);
    $("scene").dataset.posture =
      run.zipline ? "zipline" : run.y > 0.05 ? "jump" : run.slide > 0 ? "slide" : "run";
    if (Math.floor(run.time * 10) !== lastHud || run.ended) {
      lastHud = Math.floor(run.time * 10);
      $("distance").innerHTML = `${Math.floor(run.distance)}<small> m</small>`;
      $("region-name").textContent = REGIONS[regionAt(run.distance)].name;
      $("route-choice").textContent = run.choicePending!==null && run.choicePending-run.distance<100
        ? `GATES IN ${Math.max(0,Math.ceil(run.choicePending-run.distance))}m · ← Scenic · Challenge +60 → (center: scenic)`
        : run.route && run.distance<run.route.until ? `${run.route.kind==="challenge"?"CHALLENGE · +60 per clear":"SCENIC · Fewer obstacles"} · ${Math.ceil(run.route.until-run.distance)}m` : "";
      $("bones").textContent = run.bones;
      $("run-score").textContent =
        `${run.score.toLocaleString()} pts${run.combo >= 2 ? ` · ${run.combo} bone streak` : ""}`;
      const progress = missionProgress(run, currentMission);
      $("mission-label").textContent =
        `${currentMission.title} · ${progress}/${currentMission.target} ${currentMission.unit}`;
      $("mission-progress").max = currentMission.target;
      $("mission-progress").value = progress;
      if (progress === currentMission.target && !missionAnnounced) {
        missionAnnounced = true;
        toast(
          `Challenge complete! +${currentMission.reward} points when this run ends.`,
          4,
        );
      }
      const danger = run.objects.find(
        (object) =>
          !object.used &&
          !object.passed &&
          object.lane === run.lane &&
          ["rock", "log", "arch", "branch", "gate", "gap"].includes(object.type) &&
          object.at - run.distance > 0 &&
          object.at - run.distance < run.speed * 0.8,
      );
      const duck = danger && ["arch", "branch", "gate"].includes(danger.type);
      const cable = run.objects.find(object => object.type === "zipline-start" && !object.caught && object.at - run.distance > 0 && object.at - run.distance < run.speed * .65);
      $("cue").textContent = run.zipline ? "← SWING for bones →" : cable ? "↑ JUMP to grab the zipline" : danger && run.zoomies === 0
        ? duck
          ? "↓ SLIDE under"
          : danger.type === "gap" ? "↑ JUMP the gap" : "↑ JUMP over"
        : "";
      $("hearts").textContent =
        "♥ ".repeat(Math.max(0, run.hearts)) + "♡ ".repeat(3 - run.hearts);
      $("hearts").setAttribute("aria-label", `${run.hearts} hearts remaining`);
      $("power").innerHTML = [
        run.zipline
          ? `<span class="power-chip shield">🐾 SKY PAWS · ${Math.ceil(run.zipline.end-run.distance)}m <small>Ride to the end · +250 points</small><progress aria-label="Zipline distance remaining" max="140" value="${Math.max(0,run.zipline.end-run.distance)}"></progress></span>`
          : "",
        run.zoomies > 0
          ? `<span class="power-chip double">🎾 ZOOMIES · ${Math.ceil(run.zoomies)}s <small>Smash obstacles · +40 points</small><progress aria-label="Zoomies time remaining" max="6" value="${run.zoomies}"></progress></span>`
          : "",
        run.shield
          ? '<span class="power-chip shield">◇ SHIELD · One hit protected</span>'
          : "",
        run.magnet > 0
          ? `<span class="power-chip magnet">🧲 MAGNET · ${Math.ceil(run.magnet)}s <small>Pulling bones from all lanes</small><progress aria-label="Magnet time remaining" max="${10 + run.upgrades.magnet * 3}" value="${run.magnet}"></progress></span>`
          : "",
        run.double > 0
          ? `<span class="power-chip double">×2 BONE POINTS · ${Math.ceil(run.double)}s<progress aria-label="Double points time remaining" max="10" value="${run.double}"></progress></span>`
          : "",
      ]
        .filter(Boolean)
        .join("");
      $("hud").classList.toggle("has-powers", $("power").childElementCount > 0);
    }
    const currentMilestone = Math.floor(run.distance / 250);
    if (!taughtObstacles && run.distance > 65) {
      taughtObstacles = true;
      toast("Jump logs & blocks ↑ · Slide under arches, branches & gates ↓", 5);
    }
    if (currentMilestone > milestone) {
      milestone = currentMilestone;
      toast(`${milestone * 250} meters. Unstoppable paws!`);
    }
    if (run.distance < 1) milestone = 0;
    if (run.ended) finish();
  }
  if (time > toastUntil) $("toast").textContent = "";
  if (view && graphicsReady)
    view.draw(run, time, state, reducedMotion, dt, accumulator / (1 / 120), saved.collection);
  requestAnimationFrame(frame);
}
if(graphicsReady)$("play").focus({ preventScroll: true });
requestAnimationFrame(frame);
