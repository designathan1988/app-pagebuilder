# QA log — the dogfooding pass

The application used as its end user would, in the installed Chrome, with real gestures (mouse, keyboard, wheel) and a
screenshot after every step (`.cache/logs/qa-*`, scripts in `.cache/scratch/qa/`). Every change it led to is one commit
of its own, so any of them can be reverted alone (`git revert <commit>`); each entry names the commit, what the user met,
and what changed.

| # | Commit | Area | What the user met | What changed |
|---|---|---|---|---|
| 1 | (this commit) | Pages list | A click on "Home" put its name in edit and left the canvas on the other page; only the small page icon switched pages. | Another page's name reads as text and a click on it opens the page; only the page on the canvas is renamed in place. |
