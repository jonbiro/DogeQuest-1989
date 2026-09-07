export class AudioSystem {
    constructor() {
        this.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = null;
        this.available = Boolean(this.AudioContext);
        this.enabled = this.available;
        this.musicPlaying = false;
        this.musicNodes = [];
        this.musicTimer = null;
        this.effectNodes = new Set();
        this.effectTimers = new Set();
        this.musicVolume = 0.04;
        this.themeIndex = 0;
    }

    initialize() {
        if (!this.ctx && this.AudioContext) {
            try {
                this.ctx = new this.AudioContext();
            } catch {
                this.available = false;
                this.enabled = false;
            }
        }
        return this.ctx;
    }

    setEnabled(enabled) {
        this.enabled = this.available && enabled;
        if (!this.enabled) this.stopAll();
    }

    setTheme(index) {
        this.themeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
    }

    resume() {
        const context = this.initialize();
        if (context && context.state === 'suspended') return context.resume().catch(() => undefined);
        return Promise.resolve();
    }

    playTone(freq, type, duration, vol = 0.1) {
        const context = this.initialize();
        if (!this.enabled || !context) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);

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
        this.effectNodes.add(osc);
        this.effectNodes.add(gain);
        osc.addEventListener('ended', () => {
            try {
                osc.disconnect();
                gain.disconnect();
            } catch {
                // Cleanup may already have disconnected these nodes.
            }
            this.effectNodes.delete(osc);
            this.effectNodes.delete(gain);
        }, { once: true });
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    scheduleTone(callback, delay) {
        const timer = window.setTimeout(() => {
            this.effectTimers.delete(timer);
            if (this.enabled) callback();
        }, delay);
        this.effectTimers.add(timer);
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
        this.scheduleTone(() => this.playTone(1800, 'sine', 0.2, 0.1), 80);
    }

    die() {
        this.playTone(200, 'sawtooth', 0.5, 0.2);
        this.scheduleTone(() => this.playTone(150, 'sawtooth', 0.5, 0.2), 200);
        this.scheduleTone(() => this.playTone(100, 'sawtooth', 1.0, 0.2), 400);
    }

    win() {
        [440, 554, 659, 880].forEach((freq, i) => {
            this.scheduleTone(() => this.playTone(freq, 'square', 0.2, 0.1), i * 150);
        });
    }

    // New sound effects
    wallSlide() {
        this.playTone(80, 'sawtooth', 0.1, 0.03);
    }

    wallJump() {
        this.playTone(400, 'slide', 0.12, 0.1);
        this.scheduleTone(() => this.playTone(600, 'sine', 0.1, 0.08), 50);
    }

    spring() {
        this.playTone(200, 'slide', 0.2, 0.12);
        this.scheduleTone(() => this.playTone(800, 'sine', 0.15, 0.1), 100);
    }

    combo3() {
        this.playTone(800, 'sine', 0.1, 0.08);
        this.scheduleTone(() => this.playTone(1000, 'sine', 0.1, 0.08), 60);
    }

    combo5() {
        [800, 1000, 1200].forEach((freq, i) => {
            this.scheduleTone(() => this.playTone(freq, 'sine', 0.1, 0.1), i * 50);
        });
    }

    combo10() {
        [600, 800, 1000, 1200, 1600].forEach((freq, i) => {
            this.scheduleTone(() => this.playTone(freq, 'square', 0.15, 0.1), i * 60);
        });
    }

    powerUp() {
        [600, 900, 1200, 1600].forEach((freq, i) => {
            this.scheduleTone(() => this.playTone(freq, 'sine', 0.15, 0.12), i * 70);
        });
    }

    shieldHit() {
        this.playTone(300, 'sawtooth', 0.15, 0.15);
        this.scheduleTone(() => this.playTone(150, 'square', 0.3, 0.1), 100);
    }

    breakWall() {
        this.playTone(100, 'sawtooth', 0.2, 0.15);
        this.scheduleTone(() => this.playTone(60, 'square', 0.3, 0.1), 80);
        this.scheduleTone(() => this.playTone(40, 'sawtooth', 0.4, 0.08), 160);
    }

    stomp() {
        this.playTone(150, 'square', 0.1, 0.1);
        this.scheduleTone(() => this.playTone(400, 'sine', 0.2, 0.1), 50);
    }

    bump() {
        this.playTone(150, 'square', 0.1, 0.05);
    }

    startMusic() {
        const context = this.initialize();
        if (this.musicPlaying || !this.enabled || !context) return;
        this.musicPlaying = true;

        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);

        // Create a master gain for music
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        masterGain.connect(this.ctx.destination);
        this.musicNodes.push(masterGain);

        // Synthwave bass loop
        const bassPatterns = [
            [65.41, 82.41, 73.42, 87.31],
            [73.42, 92.50, 82.41, 98.00],
            [55.00, 73.42, 65.41, 82.41],
            [61.74, 77.78, 69.30, 92.50]
        ];
        const bassNotes = bassPatterns[this.themeIndex % bassPatterns.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
        bassOsc.connect(bassGain);
        bassGain.connect(masterGain);

        // Schedule repeating bass pattern
        const bpm = 106 + (this.themeIndex % 5) * 4;
        const beatDur = 60 / bpm;
        bassOsc.start();
        this.musicNodes.push(bassOsc, bassGain);

        // Pad/chord layer
        const padNotes = [
            [130.81, 164.81, 196.00], // C3 E3 G3
            [146.83, 185.00, 220.00], // D3 F#3 A3
            [130.81, 164.81, 196.00],
            [174.61, 220.00, 261.63], // F3 A3 C4
        ];
        const padOscillators = [];

        padNotes[0].forEach((_, voiceIdx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            osc.connect(gain);
            gain.connect(masterGain);

            osc.start();
            padOscillators.push(osc);
            this.musicNodes.push(osc, gain);
        });

        let step = 0;
        const updatePattern = () => {
            if (!this.musicPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;
            bassOsc.frequency.setTargetAtTime(bassNotes[step % bassNotes.length], now, 0.01);

            if (step % 4 === 0) {
                const chord = padNotes[Math.floor(step / 4) % padNotes.length];
                padOscillators.forEach((oscillator, voiceIndex) => {
                    oscillator.frequency.setTargetAtTime(chord[voiceIndex], now, 0.05);
                });
            }
            step++;
        };

        updatePattern();
        this.musicTimer = window.setInterval(updatePattern, beatDur * 1000);
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimer !== null) {
            window.clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
        this.musicNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                node.disconnect();
            } catch (e) { /* ignore */ }
        });
        this.musicNodes = [];
    }

    stopEffects() {
        this.effectTimers.forEach(timer => window.clearTimeout(timer));
        this.effectTimers.clear();
        this.effectNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                node.disconnect();
            } catch {
                // Nodes may already have stopped between scheduling and cleanup.
            }
        });
        this.effectNodes.clear();
    }

    stopAll() {
        this.stopMusic();
        this.stopEffects();
    }
}
