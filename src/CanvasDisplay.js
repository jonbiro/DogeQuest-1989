export class CanvasDisplay {
    constructor(parent, level, gameInfo, particleSystem) {
        this.scale = 20;
        this.gameInfo = gameInfo;
        this.particleSystem = particleSystem;

        // Use existing canvas if present (preferred) or create one
        this.canvas = document.getElementById("gameBoard");
        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
            this.canvas.id = "gameBoard";
            parent.appendChild(this.canvas);
        }

        this.canvas.width = Math.min(800, level.width * this.scale);
        this.canvas.height = Math.min(600, level.height * this.scale);

        this.cx = this.canvas.getContext("2d");
        this.cx.imageSmoothingEnabled = false;

        this.level = level;
        this.animationTime = 0;
        this.flipPlayer = false;

        // Screen shake
        this.screenShake = 0;
        this.shakeIntensity = 0;

        // Parallax layers
        this.stars = this.generateStars(80);
        this.farStars = this.generateStars(40);
        this.nebulaClouds = this.generateNebula(5);

        // Confetti for victory
        this.confetti = [];
        this.isVictory = false;

        // Combo text
        this.comboTexts = [];

        // Lava animation time
        this.lavaTime = 0;

        // Screen transition
        this.transition = { active: false, progress: 0, type: 'in', duration: 0.5 };

        // Camera State
        this.viewport = {
            left: 0,
            top: 0,
            width: this.canvas.width / this.scale,
            height: this.canvas.height / this.scale
        };

        // DOM Elements for HUD
        this.hudLevel = document.getElementById("level-display");
        this.hudScore = document.getElementById("score-display");
        this.hudTotal = document.getElementById("total-bones-display");
        this.hudLives = document.getElementById("lives-display");
        this.hudHighScore = document.getElementById("highscore-display");
        this.hudTimer = document.getElementById("timer-display");
        this.hudCombo = document.getElementById("combo-display");

        // Load sprites
        this.otherSprites = document.createElement("img");
        this.otherSprites.src = "img/sprites.png";

        // Player is now drawn procedurally

        // Get game container for effects
        this.gameContainer = document.querySelector('.game-container');

        this.updateHUD();
        this.drawFrame(0);
        this.buildWallCache();
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 2 + 1,
                twinkle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.5 + 0.5,
                color: Math.random() > 0.8 ? '#ff00ff' : (Math.random() > 0.5 ? '#00ffff' : '#ffffff')
            });
        }
        return stars;
    }

    generateNebula(count) {
        const clouds = [];
        for (let i = 0; i < count; i++) {
            clouds.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 150 + 100,
                color: Math.random() > 0.5 ? 'rgba(255,0,255,0.03)' : 'rgba(0,255,255,0.03)',
                drift: Math.random() * 0.0001
            });
        }
        return clouds;
    }

    addScreenShake(intensity = 5) {
        this.shakeIntensity = intensity;
        this.screenShake = 0.3;
        if (this.gameContainer) {
            this.gameContainer.classList.add('shake');
            setTimeout(() => {
                this.gameContainer.classList.remove('shake');
            }, 500);
        }
    }

    triggerFlash() {
        if (this.gameContainer) {
            this.gameContainer.classList.add('flash');
            setTimeout(() => {
                this.gameContainer.classList.remove('flash');
            }, 300);
        }
    }

    triggerGlitch() {
        if (this.gameContainer) {
            this.gameContainer.classList.add('glitch');
            setTimeout(() => {
                this.gameContainer.classList.remove('glitch');
            }, 300);
        }
    }

    triggerVictory() {
        this.isVictory = true;
        // Spawn confetti
        for (let i = 0; i < 100; i++) {
            this.confetti.push({
                x: Math.random() * this.canvas.width,
                y: -20 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 8 + 4,
                color: ['#ff00ff', '#00ffff', '#ffd700', '#00ff00', '#ff6600'][Math.floor(Math.random() * 5)],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }

    showComboText(combo, pos) {
        this.comboTexts.push({
            text: `${combo}x COMBO!`,
            x: (pos.x - this.viewport.left) * this.scale,
            y: (pos.y - this.viewport.top) * this.scale,
            life: 1.5,
            color: combo >= 10 ? '#ffd700' : (combo >= 5 ? '#ff00ff' : '#00ffff')
        });
    }

    clear() {
        this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateHUD() {
        if (this.hudLevel) this.hudLevel.textContent = this.gameInfo.level;
        const collected = this.gameInfo.totalBone - this.gameInfo.bone;

        if (this.hudScore) this.hudScore.textContent = collected;
        if (this.hudTotal) this.hudTotal.textContent = this.gameInfo.totalBone;
        if (this.hudLives) this.hudLives.textContent = this.gameInfo.life;

        // Update High Score check
        if (collected > this.gameInfo.highScore) {
            this.gameInfo.highScore = collected;
            localStorage.setItem('puppyQuestHighScore', collected);
        }
        if (this.hudHighScore) this.hudHighScore.textContent = this.gameInfo.highScore;

        // Timer display
        if (this.hudTimer && this.level) {
            const mins = Math.floor(this.level.timer / 60);
            const secs = Math.floor(this.level.timer % 60);
            this.hudTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Combo display
        if (this.hudCombo && this.level) {
            this.hudCombo.textContent = this.level.combo > 0 ? `${this.level.combo}x` : '';
        }
    }

    drawFrame(step) {
        this.animationTime += step;
        this.lavaTime += step;

        // Reduce screen shake
        if (this.screenShake > 0) {
            this.screenShake -= step;
        }

        // Update confetti
        this.confetti.forEach(c => {
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.1;
            c.rotation += c.rotSpeed;
        });
        this.confetti = this.confetti.filter(c => c.y < this.canvas.height + 50);

        // Update combo texts
        this.comboTexts.forEach(t => t.life -= step);
        this.comboTexts = this.comboTexts.filter(t => t.life > 0);

        this.updateViewport(step);
        this.clearDisplay();
        this.drawBackground();
        this.drawPlayerTrail();
        this.drawActors();
        this.drawParticles();
        this.drawConfetti();
        this.drawComboTexts();
        this.updateHUD();

        // Screen transition overlay
        if (this.transition.active) {
            this.transition.progress += step / this.transition.duration;
            if (this.transition.progress >= 1) {
                this.transition.progress = 1;
                this.transition.active = false;
            }
            this.drawTransition();
        }
    }

    startTransition(type = 'out') {
        this.transition.active = true;
        this.transition.progress = 0;
        this.transition.type = type;
    }

    drawTransition() {
        const p = this.transition.type === 'out'
            ? this.transition.progress
            : 1 - this.transition.progress;

        this.cx.save();
        this.cx.fillStyle = '#000';

        // Circular wipe from center
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const maxR = Math.sqrt(cx * cx + cy * cy);
        const r = maxR * (1 - p);

        this.cx.beginPath();
        this.cx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.cx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2, true);
        this.cx.fill('evenodd');

        this.cx.restore();
    }

    updateViewport(step) {
        let view = this.viewport, margin = view.width / 3;
        let player = this.level.player;
        let center = player.pos.plus(player.size.times(0.5));

        // Target position (centering player)
        let targetLeft = center.x - view.width / 2;
        let targetTop = center.y - view.height / 2;

        // Clamping to level bounds
        targetLeft = Math.max(0, Math.min(targetLeft, this.level.width - view.width));
        targetTop = Math.max(0, Math.min(targetTop, this.level.height - view.height));

        // Smooth camera
        if (step === 0) {
            view.left = targetLeft;
            view.top = targetTop;
        } else {
            const smoothing = 5;
            view.left += (targetLeft - view.left) * Math.min(step * smoothing, 1);
            view.top += (targetTop - view.top) * Math.min(step * smoothing, 1);
        }
    }

    clearDisplay() {
        // Vaporwave Background
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Sky Gradient (Deep purple to pink/orange at bottom)
        const grad = this.cx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#050010");
        grad.addColorStop(0.6, "#1a0b36");
        grad.addColorStop(1, "#3c1053");
        this.cx.fillStyle = grad;
        this.cx.fillRect(0, 0, width, height);

        // Retro Sun
        this.drawRetroSun(width, height);

        // Moving Perspective Grid (The "Floor")
        this.drawPerspectiveGrid(width, height);

        // Stars (Enhanced)
        this.drawStars();

        // Parallax City Skyline
        this.drawCitySkyline(width, height);
    }

    drawCitySkyline(width, height) {
        this.cx.save();
        const horizon = height * 0.6;
        const parallax = (this.viewport.left * this.scale * 0.15) % width;

        this.cx.globalAlpha = 0.4;

        // Generate building silhouettes
        const buildings = [
            { x: 0, w: 30, h: 80 }, { x: 35, w: 20, h: 50 }, { x: 60, w: 40, h: 100 },
            { x: 110, w: 25, h: 60 }, { x: 140, w: 35, h: 90 }, { x: 180, w: 20, h: 45 },
            { x: 205, w: 45, h: 110 }, { x: 260, w: 30, h: 70 }, { x: 295, w: 25, h: 55 },
            { x: 325, w: 40, h: 95 }, { x: 370, w: 20, h: 40 }, { x: 395, w: 35, h: 85 },
            { x: 440, w: 30, h: 65 }, { x: 475, w: 45, h: 105 }, { x: 530, w: 25, h: 50 },
            { x: 560, w: 40, h: 90 }, { x: 610, w: 30, h: 75 }, { x: 650, w: 35, h: 60 },
            { x: 690, w: 25, h: 80 }, { x: 720, w: 40, h: 100 },
        ];

        // Dark silhouette
        this.cx.fillStyle = '#0a0015';
        buildings.forEach(b => {
            const bx = ((b.x - parallax) % (width + 100) + width + 100) % (width + 100) - 50;
            this.cx.fillRect(bx, horizon - b.h, b.w, b.h);

            // Windows (small glowing dots)
            this.cx.save();
            this.cx.fillStyle = 'rgba(255, 0, 255, 0.5)';
            for (let wy = 0; wy < b.h - 10; wy += 12) {
                for (let wx = 4; wx < b.w - 4; wx += 8) {
                    if (Math.sin(b.x * 7 + wx * 3 + wy * 5) > 0.1) {
                        this.cx.fillRect(bx + wx, horizon - b.h + 5 + wy, 3, 4);
                    }
                }
            }
            this.cx.restore();
        });

        // Neon glow line at building tops
        this.cx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        this.cx.lineWidth = 1;
        this.cx.shadowBlur = 8;
        this.cx.shadowColor = '#ff00ff';
        buildings.forEach(b => {
            const bx = ((b.x - parallax) % (width + 100) + width + 100) % (width + 100) - 50;
            this.cx.beginPath();
            this.cx.moveTo(bx, horizon - b.h);
            this.cx.lineTo(bx + b.w, horizon - b.h);
            this.cx.stroke();
        });

        this.cx.restore();
    }

    drawRetroSun(width, height) {
        const cx = width / 2;
        const cy = height * 0.6; // Horizon line
        const radius = Math.min(width, height) * 0.25;

        this.cx.save();

        // Sun Gradient
        const grad = this.cx.createLinearGradient(cx, cy - radius, cx, cy + radius);
        grad.addColorStop(0, "#ffd700");
        grad.addColorStop(0.5, "#ff00ff");
        grad.addColorStop(1, "#9900ff");

        this.cx.fillStyle = grad;

        // Clip bottom to horizon
        this.cx.beginPath();
        this.cx.arc(cx, cy, radius, Math.PI, 0);
        this.cx.fill();

        // Scanlines on Sun
        this.cx.fillStyle = "rgba(0, 0, 0, 0.2)";
        for (let i = 0; i < 10; i++) {
            const h = radius / 5;
            const y = cy - i * h * 0.6 - (this.animationTime * 10) % (h * 0.6);
            if (y < cy - radius) continue;
            this.cx.fillRect(cx - radius, y, radius * 2, h * 0.2);
        }

        // Glow
        this.cx.shadowBlur = 40;
        this.cx.shadowColor = "#ff00ff";
        this.cx.beginPath();
        this.cx.arc(cx, cy, radius, Math.PI, 0);
        this.cx.fill();

        this.cx.restore();
    }

    drawPerspectiveGrid(width, height) {
        const horizon = height * 0.6;
        const cx = width / 2;

        this.cx.save();
        this.cx.beginPath();
        this.cx.rect(0, horizon, width, height - horizon);
        this.cx.clip();

        // Floor gradient
        const grad = this.cx.createLinearGradient(0, horizon, 0, height);
        grad.addColorStop(0, "rgba(255, 0, 255, 0.1)");
        grad.addColorStop(1, "rgba(0, 255, 255, 0.2)");
        this.cx.fillStyle = grad;
        this.cx.fillRect(0, horizon, width, height - horizon);

        this.cx.strokeStyle = "rgba(0, 255, 255, 0.3)";
        this.cx.lineWidth = 1.5;
        this.cx.shadowBlur = 8;
        this.cx.shadowColor = "#00ffff";

        // Radiating lines from vanishing point
        const spacing = 100;
        const offset = (this.viewport.left * this.scale * 0.5) % spacing;
        for (let i = -20; i <= 20; i++) {
            const lineX = (cx + i * spacing * 2) - offset;
            this.cx.beginPath();
            this.cx.moveTo(cx, horizon);
            this.cx.lineTo(lineX, height);
            this.cx.stroke();
        }

        // Horizontal depth lines
        const timeOffset = (this.animationTime * 40) % 50;
        for (let i = 0; i < 20; i++) {
            const y = horizon + Math.pow(i, 2.5) * 2 + timeOffset;
            if (y > height) break;
            this.cx.beginPath();
            this.cx.moveTo(0, y);
            this.cx.lineTo(width, y);
            this.cx.stroke();
        }

        this.cx.restore();
    }

    drawStars() {
        this.cx.save();

        // Nebula clouds (soft background glow)
        this.nebulaClouds.forEach(cloud => {
            const x = (cloud.x * this.canvas.width + Math.sin(this.animationTime * 0.2 + cloud.drift * 1000) * 20 - this.viewport.left * 0.5) % this.canvas.width;
            const y = cloud.y * this.canvas.height * 0.6;
            const drawX = x < 0 ? x + this.canvas.width : x;

            const gradient = this.cx.createRadialGradient(drawX, y, 0, drawX, y, cloud.size);
            gradient.addColorStop(0, cloud.color);
            gradient.addColorStop(1, 'transparent');
            this.cx.fillStyle = gradient;
            this.cx.fillRect(drawX - cloud.size, y - cloud.size, cloud.size * 2, cloud.size * 2);
        });

        // Far stars (slower parallax, dimmer)
        this.farStars.forEach(star => {
            const opacity = 0.3 + Math.sin(star.twinkle + this.animationTime * 0.5) * 0.2;
            const x = (star.x * this.canvas.width - this.viewport.left * 0.5) % this.canvas.width;
            const y = (star.y * this.canvas.height * 0.6 - this.viewport.top * 0.3) % (this.canvas.height * 0.6);
            const drawX = x < 0 ? x + this.canvas.width : x;
            const drawY = y < 0 ? y + this.canvas.height * 0.6 : y;

            this.cx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.cx.beginPath();
            this.cx.arc(drawX, drawY, star.size * 0.7, 0, Math.PI * 2);
            this.cx.fill();
        });

        // Near stars (brighter, faster parallax)
        this.stars.forEach(star => {
            const opacity = 0.5 + Math.sin(star.twinkle + this.animationTime) * 0.5;
            const x = (star.x * this.canvas.width - this.viewport.left * 2) % this.canvas.width;
            const y = (star.y * this.canvas.height - this.viewport.top * 1) % this.canvas.height;
            const drawX = x < 0 ? x + this.canvas.width : x;
            const drawY = y < 0 ? y + this.canvas.height : y;

            this.cx.fillStyle = star.color.replace(')', `, ${opacity})`);
            if (star.color.startsWith('#')) {
                this.cx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            }
            this.cx.shadowBlur = star.size * 3;
            this.cx.shadowColor = star.color;
            this.cx.beginPath();
            this.cx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
            this.cx.fill();
        });

        this.cx.restore();
    }

    drawPlayerTrail() {
        const player = this.level.player;
        if (!player.trailPositions || player.trailPositions.length === 0) return;

        this.cx.save();
        const color = player.isDashing ? '#00ffff' : '#ff00ff';
        player.trailPositions.forEach((trail, i) => {
            const opacity = (trail.time / 0.2) * 0.25;
            const x = (trail.x - this.viewport.left) * this.scale;
            const y = (trail.y - this.viewport.top) * this.scale;
            const w = player.size.x * this.scale;
            const h = player.size.y * this.scale;
            const r = 4; // rounded corner radius

            this.cx.globalAlpha = opacity;
            this.cx.fillStyle = color;
            this.cx.shadowBlur = 12;
            this.cx.shadowColor = color;

            this.cx.beginPath();
            this.cx.moveTo(x + r, y);
            this.cx.lineTo(x + w - r, y);
            this.cx.arcTo(x + w, y, x + w, y + r, r);
            this.cx.lineTo(x + w, y + h - r);
            this.cx.arcTo(x + w, y + h, x + w - r, y + h, r);
            this.cx.lineTo(x + r, y + h);
            this.cx.arcTo(x, y + h, x, y + h - r, r);
            this.cx.lineTo(x, y + r);
            this.cx.arcTo(x, y, x + r, y, r);
            this.cx.closePath();
            this.cx.fill();
        });
        this.cx.restore();
    }

    drawConfetti() {
        if (this.confetti.length === 0) return;

        this.cx.save();
        this.confetti.forEach(c => {
            this.cx.save();
            this.cx.translate(c.x, c.y);
            this.cx.rotate(c.rotation);
            this.cx.fillStyle = c.color;
            this.cx.shadowBlur = 5;
            this.cx.shadowColor = c.color;
            this.cx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
            this.cx.restore();
        });
        this.cx.restore();
    }

    drawComboTexts() {
        if (this.comboTexts.length === 0) return;

        this.cx.save();
        this.comboTexts.forEach(t => {
            const progress = 1 - (t.life / 1.5);
            const y = t.y - progress * 50;
            const scale = 1 + progress * 0.5;

            this.cx.save();
            this.cx.translate(t.x, y);
            this.cx.scale(scale, scale);
            this.cx.font = 'bold 16px "Press Start 2P", monospace';
            this.cx.textAlign = 'center';
            this.cx.fillStyle = t.color;
            this.cx.shadowBlur = 15;
            this.cx.shadowColor = t.color;
            this.cx.globalAlpha = Math.min(t.life, 1);
            this.cx.fillText(t.text, 0, 0);
            this.cx.restore();
        });
        this.cx.restore();
    }

    drawParticles() {
        if (!this.particleSystem) return;

        this.cx.save();
        this.particleSystem.particles.forEach(p => {
            let x = (p.pos.x - this.viewport.left) * this.scale;
            let y = (p.pos.y - this.viewport.top) * this.scale;

            const opacity = p.opacity || 1;
            this.cx.globalAlpha = opacity;

            // Glow effect
            this.cx.shadowBlur = 15;
            this.cx.shadowColor = p.color;
            this.cx.fillStyle = p.color;

            this.cx.beginPath();
            this.cx.arc(x, y, p.size || 3, 0, Math.PI * 2);
            this.cx.fill();
        });
        this.cx.restore();
    }

    drawBackground() {
        let view = this.viewport;
        let xStart = Math.floor(view.left);
        let xEnd = Math.ceil(view.left + view.width);
        let yStart = Math.floor(view.top);
        let yEnd = Math.ceil(view.top + view.height);

        for (let y = yStart; y < yEnd; y++) {
            for (let x = xStart; x < xEnd; x++) {
                const key = `${x},${y}`;
                const cached = this.wallCache && this.wallCache[key];

                if (cached) {
                    let screenX = (x - view.left) * this.scale;
                    let screenY = (y - view.top) * this.scale;
                    this.drawSmoothWallCached(screenX, screenY, cached);
                } else if (this.level.grid[y] && this.level.grid[y][x] === "lava") {
                    let screenX = (x - view.left) * this.scale;
                    let screenY = (y - view.top) * this.scale;
                    this.drawPlasmaLava(screenX, screenY, x, y);
                }
            }
        }
    }

    buildWallCache() {
        this.wallCache = {};
        for (let y = 0; y < this.level.height; y++) {
            for (let x = 0; x < this.level.width; x++) {
                if (this.isWall(x, y)) {
                    this.wallCache[`${x},${y}`] = {
                        n: this.isWall(x, y - 1),
                        s: this.isWall(x, y + 1),
                        w: this.isWall(x - 1, y),
                        e: this.isWall(x + 1, y)
                    };
                }
            }
        }
    }

    isWall(x, y) {
        if (x < 0 || x >= this.level.width || y < 0 || y >= this.level.height) return false;
        return this.level.grid[y] && this.level.grid[y][x] === "wall";
    }

    drawSmoothWallCached(screenX, screenY, neighbors) {
        const size = this.scale;
        const r = size * 0.25;
        const { n, s, w, e } = neighbors;

        // -- PATH CONSTRUCTION --
        this.cx.beginPath();

        // Top-Left Corner
        if (!n && !w) {
            this.cx.moveTo(screenX, screenY + r);
            this.cx.arcTo(screenX, screenY, screenX + r, screenY, r);
        } else {
            this.cx.moveTo(screenX, screenY);
        }

        // Top Edge -> Top-Right Corner
        if (!n) {
            this.cx.lineTo(screenX + size - (e ? 0 : r), screenY);
        } else {
            this.cx.lineTo(screenX + size, screenY);
        }

        if (!n && !e) {
            this.cx.arcTo(screenX + size, screenY, screenX + size, screenY + r, r);
        }

        // Right Edge -> Bottom-Right Corner
        if (!e) {
            this.cx.lineTo(screenX + size, screenY + size - (s ? 0 : r));
        } else {
            this.cx.lineTo(screenX + size, screenY + size);
        }

        if (!s && !e) {
            this.cx.arcTo(screenX + size, screenY + size, screenX + size - r, screenY + size, r);
        }

        // Bottom Edge -> Bottom-Left Corner
        if (!s) {
            this.cx.lineTo(screenX + (w ? 0 : r), screenY + size);
        } else {
            this.cx.lineTo(screenX, screenY + size);
        }

        if (!s && !w) {
            this.cx.arcTo(screenX, screenY + size, screenX, screenY + size - r, r);
        }

        // Left Edge -> Close
        this.cx.lineTo(screenX, screenY + (n ? 0 : r)); // Connect back to start

        this.cx.closePath();

        // -- FILL --
        this.cx.fillStyle = "#0a0a0a";
        this.cx.fill();

        // -- STROKE (Exposed edges only) --
        // We re-draw specific segments to apply the glow only on the outer edge
        // This gives a cleaner "connected" look than stroking the whole cell path

        this.cx.save();
        this.cx.strokeStyle = "#00ffff";
        this.cx.lineWidth = 2;
        this.cx.shadowBlur = 15;
        this.cx.shadowColor = "#00ffff";
        this.cx.lineCap = "round";

        this.cx.beginPath();

        // Top Edge (if exposed)
        if (!n) {
            const startX = screenX + (w ? 0 : r);
            const endX = screenX + size - (e ? 0 : r);
            this.cx.moveTo(startX, screenY);
            this.cx.lineTo(endX, screenY);

            // Corners
            if (!w) { // TL Corner
                this.cx.moveTo(screenX, screenY + r);
                this.cx.arcTo(screenX, screenY, screenX + r, screenY, r);
            }
            if (!e) { // TR Corner
                this.cx.moveTo(screenX + size - r, screenY);
                this.cx.arcTo(screenX + size, screenY, screenX + size, screenY + r, r);
            }
        }

        // Right Edge (if exposed)
        if (!e) {
            const startY = screenY + (n ? 0 : r);
            const endY = screenY + size - (s ? 0 : r);
            this.cx.moveTo(screenX + size, startY);
            this.cx.lineTo(screenX + size, endY);

            // Corners already handled by Top/Bottom checks logic? 
            // We need to be careful not to double draw corners. 
            // The previous block handled TL and TR.
            // Let's verify BR.
            if (!s) { // BR Corner
                this.cx.moveTo(screenX + size, screenY + size - r);
                this.cx.arcTo(screenX + size, screenY + size, screenX + size - r, screenY + size, r);
            }
        }

        // Bottom Edge (if exposed)
        if (!s) {
            const startX = screenX + size - (e ? 0 : r);
            const endX = screenX + (w ? 0 : r);
            this.cx.moveTo(startX, screenY + size);
            this.cx.lineTo(endX, screenY + size);

            if (!w) { // BL Corner
                this.cx.moveTo(screenX + r, screenY + size);
                this.cx.arcTo(screenX, screenY + size, screenX, screenY + size - r, r);
            }
        }

        // Left Edge (if exposed)
        if (!w) {
            const startY = screenY + size - (s ? 0 : r);
            const endY = screenY + (n ? 0 : r);
            this.cx.moveTo(screenX, startY);
            this.cx.lineTo(screenX, endY);
        }

        this.cx.stroke();
        this.cx.restore();
    }

    drawPlasmaLava(x, y, tileX, tileY) {
        const size = this.scale;

        // Time-based animation
        const t = this.lavaTime * 2;

        // Calculate color based on position and time for "plasma" effect
        // We simulate a fluid surface

        this.cx.save();

        // Base fill
        this.cx.fillStyle = "#ff0055";
        this.cx.fillRect(x, y, size, size);

        // Animated waves/plasma
        // Create a few overlapping sine waves
        const wave1 = Math.sin(tileX * 0.5 + t) * 0.5 + 0.5;
        const wave2 = Math.cos(tileY * 0.5 + t * 1.5) * 0.5 + 0.5;
        const intensity = (wave1 + wave2) / 2;

        const r = Math.floor(255);
        const g = Math.floor(intensity * 100);
        const b = Math.floor(intensity * 255); // Magenta/Purple feel

        this.cx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.cx.shadowBlur = 15;
        this.cx.shadowColor = "#ff0055";

        // Draw fluid top
        const topOffset = Math.sin(tileX * 1 + t * 2) * 5;
        this.cx.fillRect(x, y + 5 + topOffset, size, size - 5 - topOffset);

        // Surface line
        this.cx.strokeStyle = "#fff";
        this.cx.lineWidth = 2;
        this.cx.beginPath();
        this.cx.moveTo(x, y + 5 + topOffset);
        this.cx.lineTo(x + size, y + 5 + Math.sin((tileX + 1) * 1 + t * 2) * 5);
        this.cx.stroke();

        // Bubbles
        if ((tileX + tileY + Math.floor(t)) % 7 === 0) {
            this.cx.fillStyle = "#fff";
            this.cx.beginPath();
            this.cx.arc(x + size / 2, y + size / 2, 2, 0, Math.PI * 2);
            this.cx.fill();
        }

        this.cx.restore();
    }

    drawPlayer(x, y, width, height) {
        const player = this.level.player;

        // Scale for visibility
        // Slightly larger scale to make the character pop
        const scale = 1.3;
        width *= scale;
        height *= scale;
        x -= (width * (scale - 1)) / 2;
        y -= height * (scale - 1);

        if (player.speed.x !== 0)
            this.flipPlayer = player.speed.x < 0;

        this.cx.save();

        // Translate to center for rotation/scale effects
        const cx = x + width / 2;
        const cy = y + height / 2;

        this.cx.translate(cx, cy);

        // Flip horizontally if moving left
        if (this.flipPlayer) {
            this.cx.scale(-1, 1);
        }

        // Animation bounce (Squash and Stretch)
        const bounce = player.speed.x !== 0 ? Math.sin(this.animationTime * 15) * 0.1 : 0;
        const squash = player.speed.y < 0 ? 0.9 : (player.speed.y > 5 ? 1.1 : 1);

        this.cx.scale(1, squash);
        this.cx.translate(0, bounce * 5); // Bounce up and down

        // -- NEON DOGE DRAWING --
        // A stylized, geometric doge head suitable for a neon/retro theme.

        const headSize = width * 0.6;

        // Glow effects
        if (player.isDashing) {
            this.cx.shadowBlur = 20;
            this.cx.shadowColor = '#00ffff'; // Cyan dash
        } else if (player.isWallSliding) {
            this.cx.shadowBlur = 15;
            this.cx.shadowColor = '#ff00ff'; // Magenta wall slide
        } else {
            this.cx.shadowBlur = 12;
            this.cx.shadowColor = '#ffd700'; // Gold default
        }

        // 1. Head Shape (Soft Rhombus/Hexagon hybrid)
        this.cx.fillStyle = 'rgba(255, 215, 0, 0.2)'; // Gold tint
        this.cx.strokeStyle = '#ffd700'; // Gold neon
        this.cx.lineWidth = 2;

        this.cx.beginPath();
        // Snout
        this.cx.moveTo(headSize * 0.6, headSize * 0.1);
        // Cheek Right
        this.cx.lineTo(headSize * 0.4, headSize * 0.5);
        // Chin
        this.cx.lineTo(0, headSize * 0.6);
        // Cheek Left
        this.cx.lineTo(-headSize * 0.4, headSize * 0.5);
        // Top Left Ear Start
        this.cx.lineTo(-headSize * 0.5, -headSize * 0.2);
        // Top Right Ear Start
        this.cx.lineTo(headSize * 0.3, -headSize * 0.3);
        this.cx.closePath();
        this.cx.fill();
        this.cx.stroke();

        // 2. Ears (Triangular, Perky)
        // Left Ear
        this.cx.beginPath();
        this.cx.moveTo(-headSize * 0.5, -headSize * 0.2);
        this.cx.lineTo(-headSize * 0.7, -headSize * 0.7); // Tip
        this.cx.lineTo(-headSize * 0.2, -headSize * 0.4);
        this.cx.stroke();

        // Right Ear
        this.cx.beginPath();
        this.cx.moveTo(headSize * 0.3, -headSize * 0.3);
        this.cx.lineTo(headSize * 0.6, -headSize * 0.8); // Tip
        this.cx.lineTo(headSize * 0.5, -headSize * 0.1);
        this.cx.stroke();

        // 3. Face Details
        // Eyes (Sunglasses/Visor style for "Cool" factor)
        this.cx.fillStyle = '#000';
        this.cx.beginPath();
        this.cx.moveTo(-headSize * 0.3, -headSize * 0.1);
        this.cx.lineTo(headSize * 0.4, -headSize * 0.15);
        this.cx.lineTo(headSize * 0.35, headSize * 0.1);
        this.cx.lineTo(-headSize * 0.25, headSize * 0.1);
        this.cx.fill();

        // Eye glint
        this.cx.fillStyle = '#fff';
        this.cx.beginPath();
        this.cx.arc(headSize * 0.1, -headSize * 0.05, 2, 0, Math.PI * 2);
        this.cx.fill();

        // Nose/Snout Tip
        this.cx.fillStyle = '#000';
        this.cx.beginPath();
        this.cx.arc(headSize * 0.5, headSize * 0.1, 3, 0, Math.PI * 2);
        this.cx.fill();

        // 4. Scarf / Collar (Neon Blue)
        this.cx.strokeStyle = '#00ffff';
        this.cx.lineWidth = 2;
        this.cx.shadowColor = '#00ffff';
        this.cx.beginPath();
        this.cx.moveTo(-headSize * 0.3, headSize * 0.5);
        this.cx.quadraticCurveTo(0, headSize * 0.7, headSize * 0.2, headSize * 0.55);
        this.cx.stroke();

        this.cx.restore();
    }

    flipHorizontally(context, around) {
        context.translate(around, 0);
        context.scale(-1, 1);
        context.translate(-around, 0);
    }

    drawActors() {
        this.level.actors.forEach(actor => {
            let width = actor.size.x * this.scale;
            let height = actor.size.y * this.scale;
            let x = (actor.pos.x - this.viewport.left) * this.scale;
            let y = (actor.pos.y - this.viewport.top) * this.scale;

            if (actor.type === "player") {
                this.drawPlayer(x, y, width, height);
                // Shield bubble
                if (this.level.player.shieldTimer > 0) {
                    this.drawShieldBubble(x, y, width, height);
                }
                // Speed boost aura
                if (this.level.player.speedBoostTimer > 0) {
                    this.drawSpeedAura(x, y, width, height);
                }
            } else if (actor.type === "spring") {
                this.drawSpring(x, y, width, height, actor.compressed);
            } else if (actor.type === "bone") {
                this.drawBone(x, y, width, height);
            } else if (actor.type === "spike") {
                this.drawSpike(x, y, width, height);
            } else if (actor.type === "patrol") {
                this.drawPatrol(x, y, width, height, actor);
            } else if (actor.type === "speedboost") {
                this.drawSpeedBoostPickup(x, y, width, height, actor);
            } else if (actor.type === "shield") {
                this.drawShieldPickup(x, y, width, height, actor);
            } else if (actor.type === "breakablewall") {
                this.drawBreakableWall(x, y, width, height);
            }
        });
    }

    drawSpike(x, y, width, height) {
        this.cx.save();
        this.cx.fillStyle = '#ff0044';
        this.cx.shadowBlur = 15;
        this.cx.shadowColor = '#ff0044';

        const pulse = 0.9 + Math.sin(this.animationTime * 6) * 0.1;
        const cx = x + width / 2;
        const cy = y + height;

        // Three triangular spikes
        for (let i = 0; i < 3; i++) {
            const sx = x + (width * i / 3) + width / 6;
            this.cx.beginPath();
            this.cx.moveTo(sx - width * 0.12 * pulse, cy);
            this.cx.lineTo(sx, cy - height * 0.9 * pulse);
            this.cx.lineTo(sx + width * 0.12 * pulse, cy);
            this.cx.closePath();
            this.cx.fill();
        }
        this.cx.restore();
    }

    drawPatrol(x, y, width, height, actor) {
        this.cx.save();
        const bob = Math.sin(actor.wobble) * 3;
        const facingRight = actor.speed.x > 0;

        // Body (neon robot)
        this.cx.fillStyle = '#ff0066';
        this.cx.shadowBlur = 15;
        this.cx.shadowColor = '#ff0066';

        // Torso
        const r = 4;
        this.cx.beginPath();
        this.cx.moveTo(x + r, y + height * 0.3 + bob);
        this.cx.lineTo(x + width - r, y + height * 0.3 + bob);
        this.cx.arcTo(x + width, y + height * 0.3 + bob, x + width, y + height * 0.3 + r + bob, r);
        this.cx.lineTo(x + width, y + height - r + bob);
        this.cx.arcTo(x + width, y + height + bob, x + width - r, y + height + bob, r);
        this.cx.lineTo(x + r, y + height + bob);
        this.cx.arcTo(x, y + height + bob, x, y + height - r + bob, r);
        this.cx.lineTo(x, y + height * 0.3 + r + bob);
        this.cx.arcTo(x, y + height * 0.3 + bob, x + r, y + height * 0.3 + bob, r);
        this.cx.closePath();
        this.cx.fill();

        // Eye (single visor)
        this.cx.fillStyle = '#00ffff';
        this.cx.shadowColor = '#00ffff';
        this.cx.shadowBlur = 10;
        const eyeX = facingRight ? x + width * 0.55 : x + width * 0.2;
        this.cx.fillRect(eyeX, y + height * 0.4 + bob, width * 0.25, height * 0.12);

        // Antenna
        this.cx.strokeStyle = '#ff0066';
        this.cx.lineWidth = 2;
        this.cx.beginPath();
        this.cx.moveTo(x + width / 2, y + height * 0.3 + bob);
        this.cx.lineTo(x + width / 2, y + height * 0.1 + bob);
        this.cx.stroke();

        // Antenna tip
        this.cx.fillStyle = '#ffff00';
        this.cx.shadowColor = '#ffff00';
        this.cx.beginPath();
        this.cx.arc(x + width / 2, y + height * 0.1 + bob, 3, 0, Math.PI * 2);
        this.cx.fill();

        this.cx.restore();
    }

    drawSpeedBoostPickup(x, y, width, height, actor) {
        this.cx.save();
        const floatY = Math.sin(actor.wobble) * 4;
        const pulse = 0.85 + Math.sin(actor.wobble * 1.5) * 0.15;

        this.cx.translate(x + width / 2, y + height / 2 + floatY);
        this.cx.scale(pulse, pulse);

        // Lightning bolt
        this.cx.fillStyle = '#00aaff';
        this.cx.shadowBlur = 20;
        this.cx.shadowColor = '#00aaff';

        const s = width * 0.5;
        this.cx.beginPath();
        this.cx.moveTo(-s * 0.2, -s);
        this.cx.lineTo(s * 0.3, -s);
        this.cx.lineTo(-s * 0.1, 0);
        this.cx.lineTo(s * 0.2, 0);
        this.cx.lineTo(-s * 0.3, s * 1.2);
        this.cx.lineTo(0, s * 0.1);
        this.cx.lineTo(-s * 0.4, s * 0.1);
        this.cx.closePath();
        this.cx.fill();

        this.cx.restore();
    }

    drawShieldPickup(x, y, width, height, actor) {
        this.cx.save();
        const floatY = Math.sin(actor.wobble) * 4;
        const pulse = 0.85 + Math.sin(actor.wobble * 1.3) * 0.15;

        this.cx.translate(x + width / 2, y + height / 2 + floatY);
        this.cx.scale(pulse, pulse);

        // Shield shape
        this.cx.fillStyle = 'rgba(0, 255, 255, 0.4)';
        this.cx.strokeStyle = '#00ffff';
        this.cx.lineWidth = 2;
        this.cx.shadowBlur = 15;
        this.cx.shadowColor = '#00ffff';

        const s = width * 0.5;
        this.cx.beginPath();
        this.cx.moveTo(0, -s);
        this.cx.quadraticCurveTo(s, -s * 0.5, s, 0);
        this.cx.quadraticCurveTo(s, s * 0.8, 0, s * 1.2);
        this.cx.quadraticCurveTo(-s, s * 0.8, -s, 0);
        this.cx.quadraticCurveTo(-s, -s * 0.5, 0, -s);
        this.cx.closePath();
        this.cx.fill();
        this.cx.stroke();

        // Star in center
        this.cx.fillStyle = '#fff';
        this.cx.beginPath();
        this.cx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
        this.cx.fill();

        this.cx.restore();
    }

    drawBreakableWall(x, y, width, height) {
        this.cx.save();

        // Cracked wall with orange tint
        this.cx.fillStyle = '#553300';
        this.cx.shadowBlur = 8;
        this.cx.shadowColor = '#ff8800';
        this.cx.fillRect(x, y, width, height);

        // Crack pattern
        this.cx.strokeStyle = '#ff8800';
        this.cx.lineWidth = 1.5;
        this.cx.shadowBlur = 5;

        this.cx.beginPath();
        this.cx.moveTo(x + width * 0.3, y);
        this.cx.lineTo(x + width * 0.5, y + height * 0.4);
        this.cx.lineTo(x + width * 0.7, y + height * 0.2);
        this.cx.moveTo(x + width * 0.5, y + height * 0.4);
        this.cx.lineTo(x + width * 0.4, y + height * 0.7);
        this.cx.lineTo(x + width * 0.6, y + height);
        this.cx.moveTo(x + width * 0.4, y + height * 0.7);
        this.cx.lineTo(x + width * 0.2, y + height * 0.9);
        this.cx.stroke();

        // Glow border
        this.cx.strokeStyle = 'rgba(255, 136, 0, 0.5)';
        this.cx.lineWidth = 2;
        this.cx.strokeRect(x + 1, y + 1, width - 2, height - 2);

        this.cx.restore();
    }

    drawShieldBubble(x, y, width, height) {
        this.cx.save();
        const pulse = 0.95 + Math.sin(this.animationTime * 8) * 0.05;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const r = Math.max(width, height) * 0.7 * pulse;

        this.cx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        this.cx.lineWidth = 2;
        this.cx.shadowBlur = 20;
        this.cx.shadowColor = '#00ffff';

        this.cx.beginPath();
        this.cx.arc(cx, cy, r, 0, Math.PI * 2);
        this.cx.stroke();

        // Inner glow ring
        this.cx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        this.cx.beginPath();
        this.cx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
        this.cx.stroke();

        this.cx.restore();
    }

    drawSpeedAura(x, y, width, height) {
        this.cx.save();
        const cx = x + width / 2;
        const cy = y + height / 2;

        // Speed lines behind player
        this.cx.strokeStyle = 'rgba(0, 170, 255, 0.4)';
        this.cx.lineWidth = 2;
        this.cx.shadowBlur = 8;
        this.cx.shadowColor = '#00aaff';

        for (let i = 0; i < 4; i++) {
            const ly = cy - height * 0.3 + i * height * 0.2;
            const offset = (this.animationTime * 200 + i * 50) % 30;
            this.cx.beginPath();
            this.cx.moveTo(x - 5 - offset, ly);
            this.cx.lineTo(x - 15 - offset, ly);
            this.cx.stroke();
        }
        this.cx.restore();
    }

    drawBone(x, y, width, height) {
        this.cx.save();

        // Float & spin animation
        const floatY = Math.sin(this.animationTime * 4) * 5;
        const pulse = 0.8 + Math.sin(this.animationTime * 6) * 0.2; // size pulse
        const glowPulse = 15 + Math.sin(this.animationTime * 8) * 10; // glow pulse

        this.cx.translate(x + width / 2, y + height / 2 + floatY);
        this.cx.rotate(this.animationTime);
        this.cx.scale(pulse, pulse);

        // Outer glow ring
        this.cx.strokeStyle = "rgba(255, 215, 0, 0.3)";
        this.cx.lineWidth = 2;
        this.cx.shadowBlur = glowPulse;
        this.cx.shadowColor = "#ffd700";
        this.cx.beginPath();
        this.cx.arc(0, 0, width * 0.5, 0, Math.PI * 2);
        this.cx.stroke();

        // Diamond shape
        this.cx.fillStyle = "#ffd700";
        this.cx.shadowBlur = 20;
        const size = width * 0.6;
        this.cx.beginPath();
        this.cx.moveTo(0, -size);
        this.cx.lineTo(size, 0);
        this.cx.lineTo(0, size);
        this.cx.lineTo(-size, 0);
        this.cx.closePath();
        this.cx.fill();

        // Inner sparkle
        this.cx.fillStyle = "#fff";
        this.cx.shadowBlur = 10;
        this.cx.shadowColor = "#fff";
        this.cx.beginPath();
        this.cx.arc(0, 0, size / 3, 0, Math.PI * 2);
        this.cx.fill();

        this.cx.restore();
    }

    drawSpring(x, y, width, height, compressed) {
        this.cx.save();

        const springHeight = compressed ? height * 0.5 : height;
        const springY = y + (height - springHeight);
        const glow = compressed ? 25 : 10;

        // Base platform with rounded top
        this.cx.shadowBlur = glow;
        this.cx.shadowColor = '#00ff00';

        this.cx.fillStyle = '#003300';
        const baseY = springY + springHeight * 0.65;
        const baseH = springHeight * 0.35;
        const r = 3;
        this.cx.beginPath();
        this.cx.moveTo(x + r, baseY);
        this.cx.lineTo(x + width - r, baseY);
        this.cx.arcTo(x + width, baseY, x + width, baseY + r, r);
        this.cx.lineTo(x + width, baseY + baseH);
        this.cx.lineTo(x, baseY + baseH);
        this.cx.lineTo(x, baseY + r);
        this.cx.arcTo(x, baseY, x + r, baseY, r);
        this.cx.closePath();
        this.cx.fill();

        // Glowing top surface line
        this.cx.strokeStyle = '#00ff00';
        this.cx.lineWidth = 3;
        this.cx.lineCap = 'round';
        this.cx.beginPath();
        this.cx.moveTo(x + 2, baseY);
        this.cx.lineTo(x + width - 2, baseY);
        this.cx.stroke();

        // Animated chevrons
        this.cx.lineWidth = 2;
        this.cx.globalAlpha = 0.8;
        const offset = (this.animationTime * 20) % 10;

        this.cx.beginPath();
        for (let i = 0; i < 3; i++) {
            const cy = baseY - i * 7 - offset;
            if (cy < springY) continue;
            this.cx.moveTo(x + 5, cy);
            this.cx.lineTo(x + width / 2, cy - 4);
            this.cx.lineTo(x + width - 5, cy);
        }
        this.cx.stroke();

        this.cx.restore();
    }
}

