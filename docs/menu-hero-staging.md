# Menu hero staging

The camp keeps Mochi as the visual promise of the runner, so his painted coat
needs to separate from the pale road and sage scenery before the player starts.
The menu now uses two scene-locked gradients: a warm spotlight for the coat's
cream highlights and a restrained dark falloff for figure/ground contrast. The
contrast layer is hidden for gameplay, help, shop and kennel views, so it cannot
compete with obstacles or add a persistent overlay to a run.

The portrait mobile menu also gives the hero a small scale lift. This changes
presentation only; the dog's world position and collision footprint stay the
same. Reduced-motion users still receive a static, high-contrast hero.

The visual contract is covered by `test/visual-audit.test.js`. A local portrait
browser smoke check confirmed the enlarged hero and both menu actions remain
visible, and the browser reported no warnings or errors.
