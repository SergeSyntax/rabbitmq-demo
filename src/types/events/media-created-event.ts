import { Subjects } from "../../events/subjects";

export interface MediaCreatedEvent {
  subject: Subjects.MEDIA_CREATED;
  data: {
    id: string;
  };
}
