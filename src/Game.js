import { Level } from './Level.js';
import { CanvasDisplay } from './CanvasDisplay.js';
import { Input } from './Input.js';
import { ParticleSystem } from './particles/ParticleSystem.js';
import { AudioSystem } from './utils/Audio.js';
import { LevelGenerator } from './LevelGenerator.js';

const TOTAL_LEVELS = 10;
const STARTING_LIVES = 5;
const PROGRESS_KEY = 'dogeQuestProgress';
const HIGH_SCORE_KEY = 'puppyQuestHighScore';

function finiteNumber(value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export class Game {
    constructor(levels) {
        this.levels = levels;
        this.gameInfo = {
            life: STARTING_LIVES,
            bone: 0,
            totalBone: 0,
            level: 1,
            highScore: 0
        };
        this.input = new Input();
        this.display = null;
        this.currentLevel = null;
        this.animationId = null;
        this.particleSystem = new ParticleSystem();
        this.audio = new AudioSystem();
        this.paused = false;
        this.running = false;
        this.currentLevelIndex = 0;
        this.pendingTransition = null;
        this.tutorialTimeout = null;
        this.cachedLevelPlans = {};
        this.resizeAnimationId = null;

        // Stats tracking
        this.stats = {
            deaths: 0,
            totalPlayTime: 0,
            unlockedLevels: 1,
            playStartTime: Date.now()
        };

        // Tutorial messages per level
        this.tutorials = {
            0: 'Press SPACE or tap JUMP to jump!',
            1: 'Press JUMP twice for double jump!',
            2: 'Hold SHIFT or tap DASH to dash through gaps!',
            3: 'Wall jump by pressing JUMP near walls!'
        };
        this.tutorialShown = {};

        // Pause overlay elements
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.resumeBtn = document.getElementById('resume-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.levelselectBtn = document.getElementById('levelselect-btn');
        this.quitBtn = document.getElementById('quit-btn');
        this.soundBtn = document.getElementById('sound-btn');
        this.colorblindBtn = document.getElementById('colorblind-btn');
        this.tutorialPrompt = document.getElementById('tutorial-prompt');
        this.levelSelectOverlay = document.getElementById('level-select-overlay');
        this.colorblindMode = false;
        this.soundEnabled = true;

        // Load saved progress after all preference defaults are initialized.
        this.loadProgress();

        // Setup pause controls
        this.setupPauseControls();

        window.addEventListener('resize', () => {
            if (this.resizeAnimationId !== null) cancelAnimationFrame(this.resizeAnimationId);
            this.resizeAnimationId = requestAnimationFrame(() => {
                this.resizeAnimationId = null;
                if (this.display) this.display.resize();
            });
        });
    }

    setupPauseControls() {
        // Escape key to pause/unpause
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (this.isOverlayVisible(this.levelSelectOverlay)) {
                    this.resumeFromLevelSelect();
                } else {
                    this.togglePause();
                }
            } else if (e.key === 'Tab') {
                const dialog = this.getVisibleDialog();
                if (dialog) this.trapFocus(e, dialog);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.pause();
        });

        // Resume button
        if (this.resumeBtn) {
            this.resumeBtn.addEventListener('click', () => this.unpause());
        }

        // Restart level button
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => {
                this.startLevel(this.currentLevelIndex);
            });
        }

        // Level select button
        if (this.levelselectBtn) {
            this.levelselectBtn.addEventListener('click', () => {
                this.showLevelSelect();
            });
        }

        // Quit to menu button
        if (this.quitBtn) {
            this.quitBtn.addEventListener('click', () => this.returnToMenu());
        }

        const mobilePauseBtn = document.getElementById('btn-pause');
        if (mobilePauseBtn) {
            mobilePauseBtn.addEventListener('click', () => this.togglePause());
        }

        // Level select back button
        const backBtn = document.getElementById('level-select-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.resumeFromLevelSelect();
            });
        }

        // Colorblind toggle
        if (this.colorblindBtn) {
            this.colorblindBtn.addEventListener('click', () => {
                this.colorblindMode = !this.colorblindMode;
                document.body.classList.toggle('colorblind', this.colorblindMode);
                this.colorblindBtn.textContent = `COLORBLIND: ${this.colorblindMode ? 'ON' : 'OFF'}`;
                this.colorblindBtn.setAttribute('aria-pressed', String(this.colorblindMode));
                this.saveProgress();
            });
        }

        if (this.soundBtn) {
            this.soundBtn.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                this.audio.setEnabled(this.soundEnabled);
                this.updateSoundButton();
                this.saveProgress();
            });
        }

        // Click on pause overlay to unpause
        if (this.pauseOverlay) {
            this.pauseOverlay.addEventListener('click', (e) => {
                if (e.target === this.pauseOverlay) {
                    this.unpause();
                }
            });
        }

        if (this.colorblindBtn) {
            this.colorblindBtn.textContent = `COLORBLIND: ${this.colorblindMode ? 'ON' : 'OFF'}`;
            this.colorblindBtn.setAttribute('aria-pressed', String(this.colorblindMode));
        }
        this.audio.setEnabled(this.soundEnabled);
        this.updateSoundButton();
    }

    togglePause() {
        if (!this.running) return;
        if (this.paused) {
            this.unpause();
        } else {
            this.pause();
        }
    }

    pause() {
        if (this.paused || !this.running || !this.currentLevel || this.currentLevel.status) return;
        this.accumulatePlayTime();
        this.paused = true;
        if (this.pauseOverlay) {
            this.pauseOverlay.classList.remove('hidden');
            this.focusDialog(this.pauseOverlay, this.resumeBtn);
        }
        this.setGameplayInteractive(false);
        // Update stats display
        const deathEl = document.getElementById('death-count');
        const timeEl = document.getElementById('total-time');
        if (deathEl) deathEl.textContent = this.stats.deaths;
        if (timeEl) {
            const totalSec = Math.floor(this.stats.totalPlayTime);
            const min = Math.floor(totalSec / 60);
            const sec = totalSec % 60;
            timeEl.textContent = `${min}:${String(sec).padStart(2, '0')}`;
        }
        this.audio.stopAll();
        this.stopAnimation();
    }

    unpause() {
        if (!this.paused || !this.running || !this.currentLevel) return;
        this.paused = false;
        if (this.pauseOverlay) {
            this.pauseOverlay.classList.add('hidden');
        }
        this.stats.playStartTime = Date.now();
        this.audio.startMusic();
        this.runAnimation(this.currentLevelIndex);
        this.setGameplayInteractive(true);
        this.focusGame();
    }

    startLevel(n) {
        const requestedIndex = Number.isFinite(n) ? Math.floor(n) : 0;
        const levelIndex = Math.max(0, Math.min(requestedIndex, TOTAL_LEVELS - 1));
        this.stopAnimation();
        this.audio.stopAll();
        this.clearPendingTransition();
        this.hideTutorial();
        this.hideOverlays();

        this.running = true;
        this.paused = false;
        document.body.classList.add('game-active');
        this.setGameplayInteractive(true);
        this.stats.playStartTime = Date.now();
        this.particleSystem.clear();

        this.gameInfo.level = levelIndex + 1;
        this.currentLevelIndex = levelIndex;

        let plan = this.levels[levelIndex];

        // Dynamic level generation with difficulty scaling
        // Cache level plans so the same level reloads on death
        if (levelIndex > 0) {
            if (this.cachedLevelPlans[levelIndex]) {
                plan = this.cachedLevelPlans[levelIndex];
            } else {
                const gen = new LevelGenerator(levelIndex);
                plan = gen.generate();
                this.cachedLevelPlans[levelIndex] = plan;
            }
        } else if (!plan) {
            plan = this.levels[0];
        }

        this.currentLevel = new Level(plan, this.gameInfo, this.particleSystem, this.audio);
        this.display = new CanvasDisplay(document.body, this.currentLevel, this.gameInfo, this.particleSystem);
        this.currentLevel.display = this.display;
        this.display.announceStatus(`Level ${this.gameInfo.level} started. ${this.gameInfo.bone} bones to collect. ${this.gameInfo.life} lives remaining.`);

        this.display.startTransition('in');

        if (!this.audio.musicPlaying) {
            this.audio.startMusic();
        }

        // Show tutorial if applicable
        this.showTutorial(levelIndex);

        this.runAnimation(levelIndex);
    }

    // Clear cached level when player successfully completes it
    clearLevelCache(levelIndex) {
        if (this.cachedLevelPlans && this.cachedLevelPlans[levelIndex]) {
            delete this.cachedLevelPlans[levelIndex];
        }
    }

    runAnimation(levelIndex) {
        this.stopAnimation();
        let lastTime = null;
        const frame = (time) => {
            if (this.paused || !this.running) return;

            if (lastTime != null) {
                let timeStep = Math.min(time - lastTime, 100) / 1000;

                // Update game state
                if (!this.update(timeStep)) {
                    // Level finished
                    this.handleLevelFinish(levelIndex, this.currentLevel.status);
                    return;
                }
            }
            lastTime = time;
            this.animationId = requestAnimationFrame(frame);
        };
        this.animationId = requestAnimationFrame(frame);
    }

    stopAnimation() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    clearPendingTransition() {
        if (this.pendingTransition !== null) {
            clearTimeout(this.pendingTransition);
            this.pendingTransition = null;
        }
    }

    scheduleTransition(callback, delay) {
        this.clearPendingTransition();
        this.pendingTransition = setTimeout(() => {
            this.pendingTransition = null;
            callback();
        }, delay);
    }

    accumulatePlayTime() {
        if (!this.running || this.paused) return;
        const now = Date.now();
        this.stats.totalPlayTime += Math.max(0, now - this.stats.playStartTime) / 1000;
        this.stats.playStartTime = now;
    }

    update(step) {
        if (!this.currentLevel || !this.display) return false;
        this.currentLevel.animate(step, this.input.keys);
        this.particleSystem.update(step);
        this.display.drawFrame(step);

        if (this.currentLevel.isFinished()) {
            this.display.clear();
            return false;
        }
        return true;
    }

    handleLevelFinish(levelIndex, status) {
        this.stopAnimation();
        this.accumulatePlayTime();
        this.running = false;
        this.hideTutorial();
        this.audio.stopAll();
        this.setGameplayInteractive(false);

        const overlay = document.getElementById('message-overlay');
        const title = document.getElementById('message-title');
        const subtitle = document.getElementById('message-subtitle');
        const actionBtn = document.getElementById('message-action-btn');

        if (status === "lost") {
            this.stats.deaths++;
            this.audio.die();
            this.gameInfo.life--;
            this.saveProgress();

            if (this.gameInfo.life <= 0) {
                // Game Over
                title.textContent = "GAME OVER";
                subtitle.textContent = `High Score: ${this.gameInfo.highScore}`;
                overlay.classList.remove('hidden');
                this.display?.announceStatus(`Game over. High score ${this.gameInfo.highScore}.`);

                if (actionBtn) {
                    actionBtn.textContent = "TRY AGAIN";
                    actionBtn.classList.remove('hidden');
                    actionBtn.onclick = () => this.startNewGame();
                    this.focusDialog(overlay, actionBtn);
                } else {
                    // Fallback if button missing
                    this.scheduleTransition(() => {
                        overlay.classList.add('hidden');
                        this.startNewGame();
                    }, 3000);
                }
            } else {
                // Let the player retry when ready.
                title.textContent = "You Died!";
                subtitle.textContent = `Lives Remaining: ${this.gameInfo.life}`;
                overlay.classList.remove('hidden');
                this.display?.announceStatus(`Life lost. ${this.gameInfo.life} lives remaining. Choose retry when ready.`);
                if (actionBtn) {
                    actionBtn.textContent = "RETRY";
                    actionBtn.classList.remove('hidden');
                    actionBtn.onclick = () => this.startLevel(levelIndex);
                    this.focusDialog(overlay, actionBtn);
                } else {
                    this.scheduleTransition(() => this.startLevel(levelIndex), 3000);
                }
            }

        } else {
            this.audio.win();
            if (actionBtn) actionBtn.classList.add('hidden');

            // Unlock next level
            if (levelIndex + 2 > this.stats.unlockedLevels) {
                this.stats.unlockedLevels = Math.min(TOTAL_LEVELS, levelIndex + 2);
            }

            // Save progress on win
            this.saveProgress();

            title.textContent = `Level ${this.gameInfo.level} Complete!`;
            subtitle.textContent = `Time: ${Math.floor(this.currentLevel.timer)}s | Best combo: ${this.currentLevel.combo}x`;
            overlay.classList.remove('hidden');

            if (levelIndex === TOTAL_LEVELS - 1) {
                title.textContent = "QUEST COMPLETE!";
                subtitle.textContent = `All ${TOTAL_LEVELS} levels cleared. Final time: ${Math.floor(this.currentLevel.timer)}s`;
                this.display?.announceStatus(`Quest complete. All ${TOTAL_LEVELS} levels cleared.`);
                if (actionBtn) {
                    actionBtn.textContent = "PLAY AGAIN";
                    actionBtn.classList.remove('hidden');
                    actionBtn.onclick = () => this.startNewGame();
                    this.focusDialog(overlay, actionBtn);
                }
            } else {
                this.display?.announceStatus(`Level ${this.gameInfo.level} complete. Choose next level when ready.`);
                if (actionBtn) {
                    actionBtn.textContent = "NEXT LEVEL";
                    actionBtn.classList.remove('hidden');
                    actionBtn.onclick = () => {
                        this.clearLevelCache(levelIndex);
                        this.startLevel(levelIndex + 1);
                    };
                    this.focusDialog(overlay, actionBtn);
                } else {
                    this.scheduleTransition(() => {
                        this.clearLevelCache(levelIndex);
                        this.startLevel(levelIndex + 1);
                    }, 3000);
                }
            }
        }
    }

    saveProgress() {
        const data = {
            unlockedLevels: this.stats.unlockedLevels,
            highScore: this.gameInfo.highScore,
            deaths: this.stats.deaths,
            totalPlayTime: this.stats.totalPlayTime,
            colorblindMode: this.colorblindMode,
            soundEnabled: this.soundEnabled
        };
        try {
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
            localStorage.setItem(HIGH_SCORE_KEY, String(this.gameInfo.highScore));
        } catch {
            // Progress is optional when storage is blocked or full.
        }
    }

    loadProgress() {
        try {
            const data = JSON.parse(localStorage.getItem(PROGRESS_KEY));
            const legacyHighScore = finiteNumber(localStorage.getItem(HIGH_SCORE_KEY), 0);
            this.gameInfo.highScore = legacyHighScore;

            if (data) {
                this.stats.unlockedLevels = Math.floor(finiteNumber(data.unlockedLevels, 1, 1, TOTAL_LEVELS));
                this.stats.deaths = Math.floor(finiteNumber(data.deaths, 0));
                this.stats.totalPlayTime = finiteNumber(data.totalPlayTime, 0);
                this.gameInfo.highScore = Math.max(this.gameInfo.highScore, Math.floor(finiteNumber(data.highScore, 0)));
                this.colorblindMode = data.colorblindMode === true;
                this.soundEnabled = data.soundEnabled !== false;
            }

            document.body.classList.toggle('colorblind', this.colorblindMode);
        } catch {
            // Ignore corrupt or unavailable storage and use safe defaults.
        }
    }

    showLevelSelect() {
        if (!this.levelSelectOverlay) return;

        if (!this.paused) this.accumulatePlayTime();
        this.paused = true;
        this.stopAnimation();
        this.audio.stopAll();
        if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');

        const grid = document.getElementById('level-grid');
        if (!grid) return;
        grid.replaceChildren();

        for (let i = 0; i < TOTAL_LEVELS; i++) {
            const btn = document.createElement('button');
            btn.textContent = i + 1;
            btn.setAttribute('aria-label', `Level ${i + 1}`);
            if (i < this.stats.unlockedLevels) {
                btn.classList.add('unlocked');
                if (i === this.currentLevelIndex) btn.classList.add('current');
                btn.addEventListener('click', () => {
                    this.levelSelectOverlay.classList.add('hidden');
                    this.startLevel(i);
                });
            } else {
                btn.disabled = true;
                btn.setAttribute('aria-label', `Level ${i + 1}, locked`);
            }
            grid.appendChild(btn);
        }

        this.levelSelectOverlay.classList.remove('hidden');
        this.setGameplayInteractive(false);
        const currentButton = grid.querySelector('.current') || grid.querySelector('.unlocked');
        this.focusDialog(this.levelSelectOverlay, currentButton || document.getElementById('level-select-back'));
    }

    resumeFromLevelSelect() {
        if (this.levelSelectOverlay) this.levelSelectOverlay.classList.add('hidden');
        if (!this.running || !this.currentLevel) return;

        this.paused = false;
        this.stats.playStartTime = Date.now();
        this.audio.startMusic();
        this.runAnimation(this.currentLevelIndex);
        this.setGameplayInteractive(true);
        this.focusGame();
    }

    startNewGame() {
        const startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.classList.add('hidden');
        document.body.classList.add('game-active');
        this.gameInfo.life = STARTING_LIVES;
        this.gameInfo.bone = 0;
        this.gameInfo.totalBone = 0;
        this.cachedLevelPlans = {};
        this.tutorialShown = {};
        this.startLevel(0);
        this.focusGame();
    }

    returnToMenu() {
        this.accumulatePlayTime();
        this.running = false;
        this.paused = false;
        this.stopAnimation();
        this.clearPendingTransition();
        this.hideTutorial();
        this.audio.stopAll();
        this.particleSystem.clear();
        this.saveProgress();
        this.hideOverlays();

        if (this.display) this.display.dispose();
        this.display = null;
        this.currentLevel = null;
        document.body.classList.remove('game-active');
        this.setGameplayInteractive(false);
        const startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.classList.remove('hidden');
        this.focusDialog(startScreen, document.getElementById('start-btn'));
    }

    hideOverlays() {
        [this.pauseOverlay, this.levelSelectOverlay, document.getElementById('message-overlay')]
            .filter(Boolean)
            .forEach(overlay => overlay.classList.add('hidden'));
        const actionBtn = document.getElementById('message-action-btn');
        if (actionBtn) actionBtn.classList.add('hidden');
    }

    setGameplayInteractive(interactive) {
        ['game-wrapper', 'hud', 'mobile-controls'].forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;
            element.inert = !interactive;
            element.setAttribute('aria-hidden', String(!interactive));
        });
    }

    updateSoundButton() {
        if (!this.soundBtn) return;
        const available = this.audio.available;
        this.soundBtn.disabled = !available;
        this.soundBtn.textContent = available ? `SOUND: ${this.soundEnabled ? 'ON' : 'OFF'}` : 'SOUND: UNAVAILABLE';
        this.soundBtn.setAttribute('aria-pressed', String(available && this.soundEnabled));
    }

    isOverlayVisible(overlay) {
        return Boolean(overlay && !overlay.classList.contains('hidden'));
    }

    getVisibleDialog() {
        return [...document.querySelectorAll('[role="dialog"]')]
            .find(dialog => !dialog.classList.contains('hidden'));
    }

    focusDialog(dialog, preferredElement) {
        if (!dialog) return;
        requestAnimationFrame(() => {
            const target = preferredElement || dialog.querySelector('button:not([disabled]), summary, [href], [tabindex]:not([tabindex="-1"])') || dialog;
            target.focus();
        });
    }

    trapFocus(event, dialog) {
        const focusable = [...dialog.querySelectorAll('button:not([disabled]), summary, [href], [tabindex]:not([tabindex="-1"])')]
            .filter(element => !element.classList.contains('hidden'));
        if (focusable.length === 0) {
            event.preventDefault();
            dialog.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    focusGame() {
        const canvas = document.getElementById('gameBoard');
        if (canvas) requestAnimationFrame(() => canvas.focus());
    }

    showTutorial(levelIndex) {
        if (this.tutorialShown[levelIndex] || !this.tutorials[levelIndex]) return;
        this.tutorialShown[levelIndex] = true;

        if (this.tutorialPrompt) {
            this.tutorialPrompt.textContent = this.tutorials[levelIndex];
            this.tutorialPrompt.classList.remove('hidden');

            // Auto-hide after 5 seconds
            if (this.tutorialTimeout !== null) clearTimeout(this.tutorialTimeout);
            this.tutorialTimeout = setTimeout(() => {
                this.tutorialTimeout = null;
                this.hideTutorial();
            }, 5000);
        }
    }

    hideTutorial() {
        if (this.tutorialTimeout !== null) {
            clearTimeout(this.tutorialTimeout);
            this.tutorialTimeout = null;
        }
        if (this.tutorialPrompt) {
            this.tutorialPrompt.classList.add('hidden');
        }
    }
}
