// A CSS identifier as a person names a class or a variable: letters of any language ("botão", "cor-primária"),
// digits, "-" and "_", not starting with a digit — what CSS and HTML take as they are, so the export writes the name
// the person typed. The one rule of the class registry, the variables, the validator and the importer.
export const IDENTIFIER_SOURCE = String.raw`-?[_\p{L}][_\p{L}\p{N}-]*`;
const IDENTIFIER = new RegExp(`^${IDENTIFIER_SOURCE}$`, 'u');
export const isIdentifier = (name: string): boolean => IDENTIFIER.test(name);
