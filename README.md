# Puppy Quest 1989

A retro-styled platformer with modern enhancements, featuring enhanced physics, smooth controls, vibrant 80s aesthetics, and mobile support.

![Preview](https://i.imgur.com/4iEFU2Q.png)

## Features

- **Modern Engine**: Rewritten with ES6 Modules and Classes.
- **Enhanced Physics**:
  - **Double Jump**: Reach higher platforms by jumping again in mid-air.
  - **Dash**: Press `SHIFT` to dash horizontally and avoid hazards.
  - **Coyote Time**: Forgiving jump timing when leaving platforms.
  - **Jump Buffering**: Smoother jump inputs.
- **Visuals**:
  - Smooth Camera Follow.
  - Particle Effects for actions.
  - Proper HUD overlay.
- **Audio**: Synthesized sound effects (no assets required).
- **Start Screen**: Instructions and audio initialization.

## Controls

| Action | Key(s) |
| :--- | :--- |
| **Move** | `Arrow Left/Right` or `A/D` |
| **Jump** | `Arrow Up` or `W` or `Space` |
| **Double Jump** | Press Jump again in air |
| **Dash** | `Shift` |

## How to Run

Since the game uses ES6 Modules, it must be served via a local web server to avoid CORS issues.

### Using Node.js (Recommended)

1. Navigate to the project directory.
2. Run the following command:
   ```bash
   npx serve
   ```
3. Open the link provided (usually `http://localhost:3000`).

### Using VS Code

1. Install the "Live Server" extension.
2. Right-click `index.html` and select "Open with Live Server".

## Development

The source code is located in the `src/` directory:

- `src/main.js`: Entry point and Level definitions.
- `src/Game.js`: Main game loop.
- `src/Level.js`: Level logic and collision detection.
- `src/actors/`: Entity classes (`Player`, `Lava`, `Bone`).
- `src/utils/`: Utilities for Vector math and Audio.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

