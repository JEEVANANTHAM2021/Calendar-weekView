import { useEffect, useState } from 'react';
import WeekView from './components/WeekView';
import EventDetailsModal from './components/EventDetails';
import { fetchEventsInRange, createEvent, type EventDTO } from './api/events';
import { updateEvent } from './api/events';
import { login, getMe, logout, register, type UserDTO } from './api/auth';
import { startOfWeek, addDays } from 'date-fns';


function App() {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const [activeEvent, setActiveEvent] = useState<EventDTO | null>(null);
  
  const [weekStart, setWeekStart] = useState(
  () => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = addDays(weekStart, 6);

  const [newEmail, setNewEmail] = useState('');
  const [newReminderMinutes, setNewReminderMinutes] = useState<number | undefined>(5);

  //User Auth & Register
  const [user, setUser] = useState<UserDTO | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  // register form state
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');


 ///UseEffect for Auth ---->
 useEffect(() => {
  async function initAuth() {
    try {
      setAuthLoading(true);
      const me = await getMe();
      setUser(me);
    } catch (err) {
      console.error('auth init failed', err);
    } finally {
      setAuthLoading(false);
    }
  }
  initAuth();
}, []);

//UseEffect to Load ---->
 useEffect(() => {
  // don't load events until we know auth status
  if (!user) return;

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEventsInRange(
        weekStart.toISOString(),
        weekEnd.toISOString()
      );
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  load();
}, [user, weekStart]);

  function handleSlotClick(day: Date, hour: number) {
    setSelectedDay(day);
    setSelectedHour(hour);
    setNewTitle('');
    setIsDialogOpen(true);
  }

  async function handleCreateEvent() {
    if (!selectedDay || selectedHour === null || !newTitle.trim()) return;

    const start = new Date(selectedDay);
    start.setHours(selectedHour, 0, 0, 0);

    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    try {
      const created = await createEvent({
        title: newTitle.trim(),
        start: start.toISOString(),
        end: end.toISOString(),
        attendeeEmail: newEmail.trim() || undefined,
        reminderMinutesBefore: newReminderMinutes,
      });
      setEvents((prev) => [...prev, created]);
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to create event', err);
      alert('Failed to create event');
    }
  }

  function handleEventClick(event: EventDTO) {
    setActiveEvent(event);
  }

  function handleEventUpdate(updated: EventDTO) {
    setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
  }

  function handleEventDelete(id: string) {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  }

  async function handleEventDrop(event: EventDTO, newStartISO: string, newEndISO: string) {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === event.id ? { ...ev, start: newStartISO, end: newEndISO } : ev))
    );

    try {
      const updated = await updateEvent(event.id, {
        start: newStartISO,
        end: newEndISO,
        title: event.title,
      });
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
    } catch (err) {
      console.error('Failed to move event', err);
      alert('Failed to move event, reloading data');

      try {
        const data = await fetchEventsInRange(weekStart.toISOString(), weekEnd.toISOString());
        setEvents(data);
      } catch (err2) {
        console.error('Failed to reload events', err2);
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  try {
    setAuthError(null);
    const u = await login(loginEmail, loginPassword);
    setUser(u);
  } catch (err: any) {
    console.error('login failed', err);
    setAuthError(err.message ?? 'Login failed');
  }
}

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      setAuthError(null);
      const u = await register(registerName, registerEmail, registerPassword);
      setUser(u);            // logged in immediately after sign up
      setIsRegisterMode(false);
    } catch (err: any) {
      console.error('register failed', err);
      setAuthError(err.message ?? 'Register failed');
    }
  }


async function handleLogout() {                          //// Handling---> Logout function
  try {
    await logout();
    setUser(null);
  } catch (err) {
    console.error('logout failed', err);
  }
}

// Auth loading
if (authLoading) {
  return (
    <main className="p-4">
      Checking session...
    </main>
  );
}

    // 1) WHEN USER IS NOT LOGGED IN
if (!user) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-teal-500 font-sans px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md rounded-lg bg-white/90 shadow-lg p-4 sm:p-6">
        {/* Toggle: Login / Sign up */}
        <div className="mb-4 flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setAuthError(null);
            }}
            className={`flex-1 cursor-pointer border-none py-2 text-sm outline-none
              ${!isRegisterMode ? 'bg-teal-200 font-semibold' : 'bg-transparent font-normal'}`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setAuthError(null);
            }}
            className={`flex-1 cursor-pointer border-none py-2 text-sm outline-none
              ${isRegisterMode ? 'bg-teal-200 font-semibold' : 'bg-transparent font-normal'}`}
          >
            Sign up
          </button>
        </div>

        {authError && (
          <p className="mb-2 mt-0 text-xs text-red-500">{authError}</p>
        )}

        {!isRegisterMode ? (
          // LOGIN FORM
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded bg-teal-500 py-2 text-sm text-white hover:bg-teal-600 transition-colors"
            >
              Sign in
            </button>
          </form>
        ) : (
          // SIGNUP FORM
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs">Name</label>
              <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs">Email</label>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs">Create Password</label>
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded bg-teal-500 py-2 text-sm text-white hover:bg-teal-600 transition-colors"
            >
              Create account
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

// 2) WHEN USER IS LOGGED IN (CALENDAR VIEW)
return (
  <main className="min-h-screen box-border bg-slate-50 font-sans px-2 py-4 sm:px-4">
    {/* Header */}
    <header className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: title + week controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <h1 className="text-lg font-bold">Calendar Week View</h1>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
          >
            ◀ Prev
          </button>

          <button
            type="button"
            onClick={() =>
              setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
            }
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
          >
            Next ▶
          </button>
        </div>
      </div>

      {/* Right: user / logout */}
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="mr-1 text-sm font-semibold">
          {user ? `Hi, ${user.name ?? user.email}` : ''}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-gray-300 bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600"
        >
          Logout
        </button>
      </div>
    </header>

    {/* Loading / error */}
    {loading && <p>Loading events...</p>}
    {error && <p className="text-red-500">{error}</p>}

    {/* Week view container – scrollable on small screens */}
    {!loading && !error && (
      <section className="mt-2 h-[70vh] min-h-[400px] overflow-auto rounded-lg border border-gray-200 bg-white">
        <WeekView
          events={events}
          weekStart={weekStart}
          onSlotClick={handleSlotClick}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
        />
      </section>
    )}

    {/* Create event dialog */}
    {isDialogOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2">
        <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl sm:max-w-md">
          <h2 className="mb-2 mt-0 text-lg font-semibold">Create Event</h2>

          <div className="mb-2 text-xs text-gray-600">
            {selectedDay && selectedHour !== null && (
              <>
                {selectedDay.toDateString()} at{' '}
                {selectedHour.toString().padStart(2, '0')}:00
              </>
            )}
          </div>

          {/* Title */}
          <div className="mb-3">
            <label className="mb-1 block text-xs">Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="mb-1 block text-xs">
              Reminder Email (optional)
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Reminder time */}
          <div className="mb-4">
            <label className="mb-1 block text-xs">
              Reminder before event
            </label>
            <select
              value={newReminderMinutes ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setNewReminderMinutes(v === '' ? undefined : Number(v));
              }}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No reminder</option>
              <option value="5">5 minutes before</option>
              <option value="10">10 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateEvent}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Event details modal */}
    {activeEvent && (
      <EventDetailsModal
        event={activeEvent}
        onClose={() => setActiveEvent(null)}
        onUpdate={handleEventUpdate}
        onDelete={handleEventDelete}
      />
    )}
  </main>
);

}

export default App;
