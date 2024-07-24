import { promisify } from 'node:util';
import { Queue } from '../types';
import { fetchFilteredQueues } from './rabbitmq-management';
import { REPLICAS_NUM } from '../config/env';

const delay = promisify(setTimeout);

const getQueues = async (maxQueues: number): Promise<Queue[]> => {
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
    } while (data.length >= maxQueues);

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

export const getQueueKey = async (maxQueues: number): Promise<number> => {
  try {
    const filteredQueues = await getQueues(maxQueues);

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
