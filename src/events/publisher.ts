import { Channel, ChannelWrapper } from 'amqp-connection-manager';
import { Options } from 'amqplib';
import { Event } from './event';

export abstract class Publisher<T extends Event> {
  abstract subject: T['subject'];

  private exchangeType = 'topic';
  private exchangeOptions: Options.AssertExchange = { durable: true };
  private publishOptions: Options.Publish = { persistent: true };
  private routingKey = '#'; // Ensure the routing key pattern matches the listener's expectations

  async setupExchange(channel: Channel) {
    try {
      await channel.assertExchange(this.subject, this.exchangeType, this.exchangeOptions);
      console.log(`Exchange '${this.subject}' of type '${this.exchangeType}' has been asserted successfully.`);
    } catch (error) {
      console.error(`Failed to assert exchange '${this.subject}':`, error);
      throw error;
    }
  }

  /**
   * Creates an instance of Publisher.
   * @param client - The channel wrapper for managing AMQP connections.
   */
  constructor(private client: ChannelWrapper) {
    this.client.addSetup(async (channel: Channel) => {
      await this.setupExchange(channel);
    });
  }

  async publish(data: T['data']) {
    try {
      await this.client.publish(this.subject, this.routingKey, data, this.publishOptions);
      console.log(`Message published to exchange '${this.subject}':`, data);
    } catch (error) {
      console.error(`Failed to publish message to exchange '${this.subject}':`, error);
      throw error;
    }
  }
}
