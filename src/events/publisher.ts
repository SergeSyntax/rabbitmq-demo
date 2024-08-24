import { ChannelWrapper } from 'amqp-connection-manager';
import { Options, Channel } from 'amqplib';

import { logger } from '../utils/logger';
import { EventStructure } from '../types/events';

export abstract class Publisher<T extends EventStructure> {
  abstract subject: T['subject'];

  private static instance?: Publisher<any>;
  private exchangeType = 'topic';
  private exchangeOptions: Options.AssertExchange = { durable: true };
  private publishOptions: Options.Publish = { persistent: true, mandatory: true };
  private routingKey = '#'; // Ensure the routing key pattern matches the listener's expectations

  protected get exchangeName() {
    return `ex.${this.subject}`;
  }

  async setupExchange(channel: Channel) {
    try {
      await channel.assertExchange(this.exchangeName, this.exchangeType, this.exchangeOptions);
      logger.debug(`Exchange '${this.exchangeName}' of type '${this.exchangeType}' has been asserted successfully.`);
    } catch (error) {
      logger.error(`Failed to assert exchange '${this.exchangeName}':`, error);
      throw error;
    }
  }

  /**
   * Creates an instance of Publisher.
   * @param client - The channel wrapper for managing AMQP connections.
   */
  constructor(private client: ChannelWrapper) {
    if (Publisher.instance) {
      return Publisher.instance as Publisher<T>;
    } else {
      this.client
        .addSetup(async (channel: Channel) => {
          await this.setupExchange(channel);
        })
        .catch(err => {
          logger.error(`Error during AMQP setup for subject '${this.exchangeName}':`, err);

          throw err;
        });
      Publisher.instance = this;
    }
  }

  async publish(data: T['data']) {
    try {
      const wasSent = await this.client.publish(this.exchangeName, this.routingKey, data, this.publishOptions);
      if (!wasSent) new Error('Message was not confirmed');
      logger.debug(`Message published to exchange '${this.exchangeName}':`, data);
    } catch (error) {
      logger.error(`Failed to publish message to exchange '${this.exchangeName}':`, error);
      throw error;
    }
  }
}
