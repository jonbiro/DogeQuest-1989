import { createRun, act, step } from "./world.js";
import {createPracticeRun,createZiplinePracticeRun,createRaftPracticeRun,createTurnPracticeRun,createGapPracticeRun,createWeavePracticeRun,stepPractice,practiceCue,practiceResult,practiceOffer} from './practice.js';
import {runHudLabels} from './hud-labels.js';
import {courseProgress,activeCourse} from './courses.js';
import {RESUME_DURATION,resumeStep} from './resume.js';
import {installBackupControls} from './backup-ui.js';
import {installOfflineSupport} from './offline.js';
import { createView } from "./render.js";
import {prepareFirstFrame} from './shader-preparation.js';
import { UPGRADES, levels, price, purchase, refundUpgrade } from "./progression.js";
import { missionFor, missionProgress, missionTip, missionPackFor } from "./missions.js";
import { bankRun } from "./rewards.js";
import {resultRecord,resultChallenge} from './result-record.js';
import {masteryFrom,masteryCards,orderedMasteryCards,nextMasteryHint} from './mastery.js';
import {fetchReady} from './ability.js';
import {createPowerHud} from './power-hud.js';
import {readTrailSeed,readTrailVersion,readTrailTarget,validTrailTarget,trailLink} from './trail-link.js';
import {dailyTrail,restoredTrailSelection} from './daily-trail.js';
import {trailRecordsFrom,trailBest} from './trail-records.js';
import {updateTraversalControls,traversalDescription} from './traversal-controls.js';
import {supportsMobileTilt,supportsTouchControls,noTiltController} from './tilt-platform.js';
import {scoreBreakdown} from './score-breakdown.js';
import {rematchFor} from './rematch.js';
import {preferencesFrom} from "./preferences.js";
import {readStoredProfile,writeStoredProfile} from "./storage.js";
import {CUES,playNotes,stopSound,resumeSound,traversalCue,feedbackPriority} from "./sound.js";
import {createAreaSoundscape} from './soundscape.js';
import {actionCue,eventNotice,dockMode,runLesson,routeChoiceCue,touchCoach,touchGestureCoach,touchCoachVisible} from "./guidance.js";
import {turnPrompt} from "./turns.js";
import {swipeAction,canStartSwipe,canPressAction,ownsSwipe,tapAction} from "./gestures.js";
import { PUPPIES, COSTUMES, PRIZES, collectionFrom, equipOrBuy, prizeProgress } from "./collection.js";
import { puppyArtworkUrl } from "./puppy-artwork.js";
const $ = (id) => document.getElementById(id);
const updatePowerHud = createPowerHud($('power'));
const soundscape=createAreaSoundscape();
const traversalButtons=document.querySelectorAll('#controls [data-action="jump"], #controls [data-action="slide"]');
let sharedSeed = readTrailSeed(window.location.search);
let sharedVersion = readTrailVersion(window.location.search);
let sharedTarget = readTrailTarget(window.location.search);
$('shared-trail').hidden = sharedSeed === null;
const playLabel = () => sharedSeed === null ? `Run with ${PUPPIES[saved.collection.puppy].name} ↗︎` : 'Run shared trail ↗︎';
let run = createRun(),
  state = "menu",
  last = 0,
  time = 0,
  accumulator = 0,
  toastUntil = 0,
  noticePriority = 0,
  sound = false,
  audio = null;
