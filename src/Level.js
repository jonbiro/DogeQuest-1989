import { Vector } from './utils/Vector.js';
import { Player, Lava, Bone, Spring, Spike, Patrol, SpeedBoost, Shield, BreakableWall, CoinBlock } from './actors/Actors.js';

const actorChars = {
    "@": Player,
    "o": Bone,
    "=": Lava,
    "|": Lava,
    "v": Lava,
    "^": Spring,
    "S": Spike,
    "P": Patrol,
    "+": SpeedBoost,
    "*": Shield,
    "B": BreakableWall,
    "?": CoinBlock
};

export class Level {
    constructor(plan, gameInfo, particleSystem, audio, display = null) {
        if (!Array.isArray(plan) || plan.length === 0 || typeof plan[0] !== 'string' || plan[0].length === 0) {
            throw new TypeError('A level plan must be a non-empty array of non-empty strings.');
        }

        const expectedWidth = plan[0].length;
        if (plan.some(row => typeof row !== 'string' || row.length !== expectedWidth)) {
            throw new TypeError('Every row in a level plan must have the same width.');
        }

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
                }

                if (ch === "x") {
                    fieldType = "wall";
                } else if (ch === "!") {
                    fieldType = "lava";
                } else if (ch === "?") {
                    fieldType = "block"; // Solid block
                    // Also count as a bone since it gives one
                    this.gameInfo.bone++;
                } else if (ch === "B") {
                    fieldType = "breakable";
                }
                gridLine.push(fieldType);
            }
            this.grid.push(gridLine);
        }

        this.gameInfo.totalBone = this.gameInfo.bone;

        this.player = this.actors.find(actor => actor.type === "player");
        if (!this.player) {
            throw new TypeError('A level plan must contain a player start (@).');
        }
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
        return this.actorAtPosition(actor.pos, actor.size, other => other !== actor);
    }

    actorAtPosition(pos, size, predicate = () => true) {
        return this.actors.find(other => predicate(other) &&
            pos.x + size.x > other.pos.x &&
            pos.x < other.pos.x + other.size.x &&
            pos.y + size.y > other.pos.y &&
            pos.y < other.pos.y + other.size.y);
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
            if (this.status === "lost" && this.player) {
                this.player.pos.y += step;
                this.player.size.y = Math.max(0.1, this.player.size.y - step);
            }
            return;
        }

        // Remove broken breakable walls
        this.actors = this.actors.filter(a => !(a.type === 'breakablewall' && a.broken));

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
        if (this.status != null) return;
        if (["lava", "spike", "patrol"].includes(type) && this.player.invulnerabilityTimer > 0) return;

        if (type === "lava" && this.status == null) {
            if (this.player.shieldTimer > 0) {
                this.player.shieldTimer = 0;
                this.player.invulnerabilityTimer = 0.75;
                this.player.speed.y = -10;
                if (this.audio) this.audio.shieldHit();
                if (this.display) this.display.triggerFlash();
                return;
            }

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
            this.gameInfo.bone = Math.max(0, this.gameInfo.bone - 1);
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
            if (this.gameInfo.bone === 0) {
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
        } else if (type === "spike" || type === "patrol") {
            if (type === "patrol") {
                // Check if stomped (Player above enemy and falling)
                // We use a lenient "above" check to make it feel fair
                const isAbove = (this.player.pos.y + this.player.size.y) < (actor.pos.y + actor.size.y * 0.5);
                const isFalling = this.player.speed.y > 0;

                if (isAbove && isFalling) {
                    // Remove enemy
                    this.actors = this.actors.filter(a => a !== actor);

                    // Bounce player
                    this.player.speed.y = -15; // Bounce height
                    this.player.canDoubleJump = true; // Refresh double jump

                    // Effects
                    if (this.audio) this.audio.stomp();
                    if (this.display) {
                        this.display.addScreenShake(3);
                        this.display.showComboText("STOMP!", actor.pos); // Reuse combo text for effect
                    }
                    if (this.particleSystem) {
                        this.particleSystem.emit(actor.pos.plus(new Vector(0.4, 0.6)), {
                            count: 20, color: "#ff0066", speed: 6, lifetime: 0.8,
                            sizeMin: 3, sizeMax: 8, composite: 'lighter'
                        });
                    }

                    // Combo point/score for stomping?
                    this.combo++;
                    this.comboTimer = this.comboDecayTime;
                    return; // Return early, don't hurt player
                }
            }

            // Hazards — kill player (unless shielded)
            if (this.player.shieldTimer > 0 && this.status == null) {
                // Shield absorbs the hit
                this.player.shieldTimer = 0;
                this.player.invulnerabilityTimer = 0.75;
                if (this.audio) this.audio.shieldHit();
                if (this.display) this.display.triggerFlash();
                // Knock player back
                this.player.speed.y = -10;
                this.player.speed.x = (this.player.pos.x < actor.pos.x) ? -8 : 8;
                // Remove patrol enemy on hit only if shielded? Or just bounce?
                // Let's keep existing logic: shielded hit removes enemy
                if (type === "patrol") {
                    this.actors = this.actors.filter(a => a !== actor);
                    if (this.particleSystem) {
                        this.particleSystem.emit(actor.pos.plus(new Vector(0.4, 0.6)), {
                            count: 20, color: "#ff0066", speed: 6, lifetime: 0.8,
                            sizeMin: 3, sizeMax: 8, composite: 'lighter'
                        });
                    }
                }
            } else if (this.status == null) {
                // Death
                this.status = "lost";
                this.finishDelay = 1;
                this.combo = 0;
                if (this.display) {
                    this.display.addScreenShake(8);
                    this.display.triggerGlitch();
                }
                if (this.particleSystem) {
                    this.particleSystem.emit(this.player.pos.plus(new Vector(0.4, 0.75)), {
                        count: 30, color: "#ff0000", speed: 6, lifetime: 1.0,
                        sizeMin: 4, sizeMax: 10
                    });
                }
            }
        } else if (type === "speedboost") {
            this.actors = this.actors.filter(a => a !== actor);
            this.player.speedBoostTimer = 5.0;
            if (this.audio) this.audio.powerUp();
            if (this.display) this.display.triggerFlash();
            if (this.particleSystem) {
                this.particleSystem.emit(actor.pos.plus(new Vector(0.3, 0.3)), {
                    count: 20, color: "#00aaff", speed: 5, lifetime: 0.8,
                    sizeMin: 3, sizeMax: 8, composite: 'lighter'
                });
            }
        } else if (type === "shield") {
            this.actors = this.actors.filter(a => a !== actor);
            this.player.shieldTimer = 8.0;
            if (this.audio) this.audio.powerUp();
            if (this.display) this.display.triggerFlash();
            if (this.particleSystem) {
                this.particleSystem.emit(actor.pos.plus(new Vector(0.3, 0.3)), {
                    count: 20, color: "#00ffff", speed: 5, lifetime: 0.8,
                    sizeMin: 3, sizeMax: 8, composite: 'lighter'
                });
            }
        } else if (type === "breakablewall") {
            if (this.player.isDashing) {
                actor.breakWall(this);
                this.actors = this.actors.filter(other => other !== actor);
                if (this.audio) this.audio.breakWall();
                if (this.display) this.display.addScreenShake(4);
                if (this.particleSystem) {
                    this.particleSystem.emit(actor.pos.plus(new Vector(0.5, 0.5)), {
                        count: 25, color: "#ff8800", speed: 7, lifetime: 0.6,
                        sizeMin: 3, sizeMax: 9, gravity: 15
                    });
                }
            }
        }
    }
}
