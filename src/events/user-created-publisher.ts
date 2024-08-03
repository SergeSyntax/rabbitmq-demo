import { Publisher } from "./publisher";
import { Subjects } from "./subjects";
import { UserCreatedEvent } from "./user-created-event";

export class UserCreatedPublisher extends Publisher<UserCreatedEvent> {
  readonly subject = Subjects.USER_CREATED;
}
