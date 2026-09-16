import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

// Layout defects found by measuring the clubhouse, shop and help overlays at
// 320, 390, 430 and 700px. Each one was invisible in the source until the
// rendered geometry was inspected, so these lock in the rule rather than the
// appearance.

const css = readFileSync(new URL('../src/runner/ui.css', import.meta.url), 'utf8');

function rulesFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...css.matchAll(new RegExp(`(^|[,{}])\\s*${escaped}\\s*\\{([^}]*)\\}`, 'gm'))]
    .map(match => match[2]);
}

test('the compact and roomy breakpoints never both match at one width', () => {
  // Every compact rule is written `max-width: 700px`. A `min-width: 700px`
  // companion also matches at exactly 700px, so both layouts applied at once:
  // the phone card's button floor overflowed the roomy grid's narrower column
  // and clipped every Equip/price label in the right-hand column.
  const compact = [...css.matchAll(/@media[^{]*max-width:\s*(\d+)px/g)].map(m => Number(m[1]));
  const roomy = [...css.matchAll(/@media[^{]*min-width:\s*(\d+)px/g)].map(m => Number(m[1]));
  assert.ok(compact.length && roomy.length, 'the stylesheet still has both kinds of breakpoint');
  const collisions = [...new Set(roomy.filter(width => compact.includes(width)))];
  assert.deepEqual(collisions, [],
    `these widths match a compact and a roomy rule at once: ${collisions.join(', ')}`);
});

test('every clubhouse control keeps a 44px touch target', () => {
  // The shared base rule is already 44px; two later rules quietly reduced the
  // clubhouse category tabs and card actions to 40px, which is below the
  // minimum on the primary phone surface.
  const base = rulesFor('#upgrades button, #collection button').join('\n');
  assert.match(base, /min-height:\s*44px/, 'the shared shop/clubhouse button floor is 44px');
  const heights = [...css.matchAll(/#collection[^{]*button[^{]*\{([^}]*)\}/g)]
    .flatMap(match => [...match[1].matchAll(/min-height:\s*(\d+)px/g)].map(m => Number(m[1])));
  assert.ok(heights.length >= 2, `expected clubhouse button height rules, found ${heights.length}`);
  for (const height of heights)
    assert.ok(height >= 44, `a clubhouse button declares min-height ${height}px, below the 44px minimum`);
});

test('a card action can never be wider than the card holding it', () => {
  // Match the button rules only -- a looser pattern picks up the card's own
  // min-height and reports a floor that is not a width at all.
  const floors = [...css.matchAll(/#collection[^{]*\.collection-card\s*>\s*button[^{]*\{([^}]*)\}/g)]
    .map(match => match[1].match(/min-width:\s*([^;]+)/)?.[1]?.trim())
    .filter(Boolean);
  assert.ok(floors.length >= 1, 'the card action still declares a comfortable minimum width');
  // A bare pixel floor overflows a narrower card; min() keeps the floor while
  // letting the button fall back to the space actually available.
  for (const floor of floors)
    assert.match(floor, /^min\(/,
      `a fixed ${floor} floor overflows a narrow card; use min(<floor>, 100%)`);
});

test('no scroll region reserves space for an action shelf that does not overlay it', () => {
  // `.modal-actions` is never positioned anywhere in this stylesheet, so it is
  // a normal-flow sibling below the scroll region. Six rules nonetheless
  // reserved 92-108px for it, which showed up as 116px of dead space under the
  // last clubhouse card at 390x844.
  const positioned = [...css.matchAll(/([^{}]*\.modal-actions[^{}]*)\{([^}]*)\}/g)]
    .filter(match => /position:\s*(fixed|absolute|sticky)/.test(match[2]));
  assert.deepEqual(positioned.map(m => m[1].trim()), [],
    'the action shelf is positioned now, so the reservations below may be legitimate again');
  for (const selector of ['#overlay[data-kind="shop"] .modal-content #upgrades',
    '#overlay[data-kind="help"] .modal-content',
    '#collection[data-category="prizes"]']) {
    for (const body of rulesFor(selector)) {
      const padding = body.match(/padding-bottom:\s*(\d+)px/);
      if (!padding) continue;
      assert.ok(Number(padding[1]) <= 32,
        `${selector} reserves ${padding[1]}px for a shelf that never overlays it`);
    }
  }
});

test('the passport stamp columns can shrink onto the narrowest supported phone', () => {
  // Three 74px columns plus two 8px gaps need 238px, but a card on a 320px
  // phone offers about 190px. Without a relaxation the whole passport pushed
  // past the modal and gave the clubhouse a horizontal scrollbar.
  const floors = [...css.matchAll(/\.mastery-badges\s*\{([^}]*)\}/g)]
    .map(match => match[1].match(/grid-template-columns:\s*([^;]+)/)?.[1]?.trim())
    .filter(Boolean);
  assert.ok(floors.length >= 2, `expected a default and a narrow rule, found ${floors.length}`);
  assert.ok(floors.some(value => /minmax\(\s*0/.test(value)),
    `no stamp-column rule allows shrinking: ${floors.join(' | ')}`);
  // ...and that relaxation has to be reachable from a 320px phone.
  const narrow = css.match(/@media\s*\(max-width:\s*(\d+)px\)\s*\{[^}]*\.mastery-badges/);
  assert.ok(narrow && Number(narrow[1]) >= 320,
    'the shrinking rule must apply at 320px, the narrowest supported width');
});

test('passport cards are allowed to shrink inside their grid track', () => {
  // A grid item defaults to min-width:auto, so the track is sized to the card's
  // min-content and cannot fit a narrower column.
  // The selector must END at .mastery-card: a descendant rule such as
  // `#trail-passport .mastery-card > .mastery-badges` also carries min-width:0
  // and would satisfy a looser pattern while the card itself stayed rigid.
  const cardRules = [...css.matchAll(/([^{}]*\.mastery-card)\s*\{([^}]*)\}/g)]
    .filter(match => /#trail-passport/.test(match[1]))
    .map(match => match[2]);
  assert.ok(cardRules.length, 'the passport card rules are still present');
  assert.ok(cardRules.some(body => /min-width:\s*0/.test(body)),
    'passport cards need min-width:0 to shrink to the column they are given');
});
