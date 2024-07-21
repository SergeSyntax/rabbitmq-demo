import amqp, { Channel } from 'amqp-connection-manager';
import { env } from './config';

// Create the connection URL with credentials
const connectionUrl = `amqp://${env.USERNAME}:${env.PASSWORD}@${env.HOST}:${env.PORT}`;
// Create a connetion manager
const connection = amqp.connect([connectionUrl], {
  connectionOptions: {
    clientProperties: {
      connection_name: env.POD_NAME
    }
  }
});

connection.on('connect', () => console.log('Connected!'));
connection.on('disconnect', ({ err }) => console.log('Disconnected.', err.stack));

export const channelWrapper = connection.createChannel({
  json: true,
  confirm: true,
  // publishTimeout:
  setup: async (channel: Channel) => {
    // Declaring a queue is idempotent - it will only be created if it doesn't exist already. The message content is a byte array, so you can encode whatever you like there.
    await channel.prefetch(1);
  }
});

export default connection;
