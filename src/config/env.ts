import crypto from 'node:crypto';

/**
 * Generate a unique identifier similar to Kubernetes pod suffix.
 * @returns {string} A unique identifier.
 */
export const generateUniqueId = () => {
  return crypto.randomBytes(8).toString('hex');
};

export const EVENT_NAME = 'user:created';
export const EVENT_TARGET = 'ms-media';
export const DEPLOYMENT_NAME = 'media-deployment';
export const POD_NAME = `media-deployment-${generateUniqueId()}`;
export const REPLICAS_NUM = 3;

export const RABBITMQ_USERNAME = 'admin';
export const RABBITMQ_PASSWORD = 'admin';
export const RABBITMQ_HOST = 'localhost';
export const RABBITMQ_PORT = 5672;
export const RABBITMQ_MANAGEMENT_SCHEMA = 'http'
export const RABBITMQ_MANAGEMENT_PORT = 15672;
export const VHOST = '/';
