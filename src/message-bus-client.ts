
import {
  POD_NAME,
  RMQ_HOST,
  RMQ_PASSWORD,
  RMQ_PORT,
  RMQ_PROTOCOL,
  RMQ_USERNAME,
} from "./config";
import { MessageBusClient } from "./events/message-bus-client";

export const messageBusClient = new MessageBusClient({
  urls: RMQ_HOST.split(",").map((hostname) => ({
    hostname,
    port: +RMQ_PORT,
    username: RMQ_USERNAME,
    password: RMQ_PASSWORD,
    protocol: RMQ_PROTOCOL,
  })),
  connectionName: POD_NAME,
});
