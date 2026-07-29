/**
 * Compares two values one level deep: primitives (and identical references)
 * via `Object.is`, and arrays/objects by comparing their own enumerable keys
 * with `Object.is`, without recursing into nested values.
 *
 * @param a The first value.
 * @param b The second value.
 * @returns `true` if `a` and `b` are equal one level deep.
 *
 * @example Comparing derived arrays and objects
 * ```ts
 * shallowEqual([1, 2, 3], [1, 2, 3]); // true
 * shallowEqual({ a: 1 }, { a: 1 }); // true
 * shallowEqual({ a: 1 }, { a: 2 }); // false
 * shallowEqual({ a: { b: 1 } }, { a: { b: 1 } }); // false: nested object differs by reference
 * ```
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (
    typeof a !== "object" || a === null ||
    typeof b !== "object" || b === null
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  const record = b as Record<string, unknown>;
  for (const key of keysA) {
    if (
      !Object.hasOwn(record, key) ||
      !Object.is((a as Record<string, unknown>)[key], record[key])
    ) {
      return false;
    }
  }

  return true;
}
