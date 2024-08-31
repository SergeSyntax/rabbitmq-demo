import { POD_NAME, RMQ_HOST, RMQ_PASSWORD, RMQ_PORT, RMQ_PROTOCOL, RMQ_USERNAME } from './config';
import { MessageBusClient } from './events/message-bus-client';

export const messageBusClient = new MessageBusClient({
  parsedHosts: RMQ_HOST,
  parsedPorts: RMQ_PORT,
  connectionName: POD_NAME,
  connectOptions: {
    username: RMQ_USERNAME,
    password: RMQ_PASSWORD,
    protocol: RMQ_PROTOCOL
  }
});
