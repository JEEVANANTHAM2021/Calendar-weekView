import { useState } from 'react';
import type { EventDTO } from '../api/events';
import { format } from 'date-fns';
import { updateEvent, deleteEvent } from '../api/events';

interface EventDetailsProps {
  event: EventDTO;
  onClose: () => void;
  onUpdate: (updated: EventDTO) => void;
  onDelete: (id: string) => void;
}

export default function EventDetails({
  event,
  onClose,
  onUpdate,
  onDelete,
}: EventDetailsProps) {
  const [title, setTitle] = useState(event.title);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);
      const updated = await updateEvent(event.id, {
        title,
        start: event.start,
        end: event.end,
      });
      onUpdate(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update event', err);
      alert('Failed to update event');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this event?')) return;
    try {
      setDeleting(true);
      await deleteEvent(event.id);
      onDelete(event.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete event', err);
      alert('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/30">
      <div className="min-w-[320px] rounded-lg bg-white p-4 shadow-2xl">
        <h3 className="mb-3 text-base font-semibold text-gray-900">
          Event Details
        </h3>

        <div className="mb-3">
          <label className="mb-1 block text-xs text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4 text-xs text-gray-500">
          <div>
            {format(new Date(event.start), 'PPpp')} –{' '}
            {format(new Date(event.end), 'PPpp')}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`rounded border-none px-3 py-1.5 text-[13px] text-white ${
              deleting
                ? 'cursor-not-allowed bg-red-400'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`rounded border-none px-3 py-1.5 text-[13px] text-white ${
              saving
                ? 'cursor-not-allowed bg-blue-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
