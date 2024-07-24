import axios, { AxiosRequestConfig } from 'axios';
import { env } from '../config';
import { Queue } from '../types';

const RABBITMQ_API_URL = `${env.RABBITMQ_MANAGEMENT_SCHEMA}://${env.RABBITMQ_HOST}:${env.RABBITMQ_MANAGEMENT_PORT}`;

export const fetchFilteredQueues = async () => {
  const url = `${RABBITMQ_API_URL}/api/queues/${encodeURIComponent(env.VHOST)}`;

  const config: AxiosRequestConfig = {
    auth: {
      username: env.RABBITMQ_USERNAME,
      password: env.RABBITMQ_PASSWORD
    }
  };

  try {
    const response = await axios.get<Queue[]>(url, config);
    return response.data.filter(({ consumers }) => consumers > 0);
  } catch (error) {
    console.error('Error fetching queues:', error);
    throw new Error(`Failed to fetch queues from RabbitMQ: ${(error as Error).message}`);
  }
};
