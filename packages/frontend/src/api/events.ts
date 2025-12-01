
export interface EventDTO {
  id: string;
  title: string;
  start: string;  // ISO string
  end: string;    // ISO string
  allDay: boolean;
  description?: string;
  color?: string;
  recurrenceRule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  start: string;  // ISO
  end: string;    // ISO
  description?: string;
  allDay?: boolean;
  color?: string;
  recurrenceRule?: string;
  attendeeEmail?: string;
  reminderMinutesBefore?: number;
}

const BASE_URL = 'http://localhost:4000';

// GET events for range
export async function fetchEventsInRange(start: string, end: string): Promise<EventDTO[]> {
  const url = `${BASE_URL}/api/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(
    end
  )}`;
  const res = await fetch(url ,{
      credentials: 'include'
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch events: ${res.status} ${text}`);
  }

  return res.json() as Promise<EventDTO[]>;
}

// POST create event
export async function createEvent(input: CreateEventInput): Promise<EventDTO> {
  const res = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to create event: ${res.status} ${text}`);
  }

  return res.json() as Promise<EventDTO>;
}

// PUT update event
export async function updateEvent(
  id: string,
  input: Partial<CreateEventInput>
): Promise<EventDTO> {
  const res = await fetch(`${BASE_URL}/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update event: ${res.status} ${text}`);
  }

  return res.json() as Promise<EventDTO>;
}

// DELETE event
export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/events/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to delete event: ${res.status} ${text}`);
  }
}
