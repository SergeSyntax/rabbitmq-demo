import ms from 'ms';
import { UserCreatedListener } from './events/user-created-listener';
import { UserCreatedPublisher } from './events/user-created-publisher';
import { messageBusClient } from './message-bus-client';
import { delay } from './utils';

const handleTerm = async () => {
  await messageBusClient.disconnect();
  process.exit();
};
process.on('SIGTERM', handleTerm);
process.on('SIGINT', handleTerm);

export async function publishBatch() {
  const publisher = new UserCreatedPublisher(messageBusClient.channelWrapper);

  for (let i = 0; i < 500; i++) {
    const message = `Hello World....num: ${i}`;

    await publisher.publish({
      id: i.toString(),
      email: 'test@test.com',
      message,
      timestamp: new Date()
    });

    await delay(ms('2s'));
  }
}

async function main() {
  const publishMode = process.argv.includes('--publish');
  await messageBusClient.connect();

  if (publishMode) {
    await publishBatch();
  } else {
      await new UserCreatedListener(messageBusClient.channelWrapper).listen();
  }
}

main();
