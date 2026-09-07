export class LevelGenerator {
    constructor(difficulty = 1, random = Math.random) {
        const parsedDifficulty = Number.isFinite(difficulty) ? Math.floor(difficulty) : 1;
        this.difficulty = Math.max(1, Math.min(parsedDifficulty, 10));
        this.random = typeof random === 'function' ? random : Math.random;
        this.width = 50 + this.difficulty * 5; // Longer levels at higher difficulty
        this.height = 20;
    }

    nextRandom() {
        const value = Number(this.random());
        if (!Number.isFinite(value)) return 0.5;
        return Math.max(0, Math.min(value, 1 - Number.EPSILON));
    }

    generate() {
        // Create empty grid
        let grid = Array(this.height).fill(null).map(() => Array(this.width).fill(' '));

        // Floor
        for (let x = 0; x < this.width; x++) {
            grid[this.height - 1][x] = 'x';
            grid[this.height - 2][x] = 'x';
        }

        // Walls at ends
        for (let y = 0; y < this.height; y++) {
            grid[y][0] = 'x';
            grid[y][this.width - 1] = 'x';
        }

        // Player Start
        grid[this.height - 3][2] = '@';

        // Procedural Segments
        let currentX = 5;
        while (currentX < this.width - 8) {
            const unlockedSegmentTypes = Math.min(14, 6 + this.difficulty);
            const segmentType = Math.floor(this.nextRandom() * unlockedSegmentTypes);
            const features = this.createSegment(segmentType);

            // Apply features
            features.forEach(feat => {
                const targetX = currentX + feat.x;
                const targetY = this.height - 3 - feat.y;
                if (targetX >= 0 && targetX < this.width - 2 && targetY >= 0 && targetY < this.height) {
                    grid[targetY][targetX] = feat.ch;
                }
            });

            // Variable spacing based on difficulty
            const baseSpacing = 6 + Math.floor(this.nextRandom() * 4);
            const difficultyModifier = Math.max(0, 3 - Math.floor(this.difficulty / 3));
            const segmentWidth = features.reduce((max, feature) => Math.max(max, feature.x + 2), 1);
            currentX += Math.max(baseSpacing + difficultyModifier, segmentWidth);
        }

        // Add some bones along the path
        let boneCount = 3 + this.difficulty;
        for (let i = 0; i < boneCount; i++) {
            const x = 8 + Math.floor(this.nextRandom() * (this.width - 16));
            const y = this.height - 4 - Math.floor(this.nextRandom() * 5);
            if (grid[y][x] === ' ' && grid[y + 1][x] !== ' ') {
                grid[y][x] = 'o';
            }
        }

        // Every post-tutorial world has one high-value golden bone near the exit.
        if (this.difficulty >= 2) {
            for (let x = this.width - 5; x >= Math.max(8, this.width - 14); x--) {
                const y = this.height - 3;
                if (grid[y][x] === ' ' && grid[y + 1][x] === 'x') {
                    grid[y][x] = '$';
                    break;
                }
            }
        }

        // Add power-ups (rarer at low difficulty)
        if (this.difficulty >= 2 && this.nextRandom() < 0.6) {
            const px = 10 + Math.floor(this.nextRandom() * (this.width - 20));
            const py = this.height - 4 - Math.floor(this.nextRandom() * 3);
            if (grid[py][px] === ' ') {
                grid[py][px] = this.nextRandom() < 0.5 ? '+' : '*';
            }
        }

        // Add spikes at higher difficulties
        if (this.difficulty >= 3) {
            const spikeCount = Math.floor(this.difficulty / 3);
            for (let i = 0; i < spikeCount; i++) {
                const sx = 8 + Math.floor(this.nextRandom() * (this.width - 16));
                const sy = this.height - 3;
                if (grid[sy][sx] === ' ' && grid[sy + 1][sx] === 'x') {
                    grid[sy][sx] = 'S';
                }
            }
        }

        // Convert to string array
        return grid.map(row => row.join(''));
    }

    createSegment(type) {
        const features = [];

        // Type 0: Simple Platform with bone
        if (type === 0) {
            features.push({ x: 0, y: 2, ch: 'x' });
            features.push({ x: 1, y: 2, ch: 'x' });
            features.push({ x: 2, y: 2, ch: 'x' });
            features.push({ x: 1, y: 3, ch: 'o' });
        }
        // Type 1: High Platform (needs double jump)
        else if (type === 1) {
            features.push({ x: 0, y: 5, ch: 'x' });
            features.push({ x: 1, y: 5, ch: 'x' });
            features.push({ x: 2, y: 5, ch: 'x' });
            features.push({ x: 1, y: 6, ch: 'o' });
        }
        // Type 2: Lava Pit
        else if (type === 2) {
            for (let i = 0; i < 3; i++) {
                features.push({ x: i, y: -1, ch: '!' });
            }
            features.push({ x: 1, y: 3, ch: 'x' });
            features.push({ x: 1, y: 4, ch: 'o' });
        }
        // Type 3: Stairs
        else if (type === 3) {
            features.push({ x: 0, y: 1, ch: 'x' });
            features.push({ x: 1, y: 2, ch: 'x' });
            features.push({ x: 2, y: 3, ch: 'x' });
            features.push({ x: 3, y: 4, ch: 'x' });
            features.push({ x: 3, y: 5, ch: 'o' });
        }
        // Type 4: Spring Jump
        else if (type === 4) {
            features.push({ x: 0, y: 0, ch: '^' });
            features.push({ x: 3, y: 7, ch: 'x' });
            features.push({ x: 4, y: 7, ch: 'x' });
            features.push({ x: 3, y: 8, ch: 'o' });
        }
        // Type 5: Wall Jump Challenge
        else if (type === 5) {
            for (let i = 0; i < 6; i++) {
                features.push({ x: 0, y: i, ch: 'x' });
            }
            for (let i = 0; i < 6; i++) {
                features.push({ x: 3, y: i, ch: 'x' });
            }
            features.push({ x: 1, y: 6, ch: 'o' });
            features.push({ x: 2, y: 6, ch: 'o' });
        }
        // Type 6: Moving Lava
        else if (type === 6) {
            features.push({ x: 1, y: 2, ch: '=' });
            features.push({ x: 3, y: 4, ch: 'x' });
            features.push({ x: 4, y: 4, ch: 'x' });
            features.push({ x: 3, y: 5, ch: 'o' });
        }
        // Type 7: Dropper Lava
        else if (type === 7) {
            features.push({ x: 1, y: 8, ch: 'v' });
            features.push({ x: 3, y: 0, ch: 'x' });
            features.push({ x: 4, y: 0, ch: 'x' });
            features.push({ x: 3, y: 1, ch: 'o' });
        }
        // Type 8: Double Spring
        else if (type === 8) {
            features.push({ x: 0, y: 0, ch: '^' });
            features.push({ x: 4, y: 5, ch: '^' });
            features.push({ x: 7, y: 10, ch: 'x' });
            features.push({ x: 8, y: 10, ch: 'x' });
            features.push({ x: 7, y: 11, ch: 'o' });
            features.push({ x: 8, y: 11, ch: 'o' });
        }
        // Type 9: Tunnel
        else if (type === 9) {
            for (let i = 0; i < 5; i++) {
                features.push({ x: i, y: 0, ch: 'x' });
            }
            for (let i = 0; i < 5; i++) {
                features.push({ x: i, y: 3, ch: 'x' });
            }
            features.push({ x: 2, y: 1, ch: 'o' });
        }
        // Type 10: Spike Pit — spikes on floor with platform above
        else if (type === 10) {
            features.push({ x: 0, y: 0, ch: 'S' });
            features.push({ x: 1, y: 0, ch: 'S' });
            features.push({ x: 2, y: 0, ch: 'S' });
            features.push({ x: 1, y: 4, ch: 'x' });
            features.push({ x: 2, y: 4, ch: 'x' });
            features.push({ x: 1, y: 5, ch: 'o' });
        }
        // Type 11: Patrol Platform — enemy pacing on a platform
        else if (type === 11) {
            for (let i = 0; i < 5; i++) {
                features.push({ x: i, y: 2, ch: 'x' });
            }
            features.push({ x: 2, y: 3, ch: 'P' });
            features.push({ x: 2, y: 5, ch: 'o' });
        }
        // Type 12: Power-Up Platform
        else if (type === 12) {
            features.push({ x: 0, y: 3, ch: 'x' });
            features.push({ x: 1, y: 3, ch: 'x' });
            features.push({ x: 2, y: 3, ch: 'x' });
            features.push({ x: 1, y: 4, ch: this.nextRandom() < 0.5 ? '+' : '*' });
        }
        // Type 13: Breakable Wall Corridor — dash through to reach bone
        else if (type === 13) {
            for (let i = 0; i < 3; i++) {
                features.push({ x: 2, y: i, ch: 'B' });
            }
            features.push({ x: 4, y: 1, ch: 'o' });
            features.push({ x: 5, y: 1, ch: 'o' });
        }

        return features;
    }
}
