import { Channel, Options } from 'amqp-connection-manager';
import connection, { channelWrapper } from './connection';
import { env, consts } from './config';
import { generateUniqueId } from './config/env';

const convertIDtoBindingKey = (id: string, replicaNum: number) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return hash % replicaNum;
};

export const generateBindingKey = (exchangeName: string, replicaNum: number) => {
  const key = convertIDtoBindingKey(id, replicaNum);
  return `${exchangeName}.${key}`;
};

const message = 'Hello World....';

const id = generateUniqueId();

const payload = {
  message,
  timestamp: Date.now(),
  id
};

const publishOptions: Options.Publish = {
  persistent: true
};

const sendMessage = async () => {
  try {
    const bindingKey = generateBindingKey(consts.EXCHANGE_NAME, env.REPLICAS_NUM);
    channelWrapper.addSetup(async (channel: Channel) => {
      await channel.assertExchange(consts.EXCHANGE_NAME, 'topic', {
        durable: true
      });
    });

    await channelWrapper.publish(consts.EXCHANGE_NAME, bindingKey, payload, publishOptions);
    console.log(' [x] Sent %s', message);
  } catch (err) {
    console.log('Message was rejected:', (err as Error).stack);
    channelWrapper.close();
    connection.close();
  }
};
console.log('Sending messages...');
sendMessage();

setTimeout(function () {
  channelWrapper.close();
  process.exit(0);
}, 500);
