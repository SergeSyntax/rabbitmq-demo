import { promisify } from 'node:util';
import { UserCreatedPublisher } from './events/user-created-publisher';
import { messageBusClient } from './message-bus-client';

const handleTerm = async () => {
  await messageBusClient.disconnect();
  process.exit();
};
process.on('SIGTERM', handleTerm);
process.on('SIGINT', handleTerm);

async function publish() {
  await messageBusClient.connect();

  const publisher = new UserCreatedPublisher(messageBusClient.channelWrapper);

  const delay = promisify(setTimeout);

  // Function to publish events
  console.log('start');

  for (let i = 0; i < 500; i++) {
    const message = `Hello World....num: ${i}`;

    await publisher.publish({
      id: i.toString(),
      email: 'test@test.com',
      message,
      timestamp: new Date()
    });

    await delay(1900); // Delay to simulate periodic publishing
  }
}

publish();
