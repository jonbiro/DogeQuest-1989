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
        this.playerSprites = document.createElement("img");
        this.playerSprites.src = "img/player.png"; // Use original sprite

        // Get game container for effects
        this.gameContainer = document.querySelector('.game-container');

        this.updateHUD();
        this.drawFrame(0);
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
        // Gradient Background
        const grad = this.cx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, "#0a0015");
        grad.addColorStop(0.5, "#150030");
        grad.addColorStop(1, "#1a1055");
        this.cx.fillStyle = grad;
        this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw nebula clouds (far layer - slowest parallax)
        this.cx.save();
        this.nebulaClouds.forEach(cloud => {
            cloud.x += cloud.drift;
            if (cloud.x > 1.2) cloud.x = -0.2;
            const parallaxX = cloud.x * this.canvas.width - this.viewport.left * 2;
            const parallaxY = cloud.y * this.canvas.height;

            const gradient = this.cx.createRadialGradient(parallaxX, parallaxY, 0, parallaxX, parallaxY, cloud.size);
            gradient.addColorStop(0, cloud.color);
            gradient.addColorStop(1, 'transparent');
            this.cx.fillStyle = gradient;
            this.cx.fillRect(parallaxX - cloud.size, parallaxY - cloud.size, cloud.size * 2, cloud.size * 2);
        });
        this.cx.restore();

        // Draw far starfield (slower parallax)
        this.cx.save();
        this.farStars.forEach(star => {
            star.twinkle += 0.03 * star.speed;
            const opacity = 0.3 + Math.sin(star.twinkle) * 0.3;
            const x = (star.x * this.canvas.width - this.viewport.left * 5) % this.canvas.width;
            const y = (star.y * this.canvas.height - this.viewport.top * 3) % this.canvas.height;

            this.cx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.cx.beginPath();
            this.cx.arc(x < 0 ? x + this.canvas.width : x, y < 0 ? y + this.canvas.height : y, star.size * 0.7, 0, Math.PI * 2);
            this.cx.fill();
        });
        this.cx.restore();

        // Draw near starfield (faster parallax)
        this.cx.save();
        this.stars.forEach(star => {
            star.twinkle += 0.05 * star.speed;
            const opacity = 0.5 + Math.sin(star.twinkle) * 0.5;
            const x = (star.x * this.canvas.width - this.viewport.left * 10) % this.canvas.width;
            const y = (star.y * this.canvas.height - this.viewport.top * 8) % this.canvas.height;

            this.cx.fillStyle = star.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba').replace('#ffffff', `rgba(255,255,255,${opacity})`).replace('#ff00ff', `rgba(255,0,255,${opacity})`).replace('#00ffff', `rgba(0,255,255,${opacity})`);
            if (star.color.startsWith('#')) {
                this.cx.fillStyle = star.color;
                this.cx.globalAlpha = opacity;
            }
            this.cx.shadowBlur = 5;
            this.cx.shadowColor = star.color;
            this.cx.beginPath();
            this.cx.arc(x < 0 ? x + this.canvas.width : x, y < 0 ? y + this.canvas.height : y, star.size, 0, Math.PI * 2);
            this.cx.fill();
        });
        this.cx.globalAlpha = 1;
        this.cx.restore();
    }

    drawPlayerTrail() {
        const player = this.level.player;
        if (!player.trailPositions || player.trailPositions.length === 0) return;

        this.cx.save();
        player.trailPositions.forEach((trail, i) => {
            const opacity = (trail.time / 0.2) * 0.3;
            const x = (trail.x - this.viewport.left) * this.scale;
            const y = (trail.y - this.viewport.top) * this.scale;
            const width = player.size.x * this.scale;
            const height = player.size.y * this.scale;

            this.cx.globalAlpha = opacity;
            this.cx.fillStyle = player.isDashing ? '#00ffff' : '#ff00ff';
            this.cx.shadowBlur = 10;
            this.cx.shadowColor = player.isDashing ? '#00ffff' : '#ff00ff';
            this.cx.fillRect(x, y, width, height);
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
                let tile = this.level.grid[y][x];
                if (tile == null) continue;
                let screenX = (x - view.left) * this.scale;
                let screenY = (y - view.top) * this.scale;

                if (tile === "lava") {
                    // Animated lava with glow
                    this.drawAnimatedLava(screenX, screenY, x, y);
                } else {
                    let tileX = 0;
                    this.cx.drawImage(this.otherSprites, tileX, 0, this.scale, this.scale, screenX, screenY, this.scale, this.scale);
                }
            }
        }
    }

    drawAnimatedLava(screenX, screenY, tileX, tileY) {
        // Base lava from sprite
        this.cx.drawImage(this.otherSprites, this.scale, 0, this.scale, this.scale, screenX, screenY, this.scale, this.scale);

        // Animated glow overlay
        const glowIntensity = 0.3 + Math.sin(this.lavaTime * 3 + tileX * 0.5 + tileY * 0.3) * 0.2;
        this.cx.save();
        this.cx.globalAlpha = glowIntensity;
        this.cx.fillStyle = '#ff4400';
        this.cx.shadowBlur = 15;
        this.cx.shadowColor = '#ff4400';
        this.cx.fillRect(screenX, screenY, this.scale, this.scale);
        this.cx.restore();

        // Bubbling effect
        const bubblePhase = (this.lavaTime * 2 + tileX + tileY) % 1;
        if (bubblePhase < 0.3) {
            this.cx.save();
            this.cx.fillStyle = '#ffaa00';
            this.cx.globalAlpha = (0.3 - bubblePhase) * 2;
            const bubbleX = screenX + (Math.sin(tileX * 3) * 0.5 + 0.5) * this.scale;
            const bubbleY = screenY + bubblePhase * this.scale * 0.5;
            this.cx.beginPath();
            this.cx.arc(bubbleX, bubbleY, 3, 0, Math.PI * 2);
            this.cx.fill();
            this.cx.restore();
        }
    }

    drawPlayer(x, y, width, height) {
        const player = this.level.player;

        // Scale for visibility
        const scale = 1.3;
        width *= scale;
        height *= scale;
        x -= (width * (scale - 1)) / 2;
        y -= height * (scale - 1);

        if (player.speed.x !== 0)
            this.flipPlayer = player.speed.x < 0;

        this.cx.save();
        if (this.flipPlayer) {
            this.flipHorizontally(this.cx, x + width / 2);
        }

        // Glow effects
        if (player.isDashing) {
            this.cx.shadowBlur = 25;
            this.cx.shadowColor = '#00ffff';
        } else if (player.isWallSliding) {
            this.cx.shadowBlur = 15;
            this.cx.shadowColor = '#ff00ff';
        }

        // Animation bounce
        const bounce = player.speed.x !== 0 ? Math.sin(this.animationTime * 15) * 2 : 0;
        const squash = player.speed.y < 0 ? 0.9 : (player.speed.y > 5 ? 1.1 : 1);

        // Draw cute shiba inu dog
        const cx = x + width / 2;
        const cy = y + height / 2 + bounce;

        // Body (golden orange)
        this.cx.fillStyle = '#f5a623';
        this.cx.beginPath();
        this.cx.ellipse(cx, cy + height * 0.1, width * 0.35, height * 0.3 * squash, 0, 0, Math.PI * 2);
        this.cx.fill();

        // Head
        this.cx.beginPath();
        this.cx.ellipse(cx + width * 0.15, cy - height * 0.15, width * 0.28, height * 0.25, 0, 0, Math.PI * 2);
        this.cx.fill();

        // Ears (triangles)
        this.cx.beginPath();
        this.cx.moveTo(cx - width * 0.05, cy - height * 0.35);
        this.cx.lineTo(cx + width * 0.1, cy - height * 0.15);
        this.cx.lineTo(cx + width * 0.2, cy - height * 0.35);
        this.cx.fill();

        this.cx.beginPath();
        this.cx.moveTo(cx + width * 0.25, cy - height * 0.38);
        this.cx.lineTo(cx + width * 0.35, cy - height * 0.15);
        this.cx.lineTo(cx + width * 0.45, cy - height * 0.35);
        this.cx.fill();

        // Inner ears (cream)
        this.cx.fillStyle = '#ffd9a0';
        this.cx.beginPath();
        this.cx.moveTo(cx, cy - height * 0.3);
        this.cx.lineTo(cx + width * 0.08, cy - height * 0.18);
        this.cx.lineTo(cx + width * 0.15, cy - height * 0.3);
        this.cx.fill();

        // Face cream patch
        this.cx.beginPath();
        this.cx.ellipse(cx + width * 0.18, cy - height * 0.08, width * 0.15, height * 0.12, 0, 0, Math.PI * 2);
        this.cx.fill();

        // Eyes
        this.cx.fillStyle = '#000';
        this.cx.beginPath();
        this.cx.arc(cx + width * 0.08, cy - height * 0.18, width * 0.05, 0, Math.PI * 2);
        this.cx.arc(cx + width * 0.25, cy - height * 0.18, width * 0.05, 0, Math.PI * 2);
        this.cx.fill();

        // Eye shine
        this.cx.fillStyle = '#fff';
        this.cx.beginPath();
        this.cx.arc(cx + width * 0.06, cy - height * 0.2, width * 0.02, 0, Math.PI * 2);
        this.cx.arc(cx + width * 0.23, cy - height * 0.2, width * 0.02, 0, Math.PI * 2);
        this.cx.fill();

        // Nose
        this.cx.fillStyle = '#000';
        this.cx.beginPath();
        this.cx.ellipse(cx + width * 0.32, cy - height * 0.08, width * 0.04, height * 0.03, 0, 0, Math.PI * 2);
        this.cx.fill();

        // Tail (curled)
        this.cx.fillStyle = '#f5a623';
        this.cx.beginPath();
        const tailWag = Math.sin(this.animationTime * 10) * 0.1;
        this.cx.arc(cx - width * 0.35, cy + height * 0.05, width * 0.12, -0.5 + tailWag, Math.PI + 0.5 + tailWag, false);
        this.cx.lineWidth = width * 0.1;
        this.cx.strokeStyle = '#f5a623';
        this.cx.stroke();

        // Legs (animated when running)
        const legAnim = player.speed.x !== 0 ? Math.sin(this.animationTime * 20) * 0.15 : 0;
        this.cx.fillStyle = '#f5a623';

        // Front legs
        this.cx.fillRect(cx + width * 0.1, cy + height * 0.25, width * 0.1, height * 0.2 + legAnim * height);
        this.cx.fillRect(cx + width * 0.25, cy + height * 0.25, width * 0.1, height * 0.2 - legAnim * height);

        // Back legs
        this.cx.fillRect(cx - width * 0.25, cy + height * 0.2, width * 0.12, height * 0.25 - legAnim * height);
        this.cx.fillRect(cx - width * 0.1, cy + height * 0.2, width * 0.12, height * 0.25 + legAnim * height);

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
            } else if (actor.type === "spring") {
                this.drawSpring(x, y, width, height, actor.compressed);
            } else {
                let tileX = (actor.type === "bone" ? 2 : 1) * this.scale;

                // Add glow to bones
                if (actor.type === "bone") {
                    this.cx.save();
                    this.cx.shadowBlur = 10;
                    this.cx.shadowColor = '#ffd700';
                    this.cx.drawImage(this.otherSprites, tileX, 0, width, height, x, y, width, height);
                    this.cx.restore();
                } else {
                    this.cx.drawImage(this.otherSprites, tileX, 0, width, height, x, y, width, height);
                }
            }
        });
    }

    drawSpring(x, y, width, height, compressed) {
        // Draw spring as a green bouncy platform
        this.cx.save();
        this.cx.fillStyle = '#00ff00';
        this.cx.shadowBlur = 10;
        this.cx.shadowColor = '#00ff00';

        const springHeight = compressed ? height * 0.5 : height;
        const springY = y + (height - springHeight);

        // Spring base
        this.cx.fillRect(x, springY + springHeight * 0.7, width, springHeight * 0.3);

        // Spring coils
        this.cx.strokeStyle = '#00cc00';
        this.cx.lineWidth = 3;
        this.cx.beginPath();
        const coils = 3;
        for (let i = 0; i <= coils; i++) {
            const coilY = springY + (springHeight * 0.7 / coils) * i;
            this.cx.moveTo(x + 2, coilY);
            this.cx.lineTo(x + width - 2, coilY);
        }
        this.cx.stroke();

        // Top platform
        this.cx.fillStyle = '#44ff44';
        this.cx.fillRect(x - 2, springY, width + 4, 4);

        this.cx.restore();
    }
}

