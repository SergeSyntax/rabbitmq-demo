import { Channel, ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage, Options } from 'amqplib';

import { EventStructure } from '../types/events';
import { logger } from '../utils/logger';
import ms from 'ms';

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
  abstract onMessage(data: T['data'], msg: ConsumeMessage): Promise<void>;

  protected dlxMessageTtl = ms('10 days');
  protected maxRetryLimit = 15;

  private exchangeType: 'direct' | 'topic' | 'headers' | 'fanout' | 'match' = 'topic';
  private exchangeOptions: Options.AssertExchange = { durable: true };
  private dlxExchangeOptions: Options.AssertExchange = { durable: true };
  private queueType: 'quorum' | 'classic' = 'quorum';

  protected get dlxQueueOptions(): Options.AssertQueue {
    return {
      durable: true,
      autoDelete: false,
      exclusive: false,
      messageTtl: this.dlxMessageTtl,
      deadLetterExchange: '',
      arguments: {
        'x-queue-type': this.queueType
      }
    };
  }

  protected get queueOptions(): Options.AssertQueue {
    return {
      durable: true,
      autoDelete: false,
      exclusive: false,
      arguments: {
        'x-queue-type': this.queueType,
        'x-delivery-limit': this.maxRetryLimit
      }
    };
  }

  getQueueOptions(deadLetterExchange: string): Options.AssertQueue {
    return {
      ...this.queueOptions,
      deadLetterExchange
    };
  }

  private consumeOptions: Options.Consume = { noAck: false };
  private routingKey = '#';
  private dlxRoutingKey = '#';

  /**
   * Creates an instance of Listener.
   * @param client - The channel wrapper for managing AMQP connections.
   */
  constructor(private client: ChannelWrapper) {}

  get queueName() {
    return `q.${this.subject}.${this.group}`;
  }

  get exchangeName() {
    return `ex.${this.subject}`;
  }

  get dlxQueueName() {
    return `q.dlx.${this.subject}.${this.group}`;
  }

  get dlxExchangeName() {
    return `ex.dlx.${this.subject}`;
  }

  async setupExchange(channel: Channel, exchangeName: string, exchangeOptions: Options.AssertExchange) {
    try {
      await channel.assertExchange(exchangeName, this.exchangeType, exchangeOptions);
      logger.debug(`Exchange '${exchangeName}' of type '${this.exchangeType}' has been asserted successfully.`);
    } catch (error) {
      logger.error(`Failed to assert exchange '${exchangeName}':`, error);
      throw error;
    }
  }

  async setupQueue(channel: Channel, queueName: string, exchangeName: string, queueOptions: Options.AssertQueue) {
    try {
      await channel.assertQueue(queueName, queueOptions);
      logger.debug(`Queue '${queueName}' has been asserted successfully.`);
    } catch (error) {
      logger.error(`Failed to setup queue '${queueName}' for exchange '${exchangeName}':`, error);
      throw error;
    }
  }

  async bindQueueToExchange(channel: Channel, queueName: string, exchangeName: string, routingKey: string) {
    try {
      await channel.bindQueue(queueName, exchangeName, routingKey);
      logger.debug(
        `Queue '${queueName}' has been asserted and bound to exchange '${exchangeName}' with routing key '${routingKey}'.`
      );
    } catch (error) {
      logger.error(`Failed to bind queue to exchange '${exchangeName}':`, error);
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

  handleMessage = async (msg: ConsumeMessage | null): Promise<void> => {
    const queueName = this.queueName;

    if (!msg) {
      logger.warn(`${queueName} consumed a null message`);
      return;
    }

    try {
      const parsedData = this.parseMessage(msg);
      logger.debug(`Message received from queue '${queueName}':`, parsedData);
      await this.onMessage(parsedData, msg);
      this.client.ack(msg); // Acknowledge the message upon successful processing
    } catch (error) {
      logger.error(`Error handling message from queue '${queueName}':`, error);
      this.client.nack(msg, false, true); // Negative acknowledge to retry the message
    }
  };

  /**
   * Starts the listener to consume messages from the queue.
   */
  async listen() {
    try {
      await this.client.addSetup(async (channel: Channel) => {
        // setup dead letter exchange queue
        await this.setupExchange(channel, this.dlxExchangeName, this.dlxExchangeOptions);
        await this.setupQueue(channel, this.dlxQueueName, this.dlxExchangeName, this.dlxQueueOptions);
        await this.bindQueueToExchange(channel, this.dlxQueueName, this.dlxExchangeName, this.dlxRoutingKey);

        // setup exchange and queue
        await this.setupExchange(channel, this.exchangeName, this.exchangeOptions);
        await this.setupQueue(channel, this.queueName, this.exchangeName, this.getQueueOptions(this.dlxExchangeName));
        await this.bindQueueToExchange(channel, this.queueName, this.exchangeName, this.routingKey);

        await channel.consume(this.queueName, this.handleMessage, this.consumeOptions);
      });

      logger.debug(`Listener for exchange '${this.exchangeName}' is now listening for messages.`);
    } catch (error) {
      logger.error(`Failed to setup listener for exchange '${this.exchangeName}':`, error);
      throw error;
    }
  }
}
