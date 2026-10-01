// A value field takes the whole value on the click that focuses it (the dogfooding pass: a click in the padding's
// side and "80" typed made 5680px — the caret stood after the 56 the field held). The first click into a field of the
// Style tab, the quick panel or the colour picker selects what it holds, so what is typed replaces it, as in the
// design tools a person comes from; a second click places the caret. The keyboard's Tab selects the whole value
// already (the browser's own behaviour).
const FIELDS = '[data-region="inspector-style"] input, [data-region="quick-panel"] input, .picker input, [data-region="inspector-settings"] input';
// how long after the focus the click that gave it may come (a press and its release)
const SAME_PRESS_MS = 600;

export function installSelectOnFocus(root: Document = document): () => void {
  let focused: { readonly field: HTMLInputElement; readonly at: number } | null = null;
  const onFocus = (event: FocusEvent) => {
    const field = event.target;
    focused = field instanceof HTMLInputElement && field.matches(FIELDS) && isText(field) ? { field, at: event.timeStamp } : null;
  };
  const onClick = (event: Event) => {
    const was = focused;
    focused = null;
    if (was === null || event.target !== was.field || event.timeStamp - was.at > SAME_PRESS_MS) return;
    // only when nothing is selected by the press itself (a drag across the text keeps its own selection)
    if (was.field.selectionStart === was.field.selectionEnd) was.field.select();
  };
  root.addEventListener('focusin', onFocus);
  root.addEventListener('click', onClick, true);
  return () => {
    root.removeEventListener('focusin', onFocus);
    root.removeEventListener('click', onClick, true);
  };
}

const TEXT_TYPES = new Set(['text', 'search', '', 'number', 'url', 'email', 'tel']);
const isText = (field: HTMLInputElement) => TEXT_TYPES.has(field.type) && !field.readOnly;
