import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {URL} from 'node:url';

// The runner's JavaScript and its HTML shell are two separately cached
// artifacts. When they disagree the frame loop throws, and because that throw
// is caught and converted into the graphics recovery screen, the player is told
// their device needs a clean 3D start for what is really a markup mismatch.
// That shipped once: an older cached shell rendered the LEFT/RIGHT buttons
// without the nested <small> label the turn prompt writes into, so every swipe
// ended on the rescue screen.
//
// updateTurnControls now repairs that specific markup at runtime and the
// service worker no longer pairs a stale shell with a fresh bundle. These tests
// close the remaining gap in the other direction: they fail in CI if the shell
// in this repository stops providing something the code reaches for.

const shell = readFileSync(new URL('../runner/index.html', import.meta.url), 'utf8');

function runnerSources() {
  const dir = new URL('../src/runner/', import.meta.url);
  return readdirSync(dir)
    .filter(name => name.endsWith('.js'))
    .map(name => ({name, source: stripComments(readFileSync(new URL(name, dir), 'utf8'))}));
}

function stripComments(source) {
  return source.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function shellIds() {
  return new Set([...shell.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
}

test('every element id the runner looks up exists in the shipped shell', () => {
  const ids = new Map();
  for (const {name, source} of runnerSources()) {
    // The HUD deliberately reaches elements through small defensive helpers
    // rather than raw lookups, so matching only $() / getElementById() would
    // check a fraction of the real surface and pass while covering almost
    // nothing. Every id-first helper has to be listed here.
    const patterns = [
      /\$\(\s*(['"])([A-Za-z][\w-]*)\1\s*\)/g,
      /getElementById\(\s*(['"])([A-Za-z][\w-]*)\1\s*\)/g,
      // Bare calls only. `el.setAttribute('aria-label', …)` and THREE's
      // `geometry.setAttribute('position', …)` share the name but take an
      // attribute, not an element id, so a method call must not be swept in.
      /(?<![.\w$])(?:setText|setAttribute|textOf|setHidden|setData)\(\s*(['"])([A-Za-z][\w-]*)\1\s*[,)]/g,
    ];
    for (const pattern of patterns)
      for (const match of source.matchAll(pattern))
        if (!ids.has(match[2])) ids.set(match[2], name);
  }
  // A floor, so a refactor that moves lookups behind a helper this sweep does
  // not know about shows up as a coverage collapse instead of a silent pass.
  assert.ok(ids.size >= 90, `expected the runner to look up many ids, found ${ids.size}`);
  const present = shellIds();
  const missing = [...ids].filter(([id]) => !present.has(id));
  assert.deepEqual(missing, [],
    `the shell is missing ids the code dereferences: ${missing.map(([id, file]) => `${id} (${file})`).join(', ')}`);
});

test('the id sweep reports how much of the code it cannot resolve', () => {
  // Honesty about coverage: a lookup built from a variable or template literal
  // cannot be checked statically, so this test states the blind spot rather
  // than letting the sweep above imply total coverage.
  let dynamic = 0;
  for (const {source} of runnerSources())
    dynamic += [...source.matchAll(/\$\(\s*[^'")\s]/g)].length;
  // Not a correctness bound -- a tripwire. If dynamic lookups grow a lot, the
  // static sweep is covering proportionally less and needs rethinking.
  assert.ok(dynamic <= 40, `too many unresolvable element lookups to trust the static sweep: ${dynamic}`);
});

test('every touch control ships the nested label the frame loop writes into', () => {
  // This is the exact markup whose absence crashed swipes on a stale shell.
  for (const action of ['left', 'right', 'jump', 'slide']) {
    const button = shell.match(new RegExp(`<button[^>]*data-action="${action}"[^>]*>([\\s\\S]*?)</button`));
    assert.ok(button, `the shell has a ${action} control`);
    assert.match(button[1], /<small>[^<]+<\/small>/,
      `the ${action} control must ship a nested <small> label, not only an arrow glyph`);
  }
});

test('the turn prompt writes through a helper that tolerates a missing label', () => {
  // The runtime repair is the real defence for an already-cached stale shell,
  // because no test of this repository can fail on markup a browser cached
  // weeks ago. Keep the frame loop away from a raw, unguarded dereference.
  const app = stripComments(readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8'));
  assert.doesNotMatch(app, /querySelector\((['"])small\1\)\s*\.\s*textContent/,
    'the frame loop must not dereference a nested label directly');
  const controls = stripComments(
    readFileSync(new URL('../src/runner/traversal-controls.js', import.meta.url), 'utf8'));
  assert.match(controls, /querySelector\?\.\((['"])small\1\)/,
    'updateTurnControls should reach for the label defensively');
});
