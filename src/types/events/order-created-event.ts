import { Subjects } from "../../events/subjects";

export interface OrderCreatedEvent {
  subject: Subjects.ORDER_CREATED;
  data: {
    id: string;
    version: number;
    userId: string;
    expiresAt: Date;
    media: {
      id: string;
      price: number;
    };
  };
}
