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
        this.pos.x += this.speed.x * step;
        this.pos.y += this.speed.y * step;

        // Physics
        this.speed.y += step * this.gravity;
        this.speed.x *= this.friction;
        this.speed.y *= this.friction;

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
        this.maxParticles = 1200;
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

        const available = Math.max(0, this.maxParticles - this.particles.length);
        const emitCount = Math.min(count, available);
        for (let i = 0; i < emitCount; i++) {
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
        let writeIndex = 0;
        for (const particle of this.particles) {
            particle.update(step);
            if (particle.timeLeft > 0) this.particles[writeIndex++] = particle;
        }
        this.particles.length = writeIndex;
    }

    clear() {
        this.particles = [];
    }
}
