import { ConsumeMessage } from 'amqplib';
import { env } from '../config';
import { Listener } from './listener';
import { channelWrapper } from '../connection';
import { Subjects } from './subjects';
import { UserCreatedEvent } from './user-created-event';

export class UserCreatedListener extends Listener<UserCreatedEvent> {
  readonly subject = Subjects.USER_CREATED;
  group = env.SERVICE_NAME;

  onMessage(data: UserCreatedEvent['data'], msg: ConsumeMessage) {
    try {
      const secs = data.message.split('.').length - 1;

      console.log(" [x] %s: '%s'", msg.fields.routingKey, data);

      channelWrapper.ack(msg);
      console.log(' [x] Received %s', data);
      setTimeout(() => {
        console.log(' [x] Done');
      }, secs * 1000);
    } catch (err) {
      console.error('Error processing message:', err);
      channelWrapper.nack(msg, false, true); // Reject the message and requeue it
    }
  }
}
