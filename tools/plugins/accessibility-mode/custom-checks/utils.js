/**
 * Generates a unique key for dismissing items.
 * @param {string} string - The string to be prepared for dismissal (without special chars).
 * @returns {string} - The truncated string with a maximum of 256 characters.
 */
const prepareDismissal = (string) => string.replace(/([^0-9a-zA-Z])/g, '').substring(0, 256);

export { prepareDismissal }; // eslint-disable-line import/prefer-default-export
