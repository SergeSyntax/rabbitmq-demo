import { Subjects } from './subjects';

export interface UserCreatedEvent {
  subject: Subjects.USER_CREATED;
  data: {
    id: string;
    email: string;
    message: string;
    timestamp: Date;
  };
}
