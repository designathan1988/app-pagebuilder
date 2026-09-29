// Settings field placement and catalogue values come from elements.json. A field not claimed by a
// section for this element belongs to Attributes; the same attribute may have a narrower section
// on another element (Source is in Image for an image, but in Attributes for a video).
import { manifest } from '../../manifest/runtime.ts';
import type { DocNode } from '../../core/document/model.ts';
import type { ContentModel } from '../../core/elements/content-model.ts';

export const ATTRIBUTES = new Map(manifest.elements.attributes.map((attribute) => [attribute.id, attribute]));
export const SETTINGS_SECTIONS = manifest.elements.settingsSections;
export function inputValueEditorOf(node: DocNode): string | null {
  if (node.type !== 'input') return null;
  const type = String(node.attributes.inputType ?? 'text');
  return manifest.elements.inputValueEditors[type] ?? null;
}


// Whether the element's tag takes this attribute in HTML (the content model, the owner of the grammar): a tag switch
// drops what the new tag cannot hold, and the Settings shows only the fields the tag takes (the audit's A3.7: after a
// Link became a button it still offered Link address). An attribute the manifest writes as no HTML name (the page's
// own settings) always passes.
export function tagTakes(attribute: string, node: DocNode, model: ContentModel, rules: { readonly elements: ReadonlyMap<string, { readonly tags: readonly (string | null)[] }> }): boolean {
  const facts = ATTRIBUTES.get(attribute);
  if (facts === undefined) return false;
  if (node.tag === null || facts.html === null || facts.global === true) return true;
  // the strict rule only where the tag was switched (it is not the type's own): an element of its own tag keeps every
  // field the manifest gives its type (the generated table leaves real attributes out for some tags, an iframe's
  // loading), while a switched tag must not offer what it cannot hold (the audit's A3.7).
  const own = rules.elements.get(node.type)?.tags[0] ?? null;
  if (node.tag === own) return true;
  return model.takesAttribute(node.tag, facts.html);
}
export function settingsSectionFor(attribute: string, element: string): string {
  for (const section of SETTINGS_SECTIONS) {
    if (section.id === 'attributes') continue;
    if (section.elements !== 'all' && !section.elements.includes(element)) continue;
    if (section.attributes.includes(attribute)) return section.id;
  }
  return 'attributes';
}
