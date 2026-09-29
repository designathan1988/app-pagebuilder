
## Our rule: the free declarations (the user's real-use audit, item A3.33)

- The declarations field takes three kinds of line: an edited property of properties.json, **a custom property of the
  person's own** (`--brand: #123456`, any `--name`, kept as typed, written into the element's own rule and the export)
  and **a shorthand an owner reads** (`background: …`, `border: …`): the composite's codec reads it and its longhands
  are what the store and the export hold, so the person's shorthand and the editor's fields never disagree. A value a
  shorthand does not take is refused naming the line, as any other bad value.
