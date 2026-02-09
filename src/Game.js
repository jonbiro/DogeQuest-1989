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

        // Pause overlay elements
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.resumeBtn = document.getElementById('resume-btn');

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
            this.resumeBtn.addEventListener('click', () => {
                this.unpause();
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
        cancelAnimationFrame(this.animationId);
    }

    unpause() {
        if (!this.paused) return;
        this.paused = false;
        if (this.pauseOverlay) {
            this.pauseOverlay.classList.add('hidden');
        }
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
        this.paused = false;

        let plan = this.levels[n];

        // Dynamic level generation with difficulty scaling
        // Cache level plans so the same level reloads on death
        if (n > 0 && n < 10) {
            // Check if we have a cached level for this index
            if (this.cachedLevelPlans && this.cachedLevelPlans[n]) {
                plan = this.cachedLevelPlans[n];
            } else {
                // Generate new level and cache it
                const gen = new LevelGenerator(n);
                plan = gen.generate();

                // Initialize cache if needed
                if (!this.cachedLevelPlans) {
                    this.cachedLevelPlans = {};
                }
                this.cachedLevelPlans[n] = plan;
            }
        } else if (n >= 10) {
            // Win screen
            plan = this.levels[this.levels.length - 1];
        } else if (!plan) {
            plan = this.levels[0];
        }

        // Create new level instance
        this.currentLevel = new Level(plan, this.gameInfo, this.particleSystem, this.audio);

        // Create new display
        this.display = new CanvasDisplay(document.body, this.currentLevel, this.gameInfo, this.particleSystem);

        // Link display to level for effects
        this.currentLevel.display = this.display;

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

        const overlay = document.getElementById('message-overlay');
        const title = document.getElementById('message-title');
        const subtitle = document.getElementById('message-subtitle');

        if (status === "lost") {
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

            // Calculate time bonus
            const timeBonus = Math.max(0, 60 - Math.floor(this.currentLevel.timer));
            const comboBonus = this.currentLevel.combo * 10;

            title.textContent = `Level ${this.gameInfo.level} Complete!`;
            subtitle.textContent = `Time: ${Math.floor(this.currentLevel.timer)}s | Bonus: +${timeBonus + comboBonus}`;
            overlay.classList.remove('hidden');

            setTimeout(() => {
                overlay.classList.add('hidden');
                // Clear cache for completed level so next time it generates fresh
                this.clearLevelCache(levelIndex);
                this.startLevel(levelIndex + 1);
            }, 2000);
        }
    }
}

