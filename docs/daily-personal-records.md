# Daily trail personal records

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
