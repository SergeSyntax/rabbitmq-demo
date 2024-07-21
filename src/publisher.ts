import { Channel } from 'amqp-connection-manager';
import { env } from './config';
import connection, { channelWrapper } from './connection';
import { EXCHANGE_NAME, generateBindingKey } from './utils';
import { REPLICAS_NUM } from './config/env';

const convertIDtoBindingKey = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return hash % REPLICAS_NUM;
};

const message = 'Hello World....';

const sendMessage = async () => {
  try {
    channelWrapper.addSetup(async (channel: Channel) => {
      await channel.assertExchange(EXCHANGE_NAME, 'topic', {
        durable: true
      });
    });

    await channelWrapper.publish(
      EXCHANGE_NAME,
      generateBindingKey(EXCHANGE_NAME, convertIDtoBindingKey('test')),
      { time: Date.now(), message },
      {
        persistent: true
      }
    );
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
