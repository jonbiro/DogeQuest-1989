export class AudioSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.musicPlaying = false;
        this.musicNodes = [];
        this.musicVolume = 0.04;
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

    powerUp() {
        [600, 900, 1200, 1600].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.15, 0.12), i * 70);
        });
    }

    shieldHit() {
        this.playTone(300, 'sawtooth', 0.15, 0.15);
        setTimeout(() => this.playTone(150, 'square', 0.3, 0.1), 100);
    }

    breakWall() {
        this.playTone(100, 'sawtooth', 0.2, 0.15);
        setTimeout(() => this.playTone(60, 'square', 0.3, 0.1), 80);
        setTimeout(() => this.playTone(40, 'sawtooth', 0.4, 0.08), 160);
    }

    stomp() {
        this.playTone(150, 'square', 0.1, 0.1);
        setTimeout(() => this.playTone(400, 'sine', 0.2, 0.1), 50);
    }

    bump() {
        this.playTone(150, 'square', 0.1, 0.05);
    }

    startMusic() {
        if (this.musicPlaying || !this.enabled) return;
        this.musicPlaying = true;

        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Create a master gain for music
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        masterGain.connect(this.ctx.destination);
        this.musicNodes.push(masterGain);

        // Synthwave bass loop
        const bassNotes = [65.41, 82.41, 73.42, 87.31]; // C2, E2, D2, F2
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
        bassOsc.connect(bassGain);
        bassGain.connect(masterGain);

        // Schedule repeating bass pattern
        const bpm = 110;
        const beatDur = 60 / bpm;
        const patternLen = bassNotes.length * beatDur;
        const totalDuration = 600; // 10 minutes of music

        for (let t = 0; t < totalDuration; t += patternLen) {
            bassNotes.forEach((note, i) => {
                const time = this.ctx.currentTime + t + i * beatDur;
                bassOsc.frequency.setValueAtTime(note, time);
            });
        }

        bassOsc.start();
        bassOsc.stop(this.ctx.currentTime + totalDuration);
        this.musicNodes.push(bassOsc, bassGain);

        // Pad/chord layer
        const padNotes = [
            [130.81, 164.81, 196.00], // C3 E3 G3
            [146.83, 185.00, 220.00], // D3 F#3 A3
            [130.81, 164.81, 196.00],
            [174.61, 220.00, 261.63], // F3 A3 C4
        ];
        const chordDur = beatDur * 4;

        padNotes[0].forEach((_, voiceIdx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            osc.connect(gain);
            gain.connect(masterGain);

            for (let t = 0; t < totalDuration; t += chordDur * padNotes.length) {
                padNotes.forEach((chord, ci) => {
                    const time = this.ctx.currentTime + t + ci * chordDur;
                    osc.frequency.setValueAtTime(chord[voiceIdx], time);
                });
            }

            osc.start();
            osc.stop(this.ctx.currentTime + totalDuration);
            this.musicNodes.push(osc, gain);
        });
    }

    stopMusic() {
        this.musicPlaying = false;
        this.musicNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                node.disconnect();
            } catch (e) { /* ignore */ }
        });
        this.musicNodes = [];
    }
}
