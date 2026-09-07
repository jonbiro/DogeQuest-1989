const LEVELS = [
    {
        name: 'Neon Kennel',
        tagline: 'Warm up the paws and chase the glow.',
        parTime: 55,
        palette: {
            skyTop: '#050015', skyMid: '#241052', skyBottom: '#6d176d',
            primary: '#19f9ff', secondary: '#ff3ed1', accent: '#ffe66d',
            sunTop: '#fff17a', sunBottom: '#ff2faf', skyline: '#ff3ed1',
            wall: '#08131b', hazard: '#ff3864'
        }
    },
    {
        name: 'Sunset Speedway',
        tagline: 'Keep the combo alive through the afterglow.',
        parTime: 52,
        palette: {
            skyTop: '#160824', skyMid: '#64205f', skyBottom: '#d04a62',
            primary: '#68f7ff', secondary: '#ff7a59', accent: '#fff275',
            sunTop: '#fff7a8', sunBottom: '#ff6b6b', skyline: '#ff9f68',
            wall: '#180f22', hazard: '#ff3158'
        }
    },
    {
        name: 'Laser Lagoon',
        tagline: 'Bounce high above electric tides.',
        parTime: 58,
        palette: {
            skyTop: '#00152b', skyMid: '#063e5e', skyBottom: '#087f8c',
            primary: '#4dffdf', secondary: '#56b8ff', accent: '#f7ff7a',
            sunTop: '#caffbf', sunBottom: '#2ec4b6', skyline: '#4dffdf',
            wall: '#051b28', hazard: '#ff4d8d'
        }
    },
    {
        name: 'Moonbone Market',
        tagline: 'Hunt every treasure between the towers.',
        parTime: 64,
        palette: {
            skyTop: '#080b24', skyMid: '#29205f', skyBottom: '#6542a6',
            primary: '#a8e6ff', secondary: '#d78cff', accent: '#fff1a8',
            sunTop: '#ffffff', sunBottom: '#b8a1ff', skyline: '#bd93ff',
            wall: '#101027', hazard: '#ff477e'
        }
    },
    {
        name: 'Chrome Canyon',
        tagline: 'Dash first. Ask questions after the wall explodes.',
        parTime: 70,
        palette: {
            skyTop: '#10141d', skyMid: '#2c3647', skyBottom: '#65586d',
            primary: '#b8f3ff', secondary: '#ff9d4d', accent: '#fff4bd',
            sunTop: '#ffffff', sunBottom: '#ff9d4d', skyline: '#d6e4ff',
            wall: '#121820', hazard: '#ff3b30'
        }
    },
    {
        name: 'Aurora Alley',
        tagline: 'Ride the green light and never touch the floor.',
        parTime: 76,
        palette: {
            skyTop: '#021811', skyMid: '#073f35', skyBottom: '#176b6b',
            primary: '#70ffb1', secondary: '#4de4ff', accent: '#f8ff9b',
            sunTop: '#e3ffd3', sunBottom: '#3ddc97', skyline: '#70ffb1',
            wall: '#061c18', hazard: '#ff477e'
        }
    },
    {
        name: 'Comet Canopy',
        tagline: 'Wall-jump through a sky full of sparks.',
        parTime: 82,
        palette: {
            skyTop: '#140620', skyMid: '#4f145f', skyBottom: '#922b75',
            primary: '#ff7ceb', secondary: '#67e8f9', accent: '#fff36d',
            sunTop: '#fff3a3', sunBottom: '#ff5ac8', skyline: '#ff7ceb',
            wall: '#1a0921', hazard: '#ff3d54'
        }
    },
    {
        name: 'Pixel Peak',
        tagline: 'Climb clean, move fast, collect everything.',
        parTime: 90,
        palette: {
            skyTop: '#03132d', skyMid: '#1c3975', skyBottom: '#536dfe',
            primary: '#70d6ff', secondary: '#b8a1ff', accent: '#ffea70',
            sunTop: '#effaff', sunBottom: '#7b8cff', skyline: '#70d6ff',
            wall: '#07152d', hazard: '#ff4f79'
        }
    },
    {
        name: 'Hyperlane Heights',
        tagline: 'Thread the danger at maximum puppy velocity.',
        parTime: 98,
        palette: {
            skyTop: '#180500', skyMid: '#5d1808', skyBottom: '#b54a0a',
            primary: '#ffcf56', secondary: '#ff6b35', accent: '#fff3c4',
            sunTop: '#fff7b2', sunBottom: '#ff7b00', skyline: '#ffad42',
            wall: '#221008', hazard: '#ff294d'
        }
    },
    {
        name: 'Cosmic Crown',
        tagline: 'One final run. Make it legendary.',
        parTime: 108,
        palette: {
            skyTop: '#090019', skyMid: '#31006f', skyBottom: '#7900a8',
            primary: '#00fff0', secondary: '#ff39e6', accent: '#ffe45e',
            sunTop: '#ffffff', sunBottom: '#ff39e6', skyline: '#00fff0',
            wall: '#10051d', hazard: '#ff2957'
        }
    }
];

const EVENT_POINTS = Object.freeze({
    bone: 100,
    goldenBone: 500,
    coinBlock: 250,
    stomp: 300,
    breakWall: 150,
    powerUp: 100
});

export const RANKS = Object.freeze(['S', 'A', 'B', 'C']);

export function getLevelMeta(index) {
    const safeIndex = Number.isFinite(index)
        ? Math.max(0, Math.min(Math.floor(index), LEVELS.length - 1))
        : 0;
    return LEVELS[safeIndex];
}

export function scoreForEvent(type, combo = 1) {
    const base = EVENT_POINTS[type] || 0;
    const multiplier = Math.max(1, Math.min(5, Math.floor(Number(combo) || 1)));
    return base * multiplier;
}

export function rankForTime(time, parTime) {
    const safeTime = Math.max(0, Number(time) || 0);
    const safePar = Math.max(1, Number(parTime) || 1);
    const ratio = safeTime / safePar;
    if (ratio <= 0.75) return 'S';
    if (ratio <= 1) return 'A';
    if (ratio <= 1.3) return 'B';
    return 'C';
}

export function rankValue(rank) {
    const index = RANKS.indexOf(rank);
    return index === -1 ? RANKS.length : index;
}

export function calculateLevelResult({ time, parTime, score, bestCombo }) {
    const safeTime = Math.max(0, Number(time) || 0);
    const safePar = Math.max(1, Number(parTime) || 1);
    const timeBonus = Math.max(0, Math.ceil(safePar - safeTime) * 25);
    const comboBonus = Math.max(0, Math.floor(Number(bestCombo) || 0) - 1) * 50;
    return {
        rank: rankForTime(safeTime, safePar),
        timeBonus,
        comboBonus,
        totalScore: Math.max(0, Math.floor(Number(score) || 0)) + timeBonus + comboBonus
    };
}

export function formatTime(seconds, includeTenths = false) {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    if (includeTenths) {
        return `${minutes}:${remainder.toFixed(1).padStart(4, '0')}`;
    }
    return `${minutes}:${String(Math.floor(remainder)).padStart(2, '0')}`;
}

export const TOTAL_LEVELS = LEVELS.length;
