import { promisify } from 'node:util';
import { UserCreatedPublisher } from './events/user-created-publisher';
import { messageBusConnection } from './events/message-bus-connection';

// Function to send a message

const publisher = new UserCreatedPublisher(messageBusConnection.channelWrapper);

const delay = promisify(setTimeout);

// Function to publish events
async function publishEvents() {
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

publishEvents();
