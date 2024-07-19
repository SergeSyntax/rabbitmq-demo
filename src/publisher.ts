import { env } from './config';
import connection, { channelWrapper } from './connection';

const message = 'Hello World!';

const sendMessage = async () => {
  try {
    await channelWrapper.sendToQueue(env.QUEUE_NAME, { time: Date.now(), message });
    console.log(' [x] Sent %s', message);
  } catch (err) {
    console.log('Message was rejected:', (err as Error).stack);
    channelWrapper.close();
    connection.close();
  }
};
console.log('Sending messages...');
sendMessage();


setTimeout(function() {
  channelWrapper.close();
  process.exit(0)
  }, 500);