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

const Level1 = [
    "                               x  ",
    "                               x  ",
    "                               x  ",
    "                               x  ",
    "                               x  ",
    "                               x  ",
    "             xx                x  ",
    "                               x  ",
    "        xx                     x  ",
    "                         o     x  ",
    "o   xx                   xxx   x  ",
    "                     o o       x  ",
    "xxx                 xxxxx      x  ",
    "  x         ooo       v    o   x  ",
    "  x @o      ???            xxxxx  ",
    "  xxxxx   xxxxx   x            x  ",
    "      x!!!!!!!!!!!!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxxxxxxxxxxxxx  ",
    "                                  "
];

// Double Jump Level
const Level2 = [
    "                                                                 ",
    "                                                                 ",
    "                                                                 ",
    "                                                                 ",
    "                                 x                               ",
    "                                 x       o                       ",
    "                                 x      xxx                      ",
    "                                 x                               ",
    "                        o        x                               ",
    "                       xxx       x                               ",
    "                                 x                               ",
    "             o                   x                               ",
    "            xxx                  x                               ",
    "                                 x                               ",
    "     @                           x                               ",
    "  xxxxxxx        xxxx       xxxx x                               ",
    "        x        x  x       x  x x                               ",
    "        x!!!!!!!!x  x!!!!!!!x  x x                               ",
    "        xxxxxxxxxx  xxxxxxxxx  xxx                               ",
    "                                                                 "
];

// Dash Level
const Level3 = [
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "      o                                                                         ",
    "     xxx                                               o      o                 ",
    "                                                      xxx    xxx                ",
    "                                                                                ",
    "            =      =      =      =      =                                       ",
    "                                                                                ",
    "  @                                                  xxxx    xxxx               ",
    "xxxxxx                                               x  x    x  x               ",
    "     x                                               x  x    x  x               ",
    "     x                                           xxxxx  xxxxxx  xxxxxxxxxxxx    ",
    "     x                                                                          ",
    "     x                                                                          ",
    "     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                              ",
    "                                                                                "
];

const WinScreen = [
    "                                               ",
    "                                               ",
    "   o            o       o       o      o       ",
    "    o    o     o        o       o  o   o       ",
    "     o  o o   o         o       o    o o       ",
    "  @  o o   o o          o       o      o       ",
    "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
];

const GAME_LEVELS = [LevelTutorial, Level1, Level2, Level3, WinScreen];

const game = new Game(GAME_LEVELS);

// Start Screen Logic
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    // Initialize Audio context on user gesture
    if (game.audio && game.audio.ctx.state === 'suspended') {
        game.audio.ctx.resume();
    }

    // Check if we should use dynamic levels (e.g. checkbox or just default)
    // For now, let's inject a dynamic level after the tutorial
    // Or just make a "Endless Mode" button?
    // Let's replace the fixed levels (except tutorial/win) with dynamic ones
    // Actually, user asked for "levels dynamic and change every time"

    game.startLevel(0);
});
