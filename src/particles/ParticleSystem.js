import { Vector } from '../utils/Vector.js';

class Particle {
    constructor(pos, speed, color, lifetime, size = 3, options = {}) {
        this.pos = pos;
        this.speed = speed;
        this.color = color;
        this.lifetime = lifetime;
        this.timeLeft = lifetime;
        this.size = size;
        this.initialSize = size;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 1;
        this.shrink = options.shrink !== undefined ? options.shrink : true;
        this.composite = options.composite || 'source-over';
    }

    update(step) {
        this.timeLeft -= step;
        this.pos = this.pos.plus(this.speed.times(step));

        // Physics
        this.speed.y += step * this.gravity;
        this.speed = this.speed.times(this.friction);

        // Size logic
        if (this.shrink) {
            this.size = this.initialSize * (this.timeLeft / this.lifetime);
        }
    }

    get opacity() {
        return Math.max(0, this.timeLeft / this.lifetime);
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

        // New options
        const gravity = options.gravity || 0;
        const friction = options.friction || 1;
        const shrink = options.shrink !== undefined ? options.shrink : true;
        const composite = options.composite || 'source-over';

        for (let i = 0; i < count; i++) {
            const angle = angleOffset + (Math.random() - 0.5) * spread;
            const magnitude = Math.random() * speed;
            const speedVec = new Vector(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
            const size = sizeMin + Math.random() * (sizeMax - sizeMin);

            this.particles.push(new Particle(pos, speedVec, color, lifetime, size, {
                gravity,
                friction,
                shrink,
                composite
            }));
        }
    }

    update(step) {
        this.particles.forEach(p => p.update(step));
        this.particles = this.particles.filter(p => p.timeLeft > 0);
    }
}
