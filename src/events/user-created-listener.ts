import { ConsumeMessage } from 'amqplib';
import { Listener } from './listener';
import { Subjects } from './subjects';
import { UserCreatedEvent } from './user-created-event';
import * as env from '../config';
import { delay } from '../utils';
import ms from 'ms';

export class UserCreatedListener extends Listener<UserCreatedEvent> {
  readonly subject = Subjects.USER_CREATED;
  group = env.SERVICE_NAME;

  async onMessage(data: UserCreatedEvent['data'], _msg: ConsumeMessage) {
    console.log(' [x] Received %s', data);
    await delay(ms('2s'));
    console.log(' [x] Done\n');
  }
}
