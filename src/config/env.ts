import crypto from 'node:crypto';
import { generateUniqueId } from '../utils/generate-unique-id';


export const POD_NAME = `media-deployment-${generateUniqueId()}`;
export const SERVICE_NAME = 'media'

export const RABBITMQ_USERNAME = 'admin';
export const RABBITMQ_PASSWORD = 'admin';
export const RABBITMQ_HOST = 'localhost';
export const RABBITMQ_PORT = 5672;
export const RABBITMQ_MANAGEMENT_SCHEMA = 'http'
export const RABBITMQ_MANAGEMENT_PORT = 15672;
export const VHOST = '/';
