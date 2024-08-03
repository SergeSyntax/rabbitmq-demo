import crypto from 'node:crypto';

/**
 * Generate a unique identifier similar to Kubernetes pod suffix.
 * @returns {string} A unique identifier.
 */
export const generateUniqueId = () => {
  return crypto.randomBytes(8).toString('hex');
};
