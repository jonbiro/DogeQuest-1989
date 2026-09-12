# Daily trail discoverability

A fresh portrait flow audit found today's trail hidden behind Help, a disclosure
and scrolling. Camp now exposes a 44px-high Daily trail shortcut in the existing
challenge card. It reuses the existing explicit selection handler, returns focus
to Run, and retains the original Help entry. It does not start a run automatically.

Testing also exposed selected-trail overflow at 320 × 568. The compact portrait
layout now reduces the empty space above actions when the shared-trail notice is
visible. Run, the challenge and the new daily control fit within the viewport.

Verification: 380 tests, build, distribution check and lint; fresh 390 × 844 and
320 × 568 browser screenshots, one-tap selection, the selected trail starting,
and Pause. No console errors; no test rewards banked. Temporary tabs closed and
viewport reset. No changes to seeds, upgrades, scoring, saves or the playing HUD.

The local illustrated audit is `test-results/daily-entry-audit/report.md`, with
six saved and inspected screenshots. These ignored QA artifacts are not shipped.
Physical touch, screen-reader speech, text enlargement and short landscape
usability remain outside this bounded check; Help retains the alternate entry.

Reload follow-up: a link matching today's seed and generator version now retains
the dated Daily trail label at startup. Explicit score targets still take
priority. Older seeds or generator versions remain ordinary shared trails; no
URL or active run is changed at midnight. All 381 tests passed. Fresh browser
navigation confirmed the daily date and, separately, the 200-point target label.
