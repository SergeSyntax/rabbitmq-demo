import amqp, { AmqpConnectionManager, Channel, ChannelWrapper } from 'amqp-connection-manager';
import { env } from '../config';
import { Message } from 'amqplib';

class MessageBusConnection {
  public connection: AmqpConnectionManager;
  public channelWrapper: ChannelWrapper;

  constructor(urls: string[], connectionName: string) {
    // Create a connection manager
    this.connection = amqp.connect(urls, {
      connectionOptions: {
        clientProperties: {
          connection_name: connectionName
        }
      }
    });

    this.connection.on('connect', () => console.log('Connected!'));
    this.connection.on('disconnect', ({ err }) => console.log('Disconnected.', err.stack));

    this.channelWrapper = this.connection.createChannel({
      json: true,
      confirm: true,
      // publishTimeout:
      setup: async (channel: Channel) => {
        // Declaring a queue is idempotent - it will only be created if it doesn't exist already. The message content is a byte array, so you can encode whatever you like there.
        await channel.prefetch(1);
      }
    });
  }

  public async close() {
    await this.channelWrapper.close();
    await this.connection.close();
  }

  public async ack(message: Message, allUpTo?: boolean) {
    return this.channelWrapper.ack(message, allUpTo);
  }

  public async nack(message: Message, allUpTo?: boolean, requeue?: boolean) {
    return this.channelWrapper.nack(message, allUpTo, requeue);
  }
}

// Create the connection URL with credentials
const connectionUrl = `amqp://${env.RABBITMQ_USERNAME}:${env.RABBITMQ_PASSWORD}@${env.RABBITMQ_HOST}:${env.RABBITMQ_PORT}`;

export const messageBusConnection = new MessageBusConnection([connectionUrl], env.POD_NAME);

const handleTerm = async () => {
  await messageBusConnection.close();
  process.exit(0);
};

process.on('SIGTERM', handleTerm);
process.on('SIGINT', handleTerm);
