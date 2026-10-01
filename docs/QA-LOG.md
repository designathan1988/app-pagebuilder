# QA log — the dogfooding pass

The application used as its end user would, in the installed Chrome, with real gestures (mouse, keyboard, wheel) and a
screenshot after every step (`.cache/logs/qa-*`, scripts in `.cache/scratch/qa/`). Every change it led to is one commit
of its own, so any of them can be reverted alone (`git revert <commit>`); each entry names the commit, what the user met,
and what changed.

| # | Commit | Area | What the user met | What changed |
|---|---|---|---|---|
| 1 | 6c9e0a1 | Pages list | A click on "Home" put its name in edit and left the canvas on the other page; only the small page icon switched pages. | Another page's name reads as text and a click on it opens the page; only the page on the canvas is renamed in place. |
| 2 | c4b4aeb | Insert panel | The Heading, Paragraph, Button and Image were not visible: only Structure fit, the Image came after 23 form controls, the Button among them. | Groups ordered as a page is built (Structure, Text, Media, Forms, Lists, Tables, Interactive, Templates); the Button moved to Text. The scenario `a-collapsed-group-hides-its-tiles…` now compares with 230 px (Text holds a fourth row). |
| 3 | 084d603 | Value fields | A click in the padding's side holding 56 and "80" typed wrote 5680px: the caret stood after the value. | The click that focuses a value field (Style, Settings, quick panel, colour picker) selects its whole value; typing replaces it. |
| 4 | 829a3bb | Text on the canvas | A title typed on the canvas and left with Escape was lost ("Escape to cancel"). | Escape keeps the edit as Enter does (one undo step, Ctrl+Z takes it back); an unchanged text says "Kept … unchanged". Scenarios `double-click-or-enter-starts-editing`, `escape-ends-the-edit-keeping-the-text` (was `escape-cancels-the-edit`), `start-edit-from-the-command-bar` and text-edit-inline.spec follow. |
| 5 | (this commit) | Keyboard on the canvas | Typing a title outside its text ran a shortcut per letter: wrap, column, grid, hand… the structure was mangled. | A burst of letters that holds a letter binding nothing (a word) runs no further single-letter shortcut; R then S still run; a click ends the burst (constant `keys.typingBurst`). |
