import { ConsumeMessage } from 'amqplib';
import { Listener } from './listener';
import { Subjects } from './subjects';
import { UserCreatedEvent } from './user-created-event';
import * as env from '../config';
import { delay } from '../utils';

export class UserCreatedListener extends Listener<UserCreatedEvent> {
  readonly subject = Subjects.USER_CREATED;
  group = env.SERVICE_NAME;

  async onMessage(data: UserCreatedEvent['data'], _msg: ConsumeMessage) {
    console.log(' [x] Received %s', data);
    await delay(1900);
    console.log(' [x] Done');
  }
}
