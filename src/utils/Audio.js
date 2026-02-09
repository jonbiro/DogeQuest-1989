export class AudioSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Handle custom types first
        if (type === 'slide') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 2, this.ctx.currentTime + duration);
        } else if (type === 'slideDown') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq / 2, this.ctx.currentTime + duration);
        } else {
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        }

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    jump() {
        this.playTone(300, 'slide', 0.15, 0.1);
    }

    doubleJump() {
        this.playTone(500, 'slide', 0.15, 0.1);
    }

    land() {
        this.playTone(100, 'slideDown', 0.1, 0.1);
    }

    dash() {
        this.playTone(200, 'sawtooth', 0.2, 0.05);
    }

    collect() {
        this.playTone(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1800, 'sine', 0.2, 0.1), 80);
    }

    die() {
        this.playTone(200, 'sawtooth', 0.5, 0.2);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.5, 0.2), 200);
        setTimeout(() => this.playTone(100, 'sawtooth', 1.0, 0.2), 400);
    }

    win() {
        [440, 554, 659, 880].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'square', 0.2, 0.1), i * 150);
        });
    }

    // New sound effects
    wallSlide() {
        this.playTone(80, 'sawtooth', 0.1, 0.03);
    }

    wallJump() {
        this.playTone(400, 'slide', 0.12, 0.1);
        setTimeout(() => this.playTone(600, 'sine', 0.1, 0.08), 50);
    }

    spring() {
        this.playTone(200, 'slide', 0.2, 0.12);
        setTimeout(() => this.playTone(800, 'sine', 0.15, 0.1), 100);
    }

    combo3() {
        this.playTone(800, 'sine', 0.1, 0.08);
        setTimeout(() => this.playTone(1000, 'sine', 0.1, 0.08), 60);
    }

    combo5() {
        [800, 1000, 1200].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.1, 0.1), i * 50);
        });
    }

    combo10() {
        [600, 800, 1000, 1200, 1600].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'square', 0.15, 0.1), i * 60);
        });
    }
}

