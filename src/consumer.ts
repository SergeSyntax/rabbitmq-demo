import { messageBusConnection } from './events/message-bus-connection';
import { UserCreatedListener } from './events/user-created-listener';

new UserCreatedListener(messageBusConnection.channelWrapper).listen();
