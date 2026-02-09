import { Vector } from '../utils/Vector.js';

export class Actor {
    constructor(pos, size, speed) {
        this.pos = pos;
        this.size = size;
        this.speed = speed;
    }

    act(step, level, state) {
        // Base act method
    }
}

export class Lava extends Actor {
    constructor(pos, ch) {
        super(pos, new Vector(1, 1), new Vector(0, 0));

        if (ch === "=") {
            this.speed = new Vector(2, 0);
        } else if (ch === "|") {
            this.speed = new Vector(0, 2);
        } else if (ch === "v") {
            this.speed = new Vector(0, 3);
            this.repeatPos = pos;
        }
    }

    get type() { return "lava"; }

    act(step, level) {
        const newPos = this.pos.plus(this.speed.times(step));
        if (!level.obstacleAt(newPos, this.size)) {
            this.pos = newPos;
        } else if (this.repeatPos) {
            this.pos = this.repeatPos;
        } else {
            this.speed = this.speed.times(-1);
        }
    }
}

export class Bone extends Actor {
    constructor(pos) {
        super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6), new Vector(0, 0));
        this.basePos = this.pos;
        this.wobble = Math.random() * Math.PI * 2;
    }

    get type() { return "bone"; }

    act(step) {
        const wobbleSpeed = 8;
        const wobbleDist = 0.07;
        this.wobble += step * wobbleSpeed;
        const wobblePos = Math.sin(this.wobble) * wobbleDist;
        this.pos = this.basePos.plus(new Vector(0, wobblePos));
    }
}

// Spring pad that bounces player upward
export class Spring extends Actor {
    constructor(pos) {
        super(pos.plus(new Vector(0.1, 0.5)), new Vector(0.8, 0.5), new Vector(0, 0));
        this.compressed = false;
        this.compressTimer = 0;
    }

    get type() { return "spring"; }

    act(step) {
        if (this.compressTimer > 0) {
            this.compressTimer -= step;
            if (this.compressTimer <= 0) {
                this.compressed = false;
            }
        }
    }

    bounce() {
        this.compressed = true;
        this.compressTimer = 0.3;
    }
}

