import { env } from './config';

export const EXCHANGE_NAME = `${env.EVENT_NAME}_${env.EVENT_TARGET}`;

export const generateBindingKey = (exchangeName: string, key: string | number) => {
  return `${exchangeName}.${key}`;
};
