import { Options } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import { consts, env } from './config';
import { channelWrapper } from './connection';
import { getQueueKey } from './utils/get-queue-key';

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

const generateConsumer = (eventName: string) => {
  channelWrapper.addSetup(async (channel: Channel) => {
    await channel.assertExchange(eventName, 'x-consistent-hash', {
      durable: true
    });

    // maybe instead of getting free queues check which one you can delete eachtime a new consumer generated 
    const key = await getQueueKey(env.REPLICAS_NUM);
    const queueName = `${eventName}_${key}`;
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
        'x-binding-key': key
      }
    });
    console.log(`Consumer is consuming from queue: ${queueName} with key: ${key}`);

    const consume_weight = '1'
    await channel.bindQueue(queueName, eventName, consume_weight);

    const consumeOptions: Options.Consume = { noAck: false };
    await channel.consume(queueName, handleMessage, consumeOptions);
  });
};

generateConsumer(consts.USERS_CREATE_MEDIA_EVENT);
