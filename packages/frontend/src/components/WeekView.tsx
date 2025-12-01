import type { EventDTO } from '../api/events';
import { format, startOfDay, addDays } from 'date-fns';
import DraggableEvent from './DraggableEvent';

interface WeekViewProps {
  events: EventDTO[];
  weekStart: Date;
  onSlotClick?: (day: Date, hour: number) => void;
  onEventClick?: (event: EventDTO) => void;
  onEventDrop?: (event: EventDTO, newStartISO: string, newEndISO: string) => void;
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_IN_DAY = 24 * 60;

const getMinutesFromStartOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

function WeekView({ events, weekStart, onSlotClick, onEventClick, onEventDrop }: WeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex h-full rounded-lg border border-gray-200 text-[12px] font-sans">
      {/* Left hour column */}
      <div className="relative z-10 w-16 border-r border-gray-200 bg-gray-50">
        {/* top spacer */}
        <div className="h-10 border-b border-gray-200" />
        {hours.map((hour) => (
          <div
            key={hour}
            className="flex h-14 items-start justify-end border-b border-gray-100 pr-1"
          >
            <span className="text-[10px] text-gray-500">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="relative flex flex-1">
        {days.map((day, dayIndex) => {
          const dayEvents = events.filter((event) => {
            const eventDate = new Date(event.start);
            return (
              eventDate.getFullYear() === day.getFullYear() &&
              eventDate.getMonth() === day.getMonth() &&
              eventDate.getDate() === day.getDate()
            );
          });

          return (
            <div
              key={dayIndex}
              className="relative min-w-[140px] flex-1 border-r border-gray-200 bg-white"
            >
              {/* Day header */}
              <div className="sticky top-0 z-10 border-b border-gray-200 bg-white text-center py-1">
                <div className="text-[11px] tracking-[0.05em] uppercase text-gray-500">
                  {format(day, 'EEE')}
                </div>
                <div className="text-[13px] font-semibold">
                  {format(day, 'd MMM')}
                </div>
              </div>

              {/* Grid + events */}
              <div className="relative h-[1344px]">
                {/* Background slots */}
                <div
                  className="absolute inset-0 grid"
                  style={{
                    gridTemplateRows: `repeat(${hours.length}, minmax(0, 1fr))`,
                  }}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className={`border-b border-gray-100 ${
                        onSlotClick ? 'cursor-pointer' : 'cursor-default'
                      }`}
                      onClick={() => {
                        if (onSlotClick) onSlotClick(day, h);
                      }}
                    />
                  ))}
                </div>

                {/* Events */}
                <div className="pointer-events-none absolute inset-0 px-1">
                  {dayEvents.map((event) => {
                    const start = new Date(event.start);
                    const end = new Date(event.end);

                    const startMinutes = getMinutesFromStartOfDay(start);
                    const endMinutesRaw = getMinutesFromStartOfDay(end);
                    const endMinutes = Math.max(startMinutes + 30, endMinutesRaw);

                    const topPercent = (startMinutes / MINUTES_IN_DAY) * 100;
                    const heightPercent =
                      ((endMinutes - startMinutes) / MINUTES_IN_DAY) * 100;

                    return (
                      <DraggableEvent
                        key={event.id}
                        event={event}
                        style={{
                          position: 'absolute',
                          left: 2,
                          right: 2,
                          top: `${topPercent}%`,
                          height: `${heightPercent}%`,
                          borderRadius: 6,
                          background: 'rgba(59,130,246,0.12)',
                          border: '1px solid rgba(59,130,246,0.6)',
                          padding: '4px 6px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                        onDragEnd={(e, dy) => {
                          // treat tiny movement as click -> open details
                          if (Math.abs(dy) < 4) {
                            if (onEventClick) onEventClick(e);
                            return;
                          }

                          const SNAP_MINUTES = 15;
                          const HOUR_HEIGHT_PX = 56;

                          const startDate = new Date(e.start);
                          const endDate = new Date(e.end);
                          const durationMs = endDate.getTime() - startDate.getTime();
                          const durationMinutes = durationMs / (1000 * 60);

                          const originalStartMinutes =
                            getMinutesFromStartOfDay(startDate);

                          let deltaMinutes = (dy / HOUR_HEIGHT_PX) * 60;
                          deltaMinutes =
                            Math.round(deltaMinutes / SNAP_MINUTES) * SNAP_MINUTES;

                          let newStartMinutes = originalStartMinutes + deltaMinutes;
                          const maxStartMinutes = MINUTES_IN_DAY - durationMinutes;
                          newStartMinutes = Math.max(
                            0,
                            Math.min(maxStartMinutes, newStartMinutes),
                          );

                          const baseDay = new Date(startDate);
                          baseDay.setHours(0, 0, 0, 0);
                          baseDay.setMinutes(newStartMinutes);

                          const newStart = baseDay;
                          const newEnd = new Date(newStart.getTime() + durationMs);

                          if (onEventDrop) {
                            onEventDrop(e, newStart.toISOString(), newEnd.toISOString());
                          }
                        }}
                      >
                        <div className="overflow-hidden whitespace-nowrap text-ellipsis text-[11px] font-semibold">
                          {event.title}
                        </div>
                        <div className="text-[10px] text-blue-700">
                          {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                        </div>
                      </DraggableEvent>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeekView;
