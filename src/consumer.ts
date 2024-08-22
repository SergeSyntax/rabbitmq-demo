import { UserCreatedListener } from './events/user-created-listener';
import { messageBusClient } from './message-bus-client';

const handleTerm = async () => {
  await messageBusClient.disconnect();
  process.exit();
};
process.on('SIGTERM', handleTerm);
process.on('SIGINT', handleTerm);

async function consume() {
  await messageBusClient.connect();
  new UserCreatedListener(messageBusClient.channelWrapper).listen();
}

consume();