// Keep the reason for a lifecycle pause so a phone never appears to freeze
// without explaining what happened or how to continue.
let pauseReason = 'manual';
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
  mastery: masteryFrom(),
  trailRecords: [],
  preferences: preferencesFrom(null,reducedMotion),
};
try {
  const {value,available,readable} = readStoredProfile(localStorage);
  storageAvailable=available && readable;
  profileReadable=readable;
  for (const key of Object.keys(saved))
    if (key !== "upgrades" && Number.isFinite(value?.[key]) && value[key] >= 0)
      saved[key] = value[key];
  saved.upgrades = levels(value?.upgrades);
  saved.collection = collectionFrom(value?.collection,{migrateLegacyDefault:true});
  saved.mastery = masteryFrom(value?.mastery);
  saved.trailRecords = trailRecordsFrom(value?.trailRecords);
  saved.preferences = preferencesFrom(value?.preferences,reducedMotion);
  saved.challenges = Math.floor(saved.challenges);
} catch {
  storageAvailable=false;
  profileReadable=false;
}
sound=saved.preferences.sound;
const restoredTrail=restoredTrailSelection(sharedSeed,sharedVersion,sharedTarget,dailyTrail(window.location.href),saved.trailRecords);
sharedTarget=restoredTrail.target;
let localDailyTarget=restoredTrail.localDaily;
$('shared-description').textContent=restoredTrail.description;
reducedMotion=saved.preferences.reducedMotion;
function updateRecords() {
  updateSaveNotice();
  $("play").textContent = playLabel();
  $("buddy").querySelector("strong").textContent = `${PUPPIES[saved.collection.puppy].name}.`;
  $("buddy").querySelector("p").textContent = PUPPIES[saved.collection.puppy].description;
  $("best").innerHTML =
    `${Math.floor(saved.best).toLocaleString()}<span> pts</span>`;
  $("bank").textContent = Math.floor(saved.bones).toLocaleString();
  $("shop").textContent =
    `Upgrades · ${Math.floor(saved.credits).toLocaleString()} pts ↗︎`;
  const mission = missionFor(saved.challenges);
  $("mission-preview").textContent =
    `${mission.title}: ${mission.target} ${mission.unit} in one run · +${mission.reward} pts`;
  $("mission-help-title").textContent = `Your challenge: ${mission.title}`;
  $("mission-help-copy").textContent = `${mission.target} ${mission.unit} in one run · +${mission.reward} points. ${missionTip(mission)} Finish the run to bank your reward.`;
}
let clubhouseCategory = 'puppy';
let previewRear = false;
function kennel() {
  showOverlay("kennel");
  $("overlay-label").textContent = "YOUR VERY GOOD CREW";
  $("overlay-title").textContent = "The puppy clubhouse.";
  $("overlay-copy").textContent = `${Math.floor(saved.credits).toLocaleString()} points · ${saved.collection.gifts} gifts banked. Outfits and puppies are cosmetic; your upgrades work with everyone.`;
  $("overlay-primary").textContent = "Run with your puppy ↗︎";
  const content = $("collection");
  content.replaceChildren();
  const categories=document.createElement('nav');
  categories.className='clubhouse-categories';categories.setAttribute('aria-label','Clubhouse categories');
  for(const [id,label] of [['puppy','Puppies'],['costume','Outfits'],['passport','Passport'],['prizes','Prizes']]) {
    const button=document.createElement('button');button.textContent=label;
    button.setAttribute('aria-pressed',String(clubhouseCategory===id));
    button.onclick=()=>{clubhouseCategory=id;kennel();content.querySelector(`button[data-category="${id}"]`).focus();};
    button.dataset.category=id;categories.append(button);
  }
  content.append(categories);
  const passport=document.createElement('section');
  passport.id='trail-passport';
  const cards=orderedMasteryCards(saved.mastery,saved.collection.puppy);
  const collected=cards.reduce((sum,card)=>sum+card.tiers.filter(tier=>card.current>=tier.target).length,0);
  const masteryIntro=document.createElement('p');
  masteryIntro.textContent='Your next milestone comes first. Finish runs to bank progress and earn permanent stamps and upgrade points.';
  const otherCards=document.createElement('details');otherCards.className='other-passport-cards';
  const otherHeading=document.createElement('summary');otherHeading.textContent='More passport milestones';otherCards.append(otherHeading);
  if(clubhouseCategory==='passport'){
    $("overlay-title").textContent='Trail passport.';
    $("overlay-copy").textContent=`${collected}/${cards.reduce((sum,card)=>sum+card.tiers.length,0)} stamps collected`;
    content.append(passport);
  }
  for(const card of cards) {
    const section=document.createElement('section');
    section.className='mastery-card';
    const isCurrent=card.id===`dog-${saved.collection.puppy}`;
    section.dataset.current=String(isCurrent);
    const title=document.createElement('h3');title.textContent=`${card.name}${isCurrent?' · Your puppy':''}`;
    const badges=document.createElement('p');badges.className='mastery-badges';
    for(const [index,tier] of card.tiers.entries()) {
      const badge=document.createElement('span');
      const earned=card.current>=tier.target;
      badge.className=earned?'mastery-badge earned':'mastery-badge';
      badge.dataset.tier=String(index);
      const icon=document.createElement('b');icon.textContent=earned?'✓':['I','II','III'][index];icon.setAttribute('aria-hidden','true');
      const label=document.createElement('span');label.textContent=tier.name;
      const status=document.createElement('small');status.textContent=earned?'Collected':'Not yet earned';
      badge.append(icon,label,status);
      badge.title=`${tier.target} ${card.unit} · ${tier.points} pts${earned?' · collected':''}`;
      badges.append(badge);
    }
    const next=card.tiers.find(tier=>card.current<tier.target);
    const status=document.createElement('p');
    status.textContent=next?`${card.current}/${next.target} ${card.unit} · next: +${next.points} pts`:`Complete collection · ${card.current} ${card.unit}`;
    const meter=document.createElement('progress');
    meter.max=next?.target||card.tiers.at(-1).target;meter.value=card.current;
    meter.setAttribute('aria-label',`${card.name}: ${status.textContent}`);
    section.append(title,status,meter,badges);
    if(card.tip){const tip=document.createElement('p');tip.textContent=card.tip;section.append(tip);}
    (card===cards[0]?passport:otherCards).append(section);
  }
  passport.append(otherCards,masteryIntro);
  for (const [kind, catalog, title] of [["puppy", PUPPIES, "Meet the puppies"], ["costume", COSTUMES, "Dress for adventure"]]) {
    if(clubhouseCategory!==kind)continue;
    const heading = document.createElement("h3");
    heading.textContent = title;
    content.append(heading);
    const angle=document.createElement('button');angle.className='preview-angle';
    angle.textContent=previewRear?'Show faces':'Show running view';
    angle.onclick=()=>{previewRear=!previewRear;kennel();content.querySelector('.preview-angle').focus();};content.append(angle);
    for (const [id, item] of Object.entries(catalog)) {
      const row = document.createElement("div"), copy = document.createElement("p"), button = document.createElement("button");
      const owned = saved.collection[kind === "puppy" ? "puppies" : "costumes"].includes(id);
      row.className='collection-card';
      const appearance={puppy:kind==='puppy'?id:saved.collection.puppy,costume:kind==='costume'?id:saved.collection.costume};
      const image=document.createElement('img');
      // Puppy cards use the lightweight source illustration; outfit cards use
      // the same isolated portrait renderer as the camp preview so the hat,
      // cape, coat and crown are actually visible before the player equips
      // them. Fall back to the source art during the first async texture tick.
      const portrait = kind === 'costume' ? view.portrait(run, appearance, previewRear) : null;
      image.src=portrait?.startsWith('data:image/') ? portrait : puppyArtworkUrl(appearance.puppy);
      image.className='puppy-artwork-preview';
      image.decoding='async';
      image.loading='lazy';
      image.alt=`${item.name}, ${previewRear?'running view':'front view'}`;image.width=image.height=96;
      copy.textContent = `${item.name}${item.breed ? ` · ${item.breed}` : ""} — ${item.description}`;
      button.dataset[kind] = id;
      button.textContent = saved.collection[kind] === id ? "Equipped" : owned ? "Equip" : item.prize ? "Prize locked" : `${item.cost.toLocaleString()} pts`;
      button.setAttribute('aria-label',`${button.textContent} · ${item.name}`);
      button.disabled = saved.collection[kind] === id || (!owned && (item.prize || saved.credits < item.cost));
      button.onclick = () => {
        if (equipOrBuy(saved, kind, id)) {
          persist(); updateRecords(); kennel(); tone(880, .15);
        }
      };
      row.append(image,copy, button); content.append(row);
    }
  }
  drawScene(run,time,state,reducedMotion,0,1,saved.collection);
  if(clubhouseCategory!=='prizes')return;
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
  for(const id of ["menu-save-notice","overlay-save-notice"]) {
    $(id).hidden=storageAvailable;
    $(id).textContent=profileReadable
      ? 'Saving is unavailable. New points and unlocks last only for this visit.'
      : 'Saved progress could not be read and will not be overwritten. New points and unlocks last only for this visit.';
  }
}
function shop() {
  showOverlay("shop");
  $("overlay-label").textContent = "EARNED ON THE TRAIL. YOURS TO KEEP.";
  $("overlay-title").textContent = "Upgrade your paws.";
  $("overlay-copy").textContent =
    `${Math.floor(saved.credits).toLocaleString()} points to spend · Remove a level for a full refund. Tune your paws freely; records and unlocks stay yours.`;
  $("overlay-primary").textContent = "Run with your upgrades ↗︎";
  $("upgrades").replaceChildren();
  for (const [key, upgrade] of Object.entries(UPGRADES)) {
    const level = saved.upgrades[key],
      cost = price(level);
    const row = document.createElement("div"),
      copy = document.createElement("p"),
      button = document.createElement("button");
    const name=document.createElement('strong');name.textContent=upgrade.name;
    const benefit=document.createElement('span');benefit.textContent=upgrade.description;
    const meter=document.createElement('progress');meter.max=3;meter.value=level;
    meter.setAttribute('aria-label',`${upgrade.name}: level ${level} of 3`);
    const status=document.createElement('small');status.textContent=`Level ${level} / 3`;
    copy.append(name,benefit,status,meter);copy.className='upgrade-copy';
    button.textContent =
      cost === null ? "Maxed" : `${cost.toLocaleString()} pts`;
    button.setAttribute('aria-label',`${button.textContent} · ${upgrade.name} · ${cost===null?'Maximum level':`Upgrade to level ${level+1}`}`);
    button.disabled = cost === null || saved.credits < cost;
    button.dataset.upgrade = key;
    button.onclick = () => {
      if (purchase(saved, key)) {
        persist();
        updateRecords();
        shop();
        const next = document.querySelector(`[data-upgrade="${key}"]:not(:disabled)`) || document.querySelector(`[data-refund="${key}"]`);
        next?.focus({preventScroll:true});
        tone(880, 0.2);
      }
    };
    const actions = document.createElement('div');
    actions.className = 'upgrade-actions';
    actions.append(button);
    if (level > 0) {
      const refund = document.createElement('button');
      refund.className = 'upgrade-refund';
      refund.type = 'button';
      refund.textContent = `−1 level · +${price(level - 1).toLocaleString()} pts`;
      refund.setAttribute('aria-label',`Remove one ${upgrade.name} level and refund ${price(level - 1)} points`);
      refund.dataset.refund = key;
      refund.onclick = () => {
        if (refundUpgrade(saved, key)) {
          persist(); updateRecords(); shop();
          const target = document.querySelector(`[data-refund="${key}"]`) || document.querySelector(`[data-upgrade="${key}"]`);
          target?.focus();
          tone(660, .12);
        }
      };
      actions.append(refund);
    }
    row.append(copy, actions);
    $("upgrades").append(row);
  }
}
updateRecords();
installBackupControls(()=>saved);
installOfflineSupport();
function tone(frequency, duration = 0.08) {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    resumeSound(audio);
    playNotes(audio,typeof frequency==="string"?CUES[frequency]:[{from:frequency,duration}],feedbackPriority(frequency));
  } catch {
    /* Sound is optional. */
  }
}
function setText(id, text) {
  if ($(id).textContent !== text) $(id).textContent = text;
}
function toast(message, duration = 1.5, priority = 0) {
  if (time < toastUntil && priority < noticePriority) return;
  setText('toast', message);
  noticePriority = priority;
  toastUntil = time + duration;
}
function syncDock() {
  const mode = dockMode({cue:$("cue").textContent,route:$("route-choice").textContent,
    notice:$("toast").textContent,missionComplete:missionAnnounced && !activeCourse(run)});
  for (const id of ['cue','route-choice','toast','mission-summary']) $(id).hidden = mode !== id;
  $("mission-hud").dataset.dock = mode || 'none';
  $("mission-hud").hidden = state !== 'playing' || !mode;
  const coach = $('gesture-coach');
  if (coach) {
    const liveCopy = touchGestureCoach(pointer);
    // An overdrag explanation is more useful than the transient live label;
    // otherwise keep the label attached to the controls while the finger is
    // down, then fall back to the first-run lesson once it is released.
    const feedback = run.touchFeedback || '';
    const copy = run.touchOverdrag ? touchCoach(run) : liveCopy || feedback || touchCoach(run);
    setText('gesture-coach', copy);
    coach.classList.toggle('gesture-live', Boolean(liveCopy && !run.touchOverdrag && !feedback));
    coach.hidden = !touchCoachVisible(run, mode, state, $('cue').textContent, copy);
  }
  $('controls').classList.toggle('touch-overdrag', Boolean(run.touchOverdrag));
}
const mobileTilt = supportsMobileTilt(window);
const touchControls = supportsTouchControls(window);
$('game').dataset.touch = touchControls ? 'true' : 'false';
let tiltSettings = $('tilt-settings');
let tilt = noTiltController();
if (!mobileTilt) {
  // The panel lives in an inert template, so desktop never parses a tilt
  // control into the live DOM or accessibility tree.
  $('game').dataset.tilt = 'disabled';
} else {
  $('game').dataset.tilt = 'available';
  // Materialize the opt-in panel only after the coarse-pointer/mobile check.
  // This keeps desktop markup and its keyboard order completely tilt-free.
  if (!tiltSettings) {
    const template = $('tilt-settings-template');
    const panel = template?.content.firstElementChild?.cloneNode(true);
    if (panel) {
      $('run-lesson')?.before(panel);
      tiltSettings = panel;
    }
  }
  // Keep tilt out of the desktop bundle's startup path. On phones this small
  // module is loaded only after the coarse-pointer/mobile check succeeds.
  void import('./tilt-controls.js').then(({installTiltControls}) => {
    if (!tiltSettings?.isConnected) return;
    tilt = installTiltControls(window,{toggle:$('tilt-toggle'),recenter:$('tilt-recenter'),message:$('tilt-status'),
      sensitivity:$('tilt-sensitivity'),
      initialSensitivity:saved.preferences.tiltSensitivity,
      onSensitivity:value=>{saved.preferences.tiltSensitivity=value;persist();updateSaveNotice();},
      canSteer:()=>state==='playing'&&!document.hidden&&!run.ended&&!turnPrompt(run),onAction:action=>act(run,action)});
    tiltSettings.hidden = !['help','paused'].includes(state);
  }).catch(() => {
    // A missing sensor module must never block touch or keyboard play.
    tilt = noTiltController();
    tiltSettings?.remove();
    $('game').dataset.tilt = 'disabled';
  });
  // Touch/keyboard wins without moving the player's calibrated neutral
  // position. These listeners are never installed on desktop.
  window.addEventListener('pointerdown',()=>tilt.yieldToTouch(),{capture:true,passive:true});
  window.addEventListener('keydown',()=>tilt.yieldToTouch(),{capture:true});
}
function focusOverlay() {
  const primary = $("overlay-primary"), home = $("home");
  const target = !primary.disabled ? primary : !home.hidden && !home.disabled ? home : $("overlay-title");
  target.focus({preventScroll:true});
}
function setState(next) {
  const previous = state;
  state = next;
  tilt.recalibrate();
  const tiltPanel = $('tilt-settings');
  if (tiltPanel) tiltPanel.hidden=!['help','paused'].includes(state);
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
  $("hud").inert = modal;
  if (modal) {
    if (previous !== next) document.querySelector('.modal-content').scrollTop = 0;
    focusOverlay();
  }
  accumulator = 0;
  pointer = null;
  if (typeof hideTouchGhost === 'function') hideTouchGhost();
}
function start() {
  if(!graphicsReady)return;
  pauseReason = 'manual';
  // A results-screen retry is a rematch, not a new random obstacle layout.
  // Camp/help use random adventures unless an explicit shared trail is active.
  const retry = rematchFor(run,state==='ended');
  const rematchBest=retry?.rematchBest||0;
  const challengeTarget=retry ? retry.challengeTarget : sharedTarget;
  run = createRun(retry ? retry.seed : sharedSeed ?? Date.now(), saved.upgrades,
    retry ? retry.generatorVersion : sharedSeed === null ? undefined : sharedVersion);
  run.rematchBest=rematchBest;
  run.challengeTarget=challengeTarget;
  run.localDailyTarget=retry?Boolean(retry.localDailyTarget):localDailyTarget;
  run.puppy = saved.collection.puppy;
  run.appearance = { ...saved.collection };
  // Keep the opening interaction hint for touch-capable players; fine-pointer
  // desktop stays focused on the authored trail and explicit buttons.
  // Touch coaching is independent from optional motion sensors. A phone can
  // decline sensor access and still needs the tap-first lesson.
  run.touchHint = touchControls;
  run.missions = missionPackFor(saved.challenges);
  currentMission = run.missions[0];
  missionAnnounced = false;
  lastHud = -1;
  toastUntil = 0;
  noticePriority = 0;
  for (const id of ['cue','route-choice','toast']) setText(id, '');
  $('hud').classList.toggle('has-powers', updatePowerHud(run));
  setState("playing");
  $("scene").focus({ preventScroll: true });
  tone("yip");
}
function showOverlay(kind) {
  $('practice-again').hidden = true;
  $("overlay").dataset.kind = kind;
  $("graphics-recovery").hidden = kind !== "graphics-error";
  $("home").hidden = kind === "graphics-error";
  $("collection").hidden = kind !== "kennel";
  $("upgrades").hidden = kind !== "shop";
  $("results").hidden = kind !== "ended";
  $("run-lesson").hidden = kind !== "ended";
  $("run-highlights").hidden = kind !== "ended";
  $("run-breakdown").hidden = kind !== "ended";
  $("run-breakdown").open = false;
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
        ? "The buttons are easiest: tap LEFT or RIGHT for one lane, JUMP for a log or gap, and SLIDE for an overhead gate. One swipe equals one move. To keep your finger down, stop your thumb briefly, then drag again; lifting is always okay. On a phone, tap an edge to steer or the center to jump. A clear cross-direction swipe can switch between steering and jump or slide without lifting. The buttons always work."
        : kind === "paused"
          ? run.practice
            ? pauseReason === 'background'
              ? "Practice is unscored. The browser moved this page to the background, so the run is paused. Tap Keep running when you are back."
              : pauseReason === 'rotation'
                ? "Practice is unscored. The screen rotated, so the run is paused. Hold the phone upright, then tap Keep running."
                : pauseReason === 'touch'
                  ? "Practice is unscored. The browser interrupted that touch, so the run is paused. Try a shorter swipe or use the big buttons."
                  : "Practice is unscored. Take a breather, then tap Keep running whenever you are ready."
            : pauseReason === 'background'
              ? "The browser moved this page to the background, so your run is paused. Tap Keep running when you are back, or finish now to bank your points, bones and gifts."
              : pauseReason === 'rotation'
                ? "The screen rotated, so your run is paused. Hold the phone upright, then tap Keep running, or finish now to bank your points, bones and gifts."
                : pauseReason === 'touch'
                  ? "The browser interrupted that touch, so your run is paused. Try a shorter swipe or use the big buttons, then tap Keep running."
                  : "Keep running, or finish now to bank the points, bones and gifts you have earned."
          : run.practice ? "Practice is unscored. Leave whenever you like." : "Keep running, or finish now to bank the points, bones and gifts you have earned.";
  if(kind==='paused'&&!run.practice&&(run.raft||run.zipline))
    $('overlay-copy').textContent+=' Finish this ride to earn its 250-point completion bonus; collected rewards are already yours.';
  $("home").textContent = kind === 'paused' ? run.practice ? 'Leave practice' : 'Finish & bank points' : 'Back to camp';
  $("overlay-primary").textContent =
    kind === "ended"
      ? "Retry this trail ↗︎"
      : kind === "help"
        ? "Let’s run ↗︎"
        : "Keep running →";
  $("toast").textContent = "";
  setState(kind);
}
function pause() {
  const reason = arguments[0];
  pauseReason = ['background','rotation','touch','manual'].includes(reason) ? reason : 'manual';
  if (audio) stopSound(audio);
  if (state === "playing") showOverlay("paused");
}
function resume() {
  pauseReason = 'manual';
  if (sound) resumeSound(audio);
  run.resumeRemaining = RESUME_DURATION;
  setState('playing');
  $('scene').focus({preventScroll:true});
}
function finish() {
  if (run.practice) {
    showOverlay('ended');
    for (const id of ['results','run-breakdown','run-highlights']) $(id).hidden = true;
    $('overlay-label').textContent = 'NO PRESSURE. JUST PRACTICE.';
    const result=practiceResult(run);
    $('overlay-title').textContent = result.title;
    $('overlay-copy').textContent = 'Practice never changes your points, records or challenges. Rehearse again or head into the adventure.';
    $('run-lesson').textContent = result.lesson;
    $('overlay-primary').textContent = run.practice.returnTrail ? 'Retry your trail ↗︎' : 'Run the adventure ↗︎';
    $('practice-again').hidden = false;
    $('practice-again').textContent = run.practice.kind==='turn' && run.practice.correct
      ? `Practice the ${run.practice.direction==='left' ? 'right' : 'left'} turn` : 'Practice again';
    return;
  }
  const receipt = bankRun(saved, run, run.missions);
  if (!receipt) return;
  $('trail-target').checked = validTrailTarget(run.score);
  $('trail-target').disabled = !validTrailTarget(run.score);
  updateTrailLink();
  $('trail-copy-status').textContent = '';
  showOverlay("ended");
  const rehearsal=practiceOffer(run);
  $('practice-again').hidden = !rehearsal;
  if (rehearsal) $('practice-again').textContent = rehearsal.label;
  if (run.retired) {
    $('overlay-label').textContent = 'A GOOD RUN. ON YOUR TERMS.';
    $('overlay-title').textContent = 'Home safe.';
  }
  $("overlay-copy").textContent = receipt.personalBest
    ? "New personal best. Very good dog!" : "The next great run is one tap away.";
  $("final-score").textContent = run.score.toLocaleString();
  $("final-distance").textContent = `${Math.floor(run.distance)} m`;
  $("final-bones").textContent = run.bones;
  $("run-lesson").textContent = runLesson(run);
  $("run-highlights").textContent = `${run.turns} clean ${run.turns === 1 ? 'turn' : 'turns'} · ${run.clears} obstacles cleared${run.weaves?` · ${run.weaves} course ${run.weaves===1?'weave':'weaves'}`:''} · Best bone streak: ${run.bestCombo}`;
  const courses = run.regionalCourses.reduce((sum,count)=>sum+count,0);
  if (courses) $("run-highlights").textContent += ` · ${courses} clean regional ${courses === 1 ? 'course' : 'courses'}`;
  if (run.relics) $("run-highlights").textContent += ` · ${run.relics} area ${run.relics === 1 ? 'relic' : 'relics'} found`;
  const {missionPoints: reward, prizes} = receipt;
  $("overlay-copy").textContent +=
    ` +${run.score.toLocaleString()} upgrade points earned. Spend them at camp.`;
  if (reward)
    $("overlay-copy").textContent +=
      ` ${receipt.missionCount} ${receipt.missionCount === 1 ? 'challenge' : 'challenges'} complete: +${reward} extra points!`;
  if (run.gifts) $("overlay-copy").textContent += ` ${run.gifts} gift boxes banked.`;
  if (run.ziplines) $("overlay-copy").textContent += ` ${run.ziplines} zipline ${run.ziplines === 1 ? "ride" : "rides"} completed (+${run.ziplines * 250} points included in your score).`;
  if (run.rafts) $("overlay-copy").textContent += ` ${run.rafts} river ${run.rafts === 1 ? "crossing" : "crossings"} completed (+${run.rafts * 250} points included in your score).`;
  if (prizes.length) $("overlay-copy").textContent += ` Prizes earned: ${prizes.map(p => p.name).join(", ")}! Visit the clubhouse.`;
  const mastery=receipt.mastery;
  if(mastery.earned.length) $("overlay-copy").textContent += ` Passport rewards: ${mastery.earned.map(b=>b.name).join(', ')} (+${mastery.points} pts).`;
  const dogCard=masteryCards(saved.mastery).find(card=>card.id===`dog-${run.puppy}`);
  if(dogCard) {
    const next=dogCard.tiers.find(tier=>dogCard.current<tier.target);
    $("run-highlights").textContent += next ? ` · ${dogCard.name} bond: ${dogCard.current}/${next.target} toward ${next.name}` : ` · ${dogCard.name}: Trail legend`;
  }
  $("run-breakdown-copy").textContent = `${$("overlay-copy").textContent} ${$("run-highlights").textContent}`;
  $("run-breakdown-copy").textContent += ` Best clean-move streak: ${run.bestCleanStreak}.`;
  $('score-sources').textContent=scoreBreakdown(run);
  if (run.rematchBest>0) {
    const difference=run.score-run.rematchBest;
    $("run-breakdown-copy").textContent += ` Rematch target: ${run.rematchBest.toLocaleString()} points. ${difference>0?`${difference.toLocaleString()} ahead`:difference===0?'Target tied':`${(-difference).toLocaleString()} short`}.`;
  }
  if (run.challengeTarget>0) {
    const difference=run.score-run.challengeTarget;
    $("run-breakdown-copy").textContent += ` Shared target: ${run.challengeTarget.toLocaleString()} points. ${difference>0?`${difference.toLocaleString()} ahead`:difference===0?'Target tied — one more point to beat it':`${(-difference).toLocaleString()} short`}. This is a friendly, unverified score, not a ranked result.`;
  }
  $("overlay-copy").textContent = `${resultChallenge(run)}${resultRecord(receipt,run)}${receipt.totalPoints.toLocaleString()} upgrade ${receipt.totalPoints===1?'point':'points'} banked. Retry the same trail, or head to camp ${sharedSeed === null ? 'for a fresh one' : 'to switch to random trails'}.`;
  if (run.relics) $("overlay-copy").textContent += ` ${run.relics} area ${run.relics === 1 ? 'relic' : 'relics'} found (+${run.relicPoints} points included).`;
  $("run-highlights").textContent = nextMasteryHint(saved.mastery,run.puppy);
  persist();
  if (!storageAvailable) $("overlay-copy").textContent = 'Run complete. These rewards are available for this visit only; saving is unavailable.';
  updateRecords();
  tone("finish");
}
$("play").onclick = start;
function chooseDailyTrail() {
  const daily=dailyTrail(window.location.href);
  if (!daily) return;
  sharedSeed=daily.seed;sharedVersion=daily.version;
  sharedTarget=trailBest(saved.trailRecords,daily.seed,daily.version);
  localDailyTarget=true;
  window.history.replaceState(null,'',daily.url);
  $('shared-description').textContent=`Daily trail · ${daily.day} UTC${sharedTarget?` · Your best: ${sharedTarget.toLocaleString()} pts`:''} · your upgrades apply.`;
  $('shared-trail').hidden=false;
  setState('menu');updateRecords();$('play').focus({preventScroll:true});
}
$('daily-trail').onclick = chooseDailyTrail;
$('daily-camp').onclick = chooseDailyTrail;
$('shared-random').onclick = () => {
  localDailyTarget=false;
  sharedSeed=null;
  sharedVersion=null;
  sharedTarget=0;
  const url=new window.URL(window.location.href);url.searchParams.delete('trail');
  url.searchParams.delete('target');
  window.history.replaceState(null,'',url);
  $('shared-trail').hidden=true;updateRecords();$('play').focus({preventScroll:true});
};
function updateTrailLink() {
  $('trail-link').value = trailLink(window.location.href,run.seed,run.generatorVersion,$('trail-target').checked?run.score:0);
  $('trail-copy-status').textContent='';
}
$('trail-target').onchange=updateTrailLink;
$('trail-copy').onclick = async () => {
  const button=$('trail-copy'),field=$('trail-link');
  button.disabled=true;
  try {
    await navigator.clipboard.writeText(field.value);
    $('trail-copy-status').textContent='Trail link copied. Send it wherever you like.';
  } catch {
    field.focus();field.select();
    $('trail-copy-status').textContent='Copy the selected link to share this trail.';
  } finally {button.disabled=false;}
};
function startPractice(kind, cornerIndex=0) {
  if (!graphicsReady) return;
  const returnTrail=rematchFor(run,state==='ended');
  start();
  const appearance = run.appearance;
  run = kind==='raft' ? createRaftPracticeRun(saved.upgrades)
    : kind==='weave' ? createWeavePracticeRun(saved.upgrades)
    : kind==='gap' ? createGapPracticeRun(saved.upgrades)
    : kind==='turn' ? createTurnPracticeRun(saved.upgrades,cornerIndex)
    : kind==='zipline' ? createZiplinePracticeRun(saved.upgrades) : createPracticeRun(saved.upgrades,kind);
  run.puppy = saved.collection.puppy;
  run.appearance = appearance;
  if(returnTrail)run.practice.returnTrail=returnTrail;
  run.missions = [currentMission];
  missionAnnounced = true;
}
$('practice-start').onclick = () => startPractice('moves');
$('practice-jump').onclick = () => startPractice('jump');
$('practice-slide').onclick = () => startPractice('slide');
$('practice-gap').onclick = () => startPractice('gap');
$('practice-weave').onclick = () => startPractice('weave');
$('practice-zipline').onclick = () => startPractice('zipline');
$('practice-raft').onclick = () => startPractice('raft');
$('practice-turn').onclick = () => startPractice('turn');
$('practice-again').onclick = () => {
  if (!run.practice) {
    const offer=practiceOffer(run);
    if (offer) startPractice(offer.kind,offer.cornerIndex);
    return;
  }
  startPractice(run.practice.kind || 'moves',
    run.practice.kind==='turn' && run.practice.correct ? 1-run.practice.cornerIndex : run.practice.cornerIndex || 0);
};
$("run-breakdown").addEventListener("toggle", () => {
  if ($("run-breakdown").open) $("run-breakdown").scrollIntoView({block:"start"});
});
for (const id of ['mission-help','practice-help']) {
  $(id).addEventListener('toggle', () => {
    if ($(id).open) $(id).scrollIntoView({block:'start'});
  });
}
$("help").onclick = () => {
  showOverlay("help");
  try {
    for(const image of document.querySelectorAll('[data-guide]'))
      if(!image.src)image.src=view.instructionImage(image.dataset.guide);
  } catch {
    graphicsError();
    return;
  }
  drawScene(run,time,state,reducedMotion,0,1,saved.collection);
};
$("shop").onclick = shop;
$("kennel").onclick = kennel;
$("pause-button").onclick = () => pause('manual');
$("home").onclick = () => {
  if (state === 'paused' && !run.practice) {
    run.retired = true;
    run.ended = true;
    finish();
    return;
  }
  setState("menu");
  $("play").focus();
};
$("overlay-primary").onclick = () => {
  if (state === "paused") {
    resume();
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
$("swipe-only").checked = saved.preferences.swipeOnly;
$('ambience').checked=saved.preferences.ambience;
$('ambience').onchange=()=>{
  saved.preferences.ambience=$('ambience').checked;
  if(!saved.preferences.ambience)soundscape.stop();
  persist();updateSaveNotice();
};
$("controls").classList.toggle("swipe-only", saved.preferences.swipeOnly);
$("swipe-only").onchange = () => {
  saved.preferences.swipeOnly = $("swipe-only").checked;
  $("controls").classList.toggle("swipe-only", saved.preferences.swipeOnly);
  persist();
};
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
  KeyF: "fetch",
};
window.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
  // Native Enter activation repeats on a focused button. Match the direct
  // shortcuts: one physical press means one move, including lane changes.
  if (event.repeat && ['Enter','Space'].includes(event.code) &&
      document.activeElement?.closest?.('button[data-action]')) {
    event.preventDefault();
    return;
  }
  // Focused controls own Space, including Pause and sound. Preventing their
  // native key event would turn activation into an accidental jump instead.
  if (event.code === 'Space' && document.activeElement?.closest?.('button,input,select,textarea,summary,a,[role="button"]')) return;
  if (event.key === "Tab" && !$("overlay").hidden) {
    const buttons = [
      ...$("overlay").querySelectorAll("button:not(:disabled), a[href], summary, input:not(:disabled)"),
    ].filter((button) => !button.closest("[hidden]") && button.getClientRects().length > 0);
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
    if (state === "playing") pause('manual');
    else if (state === "paused") {
      resume();
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
// A gesture can stay active across deliberate action segments. The first move
// Commits one lane at the normal swipe threshold. A player can continue without
// lifting: every additional thumb-length in the same direction snaps one more
// lane, while a short timing guard prevents a single noisy sample from firing
// twice. A clear cross-axis segment can follow a jump/slide (or a lane move)
// without lifting too. A deliberate short reversal re-arms the next lane
// immediately, so one finger can scrub back and forth naturally. Same-direction
// travel must stop briefly before it re-arms; a single very long sample still
// commits only one action, even when the browser coalesces events.
// A second same-direction segment needs about one thumb-width, not a full phone
// lane. This makes held drags comfortable on narrow screens while the natural
// world lane clamp prevents the puppy from travelling beyond the trail.
const LANE_DRAG_REPEAT_DISTANCE = 48;
// Require a brief quiet gap between same-direction lane moves. This keeps a
// slow, well-sampled over-swipe from walking the puppy across the trail while
// still allowing a held finger to stop moving and drag again for the next lane.
const LANE_DRAG_REPEAT_DELAY = 96;
// Phones can emit a few CSS-pixel pointer samples while a thumb is resting.
// Do not let that micro-jitter erase the quiet gap the player intentionally
// created between held-drag segments.
const LANE_DRAG_PAUSE_MOVE_DISTANCE = 6;
// A single browser sample can cover much more than a thumb-width. Treat that
// as one over-drag and rebase instead of turning it into an accidental second
// lane move; a normal follow-up segment can still continue without a lift.
const LANE_DRAG_MAX_AUTO_DISTANCE = 84;
const LANE_DRAG_REVERSE_DISTANCE = 28;
const LANE_DRAG_LARGE_REVERSE_DISTANCE = 64;
const LANE_DRAG_REVERSE_DELAY = 90;
const CROSS_AXIS_DISTANCE = 32;
function touchGhostElement() {
  if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return null;
  return document.getElementById('touch-ghost');
}
function showTouchGhost(event, action = 'ready') {
  if (event?.pointerType !== 'touch') return;
  const ghost = touchGhostElement();
  if (!ghost) return;
  if (Number.isFinite(event.clientX)) ghost.style.setProperty('--touch-x', `${event.clientX}px`);
  if (Number.isFinite(event.clientY)) ghost.style.setProperty('--touch-y', `${event.clientY}px`);
  ghost.hidden = false;
  ghost.dataset.action = action;
  ghost.dataset.visible = 'true';
  const icon = ghost.firstElementChild;
  if (icon) icon.textContent = {left:'←',right:'→',jump:'↑',slide:'↓'}[action] || '•';
}
function hideTouchGhost() {
  const ghost = touchGhostElement();
  if (!ghost) return;
  ghost.hidden = true;
  ghost.dataset.visible = 'false';
}
function confirmTouchAction(action) {
  if (run && typeof run === 'object' && !run.ended)
    run.touchFeedback = '';
  if (run && typeof run === 'object' && !run.ended)
    run.touchActionCount = (run.touchActionCount || 0) + 1;
  if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return;
  const button = document.querySelector(`#controls [data-action="${action}"]`);
  if (!button) return;
  button.classList.remove('touch-confirmed');
  // Force a new animation when two quick actions use the same button.
  void button.offsetWidth;
  button.classList.add('touch-confirmed');
  if (typeof window !== 'undefined' && typeof window.setTimeout === 'function')
    window.setTimeout(() => button.classList.remove('touch-confirmed'), 240);
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function')
    navigator.vibrate(8);
}
function performTouchAction(action, event) {
  const isTouch = event?.pointerType === 'touch';
  const laneBefore = run?.lane;
  const turnBefore = run?.turnAttempt;
  act(run, action);
  if (!isTouch) return;
  confirmTouchAction(action);
  // A bounded lane input at the trail edge is a valid touch, but it looks like
  // a missed gesture unless we explain why the puppy stayed put. Turn inputs
  // intentionally keep ownership of the same horizontal gesture and must not
  // be mislabeled as an edge hit.
  if ((action === 'left' || action === 'right') &&
      Number.isFinite(laneBefore) && run.lane === laneBefore &&
      run.turnAttempt === turnBefore)
    run.touchFeedback = 'AT THE EDGE · TRY THE OTHER WAY';
}
const markTouchSwipe = event => {
  if (event?.pointerType === 'touch') run.touchSwipeSeen = true;
};
const commitPointerAction = (action, event) => {
  // A very long first sample still receives one bounded snap. Once the player
  // makes the next thumb-length move, the adaptive hint has done its job and
  // can return to the normal first-run lesson.
  if (event?.pointerType === 'touch') {
    run.touchOverdrag = false;
    run.touchFeedback = '';
  }
  markTouchSwipe(event);
  performTouchAction(action, event);
};
$("scene").addEventListener("pointerdown", (event) => {
  if (state !== "playing" || !canStartSwipe(event,pointer)) return;
  event.preventDefault?.();
  if (event.pointerType === 'touch') run.touchFeedback = '';
  pointer = {
    pointerType: event.pointerType,
    x: event.clientX,
    y: event.clientY,
    id: event.pointerId,
    started: event.timeStamp,
    travel: 0,
    axis: null,
    anchorX: event.clientX,
    anchorY: event.clientY,
    lastActionAt: null,
    lastMoveAt: event.timeStamp,
    laneDirection: null,
    // Keep a cumulative opposite-direction segment. Mobile browsers usually
    // sample a held thumb in small steps, so looking at one pointermove at a
    // time makes an ordinary return drag look like harmless jitter.
    reverseDirection: null,
    reverseStartX: null,
    // Cross-axis corrections need the same treatment after a horizontal
    // overswipe: a jump/slide may arrive as several small vertical samples.
    crossAxisDirection: null,
    crossAxisStartY: null,
    lastX: event.clientX,
    lastY: event.clientY,
  };
  showTouchGhost(event);
  try { $("scene").setPointerCapture(event.pointerId); }
  catch {
    hideTouchGhost();
    pointer=null;
    pause('touch'); // A vanished touch must not leave the trail running without input.
  }
});
function processPointerMove(event) {
  if (
    !pointer || pointer.id !== event.pointerId || state !== "playing"
  )
    return;
  event.preventDefault?.();
  showTouchGhost(event, pointer.laneDirection || 'ready');
  const dx = event.clientX - pointer.x,
    dy = event.clientY - pointer.y;
  const previousX = pointer.lastX,
    previousY = pointer.lastY,
    stepX = event.clientX - previousX,
    stepY = event.clientY - previousY;
  const pauseSinceMove = event.timeStamp -
    (Number.isFinite(pointer.lastMoveAt) ? pointer.lastMoveAt : pointer.started);
  if (Math.max(Math.abs(stepX), Math.abs(stepY)) >= LANE_DRAG_PAUSE_MOVE_DISTANCE)
    pointer.lastMoveAt = event.timeStamp;
  pointer.travel = Math.max(pointer.travel, Math.abs(dx), Math.abs(dy));
  pointer.lastX = event.clientX;
  pointer.lastY = event.clientY;
  if (!pointer.axis) {
    const action = swipeAction(dx, dy);
    if (!action) return;
    pointer.axis = action === 'left' || action === 'right' ? 'horizontal' : 'vertical';
    pointer.anchorX = event.clientX;
    pointer.anchorY = event.clientY;
    pointer.lastActionAt = event.timeStamp;
    pointer.laneDirection = action;
    commitPointerAction(action, event);
    showTouchGhost(event, action);
    // A browser can coalesce a fast thumb movement into one very large
    // pointermove. It still gets exactly one lane, but should also receive
    // the same held-drag explanation as a sampled overdrag.
    if (event.pointerType === 'touch' && pointer.axis === 'horizontal' &&
      Math.abs(dx) >= LANE_DRAG_REPEAT_DISTANCE)
      run.touchOverdrag = true;
    return;
  }
  const deltaX = event.clientX - pointer.anchorX;
  const deltaY = event.clientY - pointer.anchorY;
  const elapsed = event.timeStamp - pointer.lastActionAt;
  // Same-axis horizontal segments remain deliberately thumb-length. Each
  // additional segment can snap another lane without requiring a lift; the
  // small timing guard below prevents duplicate events from one noisy sample.
  // Vertical actions stay single-shot; a clear horizontal segment may follow
  // one without lifting (and vice versa).
  if (pointer.axis === 'horizontal') {
    const verticalStep = Math.abs(stepY) >= CROSS_AXIS_DISTANCE &&
      Math.abs(stepY) > Math.abs(stepX) * 1.12;
    const vertical = Math.abs(deltaY) >= CROSS_AXIS_DISTANCE &&
      Math.abs(deltaY) > Math.abs(deltaX) * 1.12;
    const verticalPathDirection = Math.abs(stepY) >= LANE_DRAG_PAUSE_MOVE_DISTANCE &&
      Math.abs(stepY) > Math.abs(stepX) * 1.12
      ? stepY > 0 ? 'slide' : 'jump' : null;
    let verticalPathReady = false;
    if (verticalPathDirection) {
      if (pointer.crossAxisDirection !== verticalPathDirection) {
        pointer.crossAxisDirection = verticalPathDirection;
        pointer.crossAxisStartY = previousY;
      }
      verticalPathReady = Number.isFinite(pointer.crossAxisStartY) &&
        Math.abs(event.clientY - pointer.crossAxisStartY) >= CROSS_AXIS_DISTANCE;
    } else if (Math.abs(stepX) >= LANE_DRAG_PAUSE_MOVE_DISTANCE) {
      // A meaningful horizontal segment abandons a partial vertical path;
      // tiny rest jitter does not.
      pointer.crossAxisDirection = null;
      pointer.crossAxisStartY = null;
    }
    // Prefer a clear local vertical movement to a stale horizontal offset.
    // This lets a player jump or slide after steering too far without lifting.
    if (verticalStep || vertical || verticalPathReady) {
      pointer.axis = 'vertical';
      pointer.anchorX = event.clientX;
      pointer.anchorY = event.clientY;
      pointer.lastActionAt = event.timeStamp;
      const verticalAction = verticalPathDirection || (deltaY > 0 ? 'slide' : 'jump');
      pointer.crossAxisDirection = null;
      pointer.crossAxisStartY = null;
      pointer.reverseDirection = null;
      pointer.reverseStartX = null;
      commitPointerAction(verticalAction, event);
      showTouchGhost(event, verticalAction);
      return;
    }
    // A player who keeps their finger down often swipes back immediately after
    // a long segment. Treat a clear opposite local segment as the next lane
    // move. The distance and delay filters keep small thumb wobble near the
    // snap from reversing the puppy.
    const localDirection = stepX > 0 ? 'right' : stepX < 0 ? 'left' : null;
    if (localDirection && pointer.laneDirection &&
      localDirection !== pointer.laneDirection) {
      // Accumulate the whole opposite segment rather than requiring one
      // unusually large pointermove. This is what makes a no-lift correction
      // work on both high- and low-sampling phones.
      if (pointer.reverseDirection !== localDirection) {
        pointer.reverseDirection = localDirection;
        pointer.reverseStartX = previousX;
      }
      const reverseDistance = Number.isFinite(pointer.reverseStartX)
        ? Math.abs(event.clientX - pointer.reverseStartX) : Math.abs(stepX);
      const reverseElapsed = Number.isFinite(pointer.lastActionAt)
        ? event.timeStamp - pointer.lastActionAt : 0;
      const reversing = reverseDistance >= LANE_DRAG_REVERSE_DISTANCE &&
        Number.isFinite(pointer.lastActionAt) &&
        (reverseDistance >= LANE_DRAG_LARGE_REVERSE_DISTANCE ||
          reverseElapsed >= LANE_DRAG_REVERSE_DELAY);
      if (!reversing) return;
      pointer.reverseDirection = null;
      pointer.reverseStartX = null;
      pointer.anchorX = event.clientX;
      pointer.anchorY = event.clientY;
      pointer.lastActionAt = event.timeStamp;
      pointer.laneDirection = localDirection;
      pointer.crossAxisDirection = null;
      pointer.crossAxisStartY = null;
      commitPointerAction(localDirection, event);
      showTouchGhost(event, localDirection);
      return;
    }
    // A same-direction sample starts a fresh potential reversal. A rest keeps
    // the accumulated segment alive so the next small sample can finish it.
    if (localDirection === pointer.laneDirection) {
      pointer.reverseDirection = null;
      pointer.reverseStartX = null;
    }
    if (Math.abs(deltaX) >= LANE_DRAG_REPEAT_DISTANCE) {
      // Only same-direction travel reaches this branch. Opposite movement is
      // handled by the deliberate reversal guard above, which filters out
      // tiny thumb wobble after a snap.
      const segmentDirection = deltaX > 0 ? 'right' : 'left';
      if (segmentDirection !== pointer.laneDirection) return;
      if (Math.abs(deltaX) > LANE_DRAG_MAX_AUTO_DISTANCE) {
        if (event.pointerType === 'touch') run.touchOverdrag = true;
        // Keep the thumb's current position as the next segment's origin. This
        // prevents one coalesced over-drag from walking across the trail while
        // preserving the no-lift path once the player moves another thumb-width.
        pointer.anchorX = event.clientX;
        pointer.anchorY = event.clientY;
        pointer.lastActionAt = event.timeStamp;
        return;
      }
      // A delay since the previous action is not enough: a continuous slow
      // stroke can otherwise cross another threshold every few samples. Only
      // re-arm after the pointer has stopped moving for the full pause window.
      if (Number.isFinite(elapsed) && elapsed < LANE_DRAG_REPEAT_DELAY) return;
      if (Number.isFinite(pauseSinceMove) && pauseSinceMove < LANE_DRAG_REPEAT_DELAY) return;
      pointer.anchorX = event.clientX;
      pointer.anchorY = event.clientY;
      pointer.lastActionAt = event.timeStamp;
      pointer.laneDirection = segmentDirection;
      pointer.crossAxisDirection = null;
      pointer.crossAxisStartY = null;
      commitPointerAction(segmentDirection, event);
      showTouchGhost(event, pointer.laneDirection);
      return;
    }
    return;
  }
  if (pointer.axis !== 'vertical') return;
  const horizontalStep = Math.abs(stepX) >= CROSS_AXIS_DISTANCE &&
    Math.abs(stepX) > Math.abs(stepY) * 1.12;
  const horizontal = horizontalStep || Math.abs(deltaX) >= CROSS_AXIS_DISTANCE &&
    Math.abs(deltaX) > Math.abs(deltaY) * 1.12;
  if (!horizontal) return;
  pointer.axis = 'horizontal';
  pointer.anchorX = event.clientX;
  pointer.anchorY = event.clientY;
  pointer.lastActionAt = event.timeStamp;
  pointer.laneDirection = deltaX > 0 ? 'right' : 'left';
  commitPointerAction(pointer.laneDirection, event);
  showTouchGhost(event, pointer.laneDirection);
}
$("scene").addEventListener("pointermove", (event) => {
  if (!pointer || pointer.id !== event.pointerId || state !== "playing") return;
  event.preventDefault?.();
  // PointerEvent coalescing is common during fast touch paths. Process the
  // samples that the browser kept instead of judging a whole out-and-back
  // gesture from its final coordinate alone. The terminal event is appended
  // only when it is not already represented by the coalesced list.
  let coalesced = [];
  try {
    coalesced = typeof event.getCoalescedEvents === 'function'
      ? event.getCoalescedEvents() : [];
  } catch {
    // A few embedded browsers expose the method but throw when touch
    // hardware does not provide a coalesced sample buffer. The terminal
    // PointerEvent is still a valid sample and remains our safe fallback.
  }
  const samples = Array.isArray(coalesced) ? [...coalesced] : [];
  const last = samples[samples.length - 1];
  if (!last || last.timeStamp !== event.timeStamp ||
    last.clientX !== event.clientX || last.clientY !== event.clientY)
    samples.push(event);
  for (const sample of samples) {
    processPointerMove(sample);
    if (!pointer || state !== "playing") break;
  }
});
$("scene").addEventListener("pointerup", (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  event.preventDefault?.();
  if (pointer.axis) {
    // A phone may deliver the final part of a fast swipe only on pointerup.
    // Consume one trailing thumb-length segment so a player does not need to
    // repeat the same gesture just because intermediate samples were sparse.
    if (event.pointerType === 'touch' && pointer.axis === 'horizontal' &&
      pointer.laneDirection && Number.isFinite(pointer.lastActionAt)) {
      const deltaX = event.clientX - pointer.anchorX;
      const deltaY = event.clientY - pointer.anchorY;
      const segmentDirection = deltaX > 0 ? 'right' : 'left';
      const elapsed = event.timeStamp - pointer.lastActionAt;
      const pauseSinceMove = event.timeStamp -
        (Number.isFinite(pointer.lastMoveAt) ? pointer.lastMoveAt : pointer.started);
      const verticalIntent = Math.abs(deltaY) >= CROSS_AXIS_DISTANCE &&
        Math.abs(deltaY) > Math.abs(deltaX) * 1.12;
      if (verticalIntent) {
        // The final upward/downward part of a held gesture can be delivered
        // only on pointerup when the browser coalesces touch samples.
        commitPointerAction(deltaY > 0 ? 'slide' : 'jump', event);
      } else if (segmentDirection === pointer.laneDirection &&
        Math.abs(deltaX) >= LANE_DRAG_REPEAT_DISTANCE &&
        Math.abs(deltaX) <= LANE_DRAG_MAX_AUTO_DISTANCE &&
        elapsed >= LANE_DRAG_REPEAT_DELAY &&
        (!Number.isFinite(pauseSinceMove) || pauseSinceMove >= LANE_DRAG_REPEAT_DELAY)) {
        commitPointerAction(segmentDirection, event);
      } else if (segmentDirection !== pointer.laneDirection) {
        // A reverse may also be represented by the release coordinate alone.
        // Use an accumulated start when pointermove saw part of the return;
        // otherwise the last accepted snap is the safe origin.
        const reverseStart = pointer.reverseDirection === segmentDirection &&
          Number.isFinite(pointer.reverseStartX)
          ? pointer.reverseStartX : pointer.anchorX;
        const reverseDistance = Math.abs(event.clientX - reverseStart);
        if (reverseDistance >= LANE_DRAG_REVERSE_DISTANCE &&
          Number.isFinite(pointer.lastActionAt) &&
          (reverseDistance >= LANE_DRAG_LARGE_REVERSE_DISTANCE ||
            elapsed >= LANE_DRAG_REVERSE_DELAY)) {
          pointer.reverseDirection = null;
          pointer.reverseStartX = null;
          pointer.laneDirection = segmentDirection;
          commitPointerAction(segmentDirection, event);
        }
      }
    }
    hideTouchGhost();
    pointer = null;
    return;
  }
  const dx = event.clientX - pointer.x,
    dy = event.clientY - pointer.y;
  const screenWidth = $("scene").clientWidth || event.view?.innerWidth ||
    (typeof window !== 'undefined' ? window.innerWidth : 0);
  const action = tapAction(pointer, event, screenWidth,
    event.pointerType === 'touch');
  const touchPointer = pointer;
  hideTouchGhost();
  pointer = null;
  if (state !== "playing") return;
  if (action) {
    performTouchAction(action, event);
  }
  else {
    const action = swipeAction(dx, dy, true);
    if (action) {
      commitPointerAction(action, event);
    } else if (event.pointerType === 'touch') {
      const heldTooLong = event.timeStamp - touchPointer.started > 350;
      run.touchFeedback = heldTooLong && touchPointer.travel < 24
        ? 'TAP QUICKLY · OR USE THE BIG BUTTONS'
        : 'ONE DIRECTION AT A TIME · TRY AGAIN';
    }
  }
});
const cancelOwnedPointer = event => {
  if(!ownsSwipe(event,pointer))return;
  hideTouchGhost();
  pointer=null;
  // The browser took over this gesture. Do not keep running under a system UI.
  pause('touch');
};
$("scene").addEventListener("pointercancel", cancelOwnedPointer);
$("scene").addEventListener("lostpointercapture", cancelOwnedPointer);
for (const button of document.querySelectorAll("[data-action]")) {
  button.onpointerdown = (event) => {
    if (state === "playing" && canPressAction(event)) {
      event.preventDefault();
      if (typeof hideTouchGhost === 'function') hideTouchGhost();
      pointer = null; // A button supersedes an unfinished trail tap, not a second move on release.
      if (event.pointerType === 'touch') run.touchFeedback = '';
      performTouchAction(button.dataset.action, event);
    }
  };
  button.onclick = (event) => {
    if (state === "playing" && event.detail === 0) {
      pointer = null;
      act(run, button.dataset.action);
    }
  };
}
window.addEventListener("blur", () => pause('background'));
// Mobile browsers can freeze or discard a page without delivering blur or a
// visibilitychange first.  pagehide is the last reliable lifecycle signal;
// pausing here prevents a restored page from looking frozen while its old run
// continues behind the browser's back/forward cache.
window.addEventListener("pagehide", () => pause('background'));
// Rotation can move hazards and touch targets beneath a player's thumb.
// Listen to device orientation, not resize: mobile browser chrome resizes often.
if (window.screen?.orientation?.addEventListener)
  window.screen.orientation.addEventListener('change', () => pause('rotation'));
else window.addEventListener('orientationchange', () => pause('rotation'));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause('background');
});
$("scene").addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  graphicsError();
});
function graphicsError() {
  // Keep recovery idempotent even if the original failure happened while the
  // finish/overlay path was already unwinding. A second RAF must not bank or
  // replace the same run again.
  if (graphicsError.handled && state === 'graphics-error') return;
  graphicsError.handled = true;
  if (['playing','paused'].includes(state) && !run.practice) {
    run.retired = true;
    run.ended = true;
    try {
      finish();
      run.graphicsRescued = Boolean(run.receipt);
    } catch {
      // A storage or DOM failure while banking must not prevent the recovery
      // screen from appearing; keep the run unclaimed and offer a clean retry.
      run.graphicsRescued = false;
    }
  }
  if(audio)stopSound(audio);
  graphicsReady=false;
  $("play").disabled=true;
  $("overlay-primary").disabled = false;
  showOverlay("graphics-error");
  $("overlay-label").textContent="LET’S GET YOUR PAWS BACK ON THE TRAIL";
  const mobileGraphics = window.matchMedia?.('(pointer: coarse)')?.matches === true;
  const desktopHelp = $('graphics-desktop-help');
  const mobileHelp = $('graphics-mobile-help');
  if (desktopHelp) desktopHelp.hidden = mobileGraphics;
  if (mobileHelp) mobileHelp.hidden = !mobileGraphics;
  $('graphics-recovery')?.setAttribute?.('aria-label',
    mobileGraphics ? 'Restore full 3D graphics on this device' : 'Turn on full 3D graphics');
  $("overlay-title").textContent = mobileGraphics
    ? "This device needs a clean 3D start."
    : "Chrome needs hardware acceleration.";
  $("overlay-copy").textContent = mobileGraphics
    ? run.graphicsRescued
      ? storageAvailable
        ? 'The trail was interrupted on this device, but your earned points, bones and completed challenges were saved. Close other games or 3D-heavy tabs, relaunch your browser if needed, then try the 3D trail again.'
        : 'The trail was interrupted on this device. Earned rewards were counted for this visit, but saving is unavailable. Close other games or 3D-heavy tabs, relaunch your browser if needed, then try the 3D trail again.'
      : 'This device or browser did not expose the WebGL2 graphics context the full 3D trail needs. Close other games or 3D-heavy tabs, relaunch your browser, then choose Try 3D again. Older or managed browsers may not support the full 3D trail. Your saved puppies, outfits and points stay in this browser; practice never changes your progress.'
    : run.graphicsRescued
      ? storageAvailable
        ? 'The trail was interrupted, but your earned points, bones and completed challenges were saved. Turn on Chrome hardware acceleration, then try the 3D trail again.'
        : 'The trail was interrupted. Earned rewards were counted for this visit, but saving is unavailable. Turn on Chrome hardware acceleration, then try the 3D trail again.'
      : 'Chrome is not exposing the WebGL2 graphics context the full 3D trail needs. Turn on hardware acceleration using the steps below, relaunch Chrome, then try again. Your saved puppies, outfits and points stay in this browser; practice never changes your progress.';
  $("overlay-primary").textContent = "Try 3D again";
  $("overlay-primary").onclick = () => {
    // A normal reload can keep an interrupted module graph in a service
    // worker cache. Change only a disposable retry parameter so the browser
    // asks for a fresh document while preserving any shared-trail query.
    const url = new window.URL(window.location.href);
    url.searchParams.set('retry', String(Date.now()));
    if (typeof window.location.assign === 'function') window.location.assign(url.href);
    else window.location.reload();
  };
}
let view;
try {
  view = createView($("scene"));
  $("play").textContent = 'Preparing the trail…';
  $("overlay-primary").disabled = true;
  void prepareFirstFrame(()=>view.prepareShaders()).then(()=>{
    if(state==='graphics-error')return;
    graphicsReady=true;
    $("play").disabled = false;
    $("overlay-primary").disabled = false;
    $("play").textContent = playLabel();
    if(state==='menu' && (!document.activeElement || document.activeElement===document.body))
      $("play").focus({preventScroll:true});
  });
} catch {
  // Full 3D is intentional: never silently downgrade the runner to a
  // different presentation. The recovery overlay explains the one browser
  // setting that can restore the authored trail and offers a cache-busted
  // re-probe after Chrome has been relaunched.
  view = null;
  $("game").dataset.renderer = 'webgl-required';
  const mobileGraphics = window.matchMedia?.('(pointer: coarse)')?.matches === true;
  $("scene").setAttribute('aria-label', mobileGraphics
    ? 'Full 3D running trail unavailable on this device. Close other games or 3D-heavy tabs and choose Try 3D again.'
    : 'Full 3D running trail unavailable. Turn on Chrome hardware acceleration and choose Try 3D again.');
  graphicsError();
}
// A mobile GPU can lose a texture or reject a draw without delivering the
// WebGL context-lost event first. Keep one bad frame from silently terminating
// requestAnimationFrame; the existing recovery screen is a much safer exit.
function drawScene(runState, now, screenState, motionReduced, delta, blend, collection, frameDelta) {
  if (!view || !graphicsReady) return;
  try {
    view.draw(runState, now, screenState, motionReduced, delta, blend, collection, frameDelta);
  } catch {
    graphicsError();
  }
}
let currentMission = missionFor(saved.challenges),
  missionAnnounced = false;
