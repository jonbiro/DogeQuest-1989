# Contributing to Puppy Quest 1989

Thanks for helping improve Puppy Quest 1989. The game is a small client-side project, so focused changes and reproducible browser testing are especially valuable.

## Before you start

1. Open an issue for a bug or feature that changes gameplay, controls, progression, or the public interface.
2. Fork the repository and create a focused branch from the default branch.
3. Keep unrelated formatting or generated files out of the change.

## Set up locally

Use Node.js 20.19 or newer and npm:

```bash
npm ci
npm run check
npm start
```

`npm run check` builds `dist/`, lints the tracked project files, and runs the Node test suite. `npm start` rebuilds `dist/` and serves it locally. Open the local URL printed by the server. Because the project uses native ES modules, do not test by opening `index.html` directly from the filesystem. The generated `dist/` directory is a deployment artifact and should not be committed.

## Making changes

- Preserve the canonical product name, **Puppy Quest 1989**. `DogeQuest-1989` is the legacy repository name.
- Keep gameplay logic in the relevant `src/` module and avoid adding global state when a game or level object can own it.
- Keep keyboard and touch input paths usable. Do not make color the only signal for a hazard, state, or reward.
- Keep the start gesture/audio behavior intact and handle browsers without optional vibration support gracefully.
- Prefer small, composable vanilla JavaScript, HTML, and CSS changes. Explain any new dependency in the pull request.
- Keep the static build safe and deterministic: source files should be copied by `scripts/build.js`, while generated `dist/` output remains disposable.
- For assets or third-party code, record the source, license, and any attribution in the pull request before committing them.

## Test your change

Run `npm run check`, then manually test the affected behavior in a current desktop browser. For controls or layout changes, also test a narrow/coarse-pointer viewport and a keyboard-only pass.

At minimum, verify:

- the start screen and audio initialization;
- movement, jumping, dash, pause, restart, and level selection when affected;
- bone collection, hazards, lives, win/loss overlays, and saved progress when affected;
- no console errors, broken module paths, or missing assets;
- readable focus states, usable touch targets, non-color cues, and reasonable behavior with reduced motion when changing UI or effects.

Procedural layouts are random. When reporting a gameplay issue, include the level slot, a concise reproduction sequence, browser/device, input method, and a screenshot or recording if it helps.

## Pull requests

Keep each pull request focused and describe the user-visible result. Include:

- a short summary and the motivation;
- files or systems changed;
- commands run and browsers/devices tested;
- screenshots or a recording for visual/gameplay changes;
- any follow-up work or known limitations.

Before requesting review, confirm that `npm run check` passes, no dependency or build artifacts are included accidentally, and the README or changelog is updated when behavior or public setup changes.

## Reporting bugs

Use the bug issue form and include exact steps, expected behavior, actual behavior, level slot, browser version, viewport/device, and whether keyboard or touch input was used. Do not include private data or security-sensitive details in a public issue; see [SECURITY.md](SECURITY.md).
