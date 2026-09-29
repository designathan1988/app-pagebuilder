// Reading markup (split out of core/import/import.ts, which keeps the mapping): the DOM walk that turns an HTML
// text into the tree of tags, attributes and text the importer reads, and the source line a piece of it starts on.
export interface MarkupNode {
  readonly tag: string;
  readonly attributes: ReadonlyMap<string, string>;
  readonly children: readonly MarkupChild[];
}
export type MarkupChild = MarkupNode | string;

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const defaultParse = (text: string): Document => new DOMParser().parseFromString(text, 'text/html');

// the children of a parsed element as markup: its texts and its elements, each element with its attributes
export function childrenOf(parent: Node): MarkupChild[] {
  const out: MarkupChild[] = [];
  for (const child of parent.childNodes) {
    if (child.nodeType === TEXT_NODE) out.push(child.nodeValue ?? '');
    else if (child.nodeType === ELEMENT_NODE) {
      const element = child as Element;
      const attributes = new Map<string, string>();
      for (const attribute of element.attributes) attributes.set(attribute.name.toLowerCase(), attribute.value);
      out.push({ tag: element.localName, attributes, children: childrenOf(element.localName === 'template' ? (element as HTMLTemplateElement).content : element) });
    }
  }
  return out;
}

// The markup's own elements and texts, as the browser parses them (the wrappers a fragment was written with are gone:
// parseFromString puts what it finds where the content model says, and its body holds the rest).
export function parseMarkup(markup: string, parse: (text: string) => Document = defaultParse): readonly MarkupChild[] {
  return childrenOf(parse(markup).body);
}

// A whole page's markup: the head's elements, the title, and the body's children and attributes (File › Import HTML
// reads the page's settings from the head, which parseMarkup alone leaves out).
export interface MarkupPage {
  readonly head: readonly MarkupNode[];
  readonly title: string;
  readonly htmlAttributes: ReadonlyMap<string, string>;
  readonly body: readonly MarkupChild[];
  readonly bodyAttributes: ReadonlyMap<string, string>;
}

export function parsePage(markup: string, parse: (text: string) => Document = defaultParse): MarkupPage {
  const document = parse(markup);
  const html = document.documentElement;
  const head = html?.querySelector('head') ?? null;
  const attributes = (element: Element | null): ReadonlyMap<string, string> => {
    const out = new Map<string, string>();
    for (const attribute of element?.attributes ?? []) out.set(attribute.name.toLowerCase(), attribute.value);
    return out;
  };
  return {
    head: head === null ? [] : childrenOf(head).filter((child): child is MarkupNode => typeof child !== 'string'),
    title: head?.querySelector('title')?.textContent ?? '',
    htmlAttributes: attributes(html ?? null),
    body: childrenOf(document.body),
    bodyAttributes: attributes(document.body),
  };
}

// the text an element's children hold as one string (a head element's content, a script's code)
export function textOf(node: MarkupNode): string {
  return node.children.map((child) => (typeof child === 'string' ? child : textOf(child))).join('');
}

// The line of the first piece of the source that starts with `needle` (1 when the source does not hold it): what a
// report names, so the person sees where the piece is.
export function lineOf(markup: string, needle: string): number {
  const at = markup.indexOf(needle);
  return at < 0 ? 1 : markup.slice(0, at).split('\n').length;
}

// the line of an element's start tag as the source wrote it (a repeated identical tag names the first of them)
export function lineOfNode(markup: string, node: MarkupNode): number {
  const attributes = [...node.attributes].map(([name, value]) => ` ${name}="${value.replaceAll('"', '&quot;')}"`).join('');
  return lineOf(markup, `<${node.tag}${attributes}`);
}
