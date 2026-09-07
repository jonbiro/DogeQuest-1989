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

function startGame(event) {
    if (startScreen.classList.contains('hidden')) return;
    event?.preventDefault();
    startScreen.classList.add('hidden');
    game.input.reset();
    game.audio.resume()
        .then(() => game.updateSoundButton())
        .catch(() => game.updateSoundButton());
    game.startNewGame();
}

startBtn.addEventListener('click', startGame);

// Make the arcade-style start screen forgiving: tap/click anywhere on it.
startScreen.addEventListener('click', (event) => {
    if (!event.target.closest('#start-btn')) startGame(event);
});

// Enter and Space start the game even before a control has received focus.
window.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && !startScreen.classList.contains('hidden')) {
        startGame(event);
    }
});

requestAnimationFrame(() => startBtn.focus({ preventScroll: true }));
