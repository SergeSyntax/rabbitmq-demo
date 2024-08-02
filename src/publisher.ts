import { Channel, Options } from 'amqp-connection-manager';
import  { channelWrapper } from './connection';
import { consts } from './config';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'node:util';


const sendMessage = async (evenName: string, payload: { id: string }) => {
  await channelWrapper.addSetup(async (channel: Channel) => {
    await channel.assertExchange(evenName, 'x-consistent-hash', {
      durable: true
    });
  });

  const publishOptions: Options.Publish = {
    persistent: true
  };

  await channelWrapper.publish(evenName, payload.id, payload, publishOptions);
};

const delay = promisify(setTimeout);

async function publish_events() {
  for (let i = 0; i < 500; i++) {
    const message = `Hello World....num: ${i}`;

    const payload = {
      message,
      timestamp: Date.now(),
      id: uuidv4()
    };

    await sendMessage(consts.USERS_CREATE_MEDIA_EVENT, payload);
    await delay(300);
  }
}

publish_events()
