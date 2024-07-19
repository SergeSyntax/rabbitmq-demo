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


const handleMessage = (msg: ConsumeMessage | null) => {
  console.log(' [x] Received %s', msg?.content.toString() ?? '');
};

const consumeOptions: Options.Consume = {
  noAck: true 
};

channelWrapper.addSetup(async (channel: Channel) => {
  await channel.assertQueue(env.QUEUE_NAME, queueOptions);
  // await channel.bindQueue(QUEUE_NAME, 'exchange-name', 'create'),
  await channel.consume(env.QUEUE_NAME, handleMessage, consumeOptions);
});
