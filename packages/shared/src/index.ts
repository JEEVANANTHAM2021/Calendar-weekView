
export interface EventDTO  {
    id: string
    title: string
    description?: string
    start: string
    end: string
    allDay: boolean
    color?: string
    recurrenceRule?: string
    createdAt: string
    updatedAt: string
    attendeeEmail?: string;
    reminderMinutesBefore?: number;
    reminderSent?: boolean;
        
}

export interface CreateEventPayload {
    title: string
    description?: string
    start: string
    end: string
    allDay?: boolean
    color?: string
    recurrenceRule?: string
    attendeeEmail?: string;
    reminderMinutesBefore?: number;

}

export interface UpdateEventPayload {

    title?: string
    description?: string
    start?: string
    end?: string
    allDay?: boolean
    color?: string
    recurrenceRule?: string
    attendeeEmail?: string;
    reminderMinutesBefore?: number;
    reminderSent?: boolean;

}
