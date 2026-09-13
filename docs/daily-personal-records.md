# Daily trail personal records

Completed-run receipts now retain the previous and updated trail best. The
existing result sentence recognizes “New best on this trail!” when improving an
established record below the overall personal best. A tie or lower score does
not trigger it, and rereading a completion receipt retains the same result without
adding currency. Close misses say “score target”, covering both local daily
records and explicit shared targets without mislabeling local records as shared.

Today's UTC daily seed is retained ahead of ordinary recent trails when banking,
so repeated random adventures cannot evict the current daily target. The history
still holds at most 32 records. After the UTC day changes, the old day's entry
returns to normal recent-history eviction. A regression banks 100 random runs
without losing today's best, then verifies bounded eviction on the next day.

Reopening or reloading today's exact trail now restores the personal score target
after loading the saved profile. Explicit targets in shared links take precedence;
other dates/layouts do not inherit today's record. Tests cover those branches.
An isolated browser reload retained “Your best: 2,400 pts”; adding an explicit
500-point target instead displayed “Beat 500 pts”. No actual profile was changed.

Completed adventures retain a best score for their exact seed and generator
version, with a bounded history of the 32 most recently played distinct trails.
Selecting Daily trail looks up that layout's record, displays “Your best”, and
uses it as the existing in-run score-chase target. Worse runs never lower the
record. Older layout versions cannot replace a current-layout record.

Records are local, not ranked or independently verified. Upgrades and route
choices still apply, as disclosed in the daily selector. This adds no currency,
attendance penalty, account or external service. Practice and unfinished runs
cannot bank records; normal completion receipts remain idempotent. Portable
backups preserve the history and older backups import with an empty history.

Automated tests cover sanitization, duplicates, bounded history, one-time banking,
version isolation, practice exclusion, lower-score preservation, backup round
trips and actual Daily button wiring. A 320 × 568 isolated browser profile showed
a 2,400-point daily record with visible Play and navigation controls; starting
the run showed “4 / 2,400 pts”. No actual saved profile was modified by the preview.
