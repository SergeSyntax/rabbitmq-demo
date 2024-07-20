#!/usr/bin/env node

import amqp, { Options } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import { env } from './config';
import { channelWrapper } from './connection';

const queueOptions: Options.AssertQueue = {
  durable: true,
  arguments: {
    'x-queue-type': 'quorum'
  }
};

const handleMessage = async (msg: ConsumeMessage | null) => {
  if (!msg) return;

  try {
    const data = msg?.content.toString() ?? '';
    const secs = data.split('.').length - 1;
  
    channelWrapper.ack(msg);
    console.log(' [x] Received %s', data);
    setTimeout(() => {
      console.log(' [x] Done');
    }, secs * 1000);
  } catch (err) {
    console.error('Error processing message:', err);
    // Reject the message and requeue it
    channelWrapper.nack(msg, false, true);
  }
};

const consumeOptions: Options.Consume = {
  noAck: false
};

channelWrapper.addSetup(async (channel: Channel) => {
  await channel.assertQueue(env.QUEUE_NAME, queueOptions);
  // await channel.bindQueue(QUEUE_NAME, 'exchange-name', 'create'),
  await channel.consume(env.QUEUE_NAME, handleMessage, consumeOptions);
});
