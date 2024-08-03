import { Channel, ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage, Options } from 'amqplib';
import { Event } from './event';

export abstract class Listener<T extends Event> {
  /**
   * The name of the exchange to which this listener will bind.
   * This is the event name we want to distribute across the whole app
   * for all services that care about that event.
   */
  abstract subject: T['subject'];

  /**
   * The name of the queue group.
   * This is the queue that is shared between the replicas to receive one event per service.
   */
  abstract group: string;

  /**
   * Handles the message received from the queue.
   * @param data - The parsed message data.
   * @param msg - The original message from the queue.
   */
  abstract onMessage(data: T['data'], msg: ConsumeMessage): void;

  private exchangeType = 'topic';
  private exchangeOptions: Options.AssertExchange = { durable: true };
  private queueOptions: Options.AssertQueue = {
    durable: true,
    arguments: {
      'x-queue-type': 'quorum'
    }
  };
  private consumeOptions: Options.Consume = { noAck: false };
  private bindingKey = '#';

  /**
   * Creates an instance of Listener.
   * @param client - The channel wrapper for managing AMQP connections.
   */
  constructor(private client: ChannelWrapper) {}

  getQueueName() {
    return `${this.subject}.${this.group}`;
  }

  async setupExchange(channel: Channel) {
    try {
      await channel.assertExchange(this.subject, this.exchangeType, this.exchangeOptions);
      console.log(`Exchange '${this.subject}' of type '${this.exchangeType}' has been asserted successfully.`);
    } catch (error) {
      console.error(`Failed to assert exchange '${this.subject}':`, error);
      throw error;
    }
  }

  async setupQueue(channel: Channel) {
    try {
      await channel.assertQueue(this.getQueueName(), this.queueOptions);
      console.log(`Queue '${this.getQueueName()}' has been asserted successfully.`);
    } catch (error) {
      console.error(`Failed to setup queue for exchange '${this.subject}':`, error);
      throw error;
    }
  }

  async bindQueueToExchange(channel: Channel) {
    try {
      const queueName = this.getQueueName();
      await channel.bindQueue(queueName, this.subject, this.bindingKey);
      console.log(
        `Queue '${queueName}' has been asserted and bound to exchange '${this.subject}' with routing key '${this.bindingKey}'.`
      );
    } catch (error) {
      console.error(`Failed to bind queue to exchange '${this.subject}':`, error);
      throw error;
    }
  }

  /**
   * Parses the message content from the queue.
   * @param msg - The original message from the queue.
   * @returns The parsed message data.
   */
  parseMessage(msg: ConsumeMessage) {
    try {
      const data = msg.content.toString();

      // Assuming the message content is JSON, parse it
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing message content:', error);
      throw error;
    }
  }

  /**
   * Starts the listener to consume messages from the queue.
   */
  async listen() {
    try {
      await this.client.addSetup(async (channel: Channel) => {
        await this.setupExchange(channel);
        await this.setupQueue(channel);
        await this.bindQueueToExchange(channel);

        await channel.consume(
          this.getQueueName(),
          msg => {
            if (!msg) {
              console.warn(`${this.getQueueName()} consumed a null message`);
              return;
            }

            try {
              const parsedData = this.parseMessage(msg);
              console.log(`Message received from queue '${this.getQueueName()}':`, parsedData);
              this.onMessage(parsedData, msg);
            } catch (error) {
              console.error(`Error handling message from queue '${this.getQueueName()}':`, error);
              this.client.nack(msg, false, false);
            }
          },
          this.consumeOptions
        );
      });

      console.log(`Listener for exchange '${this.subject}' is now listening for messages.`);
    } catch (error) {
      console.error(`Failed to setup listener for exchange '${this.subject}':`, error);
      throw error;
    }
  }
}
