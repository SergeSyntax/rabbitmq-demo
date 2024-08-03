import { channelWrapper } from './connection';
import { UserCreatedListener } from './events/user-created-listener';

new UserCreatedListener(channelWrapper).listen();
