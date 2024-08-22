import { Subjects } from "../../events/subjects";

export interface OrderCancelledEvent {
  subject: Subjects.ORDER_CANCELLED;
  data: {
    id: string;
    version: number;
    media: {
      id: string;
    };
  };
}
