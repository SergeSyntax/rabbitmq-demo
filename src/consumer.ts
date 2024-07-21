import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import amqp, { Options } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import { env } from './config';
import { channelWrapper } from './connection';
import { EXCHANGE_NAME, generateBindingKey } from './utils';
import { Queue } from './types';
import { REPLICAS_NUM } from './config/env';
import { promisify } from 'node:util';

const delay = promisify(setTimeout);

const RABBITMQ_API_URL = `http://${env.HOST}:${env.MANAGEMENT_PORT}`;

const fetchFilteredQueues = async () => {
  const url = `${RABBITMQ_API_URL}/api/queues/${encodeURIComponent(env.VHOST)}`;

  const config: AxiosRequestConfig = {
    auth: {
      username: env.USERNAME,
      password: env.PASSWORD
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

const getQueues = async (): Promise<Queue[]> => {
  const start = Date.now();
  const SEC = 1000;
  const timeout = 60 * SEC;
  const interval = 10 * SEC;

  try {
    let data: Queue[];
    do {
      await delay(interval);
      data = await fetchFilteredQueues();

      if (Date.now() - start >= timeout) {
        throw new Error('Timeout: No free slot found within the specified time.');
      }
    } while (data.length >= REPLICAS_NUM);

    return data;
  } catch (error) {
    console.error('Error in getQueues function:', error);
    throw new Error(`Failed to get filtered queues within the timeout period: ${(error as Error).message}`);
  }
};

const formatQueues = (queues: Queue[]): Record<string, string> => {
  return queues.reduce((acc, curr) => {
    if (!curr.arguments['x-binding-key']) {
      throw new Error(`Queue ${curr.name} is missing x-binding-key`);
    }

    return {
      ...acc,
      [curr.arguments['x-binding-key']]: curr.name
    };
  }, {});
};

const getQueueKey = async (): Promise<number> => {
  try {
    const filteredQueues = await getQueues();

    if (filteredQueues.length === 0) return 1;

    const queues = formatQueues(filteredQueues);

    for (let i = 1; i < REPLICAS_NUM; i++) {
      if (queues[i] === undefined) return i;
    }

    return REPLICAS_NUM;
  } catch (error) {
    console.error('Error in getQueueKey function:', error);
    throw new Error(`Failed to determine an available queue key: ${(error as Error).message}`);
  }
};

// TABLE_NAME:event-type_POD_NAME
const QUEUE_NAME = `${env.EVENT_NAME}_${env.POD_NAME}`;

const handleMessage = async (msg: ConsumeMessage | null) => {
  if (!msg) return;

  try {
    const data = msg.content.toString();
    const secs = data.split('.').length - 1;

    console.log(" [x] %s: '%s'", msg.fields.routingKey, data);

    channelWrapper.ack(msg);
    console.log(' [x] Received %s', data);
    setTimeout(() => {
      console.log(' [x] Done');
    }, secs * 1000);
  } catch (err) {
    console.error('Error processing message:', err);
    channelWrapper.nack(msg, false, true); // Reject the message and requeue it
  }
};

const consumeOptions: Options.Consume = {
  noAck: false
};

async function main() {
  try {
    const key = await getQueueKey();
    console.log(`Consumer will listen to key: ${key}`);

    const queueOptions: Options.AssertQueue = {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
        'x-binding-key': key
      }
    };

    channelWrapper.addSetup(async (channel: Channel) => {
      await channel.assertQueue(QUEUE_NAME, queueOptions);
      await channel.assertExchange(EXCHANGE_NAME, 'topic', {
        durable: true
      });

      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, generateBindingKey(EXCHANGE_NAME, key));
      await channel.consume(QUEUE_NAME, handleMessage, consumeOptions);
    });
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main();
