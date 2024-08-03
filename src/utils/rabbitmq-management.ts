import axios, { AxiosRequestConfig } from 'axios';
import { env } from '../config';

export interface QueueArguments {
  'x-queue-type': string;
}

export interface Queue {
  arguments: QueueArguments;
  auto_delete: boolean;
  consumer_capacity: number;
  consumer_utilisation: number;
  consumers: number;
  durable: boolean;
  effective_policy_definition: Record<string, unknown>;
  exclusive: boolean;
  leader: string;
  members: string[];
  memory: number;
  message_bytes: number;
  message_bytes_dlx: number;
  message_bytes_persistent: number;
  message_bytes_ram: number;
  message_bytes_ready: number;
  message_bytes_unacknowledged: number;
  messages: number;
  messages_details: {
    rate: number;
  };
  messages_dlx: number;
  messages_persistent: number;
  messages_ram: number;
  messages_ready: number;
  messages_ready_details: {
    rate: number;
  };
  messages_unacknowledged: number;
  messages_unacknowledged_details: {
    rate: number;
  };
  name: string;
  node: string;
  online: string[];
  open_files: Record<string, number>;
  reductions: number;
  reductions_details: {
    rate: number;
  };
  single_active_consumer_tag?: string;
  state: string;
  type: string;
  vhost: string;
  message_stats?: {
    ack: number;
    ack_details: Record<string, unknown>;
    deliver: number;
    deliver_details: Record<string, unknown>;
    deliver_get: number;
    deliver_get_details: Record<string, unknown>;
    deliver_no_ack: number;
    deliver_no_ack_details: Record<string, unknown>;
    get: number;
    get_details: Record<string, unknown>;
    get_empty: number;
    get_empty_details: Record<string, unknown>;
    get_no_ack: number;
    get_no_ack_details: Record<string, unknown>;
    publish: number;
    publish_details: Record<string, unknown>;
    redeliver: number;
    redeliver_details: Record<string, unknown>;
  };
}

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
