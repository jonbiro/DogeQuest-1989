import { Vector } from './utils/Vector.js';
import { Player, Lava, Bone, Spring } from './actors/Actors.js';

const actorChars = {
    "@": Player,
    "o": Bone,
    "=": Lava,
    "|": Lava,
    "v": Lava,
    "^": Spring
};

export class Level {
    constructor(plan, gameInfo, particleSystem, audio, display = null) {
        this.width = plan[0].length;
        this.height = plan.length;
        this.grid = [];
        this.actors = [];
        this.gameInfo = gameInfo;
        this.particleSystem = particleSystem;
        this.audio = audio;
        this.display = display;

        // Timer and combo system
        this.timer = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.comboDecayTime = 2.0; // Seconds before combo resets

        // Reset bone count for the level
        this.gameInfo.bone = 0;

        for (let y = 0; y < this.height; y++) {
            let line = plan[y], gridLine = [];
            for (let x = 0; x < this.width; x++) {
                let ch = line[x], fieldType = null;
                let Actor = actorChars[ch];

                if (ch === 'o') {
                    this.gameInfo.bone++;
                }

                if (Actor) {
                    this.actors.push(new Actor(new Vector(x, y), ch));
                } else if (ch === "x") {
                    fieldType = "wall";
                } else if (ch === "!") {
                    fieldType = "lava";
                }
                gridLine.push(fieldType);
            }
            this.grid.push(gridLine);
        }

        this.gameInfo.totalBone = this.gameInfo.bone;

        this.player = this.actors.find(actor => actor.type === "player");
        this.status = null;
        this.finishDelay = null;
    }

    isFinished() {
        return this.status != null && this.finishDelay < 0;
    }

    obstacleAt(pos, size) {
        const xStart = Math.floor(pos.x);
        const xEnd = Math.ceil(pos.x + size.x);
        const yStart = Math.floor(pos.y);
        const yEnd = Math.ceil(pos.y + size.y);

        if (xStart < 0 || xEnd > this.width || yStart < 0) return "wall";
        if (yEnd > this.height) return "lava";

        for (let y = yStart; y < yEnd; y++) {
            for (let x = xStart; x < xEnd; x++) {
                let fieldType = this.grid[y][x];
                if (fieldType) return fieldType;
            }
        }
    }

    actorAt(actor) {
        for (let i = 0; i < this.actors.length; i++) {
            let other = this.actors[i];
            if (other !== actor &&
                actor.pos.x + actor.size.x > other.pos.x &&
                actor.pos.x < other.pos.x + other.size.x &&
                actor.pos.y + actor.size.y > other.pos.y &&
                actor.pos.y < other.pos.y + other.size.y)
                return other;
        }
    }

    animate(step, keys) {
        // Update timer
        if (this.status === null) {
            this.timer += step;
        }

        // Combo decay
        if (this.comboTimer > 0) {
            this.comboTimer -= step;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        if (this.status != null) {
            this.finishDelay -= step;
        }

        const maxStep = 0.05;
        while (step > 0) {
            let thisStep = Math.min(step, maxStep);
            this.actors.forEach(actor => {
                actor.act(thisStep, this, keys);
            });
            step -= thisStep;
        }
    }

    playerTouched(type, actor) {
        if (type === "lava" && this.status == null) {
            this.status = "lost";
            this.finishDelay = 1;
            this.combo = 0;

            // Screen shake on death
            if (this.display) {
                this.display.addScreenShake(8);
                this.display.triggerGlitch();
            }

            // Death particles
            if (this.particleSystem) {
                this.particleSystem.emit(this.player.pos.plus(new Vector(0.4, 0.75)), {
                    count: 30,
                    color: "#ff0000",
                    speed: 6,
                    lifetime: 1.0,
                    sizeMin: 4,
                    sizeMax: 10
                });
            }
        } else if (type === "bone") {
            this.gameInfo.bone--;
            this.actors = this.actors.filter(other => other !== actor);

            // Combo system
            this.combo++;
            this.comboTimer = this.comboDecayTime;

            // Show combo text for streaks
            if (this.combo >= 3 && this.display) {
                this.display.showComboText(this.combo, actor.pos);
            }

            // Combo milestone sounds
            if (this.audio) {
                if (this.combo === 3) this.audio.combo3();
                else if (this.combo === 5) this.audio.combo5();
                else if (this.combo >= 10) this.audio.combo10();
            }

            // Flash effect on collection
            if (this.display) {
                this.display.triggerFlash();
            }

            // Emit particles - more dramatic for combos
            if (this.particleSystem) {
                const particleCount = Math.min(25 + this.combo * 3, 50);
                this.particleSystem.emit(actor.pos.plus(new Vector(0.3, 0.3)), {
                    count: particleCount,
                    color: "#ffd700",
                    speed: 5 + this.combo * 0.5,
                    lifetime: 1.0,
                    sizeMin: 4,
                    sizeMax: 10
                });
                // Add secondary cyan particles for retro feel
                this.particleSystem.emit(actor.pos.plus(new Vector(0.3, 0.3)), {
                    count: 15,
                    color: "#00ffff",
                    speed: 4,
                    lifetime: 0.8,
                    sizeMin: 3,
                    sizeMax: 7
                });
            }
            if (this.audio) this.audio.collect();

            // Check if all bones collected
            if (!this.actors.some(actor => actor.type === "bone")) {
                this.status = "won";
                this.finishDelay = 1;

                // Victory confetti
                if (this.display) {
                    this.display.triggerVictory();
                }
            }
        } else if (type === "spring") {
            // Bounce on spring
            const springJumpSpeed = 25;
            this.player.speed.y = -springJumpSpeed;
            this.player.canDoubleJump = true;
            actor.bounce();

            if (this.particleSystem) {
                this.particleSystem.emit(actor.pos.plus(new Vector(0.4, 0)), {
                    count: 15,
                    color: "#00ff00",
                    speed: 5,
                    lifetime: 0.6,
                    sizeMin: 4,
                    sizeMax: 8
                });
            }
            if (this.audio) this.audio.spring();
        }
    }
}

