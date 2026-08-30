import { Game } from './Game.js';

// Tutorial Level
const LevelTutorial = [
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                      xxx                                       ",
    "                                     xx!xx                                      ",
    "                                     x!!!x                                      ",
    "                                     xx!xx                                      ",
    "                                      xvx                                       ",
    "                                                                                ",
    "  @      o    o      o      xxx     xxxxxxxxx     xxx       o      o            ",
    "xxxxxxxxxxxxxxxxxxxxxxxxx   x!x     x!!!!!!!x     x!x    xxxxxxxxxxxxx    o     ",
    "                        x   x!x     x!!!!!!!x     x!x    x           x   xxx    ",
    "                        x   x!x     x!!!!!!!x     x!x    x           x          ",
    "                        x   xxx     xxxxxxxxx     xxx    x           x          ",
    "                        x                                x           x          ",
    "                        x      o                         x           x          ",
    "                        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx           xxxxxxxxxx ",
    "                                                                                "
];

const GAME_LEVELS = [LevelTutorial];

const game = new Game(GAME_LEVELS);

// Start Screen Logic
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    game.audio.resume().then(() => game.updateSoundButton());

    game.startNewGame();
});
