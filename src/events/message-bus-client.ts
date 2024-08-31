import amqp, { AmqpConnectionManager, Channel, ChannelWrapper } from 'amqp-connection-manager';
import { Message, Options } from 'amqplib';
import { logger } from '../utils/logger';

interface MessageBusClientOptions {
  parsedHosts: string;
  parsedPorts: string;
  connectOptions: Options.Connect;
  connectionName: string;
  prefetch?: number;
  publishTimeout?: number;
}

const parseEnvVarArr = (str: string) => str.split(',').map(term => term.trim());

export class MessageBusClient {
  private _connection?: AmqpConnectionManager;
  private _channelWrapper?: ChannelWrapper;

  public get connection(): AmqpConnectionManager {
    if (!this._connection) throw new Error('RabbitMQ connection is not established. Ensure connect() is called before accessing the connection.');
    return this._connection;
  }
  
  public get channelWrapper(): ChannelWrapper {
    if (!this._channelWrapper) {
      throw new Error('RabbitMQ channelWrapper is not established. Ensure connect() is called before accessing the channel.');
    }
    return this._channelWrapper;
  }

  constructor(private options: MessageBusClientOptions) {}

  public async connect() {
    const {
      parsedHosts,
      parsedPorts,
      connectOptions,
      connectionName,
      prefetch = 1,
      publishTimeout = 10000
    } = this.options;

    const hosts = parseEnvVarArr(parsedHosts);
    const ports = parseEnvVarArr(parsedPorts);

    const derivedHosts = ports.length === 1 ? Array(ports.length).fill(hosts[1]) : hosts;
    const derivedPorts = hosts.length === 1 ? Array(hosts.length).fill(ports[1]) : ports;

    if (derivedHosts.length !== derivedPorts.length) {
      throw new Error(
        `Configuration error: ${hosts.length} hosts were provided but only ${ports.length} ports. Ensure each host has a corresponding port.`
      );
    }

    const urls = derivedHosts.map((hostname, i) => ({
      hostname,
      port: +derivedPorts[i],
      ...connectOptions
    }));

    // Create a connection manager
    this._connection = amqp.connect(urls, {
      connectionOptions: {
        clientProperties: {
          connection_name: connectionName
        }
      }
    });

    this.connection.on('connect', () => {
      logger.info(`[${connectionName}] RabbitMQ connection established successfully.`);
    });

    this.connection.on('connectFailed', ({ err, url }) => {
      const { password, username, ...urlParams } = url as Options.Connect;
      logger.error(`[${connectionName}] RabbitMQ connection attempt to ${JSON.stringify(urlParams)} failed with error: ${err.message}`);
    });

    this.connection.on('blocked', ({ reason }) => {
      logger.error(`[${connectionName}] RabbitMQ connection is blocked due to: ${reason}.`);
    });

    this.connection.on('unblocked', () => {
      logger.info(`[${connectionName}] RabbitMQ connection is now unblocked.`);
    });

    this.connection.on('disconnect', ({ err }) => {
      logger.error(`[${connectionName}] RabbitMQ connection was lost. Reason: ${err ? err.stack : 'Unknown error'}.`);
    });

    this._channelWrapper = this._connection.createChannel({
      json: true,
      confirm: true,
      publishTimeout,
      name: connectionName,
      setup: async (channel: Channel) => {
        await channel.prefetch(prefetch);
        channel.on('return', this.handleUndeliverableMessage);
      }
    });

    await this.channelWrapper.waitForConnect();
    logger.info(`[${connectionName}] RabbitMQ channel established successfully.`);
  }

  public disconnect = async () => {
    await this.channelWrapper.close();
    await this.connection.close();
    logger.info(
      `RabbitMQ connection [${this.options.connectionName}] closed gracefully due to application termination.`
    );
  };

  handleUndeliverableMessage = async (msg: Message) => {
    const exchangeName = msg.fields.exchange;
    const routingKey = msg.fields.routingKey;
    const messageContent = msg.content ? msg.content.toString() : 'No content';
    const errorMessage = `Message undeliverable: Returned from exchange '${exchangeName}' with routing key '${routingKey}'. Content: ${messageContent}`;
    logger.error(errorMessage);

    await this.disconnect();
  };

  public async ack(message: Message, allUpTo?: boolean) {
    return this.channelWrapper.ack(message, allUpTo);
  }

  public async nack(message: Message, allUpTo?: boolean, requeue?: boolean) {
    return this.channelWrapper.nack(message, allUpTo, requeue);
  }
}
