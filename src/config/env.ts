import crypto from 'node:crypto';

/**
 * Generate a unique identifier similar to Kubernetes pod suffix.
 * @returns {string} A unique identifier.
 */
const generateUniqueId = () => {
  return crypto.randomBytes(8).toString('hex');
};

export const EVENT_NAME = 'user:created';
export const EVENT_TARGET = 'ms-media';
export const DEPLOYMENT_NAME = 'media-deployment';
export const POD_NAME = `media-deployment-${generateUniqueId()}`;
export const REPLICAS_NUM = 3;

export const USERNAME = 'admin';
export const PASSWORD = 'admin';
export const HOST = 'localhost';
export const PORT = 5672;
export const MANAGEMENT_PORT = 15672;
export const VHOST = '/';
