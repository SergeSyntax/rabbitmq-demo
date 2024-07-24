import { Options } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import { env } from './config';
import { channelWrapper } from './connection';
import { EXCHANGE_NAME, generateBindingKey } from './utils';
import { getQueueKey } from './utils/get-queue-key';

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
    const key = await getQueueKey(env.REPLICAS_NUM);
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
