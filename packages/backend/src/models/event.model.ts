import {Schema, model, InferSchemaType, HydratedDocument,} from 'mongoose';
import type { EventDTO } from '@calendar/shared';

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    color: { type: String },
    recurrenceRule: { type: String },

    // Reminder-related fields
    attendeeEmail: { type: String },
    reminderMinutesBefore: { type: Number },
    reminderSent: { type: Boolean, default: false },
    
  },
  {
    timestamps: true,
  }
);

// 1) Shape of document data (no methods)
type EventAttrs = InferSchemaType<typeof EventSchema>;

// 2) HydratedDocument = data + mongoose instance methods (.save, .populate, etc.)
export type EventDocument = HydratedDocument<EventAttrs>;

// 3) Model uses EventAttrs as generic, Mongoose infers docs as HydratedDocument<EventAttrs>
export const EventModel = model<EventAttrs>('Event', EventSchema);

export function toEventDTO(doc: EventDocument): EventDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description ?? undefined,
    start: doc.start.toISOString(),
    end: doc.end.toISOString(),
    allDay: doc.allDay,
    color: doc.color ?? undefined,
    recurrenceRule: doc.recurrenceRule ?? undefined,

    attendeeEmail: doc.attendeeEmail ?? undefined,
    reminderMinutesBefore: doc.reminderMinutesBefore ?? undefined,
    reminderSent: doc.reminderSent ?? undefined,

    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
