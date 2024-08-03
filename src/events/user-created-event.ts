import { Subjects } from './subjects';

// NOTE: this is only a good choice if all the services written in Javascript/TypeScript if you have for example a service in Java Check alternatives JSON Schema, ProtoBuf and ApacheAvro (mostly focus on java)
export interface UserCreatedEvent {
  subject: Subjects.USER_CREATED;
  data: {
    id: string;
    email: string;
    message: string;
    timestamp: Date;
  };
}
