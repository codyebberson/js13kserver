/**
 * Removes an element from the array.
 * @param {!Array} array
 * @param {!Object} element
 */
export function removeElement<T>(array: T[], element: T): void {
  array.splice(array.indexOf(element), 1);
}
