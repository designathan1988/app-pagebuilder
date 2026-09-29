// The plain JavaScript of a project's interactions (ARCHITECTURE.md, Command owners; group 18, spec export-events-js):
// the one writer of the site's `js/interactions.js`, read by the export (core/export/export.ts, which puts it in the
// archive and links it from the pages that use interactions) and by the preview (previewPage, which runs the same
// script). No framework, no inline handler, no editor id and no data attribute: every element is addressed by the BEM
// class the export gives it or by the person's own `id` attribute, the class the exporter wrote for the element.
//  - A trigger: click; hover (pointerenter, and pointerleave for the actions that reverse: show and hide); entering
//    the screen (an IntersectionObserver, once); the page loading (the script runs deferred, so the page is parsed); a
//    form's submit (the browser's own submit, never navigated away).
//  - An action: show and hide (the hidden property the editor's eye and a hidden element's export agree on); toggle a
//    class; play an animation (the class rule the export writes beside its @keyframes, restarted when it fires again);
//    scroll to an element; open a link (a new tab like the element's own link, or the same one).
import { walk, type DocNode, type DocumentJson, type Interaction, type NodeId } from '../document/model.ts';
import { interactionsOf, needsAddress, needsAnimation } from './interactions.ts';
import { playedClassName } from '../animation/animation.ts';

// One selector per node, as the export writes it: the class the export gave the element (the export gives every element
// an interaction addresses a class of its own), or the person's own `id` attribute.
export type SelectorOf = (node: NodeId) => string;

const quoted = (text: string): string => `'${text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

// what an interaction's action does, as JavaScript statements
function actionJs(interaction: Interaction, selectorOf: SelectorOf): string | null {
  const target = interaction.target === undefined ? null : selectorOf(interaction.target);
  const find = target === null ? null : `var target = document.querySelector(${quoted(target)});`;
  const act: string | null = (() => {
    if (interaction.action === 'show') return `if (target) target.hidden = false;`;
    if (interaction.action === 'hide') return `if (target) target.hidden = true;`;
    if (interaction.action === 'toggle-class')
      return interaction.className === undefined ? null : `if (target) target.classList.toggle(${quoted(interaction.className)});`;
    if (needsAnimation(interaction.action)) {
      if (interaction.animation === undefined) return null;
      // the class rule the export writes next to the @keyframes; taken off and on again so a second firing plays anew
      const name = playedClassName(interaction.animation);
      return `if (target) { target.classList.remove(${quoted(name)}); void target.offsetWidth; target.classList.add(${quoted(name)}); }`;
    }
    if (interaction.action === 'scroll-to') return `if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });`;
    if (needsAddress(interaction.action)) {
      if (interaction.address === undefined) return null;
      return interaction.newTab === true
        ? `window.open(${quoted(interaction.address)}, '_blank', 'noopener,noreferrer');`
        : `window.location.assign(${quoted(interaction.address)});`;
    }
    return null;
  })();
  if (act === null) return null;
  return find === null ? act : `${find} ${act}`;
}

// the action a hover's leave runs, where the action has one (show and hide are each other's)
function reverseJs(interaction: Interaction, selectorOf: SelectorOf): string | null {
  if (interaction.target === undefined) return null;
  const other = interaction.action === 'show' ? 'hide' : interaction.action === 'hide' ? 'show' : null;
  return other === null ? null : actionJs({ ...interaction, action: other }, selectorOf);
}

// one interaction of one element, as the statement that wires it
function wiringJs(node: DocNode, interaction: Interaction, triggerSelectorOf: SelectorOf, selectorOf: SelectorOf): string | null {
  const act = actionJs(interaction, selectorOf);
  if (act === null) return null;
  const selector = triggerSelectorOf(node.id as NodeId);
  if (interaction.trigger === 'click') return `each(${quoted(selector)}, function (el) { el.addEventListener('click', function () { ${act} }); });`;
  if (interaction.trigger === 'hover') {
    const leave = reverseJs(interaction, selectorOf);
    return `each(${quoted(selector)}, function (el) { el.addEventListener('pointerenter', function () { ${act} });${leave === null ? '' : ` el.addEventListener('pointerleave', function () { ${leave} });`} });`;
  }
  if (interaction.trigger === 'scroll-into-view')
    return `each(${quoted(selector)}, function (el) {\n    var fired = false;\n    var observer = new IntersectionObserver(function (entries) {\n      for (var i = 0; i < entries.length; i += 1) {\n        if (!entries[i].isIntersecting || fired) continue;\n        fired = true;\n        observer.disconnect();\n        ${act}\n      }\n    }, { threshold: 0.5 });\n    observer.observe(el);\n  });`;
  if (interaction.trigger === 'page-load') return `each(${quoted(selector)}, function () { ${act} });`;
  if (interaction.trigger === 'form-submit') return `each(${quoted(selector)}, function (el) { el.addEventListener('submit', function (event) { event.preventDefault(); ${act} }); });`;
  return null;
}

// The whole script of a project's interactions: the pages' elements in document order, one block per interaction.
// Null while the project holds none (a site without interactions gets no file and no script link).
export function interactionsJs(document: DocumentJson, selectorOf: SelectorOf): string | null {
  const blocks: string[] = [];
  for (const page of document.pages) {
    for (const node of walk(page.tree)) {
      for (const interaction of interactionsOf(node)) {
        const wired = wiringJs(node, interaction, () => selectorOf(node.id as NodeId), selectorOf);
        if (wired !== null) blocks.push(wired);
      }
    }
  }
  if (blocks.length === 0) return null;
  return [
    '// Generated by Builder: the interactions of the site. Plain JavaScript, no dependencies.',
    '(function () {',
    "  'use strict';",
    '  var each = function (selector, run) {',
    '    var found = document.querySelectorAll(selector);',
    '    for (var i = 0; i < found.length; i += 1) run(found[i]);',
    '  };',
    ...blocks.map((block) => block.split('\n').map((line) => `  ${line}`).join('\n')),
    '})();',
    '',
  ].join('\n');
}