export class Player extends Actor {
    constructor(pos) {
        // Reduced height from 1.5 to 0.95 so player can fit under platforms
        super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 0.95), new Vector(0, 0));
        this.playerXOverlap = 4;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.wasUp = false;
        this.canDoubleJump = false;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashTimer = 0;
        this.lastDir = 1;
        // Wall slide/jump properties
        this.isWallSliding = false;
        this.wallDir = 0;
        this.wallJumpCooldown = 0;
        this.wallSlideTimer = 0; // Timer to exit wall slide
        // Trail for visual effect
        this.trailPositions = [];
    }

    get type() { return "player"; }

    act(step, level, keys) {
        // Dash Cooldown
        if (this.dashCooldown > 0) this.dashCooldown -= step;
        if (this.wallJumpCooldown > 0) this.wallJumpCooldown -= step;

        // Store trail positions for ghost effect
        this.trailPositions.unshift({ x: this.pos.x, y: this.pos.y, time: 0.2 });
        this.trailPositions = this.trailPositions.filter(p => {
            p.time -= step;
            return p.time > 0;
        });
        if (this.trailPositions.length > 8) this.trailPositions.length = 8;

        // Dash Logic
        if (this.isDashing) {
            this.dashTimer -= step;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.speed.x = 0;
            } else {
                // Check for obstacle BEFORE moving
                const newPos = this.pos.plus(this.speed.times(step));
                const obstacle = level.obstacleAt(newPos, this.size);

                if (obstacle) {
                    // Hit something - stop dash but don't move into it
                    level.playerTouched(obstacle);
                    this.isDashing = false;
                    this.speed.x = 0;
                    this.speed.y = 0;
                    // Don't update position - stay where we are
                } else {
                    // Safe to move
                    this.pos = newPos;
                }

                // Trail particles
                if (level.particleSystem) {
                    level.particleSystem.emit(this.pos.plus(new Vector(0.4, 0.5)), {
                        count: 5,
                        color: "#00ffff",
                        speed: 3,
                        lifetime: 0.4,
                        sizeMin: 2,
                        sizeMax: 5,
                        friction: 0.9,
                        shrink: true
                    });
                }
                return;
            }
        }

        // Start Dash
        if (keys.shift && this.dashCooldown <= 0) {
            this.isDashing = true;
            this.dashTimer = 0.2;
            this.dashCooldown = 1.0;
            const dashSpeed = 15;
            let dir = 0;
            if (keys.right || keys.d) dir = 1;
            else if (keys.left || keys.a) dir = -1;
            else dir = this.lastDir || 1;

            this.speed = new Vector(dir * dashSpeed, 0);

            if (level.particleSystem) {
                level.particleSystem.emit(this.pos.plus(new Vector(0.4, 0.75)), {
                    count: 30,
                    color: "#ff00ff",
                    speed: 6,
                    lifetime: 0.8,
                    sizeMin: 3,
                    sizeMax: 10,
                    gravity: 0,
                    friction: 0.95,
                    composite: 'lighter'
                });
            }
            if (level.audio) level.audio.dash();
            return;
        }

        this.moveX(step, level, keys);
        this.moveY(step, level, keys);

        // Store key state for next frame
        this.wasUp = keys.up;

        const otherActor = level.actorAt(this);
        if (otherActor) {
            level.playerTouched(otherActor.type, otherActor);
        }

        // Losing animation
        if (level.status === "lost") {
            this.pos.y += step;
            this.size.y -= step;
        }
    }

    moveX(step, level, keys) {
        this.speed.x = 0;
        const playerXSpeed = 8;
        if (keys.left || keys.a) {
            this.speed.x -= playerXSpeed;
            this.lastDir = -1;
        }
        if (keys.right || keys.d) {
            this.speed.x += playerXSpeed;
            this.lastDir = 1;
        }

        const motion = new Vector(this.speed.x * step, 0);
        const newPos = this.pos.plus(motion);
        const obstacle = level.obstacleAt(newPos, this.size);

        if (obstacle) {
            level.playerTouched(obstacle);
            // Check for wall slide opportunity (only when moving into wall and falling)
            if (obstacle === "wall" && !this.isGrounded && this.speed.y > 0 && Math.abs(this.speed.x) > 0) {
                this.isWallSliding = true;
                this.wallDir = this.lastDir;
                this.wallSlideTimer = 0.5; // Max wall slide time
            }
        } else {
            this.pos = newPos;
            // Exit wall slide when no longer pressing into wall
            if (this.isWallSliding) {
                this.isWallSliding = false;
            }
        }
    }

    moveY(step, level, keys) {
        const gravity = 30;
        const jumpSpeed = 17;
        const wallSlideSpeed = 3;
        const wallJumpXSpeed = 12;

        // Physics constants
        const coyoteTimeDuration = 0.1;
        const jumpBufferDuration = 0.1;

        // Update timers
        if (this.coyoteTimer > 0) this.coyoteTimer -= step;
        if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= step;

        // Register jump input
        if (keys.up && !this.wasUp) {
            this.jumpBufferTimer = jumpBufferDuration;
        }

        // Decrement wall slide timer
        if (this.wallSlideTimer > 0) {
            this.wallSlideTimer -= step;
            if (this.wallSlideTimer <= 0) {
                this.isWallSliding = false;
            }
        }

        // Apply gravity (reduced during wall slide)
        if (this.isWallSliding && this.wallSlideTimer > 0) {
            this.speed.y = Math.min(this.speed.y + step * gravity * 0.3, wallSlideSpeed);
            // Wall slide particles
            if (level.particleSystem && Math.random() < 0.3) {
                level.particleSystem.emit(this.pos.plus(new Vector(this.wallDir > 0 ? 0.8 : 0, 0.5)), {
                    count: 2,
                    color: "#ff00ff",
                    speed: 2,
                    lifetime: 0.4,
                    sizeMin: 2,
                    sizeMax: 4,
                    gravity: 10,
                    friction: 0.95
                });
            }
            if (level.audio && !this._wallSlideSound) {
                level.audio.wallSlide();
                this._wallSlideSound = true;
            }
        } else {
            this.speed.y += step * gravity;
            this._wallSlideSound = false;
            this.isWallSliding = false;
        }

        const motion = new Vector(0, this.speed.y * step);
        const newPos = this.pos.plus(motion);
        const obstacle = level.obstacleAt(newPos, this.size);

        if (obstacle) {
            level.playerTouched(obstacle);

            // Ground collision detection
            if (this.speed.y > 0) {
                if (!this.isGrounded && level.audio) level.audio.land();

                // Land particles
                if (!this.isGrounded && level.particleSystem) {
                    level.particleSystem.emit(this.pos.plus(new Vector(0.4, 1.0)), {
                        count: 10,
                        color: "#ffffff",
                        speed: 4,
                        lifetime: 0.3,
                        sizeMin: 2,
                        sizeMax: 5,
                        spread: Math.PI,
                        angleOffset: -Math.PI / 2,
                        gravity: 5
                    });
                }

                this.coyoteTimer = coyoteTimeDuration;
                this.isGrounded = true;
                this.canDoubleJump = true;
                this.isWallSliding = false;
            } else {
                this.isGrounded = false;
            }

            // Jump Logic (Ground Jump)
            if (this.speed.y > 0 && this.jumpBufferTimer > 0) {
                this.speed.y = -jumpSpeed;
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;

                if (level.particleSystem) {
                    level.particleSystem.emit(this.pos.plus(new Vector(0.4, 1.0)), {
                        count: 15,
                        color: "#00ffff",
                        speed: 5,
                        lifetime: 0.6,
                        sizeMin: 3,
                        sizeMax: 7,
                        spread: Math.PI,
                        angleOffset: Math.PI / 2,
                        gravity: 10,
                        composite: 'lighter'
                    });
                }
                if (level.audio) level.audio.jump();
            } else {
                if (this.speed.y > 0) this.speed.y = 0;
                else if (this.speed.y < 0) this.speed.y = 0;
            }
        } else {
            this.pos = newPos;
            this.isGrounded = false;
        }

        // Wall Jump
        if (this.isWallSliding && this.jumpBufferTimer > 0 && this.wallJumpCooldown <= 0) {
            this.speed.y = -jumpSpeed * 0.9;
            this.speed.x = -this.wallDir * wallJumpXSpeed;
            this.jumpBufferTimer = 0;
            this.isWallSliding = false;
            this.canDoubleJump = true;
            this.wallJumpCooldown = 0.2;

            if (level.particleSystem) {
                level.particleSystem.emit(this.pos.plus(new Vector(this.wallDir > 0 ? 0.8 : 0, 0.75)), {
                    count: 20,
                    color: "#00ffff",
                    speed: 6,
                    lifetime: 0.6,
                    sizeMin: 3,
                    sizeMax: 8,
                    gravity: 5,
                    composite: 'lighter'
                });
            }
            if (level.audio) level.audio.wallJump();
            return;
        }

        // Air Jumps (Coyote & Double Jump)
        if (!obstacle && this.jumpBufferTimer > 0 && !this.isWallSliding) {
            // Coyote Jump
            if (this.coyoteTimer > 0) {
                this.speed.y = -jumpSpeed;
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;
                if (level.particleSystem) {
                    level.particleSystem.emit(this.pos.plus(new Vector(0.4, 1.0)), {
                        count: 15,
                        color: "#00ffff",
                        speed: 5,
                        lifetime: 0.6,
                        sizeMin: 3,
                        sizeMax: 7,
                        spread: Math.PI,
                        angleOffset: Math.PI / 2,
                        gravity: 10
                    });
                }
                if (level.audio) level.audio.jump();
            }
            // Double Jump
            else if (this.canDoubleJump) {
                this.speed.y = -jumpSpeed;
                this.jumpBufferTimer = 0;
                this.canDoubleJump = false;
                if (level.particleSystem) {
                    level.particleSystem.emit(this.pos.plus(new Vector(0.4, 0.75)), {
                        count: 25,
                        color: "#ff00ff",
                        speed: 6,
                        lifetime: 0.7,
                        sizeMin: 4,
                        sizeMax: 9,
                        gravity: 5,
                        composite: 'lighter'
                    });
                }
                if (level.audio) level.audio.jump();
            }
        }

        // Variable Jump Height
        if (!keys.up && this.speed.y < -jumpSpeed / 2) {
            this.speed.y = -jumpSpeed / 2;
        }
    }
}
