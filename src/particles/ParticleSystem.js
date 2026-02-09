import { Vector } from '../utils/Vector.js';

class Particle {
    constructor(pos, speed, color, lifetime, size = 3) {
        this.pos = pos;
        this.speed = speed;
        this.color = color;
        this.lifetime = lifetime;
        this.timeLeft = lifetime;
        this.size = size;
        this.initialSize = size;
    }

    update(step) {
        this.timeLeft -= step;
        this.pos = this.pos.plus(this.speed.times(step));
        // Gravity effect
        this.speed.y += step * 10;
        // Size shrinks over time
        this.size = this.initialSize * (this.timeLeft / this.lifetime);
    }

    get opacity() {
        return this.timeLeft / this.lifetime;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(pos, options = {}) {
        const count = options.count || 5;
        const speed = options.speed || 5;
        const color = options.color || "#fff";
        const lifetime = options.lifetime || 0.5;
        const spread = options.spread !== undefined ? options.spread : Math.PI * 2;
        const angleOffset = options.angleOffset || 0;
        const sizeMin = options.sizeMin || 2;
        const sizeMax = options.sizeMax || 5;

        for (let i = 0; i < count; i++) {
            const angle = angleOffset + (Math.random() - 0.5) * spread;
            const magnitude = Math.random() * speed;
            const speedVec = new Vector(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
            const size = sizeMin + Math.random() * (sizeMax - sizeMin);

            this.particles.push(new Particle(pos, speedVec, color, lifetime, size));
        }
    }

    update(step) {
        this.particles.forEach(p => p.update(step));
        this.particles = this.particles.filter(p => p.timeLeft > 0);
    }
}
