import { createRun, act, step } from "./world.js";
import {createPracticeRun,createZiplinePracticeRun,createTurnPracticeRun,createGapPracticeRun,stepPractice,practiceCue,practiceProgress,practiceResult,practiceOffer} from './practice.js';
import {scoreChaseLabel} from './score-chase.js';
import {courseProgress,activeCourse} from './courses.js';
import {RESUME_DURATION,resumeStep} from './resume.js';
import {installBackupControls} from './backup-ui.js';
import {installOfflineSupport} from './offline.js';
import { createView } from "./render.js";
import { UPGRADES, levels, price, purchase, refundUpgrade } from "./progression.js";
import { missionFor, missionProgress, missionTip, missionPackFor } from "./missions.js";
import { bankRun } from "./rewards.js";
import {masteryFrom,masteryCards} from './mastery.js';
import {fetchReady} from './ability.js';
import {createPowerHud} from './power-hud.js';
import {readTrailSeed,readTrailVersion,trailLink} from './trail-link.js';
import {REGIONS,regionAt} from "./regions.js";
import {preferencesFrom} from "./preferences.js";
import {readStoredProfile,writeStoredProfile} from "./storage.js";
import {CUES,playNotes,stopSound,resumeSound} from "./sound.js";
import {actionCue,eventNotice,dockMode,runLesson} from "./guidance.js";
import {turnPrompt} from "./turns.js";
import {swipeAction,canStartSwipe,canPressAction,ownsSwipe,isJumpTap} from "./gestures.js";
import { PUPPIES, COSTUMES, PRIZES, collectionFrom, equipOrBuy, prizeProgress } from "./collection.js";
const $ = (id) => document.getElementById(id);
const updatePowerHud = createPowerHud($('power'));
let sharedSeed = readTrailSeed(window.location.search);
let sharedVersion = readTrailVersion(window.location.search);
$('shared-trail').hidden = sharedSeed === null;
const playLabel = () => sharedSeed === null ? `Run with ${PUPPIES[saved.collection.puppy].name} ↗` : 'Run shared trail ↗';
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
  $("play").textContent = playLabel();
  $("buddy").querySelector("strong").textContent = `${PUPPIES[saved.collection.puppy].name}.`;
  $("buddy").querySelector("p").textContent = PUPPIES[saved.collection.puppy].description;
  $("best").innerHTML =
    `${Math.floor(saved.best).toLocaleString()}<span> pts</span>`;
  $("bank").textContent = Math.floor(saved.bones).toLocaleString();
  $("shop").textContent =
    `Upgrades · ${Math.floor(saved.credits).toLocaleString()} pts ↗`;
  const mission = missionFor(saved.challenges);
  $("mission-preview").textContent =
    `${mission.title}: ${mission.target} ${mission.unit} in one run · +${mission.reward} pts`;
  $("mission-help-title").textContent = `Your challenge: ${mission.title}`;
  $("mission-help-copy").textContent = `${mission.target} ${mission.unit} in one run · +${mission.reward} points. ${missionTip(mission)} Finish the run to bank your reward.`;
}
let clubhouseCategory = 'puppy';
let previewRear = false;
const portraitCache = new Map();
function kennel() {
  showOverlay("kennel");
  $("overlay-label").textContent = "YOUR VERY GOOD CREW";
  $("overlay-title").textContent = "The puppy clubhouse.";
  $("overlay-copy").textContent = `${Math.floor(saved.credits).toLocaleString()} points · ${saved.collection.gifts} gifts banked. Outfits and puppies are cosmetic; your upgrades work with everyone.`;
  $("overlay-primary").textContent = "Run with your puppy ↗";
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
  const cards=masteryCards(saved.mastery);
  cards.sort((a,b)=>Number(b.id===`dog-${saved.collection.puppy}`)-Number(a.id===`dog-${saved.collection.puppy}`));
  const collected=cards.reduce((sum,card)=>sum+card.tiers.filter(tier=>card.current>=tier.target).length,0);
  const masteryIntro=document.createElement('p');
  masteryIntro.textContent='Your next milestone comes first. Finish runs to bank progress and earn permanent stamps and upgrade points.';
  const otherCards=document.createElement('details');otherCards.className='other-passport-cards';
  const otherHeading=document.createElement('summary');otherHeading.textContent='Other puppies and regions';otherCards.append(otherHeading);
  if(clubhouseCategory==='passport'){
    $("overlay-title").textContent='Trail passport.';
    $("overlay-copy").textContent=`${collected}/21 stamps collected`;
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
    (isCurrent?passport:otherCards).append(section);
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
      const cacheKey=`${appearance.puppy}:${appearance.costume}:${previewRear}`;
      if(!portraitCache.has(cacheKey))portraitCache.set(cacheKey,view.portrait(run,appearance,previewRear));
      const image=document.createElement('img');image.src=portraitCache.get(cacheKey);
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
  $("overlay-primary").textContent = "Run with your upgrades ↗";
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
    playNotes(audio,typeof frequency==="string"?CUES[frequency]:[{from:frequency,duration}]);
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
  $("mission-hud").hidden = state !== 'playing' || !mode;
}
function setState(next) {
  const previous = state;
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
  $("hud").inert = modal;
  if (modal) {
    if (previous !== next) document.querySelector('.modal-content').scrollTop = 0;
    $("overlay-primary").focus({preventScroll:true});
  }
  accumulator = 0;
  pointer = null;
}
function start() {
  if(!graphicsReady){graphicsError();return;}
  // A results-screen retry is a rematch, not a new random obstacle layout.
  // Camp/help use random adventures unless an explicit shared trail is active.
  const retry = state === 'ended' && !run.practice;
  const rematchBest=retry ? Math.max(run.rematchBest || 0,run.score) : 0;
  run = createRun(retry ? run.seed : sharedSeed ?? Date.now(), saved.upgrades,
    retry ? run.generatorVersion : sharedSeed === null ? undefined : sharedVersion);
  run.rematchBest=rematchBest;
  run.puppy = saved.collection.puppy;
  run.appearance = { ...saved.collection };
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
        ? "Swipe anywhere on the trail, or use the buttons."
        : run.practice ? "Practice is unscored. Leave whenever you like." : "Keep running, or finish now to bank the points, bones and gifts you have earned.";
  $("home").textContent = kind === 'paused' ? run.practice ? 'Leave practice' : 'Finish & bank points' : 'Back to camp';
  $("overlay-primary").textContent =
    kind === "ended"
      ? "Retry this trail ↗"
      : kind === "help"
        ? "Let’s run ↗"
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
    $('overlay-primary').textContent = 'Run the adventure ↗';
    $('practice-again').hidden = false;
    $('practice-again').textContent = run.practice.kind==='turn' && run.practice.correct
      ? `Practise the ${run.practice.direction==='left' ? 'right' : 'left'} turn` : 'Practise again';
    return;
  }
  const receipt = bankRun(saved, run, run.missions);
  if (!receipt) return;
  $('trail-link').value = trailLink(window.location.href,run.seed,run.generatorVersion);
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
  $("run-highlights").textContent = `${run.turns} clean ${run.turns === 1 ? 'turn' : 'turns'} · ${run.clears} obstacles cleared · Best bone streak: ${run.bestCombo}`;
  const courses = run.regionalCourses.reduce((sum,count)=>sum+count,0);
  if (courses) $("run-highlights").textContent += ` · ${courses} clean regional ${courses === 1 ? 'course' : 'courses'}`;
  const {missionPoints: reward, prizes} = receipt;
  $("overlay-copy").textContent +=
    ` +${run.score.toLocaleString()} upgrade points earned. Spend them at camp.`;
  if (reward)
    $("overlay-copy").textContent +=
      ` ${receipt.missionCount} ${receipt.missionCount === 1 ? 'challenge' : 'challenges'} complete: +${reward} extra points!`;
  if (run.gifts) $("overlay-copy").textContent += ` ${run.gifts} gift boxes banked.`;
  if (run.ziplines) $("overlay-copy").textContent += ` ${run.ziplines} zipline ${run.ziplines === 1 ? "ride" : "rides"} completed (+${run.ziplines * 250} points included in your score).`;
  if (prizes.length) $("overlay-copy").textContent += ` Prizes earned: ${prizes.map(p => p.name).join(", ")}! Visit the clubhouse.`;
  const mastery=receipt.mastery;
  if(mastery.earned.length) $("overlay-copy").textContent += ` Passport rewards: ${mastery.earned.map(b=>b.name).join(', ')} (+${mastery.points} pts).`;
  const dogCard=masteryCards(saved.mastery).find(card=>card.id===`dog-${run.puppy}`);
  if(dogCard) {
    const next=dogCard.tiers.find(tier=>dogCard.current<tier.target);
    $("run-highlights").textContent += next ? ` · ${dogCard.name} bond: ${dogCard.current}/${next.target} toward ${next.name}` : ` · ${dogCard.name}: Trail legend`;
  }
  $("run-breakdown-copy").textContent = `${$("overlay-copy").textContent} ${$("run-highlights").textContent}`;
  $("run-breakdown-copy").textContent += ` Best clean-move streak: ${run.bestCleanStreak}. Clean-move bonuses: +${run.flowPoints} points (included in score).`;
  if (run.rematchBest>0) {
    const difference=run.score-run.rematchBest;
    $("run-breakdown-copy").textContent += ` Rematch target: ${run.rematchBest.toLocaleString()} points. ${difference>0?`${difference.toLocaleString()} ahead`:difference===0?'Target tied':`${(-difference).toLocaleString()} short`}.`;
  }
  $("overlay-copy").textContent = `${receipt.personalBest ? 'New personal best! ' : run.rematchBest>0&&run.score>run.rematchBest ? 'Rematch best! ' : ''}Score banked. Retry the same trail, or head to camp ${sharedSeed === null ? 'for a fresh one' : 'to switch to random trails'}.`;
  const nextBond=dogCard?.tiers.find(tier=>dogCard.current<tier.target);
  $("run-highlights").textContent = nextBond
    ? `Next: ${dogCard.name} · ${Math.max(0,nextBond.target-dogCard.current)} clean clears or turns to ${nextBond.name}`
    : `${run.clears} obstacles cleared · Best bone streak: ${run.bestCombo}`;
  persist();
  if (!storageAvailable) $("overlay-copy").textContent = 'Run complete. These rewards are available for this visit only; saving is unavailable.';
  updateRecords();
  tone("finish");
}
$("play").onclick = start;
$('shared-random').onclick = () => {
  sharedSeed=null;
  sharedVersion=null;
  const url=new window.URL(window.location.href);url.searchParams.delete('trail');
  window.history.replaceState(null,'',url);
  $('shared-trail').hidden=true;updateRecords();$('play').focus({preventScroll:true});
};
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
  start();
  const appearance = run.appearance;
  run = kind==='gap' ? createGapPracticeRun(saved.upgrades)
    : kind==='turn' ? createTurnPracticeRun(saved.upgrades,cornerIndex)
    : kind==='zipline' ? createZiplinePracticeRun(saved.upgrades) : createPracticeRun(saved.upgrades);
  run.puppy = saved.collection.puppy;
  run.appearance = appearance;
  run.missions = [currentMission];
  missionAnnounced = true;
}
$('practice-start').onclick = () => startPractice('moves');
$('practice-zipline').onclick = () => startPractice('zipline');
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
$("scene").addEventListener("pointerdown", (event) => {
  if (state !== "playing" || !canStartSwipe(event,pointer)) return;
  pointer = { x: event.clientX, y: event.clientY, id: event.pointerId, started: event.timeStamp, travel: 0 };
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
  pointer.travel = Math.max(pointer.travel, Math.abs(dx), Math.abs(dy));
  const action = swipeAction(dx, dy);
  if (!action) return;
  pointer.consumed = true;
  act(run, action);
});
$("scene").addEventListener("pointerup", (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  if (pointer.consumed) {
    pointer = null;
    return;
  }
  const dx = event.clientX - pointer.x,
    dy = event.clientY - pointer.y;
  const tap = isJumpTap(pointer, event);
  pointer = null;
  if (state !== "playing") return;
  if (tap) act(run, "jump");
  else {
    const action = swipeAction(dx, dy, true);
    if (action) act(run, action);
  }
});
const clearOwnedPointer = event => {
  if(ownsSwipe(event,pointer))pointer=null;
};
$("scene").addEventListener("pointercancel", clearOwnedPointer);
$("scene").addEventListener("lostpointercapture", clearOwnedPointer);
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
  showOverlay("graphics-error");
  $("overlay-label").textContent="LET’S GET YOUR PAWS BACK ON THE TRAIL";
  $("overlay-title").textContent="The 3D trail needs a restart.";
  $("overlay-copy").textContent =
    run.graphicsRescued
      ? storageAvailable
        ? 'The trail was interrupted, but your earned points, bones and completed challenges were saved. Reload to start a fresh adventure.'
        : 'The trail was interrupted. Earned rewards were counted for this visit, but saving is unavailable. Reloading may lose this progress.'
      : 'Graphics are unavailable or were interrupted. Reload to try again. Previously saved puppies, outfits and points stay in this browser; practice never changes your progress.';
  $("overlay-primary").textContent = "Reload trail";
  $("overlay-primary").onclick = () => window.location.reload();
}
let view;
try {
  view = createView($("scene"));
  graphicsReady=true;
  $("play").disabled = false;
  $("play").textContent = playLabel();
} catch {
  graphicsError();
}
let currentMission = missionFor(saved.challenges),
  missionAnnounced = false;
