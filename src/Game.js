import { Level } from './Level.js';
import { CanvasDisplay } from './CanvasDisplay.js';
import { Input } from './Input.js';
import { ParticleSystem } from './particles/ParticleSystem.js';
import { AudioSystem } from './utils/Audio.js';
import { LevelGenerator } from './LevelGenerator.js';

export class Game {
    constructor(levels) {
        this.levels = levels;
        this.gameInfo = {
            life: 5,
            bone: 0,
            totalBone: 0,
            level: 1,
            highScore: parseInt(localStorage.getItem('puppyQuestHighScore')) || 0
        };
        this.input = new Input();
        this.display = null;
        this.currentLevel = null;
        this.animationId = null;
        this.particleSystem = new ParticleSystem();
        this.audio = new AudioSystem();
        this.paused = false;
        this.currentLevelIndex = 0;

        // Stats tracking
        this.stats = {
            deaths: 0,
            totalPlayTime: 0,
            unlockedLevels: 1,
            playStartTime: Date.now()
        };

        // Load saved progress
        this.loadProgress();

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
        this.tutorialPrompt = document.getElementById('tutorial-prompt');
        this.levelSelectOverlay = document.getElementById('level-select-overlay');

        // Setup pause controls
        this.setupPauseControls();
    }

    setupPauseControls() {
        // Escape key to pause/unpause
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });

        // Resume button
        if (this.resumeBtn) {
            this.resumeBtn.addEventListener('click', () => this.unpause());
        }

        // Restart level button
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => {
                this.unpause();
                this.startLevel(this.currentLevelIndex);
            });
        }

        // Level select button
        if (this.levelselectBtn) {
            this.levelselectBtn.addEventListener('click', () => {
                this.unpause();
                this.showLevelSelect();
            });
        }

        // Quit to menu button
        if (this.quitBtn) {
            this.quitBtn.addEventListener('click', () => {
                this.unpause();
                this.saveProgress();
                this.audio.stopMusic();
                // Show start screen
                const startScreen = document.getElementById('start-screen');
                if (startScreen) startScreen.classList.remove('hidden');
                cancelAnimationFrame(this.animationId);
            });
        }

        // Level select back button
        const backBtn = document.getElementById('level-select-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.levelSelectOverlay) this.levelSelectOverlay.classList.add('hidden');
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
    }

    togglePause() {
        if (this.paused) {
            this.unpause();
        } else {
            this.pause();
        }
    }

    pause() {
        if (this.paused || !this.currentLevel || this.currentLevel.status) return;
        this.paused = true;
        if (this.pauseOverlay) {
            this.pauseOverlay.classList.remove('hidden');
        }
        // Update stats display
        const deathEl = document.getElementById('death-count');
        const timeEl = document.getElementById('total-time');
        if (deathEl) deathEl.textContent = this.stats.deaths;
        if (timeEl) {
            const totalSec = Math.floor(this.stats.totalPlayTime + (Date.now() - this.stats.playStartTime) / 1000);
            const min = Math.floor(totalSec / 60);
            const sec = totalSec % 60;
            timeEl.textContent = `${min}:${String(sec).padStart(2, '0')}`;
        }
        this.audio.stopMusic();
        cancelAnimationFrame(this.animationId);
    }

    unpause() {
        if (!this.paused) return;
        this.paused = false;
        if (this.pauseOverlay) {
            this.pauseOverlay.classList.add('hidden');
        }
        this.audio.startMusic();
        // Resume animation loop
        let lastTime = performance.now();
        const frame = (time) => {
            if (this.paused) return;
            let timeStep = Math.min(time - lastTime, 100) / 1000;
            lastTime = time;

            if (!this.update(timeStep)) {
                this.handleLevelFinish(this.gameInfo.level - 1, this.currentLevel.status);
                return;
            }
            this.animationId = requestAnimationFrame(frame);
        };
        this.animationId = requestAnimationFrame(frame);
    }

    startLevel(n) {
        this.gameInfo.level = n + 1;
        this.currentLevelIndex = n;
        this.paused = false;

        let plan = this.levels[n];

        // Dynamic level generation with difficulty scaling
        // Cache level plans so the same level reloads on death
        if (n > 0 && n < 10) {
            if (this.cachedLevelPlans && this.cachedLevelPlans[n]) {
                plan = this.cachedLevelPlans[n];
            } else {
                const gen = new LevelGenerator(n);
                plan = gen.generate();
                if (!this.cachedLevelPlans) this.cachedLevelPlans = {};
                this.cachedLevelPlans[n] = plan;
            }
        } else if (n >= 10) {
            plan = this.levels[this.levels.length - 1];
        } else if (!plan) {
            plan = this.levels[0];
        }

        this.currentLevel = new Level(plan, this.gameInfo, this.particleSystem, this.audio);
        this.display = new CanvasDisplay(document.body, this.currentLevel, this.gameInfo, this.particleSystem);
        this.currentLevel.display = this.display;

        this.display.startTransition('in');

        if (!this.audio.musicPlaying) {
            this.audio.startMusic();
        }

        // Show tutorial if applicable
        this.showTutorial(n);

        this.runAnimation(n);
    }

    // Clear cached level when player successfully completes it
    clearLevelCache(levelIndex) {
        if (this.cachedLevelPlans && this.cachedLevelPlans[levelIndex]) {
            delete this.cachedLevelPlans[levelIndex];
        }
    }

    runAnimation(levelIndex) {
        let lastTime = null;
        const frame = (time) => {
            if (this.paused) return;

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

    update(step) {
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
        cancelAnimationFrame(this.animationId);
        this.hideTutorial();

        const overlay = document.getElementById('message-overlay');
        const title = document.getElementById('message-title');
        const subtitle = document.getElementById('message-subtitle');

        if (status === "lost") {
            this.stats.deaths++;
            this.audio.die();
            title.textContent = "You Died!";
            subtitle.textContent = "Restarting Level...";
            overlay.classList.remove('hidden');

            setTimeout(() => {
                overlay.classList.add('hidden');
                this.gameInfo.life--;
                if (this.gameInfo.life <= 0) {
                    this.gameInfo.life = 5;
                    this.startLevel(0);
                } else {
                    this.startLevel(levelIndex);
                }
            }, 1500);

        } else {
            this.audio.win();

            // Unlock next level
            if (levelIndex + 2 > this.stats.unlockedLevels) {
                this.stats.unlockedLevels = levelIndex + 2;
            }

            // Save progress on win
            this.saveProgress();

            const timeBonus = Math.max(0, 60 - Math.floor(this.currentLevel.timer));
            const comboBonus = this.currentLevel.combo * 10;

            title.textContent = `Level ${this.gameInfo.level} Complete!`;
            subtitle.textContent = `Time: ${Math.floor(this.currentLevel.timer)}s | Bonus: +${timeBonus + comboBonus}`;
            overlay.classList.remove('hidden');

            setTimeout(() => {
                overlay.classList.add('hidden');
                this.clearLevelCache(levelIndex);
                this.startLevel(levelIndex + 1);
            }, 2000);
        }
    }

    saveProgress() {
        const data = {
            unlockedLevels: this.stats.unlockedLevels,
            highScore: this.gameInfo.highScore,
            deaths: this.stats.deaths,
            totalPlayTime: this.stats.totalPlayTime + (Date.now() - this.stats.playStartTime) / 1000
        };
        localStorage.setItem('dogeQuestProgress', JSON.stringify(data));
    }

    loadProgress() {
        try {
            const data = JSON.parse(localStorage.getItem('dogeQuestProgress'));
            if (data) {
                this.stats.unlockedLevels = data.unlockedLevels || 1;
                this.stats.deaths = data.deaths || 0;
                this.stats.totalPlayTime = data.totalPlayTime || 0;
                if (data.highScore) this.gameInfo.highScore = data.highScore;
            }
        } catch (e) { /* ignore corrupt data */ }
    }

    showLevelSelect() {
        if (!this.levelSelectOverlay) return;

        cancelAnimationFrame(this.animationId);
        this.audio.stopMusic();

        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';

        for (let i = 0; i < 10; i++) {
            const btn = document.createElement('button');
            btn.textContent = i + 1;
            if (i < this.stats.unlockedLevels) {
                btn.classList.add('unlocked');
                if (i === this.currentLevelIndex) btn.classList.add('current');
                btn.addEventListener('click', () => {
                    this.levelSelectOverlay.classList.add('hidden');
                    this.startLevel(i);
                });
            }
            grid.appendChild(btn);
        }

        this.levelSelectOverlay.classList.remove('hidden');
    }

    showTutorial(levelIndex) {
        if (this.tutorialShown[levelIndex] || !this.tutorials[levelIndex]) return;
        this.tutorialShown[levelIndex] = true;

        if (this.tutorialPrompt) {
            this.tutorialPrompt.textContent = this.tutorials[levelIndex];
            this.tutorialPrompt.classList.remove('hidden');

            // Auto-hide after 5 seconds
            setTimeout(() => this.hideTutorial(), 5000);
        }
    }

    hideTutorial() {
        if (this.tutorialPrompt) {
            this.tutorialPrompt.classList.add('hidden');
        }
    }
}
