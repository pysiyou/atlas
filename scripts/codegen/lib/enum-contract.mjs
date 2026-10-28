/**
 * Shared helpers for contracts/enums.json (members + wire shape).
 */

function wireLookupKey(wire) {
  return typeof wire === 'number' ? String(wire) : wire;
}

/** @param {Record<string, unknown>} def */
export function assertMembersShape(def, enumName) {
  if (!def.members || typeof def.members !== 'object') {
    console.error(`enums.json: ${enumName} missing members`);
    process.exit(1);
  }
}

/** @param {Record<string, { wire: string | number } & Record<string, unknown>>} def */
export function iterEnumMembers(def) {
  return Object.entries(def.members);
}

/** @param {Record<string, { wire: string | number }>} def */
export function enumWireValues(def) {
  return iterEnumMembers(def).map(([, member]) => member.wire);
}

/** Presentation fields for *_CONFIG (excludes wire). */
export function presentationFields(member) {
  const { wire: _wire, ...rest } = member;
  return rest;
}

export { wireLookupKey };