let lastHud = -1;
function frame(now) {
  try {
    const frameDt = (now - last) / 1000 || 0;
    const dt = Math.min(0.05, frameDt);
    last = now;
    time += dt;
    if (state === "playing" && !tilt.isRequesting()) {
    accumulator += resumeStep(run, dt);
    while (accumulator >= 1 / 120 && !run.ended) {
      if (run.practice) stepPractice(run, 1 / 120);
      else step(run, 1 / 120);
      accumulator -= 1 / 120;
    }
    for (const event of run.events) {
      const notice = eventNotice(event, run);
      if (notice) toast(notice.text, 1.5, notice.priority);
      if (event === "bone") tone(740 + Math.min(run.combo, 12) * 28, 0.055);
      if (event === "streak" || event === 'flow') {
        tone("reward");
      }
      if (event === "clear" || event === 'weave') tone(540, 0.08);
      if (event === "turn-left" || event === "turn-right") tone(680, 0.1);
      if (event === "course-complete" || event === "course-recovery") tone('reward');
      if (event === "jump") tone("jump");
      if (event === "land") tone("land");
      if (event === "slide") tone("slide");
      if (event === "magnet") {
        tone(900, 0.25);
      }
      if (event === "shield") {
        tone(650, 0.25);
      }
      if (event === "gem") {
        tone(990, 0.2);
      }
      if (event === "gift") tone("reward");
      if (event === "zoomies") tone("zoomies");
      if (event === "fetch") tone(900, .25);
      if (event === "smash") tone(260,.08);
      const rideSound=traversalCue(event);
      if(rideSound)tone(rideSound);
      if (event === "double") {
        tone(880, 0.2);
      }
      if (event === "heart") {
        tone(660, 0.2);
      }
      if (event === "relic") tone("reward");
      if (event === "hit") {
        tone('hit');
      }
    }
    run.events = [];
    updateTraversalControls(traversalButtons,run);
    const sceneDescription=traversalDescription(run);
    if($('scene').getAttribute('aria-label')!==sceneDescription)$('scene').setAttribute('aria-label',sceneDescription);
    $("scene").dataset.lane = String(run.lane + 1);
    $("scene").dataset.turns = String(run.turns);
    $("scene").dataset.missedTurns = String(run.missedTurns);
    $("scene").dataset.courses = run.regionalCourses.join(',');
    $("scene").dataset.course = run.course?.name || '';
    $("scene").dataset.posture =
      run.raft ? "raft" : run.zipline ? "zipline" : run.y > 0.05 ? "jump" : run.slide > 0 ? "slide" : "run";
    // Decision cues follow each rendered frame; counters can wait for the HUD tick.
    setText('cue', run.practice ? practiceCue(run) : actionCue(run));
    if (Math.floor(run.time * 10) !== lastHud || run.ended) {
      lastHud = Math.floor(run.time * 10);
      $("distance").innerHTML = `${Math.floor(run.distance-(run.practice?.start || 0))}<small> m</small>`;
      const labels=runHudLabels(run,saved.best);
      $("region-name").textContent = labels.region;
      $("area-rhythm").textContent = labels.rhythm;
      setText('route-choice', routeChoiceCue(run));
      $("bones").textContent = run.bones;
      $("run-score").textContent = labels.score;
      const progress = missionProgress(run, currentMission);
      const courseStatus=courseProgress(run);
      $("mission-label").textContent = courseStatus?.label ??
        `${run.missions.indexOf(currentMission)+1}/3 · ${currentMission.title} · ${progress}/${currentMission.target} ${currentMission.unit}`;
      $("mission-progress").max = courseStatus?.max ?? currentMission.target;
      $("mission-progress").value = courseStatus?.value ?? progress;
      $("mission-progress").setAttribute('aria-label',courseStatus?.ariaLabel ?? (courseStatus?'Clean course moves':'Challenge progress'));
      if (progress === currentMission.target && !missionAnnounced) {
        missionAnnounced = true;
        toast(
          `Goal complete · +${currentMission.reward} at finish`,
          2, 0,
        );
      }
      if (missionAnnounced && time >= toastUntil) {
        const next = run.missions[run.missions.indexOf(currentMission) + 1];
        if (next) { currentMission = next; missionAnnounced = false; }
      }
      const fetchButton = $('fetch');
      $('scene').dataset.fetchUses = String(run.fetchUses);
      const ready = fetchReady(run);
      if (fetchButton.disabled && ready) tone('ready');
      fetchButton.disabled = !ready;
      fetchButton.classList.toggle('ready', !fetchButton.disabled);
      fetchButton.classList.toggle('charging', !ready && run.fetchTime <= 0 && run.magnet <= 0);
      setText('fetch', run.fetchTime > 0 ? `FETCH · ${Math.ceil(run.fetchTime)}s`
        : run.magnet > 0 ? `MAGNET ACTIVE · ${run.fetchCharge}%`
        : run.fetchCharge === 100 ? 'FETCH READY · F' : `FETCH · ${run.fetchCharge}%`);
      fetchButton.setAttribute('aria-label', run.fetchTime > 0 ? 'Fetch active'
        : run.magnet > 0 ? `Magnet active. Fetch charge ${run.fetchCharge} percent`
        : `Fetch ${run.fetchCharge === 100 ? 'ready. Tap or press F to collect nearby bones for four seconds' : `charge ${run.fetchCharge} percent. The Fetch meter becomes available at 100 percent`}`);
      fetchButton.setAttribute('title', ready ? 'Fetch nearby bones for four seconds'
        : run.fetchTime > 0 ? 'Fetch is active'
        : run.magnet > 0 ? 'Magnet is active; Fetch recharges afterward'
        : 'Collect bones and clear obstacles to charge Fetch');
      const turn = turnPrompt(run);
      $("scene").dataset.turn = turn ? `${turn.direction}-${turn.status}` : '';
      for (const direction of ['left','right']) {
        const button = document.querySelector(`[data-action="${direction}"]`);
        const active = turn && turn.status !== 'accepted' && turn.direction === direction;
        button.classList.toggle('turn-ready', Boolean(active));
        button.querySelector('small').textContent=active?'TURN':direction.toUpperCase();
        button.setAttribute('aria-label', turn ? `Turn ${direction}` : `Move ${direction} one lane`);
      }
      $("hearts").textContent =
        "♥ ".repeat(Math.max(0, run.hearts)) + "♡ ".repeat(3 - run.hearts);
      $("hearts").setAttribute("aria-label", `${run.hearts} hearts remaining`);
      if (run.practice) { $('hearts').textContent = '∞'; $('hearts').setAttribute('aria-label','Practice: unlimited tries'); }
      $("hud").classList.toggle("has-powers", updatePowerHud(run));
    }
    if (run.ended) finish();
    }
    if (time > toastUntil) setText('toast', '');
    try{
      soundscape.update(audio,{enabled:sound&&saved.preferences.ambience&&state==='playing'&&!run.ended&&!document.hidden&&!tilt.isRequesting(),
        time:run.time,distance:run.distance,quiet:!$('cue').textContent&&!routeChoiceCue(run)&&!run.practice});
    }catch{soundscape.stop();} // Optional audio must never interrupt animation.
    syncDock();
    drawScene(run, time, state, reducedMotion, dt, accumulator / (1 / 120), saved.collection, frameDt);
  } catch {
    // A mobile driver can reject a non-draw update (for example while its
    // canvas is being reclaimed). Keep the RAF chain alive and show the same
    // recoverable 3D screen instead of leaving a frozen, untouchable run.
    graphicsError();
  } finally {
    requestAnimationFrame(frame);
  }
}
if(graphicsReady)$("play").focus({ preventScroll: true });
requestAnimationFrame(frame);
