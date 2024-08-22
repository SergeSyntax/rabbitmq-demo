import { Subjects } from "../../events/subjects";

export interface EventStructure {
  subject: Subjects;
  data: unknown;
}
