import { generateUniqueId } from '../utils/generate-unique-id';


export const SERVICE_NAME = 'media'

export const RABBITMQ_MANAGEMENT_SCHEMA = 'http'
export const RABBITMQ_MANAGEMENT_PORT = 15672;

export const {
  // RabbitMQ
  RMQ_USERNAME = "admin",
  RMQ_PASSWORD = "admin",
  RMQ_HOST = "localhost",
  RMQ_PORT = "5672",
  RMQ_VHOST = "/",
  RMQ_PROTOCOL = "amqp",
  POD_NAME = `media-deployment-${generateUniqueId()}`
} = process.env;
