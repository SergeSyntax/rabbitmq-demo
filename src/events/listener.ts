import { Channel, ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage, Options } from 'amqplib';

import { EventStructure } from '../types/events';
import { logger } from '../utils/logger';

// NOTE: this is only a good choice if all the services written in Javascript/TypeScript if you have for example a service in Java Check alternatives JSON Schema, ProtoBuf and ApacheAvro (mostly focus on java)
export abstract class Listener<T extends EventStructure> {
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
      logger.debug(`Exchange '${this.subject}' of type '${this.exchangeType}' has been asserted successfully.`);
    } catch (error) {
      logger.error(`Failed to assert exchange '${this.subject}':`, error);
      throw error;
    }
  }

  async setupQueue(channel: Channel) {
    try {
      await channel.assertQueue(this.getQueueName(), this.queueOptions);
      logger.debug(`Queue '${this.getQueueName()}' has been asserted successfully.`);
    } catch (error) {
      logger.error(`Failed to setup queue for exchange '${this.subject}':`, error);
      throw error;
    }
  }

  async bindQueueToExchange(channel: Channel) {
    try {
      const queueName = this.getQueueName();
      await channel.bindQueue(queueName, this.subject, this.bindingKey);
      logger.debug(
        `Queue '${queueName}' has been asserted and bound to exchange '${this.subject}' with routing key '${this.bindingKey}'.`
      );
    } catch (error) {
      logger.error(`Failed to bind queue to exchange '${this.subject}':`, error);
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
      logger.error('Error parsing message content:', error);
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
              logger.warn(`${this.getQueueName()} consumed a null message`);
              return;
            }

            try {
              const parsedData = this.parseMessage(msg);
              logger.debug(`Message received from queue '${this.getQueueName()}':`, parsedData);
              this.onMessage(parsedData, msg);
            } catch (error) {
              logger.error(`Error handling message from queue '${this.getQueueName()}':`, error);
              this.client.nack(msg, false, false);
            }
          },
          this.consumeOptions
        );
      });

      logger.debug(`Listener for exchange '${this.subject}' is now listening for messages.`);
    } catch (error) {
      logger.error(`Failed to setup listener for exchange '${this.subject}':`, error);
      throw error;
    }
  }
}
