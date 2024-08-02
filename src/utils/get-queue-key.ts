import { promisify } from 'node:util';
import { Queue } from '../types';
import { fetchFilteredQueues } from './rabbitmq-management';
import { SEC } from '../config/consts';

// TODO: require refactor deployments run pods in the same time when init if you init that function 3 times in the same time they all will return the same key 1 and duplicate any message send to each pod which would be a disaster in this scenario
const delay = promisify(setTimeout);

const getQueues = async (maxQueues: number): Promise<Queue[]> => {
  const maxRetries = 4;
  const interval = 10 * SEC;
  let attempt = 0;

  try {
    let data: Queue[];
    do {
      data = await fetchFilteredQueues();
      
      if (data.length > 0 && data.length < maxQueues) return data;

      await delay(interval);
      attempt++;
    } while (attempt < maxRetries);

    if (data.length >= maxQueues) {
      throw new Error(`Too many queues (${data.length}), skipping consumption.`);
    }

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

    for (let i = 1; i < maxQueues; i++) {
      if (queues[i] === undefined) return i;
    }

    return maxQueues;
  } catch (error) {
    console.error('Error in getQueueKey function:', error);
    throw new Error(`Failed to determine an available queue key: ${(error as Error).message}`);
  }
};
