import { Subjects } from "../../events/subjects";

export interface MediaUpdatedEvent {
  subject: Subjects.MEDIA_UPDATED;
  data: {
    id: string;
  };
}
