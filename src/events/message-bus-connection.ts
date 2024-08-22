import amqp, { AmqpConnectionManager, Channel, ChannelWrapper } from "amqp-connection-manager";
import { Message, Options } from "amqplib";

import { logger } from "../utils/logger";

interface MessageBusClientOptions {
  urls: Options.Connect[];
  connectionName: string;
  prefetch?: number;
  publishTimeout?: number;
}

export class MessageBusClient {
  private _connection?: AmqpConnectionManager;
  private _channelWrapper?: ChannelWrapper;

  public get connection(): AmqpConnectionManager {
    if (!this._connection) throw new Error("RabbitMQ connection is not established.");
    return this._connection;
  }
  public get channelWrapper(): ChannelWrapper {
    if (!this._channelWrapper) {
      throw new Error("RabbitMQ channelWrapper is not established.");
    }
    return this._channelWrapper;
  }

  constructor(private options: MessageBusClientOptions) {}

  public async connect() {
    const { urls, connectionName, prefetch = 1, publishTimeout = 10000 } = this.options;

    // Create a connection manager
    this._connection = amqp.connect(urls, {
      connectionOptions: {
        clientProperties: {
          connection_name: connectionName,
        },
      },
    });

    this.connection.on("connect", () => {
      logger.info(`[${connectionName}] RabbitMQ connection established.`);
    });

    this.connection.on("connectFailed", ({ err, url }) => {
      const { password, username, ...urlParams } = url as Options.Connect;
      logger.error(
        `[${connectionName}] RabbitMQ connection to ${JSON.stringify(urlParams)} failed: ${err.message}`,
      );
    });
    this.connection.on("blocked", ({ reason }) => {
      logger.error(`[${connectionName}] RabbitMQ connection blocked: ${reason}`);
    });

    this.connection.on("unblocked", () => {
      logger.info(`[${connectionName}] RabbitMQ connection unblocked.`);
    });

    this.connection.on("disconnect", ({ err }) => {
      logger.error(
        `[${connectionName}] RabbitMQ connection lost: ${err ? err.stack : "Unknown error"}`,
      );
    });

    this._channelWrapper = this._connection.createChannel({
      json: true,
      confirm: true,
      publishTimeout,
      name: connectionName,
      setup: async (channel: Channel) => {
        // Declaring a queue is idempotent - it will only be created if it doesn't exist already. The message content is a byte array, so you can encode whatever you like there.
        await channel.prefetch(prefetch);
      },
    });

    await this.channelWrapper.waitForConnect();
    logger.info(`[${connectionName}] RabbitMQ channel established.`);
  }

  public async disconnect() {
    await this.channelWrapper.close();
    await this.connection.close();
    logger.info(
      `RabbitMQ (${this.options.connectionName}): Connection closed gracefully due to application termination.`,
    );
  }

  public async ack(message: Message, allUpTo?: boolean) {
    return this.channelWrapper.ack(message, allUpTo);
  }

  public async nack(message: Message, allUpTo?: boolean, requeue?: boolean) {
    return this.channelWrapper.nack(message, allUpTo, requeue);
  }
}
