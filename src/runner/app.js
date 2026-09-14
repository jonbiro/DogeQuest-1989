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
import {supportsMobileTilt,noTiltController} from './tilt-platform.js';
import {scoreBreakdown} from './score-breakdown.js';
import {rematchFor} from './rematch.js';
import {preferencesFrom} from "./preferences.js";
import {readStoredProfile,writeStoredProfile} from "./storage.js";
import {CUES,playNotes,stopSound,resumeSound,traversalCue,feedbackPriority} from "./sound.js";
import {createAreaSoundscape} from './soundscape.js';
import {actionCue,eventNotice,dockMode,runLesson,routeChoiceCue,touchCoach} from "./guidance.js";
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
  saved.collection = collectionFrom(value?.collection);
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
  view.draw(run,time,state,reducedMotion,0,1,saved.collection);
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
    const copy = touchCoach(run);
    setText('gesture-coach', copy);
    coach.hidden = state !== 'playing' || !copy || Boolean(mode && mode !== 'mission-summary');
  }
}
const mobileTilt = supportsMobileTilt(window);
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
}
function start() {
  if(!graphicsReady)return;
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
  // Keep the opening interaction hint for actual phone/tablet players only;
  // desktop stays focused on the authored trail and explicit buttons.
  run.touchHint = typeof mobileTilt === 'boolean' && mobileTilt;
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
        ? "Press and hold on the trail. Drag one lane left or right; pause briefly, then drag again without lifting. On a phone, tap an edge to steer or the center to jump. A clear cross-direction swipe can switch between steering and jump or slide without lifting. Swipe up to jump or down to slide. The buttons always work."
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
  if (audio) stopSound(audio);
  if (state === "playing") showOverlay("paused");
}
function resume() {
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
  for(const image of document.querySelectorAll('[data-guide]'))
    if(!image.src)image.src=view.instructionImage(image.dataset.guide);
  view.draw(run,time,state,reducedMotion,0,1,saved.collection);
};
$("shop").onclick = shop;
$("kennel").onclick = kennel;
$("pause-button").onclick = pause;
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
    if (state === "playing") pause();
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
// commits one lane at the normal swipe threshold. A player can continue without
// lifting, but must pause briefly between lane segments before another one is
// armed; one long, fast drag therefore cannot throw the runner to the edge. The
// pause can happen anywhere after the snap (a thumb that overshot does not need
// to travel back), while a clear cross-axis segment can follow a jump/slide (or
// a lane move) without lifting too. A single very long sample still commits
// only one action, even when the browser coalesces pointer events.
const LANE_DRAG_REPEAT_DISTANCE = 56;
const LANE_DRAG_REPEAT_DELAY = 140;
const LANE_DRAG_REARM_RADIUS = 20;
const LANE_DRAG_REARM_DWELL = 110;
const CROSS_AXIS_DISTANCE = 32;
$("scene").addEventListener("pointerdown", (event) => {
  if (state !== "playing" || !canStartSwipe(event,pointer)) return;
  event.preventDefault?.();
  pointer = {
    x: event.clientX,
    y: event.clientY,
    id: event.pointerId,
    started: event.timeStamp,
    travel: 0,
    axis: null,
    anchorX: event.clientX,
    anchorY: event.clientY,
    lastActionAt: null,
    lastX: event.clientX,
    lastY: event.clientY,
    lastMoveAt: event.timeStamp,
    settledSince: null,
    laneRearmed: true,
  };
  try { $("scene").setPointerCapture(event.pointerId); }
  catch {
    pointer=null;
    pause(); // A vanished touch must not leave the trail running without input.
  }
});
$("scene").addEventListener("pointermove", (event) => {
  if (
    !pointer || pointer.id !== event.pointerId || state !== "playing"
  )
    return;
  event.preventDefault?.();
  const dx = event.clientX - pointer.x,
    dy = event.clientY - pointer.y;
  pointer.travel = Math.max(pointer.travel, Math.abs(dx), Math.abs(dy));
  const previousX = pointer.lastX,
    previousY = pointer.lastY,
    previousMoveAt = pointer.lastMoveAt,
    stepX = event.clientX - previousX,
    stepY = event.clientY - previousY;
  pointer.lastX = event.clientX;
  pointer.lastY = event.clientY;
  pointer.lastMoveAt = event.timeStamp;
  if (!pointer.axis) {
    const action = swipeAction(dx, dy);
    if (!action) return;
    pointer.axis = action === 'left' || action === 'right' ? 'horizontal' : 'vertical';
    pointer.consumed = true;
    pointer.anchorX = event.clientX;
    pointer.anchorY = event.clientY;
    pointer.lastActionAt = event.timeStamp;
    // The action sample is the snap itself, not a pause at that snap.
    pointer.settledSince = null;
    pointer.laneRearmed = false;
    act(run, action);
    return;
  }
  let deltaX = event.clientX - pointer.anchorX;
  let deltaY = event.clientY - pointer.anchorY;
  const elapsed = event.timeStamp - pointer.lastActionAt;
  // Same-axis horizontal segments remain deliberately thumb-length so a
  // quick overlong move cannot skip lanes. A short dwell between move samples
  // re-arms the next horizontal segment anywhere after the last snap; this is
  // the no-lift equivalent of lifting and starting a fresh swipe. A near-snap
  // dwell remains a useful fallback for browsers that emit frequent samples
  // while a thumb rests. Vertical actions stay single-shot; a clear horizontal
  // segment may follow one without lifting (and vice versa).
  if (pointer.axis === 'horizontal') {
    const pauseBetweenSegments = Number.isFinite(previousMoveAt) &&
      Number.isFinite(event.timeStamp) &&
      event.timeStamp - previousMoveAt >= LANE_DRAG_REARM_DWELL;
    // Rebase at the thumb's actual resting point. This preserves the direction
    // of a reverse swipe after an overshoot and prevents a large horizontal
    // offset from masking the next jump or slide.
    if (pauseBetweenSegments && !pointer.laneRearmed) {
      pointer.anchorX = previousX;
      pointer.anchorY = previousY;
      pointer.laneRearmed = true;
      deltaX = event.clientX - pointer.anchorX;
      deltaY = event.clientY - pointer.anchorY;
    }
    const nearSnap = Math.abs(deltaX) <= LANE_DRAG_REARM_RADIUS &&
      Math.abs(deltaY) <= LANE_DRAG_REARM_RADIUS;
    const dwellElapsed = Number.isFinite(pointer.settledSince) &&
      event.timeStamp - pointer.settledSince >= LANE_DRAG_REARM_DWELL;
    if (pauseBetweenSegments) pointer.laneRearmed = true;
    if (nearSnap) {
      pointer.settledSince ??= event.timeStamp;
      if (event.timeStamp - pointer.settledSince >= LANE_DRAG_REARM_DWELL)
        pointer.laneRearmed = true;
    } else {
      // A phone may emit no move events while the thumb is resting. A near-
      // snap sample followed by enough elapsed time is still a real pause.
      if (dwellElapsed) pointer.laneRearmed = true;
      pointer.settledSince = null;
    }
    const verticalStep = Math.abs(stepY) >= CROSS_AXIS_DISTANCE &&
      Math.abs(stepY) > Math.abs(stepX) * 1.12;
    const vertical = Math.abs(deltaY) >= CROSS_AXIS_DISTANCE &&
      Math.abs(deltaY) > Math.abs(deltaX) * 1.12;
    // Prefer a clear local vertical movement to a stale horizontal offset.
    // This lets a player jump or slide after steering too far without lifting.
    if (verticalStep || vertical) {
      pointer.axis = 'vertical';
      pointer.anchorX = event.clientX;
      pointer.anchorY = event.clientY;
      pointer.lastActionAt = event.timeStamp;
      pointer.settledSince = null;
      pointer.laneRearmed = false;
      act(run, deltaY > 0 ? 'slide' : 'jump');
      return;
    }
    if (Math.abs(deltaX) >= LANE_DRAG_REPEAT_DISTANCE) {
      if (!pointer.laneRearmed) return;
      if (Number.isFinite(elapsed) && elapsed < LANE_DRAG_REPEAT_DELAY) return;
      pointer.anchorX = event.clientX;
      pointer.anchorY = event.clientY;
      pointer.lastActionAt = event.timeStamp;
      pointer.settledSince = null;
      pointer.laneRearmed = false;
      act(run, deltaX > 0 ? 'right' : 'left');
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
  pointer.settledSince = null;
  pointer.laneRearmed = false;
  act(run, deltaX > 0 ? 'right' : 'left');
});
$("scene").addEventListener("pointerup", (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  event.preventDefault?.();
  if (pointer.axis) {
    pointer = null;
    return;
  }
  const dx = event.clientX - pointer.x,
    dy = event.clientY - pointer.y;
  const screenWidth = $("scene").clientWidth || event.view?.innerWidth ||
    (typeof window !== 'undefined' ? window.innerWidth : 0);
  const action = tapAction(pointer, event, screenWidth,
    event.pointerType === 'touch');
  pointer = null;
  if (state !== "playing") return;
  if (action) act(run, action);
  else {
    const action = swipeAction(dx, dy, true);
    if (action) act(run, action);
  }
});
const cancelOwnedPointer = event => {
  if(!ownsSwipe(event,pointer))return;
  pointer=null;
  // The browser took over this gesture. Do not keep running under a system UI.
  pause();
};
$("scene").addEventListener("pointercancel", cancelOwnedPointer);
$("scene").addEventListener("lostpointercapture", cancelOwnedPointer);
for (const button of document.querySelectorAll("[data-action]")) {
  button.onpointerdown = (event) => {
    if (state === "playing" && canPressAction(event)) {
      event.preventDefault();
      pointer = null; // A button supersedes an unfinished trail tap, not a second move on release.
      act(run, button.dataset.action);
    }
  };
  button.onclick = (event) => {
    if (state === "playing" && event.detail === 0) {
      pointer = null;
      act(run, button.dataset.action);
    }
  };
}
window.addEventListener("blur", pause);
// Rotation can move hazards and touch targets beneath a player's thumb.
// Listen to device orientation, not resize: mobile browser chrome resizes often.
if (window.screen?.orientation?.addEventListener)
  window.screen.orientation.addEventListener('change', pause);
else window.addEventListener('orientationchange', pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
$("scene").addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  graphicsError();
});
function graphicsError() {
  if (['playing','paused'].includes(state) && !run.practice) {
    run.retired = true;
    run.ended = true;
    finish();
    run.graphicsRescued = Boolean(run.receipt);
  }
  if(audio)stopSound(audio);
  graphicsReady=false;
  $("play").disabled=true;
  $("overlay-primary").disabled = false;
  showOverlay("graphics-error");
  $("overlay-label").textContent="LET’S GET YOUR PAWS BACK ON THE TRAIL";
  $("overlay-title").textContent="Chrome needs hardware acceleration.";
  $("overlay-copy").textContent =
    run.graphicsRescued
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
  $("scene").setAttribute('aria-label', 'Full 3D running trail unavailable. Turn on Chrome hardware acceleration and choose Try 3D again.');
  graphicsError();
}
let currentMission = missionFor(saved.challenges),
  missionAnnounced = false;
let lastHud = -1;
function frame(now) {
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
      setText('fetch', run.fetchTime > 0 ? `FETCH · ${Math.ceil(run.fetchTime)}s`
        : run.magnet > 0 ? `MAGNET ACTIVE · ${run.fetchCharge}%`
        : run.fetchCharge === 100 ? 'FETCH READY · F' : `FETCH · ${run.fetchCharge}%`);
      fetchButton.setAttribute('aria-label', run.fetchTime > 0 ? 'Fetch active'
        : run.magnet > 0 ? `Magnet active. Fetch charge ${run.fetchCharge} percent`
        : `Fetch ${run.fetchCharge === 100 ? 'ready. Tap or press F to collect nearby bones for four seconds' : `${run.fetchCharge} percent charged`}`);
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
  if (view && graphicsReady)
    view.draw(run, time, state, reducedMotion, dt, accumulator / (1 / 120), saved.collection, frameDt);
  requestAnimationFrame(frame);
}
if(graphicsReady)$("play").focus({ preventScroll: true });
requestAnimationFrame(frame);
