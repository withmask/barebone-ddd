export function flattenMatch(
  object: { [key: string]: any },
  prefix?: string
): {
  [key: string]: any;
} {
  const final: { [key: string]: any } = {};

  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const element = object[key],
        prefixedKey = (prefix ? `${prefix}.` : '') + key;

      if (typeof element === 'object' && element !== null)
        Object.assign(final, flattenMatch(element, prefixedKey));
      else final[prefixedKey] = element;
    }
  }

  return final;
}