let lastHud = -1;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  time += dt;
  if (state === "playing") {
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
      if (event === "clear") tone(540, 0.08);
      if (event === "turn-left" || event === "turn-right") tone(680, 0.1);
      if (event === "course-complete") tone('reward');
      if (event === "jump") tone("jump");
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
      if(event==="zipline-start") tone("zoomies");
      if(event==="zipline-end") tone("reward");
      if (event === "double") {
        tone(880, 0.2);
      }
      if (event === "heart") {
        tone(660, 0.2);
      }
      if (event === "hit") {
        tone(120, 0.2);
      }
    }
    run.events = [];
    $("scene").dataset.lane = String(run.lane + 1);
    $("scene").dataset.turns = String(run.turns);
    $("scene").dataset.missedTurns = String(run.missedTurns);
    $("scene").dataset.courses = run.regionalCourses.join(',');
    $("scene").dataset.course = run.course?.name || '';
    $("scene").dataset.posture =
      run.zipline ? "zipline" : run.y > 0.05 ? "jump" : run.slide > 0 ? "slide" : "run";
    // Decision cues follow each rendered frame; counters can wait for the HUD tick.
    setText('cue', run.practice ? practiceCue(run) : actionCue(run));
    if (Math.floor(run.time * 10) !== lastHud || run.ended) {
      lastHud = Math.floor(run.time * 10);
      $("distance").innerHTML = `${Math.floor(run.distance-(run.practice?.start || 0))}<small> m</small>`;
      $("region-name").textContent = run.practice ? 'Practice · no penalties' : REGIONS[regionAt(run.distance)].name;
      setText('route-choice', run.choicePending!==null && run.choicePending-run.distance<100
        ? `GATES IN ${Math.max(0,Math.ceil(run.choicePending-run.distance))}m · ← Scenic: fewer obstacles · Challenge: more points →` : '');
      $("bones").textContent = run.bones;
      $("run-score").textContent =
        run.practice ? practiceProgress(run) : run.route && run.distance<run.route.until
          ? `${run.score.toLocaleString()} pts · ${run.route.kind==='challenge'?'CHALLENGE':'SCENIC'}`
          : scoreChaseLabel(run.score, saved.best, run.rematchBest);
      const progress = missionProgress(run, currentMission);
      const courseStatus=courseProgress(run);
      $("mission-label").textContent = courseStatus?.label ??
        `${run.missions.indexOf(currentMission)+1}/3 · ${currentMission.title} · ${progress}/${currentMission.target} ${currentMission.unit}`;
      $("mission-progress").max = courseStatus?.max ?? currentMission.target;
      $("mission-progress").value = courseStatus?.value ?? progress;
      $("mission-progress").setAttribute('aria-label',courseStatus?'Clean course moves':'Challenge progress');
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
        button.setAttribute('aria-label', turn ? `Turn ${direction}` : `Move ${direction}`);
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
  syncDock();
  if (view && graphicsReady)
    view.draw(run, time, state, reducedMotion, dt, accumulator / (1 / 120), saved.collection);
  requestAnimationFrame(frame);
}
if(graphicsReady)$("play").focus({ preventScroll: true });
requestAnimationFrame(frame);
