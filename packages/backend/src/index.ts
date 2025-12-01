import bcrypt  from 'bcryptjs';
import express from 'express'
import cors from 'cors'
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { toEventDTO } from './models/event.model';
import type { CreateEventPayload } from '@calendar/shared';
import { sendEventReminderMail } from './mailer';
import type { EventDocument } from './models/event.model';
import { EventModel } from './models/event.model';
import cookieParser from 'cookie-parser'
import { UserModel, toUserDTO } from './models/user.model';
import { signAccessToken, type AuthRequest, authMiddleware} from './auth'



   //for production
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  // Local development only
  config({ path: '../../.env' });
}
console.log('Loaded MONGO_URI:', process.env.MONGO_URI);


//config
const app = express()
const PORT = process.env.PORT || 4000


//middleware
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_DEV || 'http://localhost:5173',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);


const cookieOptions = {
  httpOnly: true,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  secure: isProd,
};

// AUTH ROUTES
// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: 'email, password, and name are required' });
    }

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ email, passwordHash, name });

    const token = signAccessToken(user);

    res.cookie('token', token, cookieOptions);

    return res.status(201).json({ user: toUserDTO(user) });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ message: 'Failed to register' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signAccessToken(user);

    res.cookie('token', token, cookieOptions);

    return res.json({ user: toUserDTO(user) });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Failed to login' });
  }
});

// Logout
app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token', {
  sameSite: cookieOptions.sameSite,
  secure: cookieOptions.secure,
});
  return res.json({ success: true });
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  return res.json({ user: toUserDTO(user) });
});



//Api GET&POST events
//GET Events
app.get('/api/events', async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: 'start and end query params are required' });
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'start or end is not a valid date' });
    }

    const events = await EventModel.find({
      start: { $lt: endDate },
      end: { $gt: startDate },
    }).sort({ start: 1 });

    const dtos = events.map(toEventDTO);
    return res.json(dtos);
  } catch (err) {
    console.error('Failed to fetch events', err);
    return res.status(500).json({ message: 'Failed to fetch events' });
  }
});

//POST events
app.post('/api/events', async (req, res) => {
  try {
    const payload = req.body as CreateEventPayload | undefined;

    if (!payload) {
      return res.status(400).json({ message: 'Request body is required' });
    }

    if (!payload.title || !payload.start || !payload.end) {
      return res.status(400).json({ message: 'title, start, and end are required' });
    }

    const startDate = new Date(payload.start);
    const endDate = new Date(payload.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'start or end is not a valid date' });
    }

    const doc = await EventModel.create({
      title: payload.title,
      description: payload.description ?? undefined,
      start: startDate,
      end: endDate,
      allDay: payload.allDay ?? false,
      color: payload.color ?? undefined,
      recurrenceRule: payload.recurrenceRule ?? undefined,
      attendeeEmail: payload.attendeeEmail ?? undefined,
      reminderMinutesBefore: payload.reminderMinutesBefore ?? undefined,
      reminderSent: false,
    });

    const dto = toEventDTO(doc);
    return res.status(201).json(dto);
  } catch (err) {
    console.error('Failed to create event', err);
    return res.status(500).json({ message: 'Failed to create event' });
  }
});



//Api listen
async function start() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    setInterval(checkAndSendReminders, 60_000);
  } catch (err) {
    console.error('Failed to start server', err);
  }
}

start();


// PUT /api/events/:id  -> update event
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body; // partial update allowed

    if (!id) return res.status(400).json({ message: 'id required' });

    // Build updates: only allow specific fields
    const updates: Partial<any> = {};
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.start !== undefined) updates.start = new Date(payload.start);
    if (payload.end !== undefined) updates.end = new Date(payload.end);
    if (payload.allDay !== undefined) updates.allDay = payload.allDay;
    if (payload.color !== undefined) updates.color = payload.color;
    if (payload.recurrenceRule !== undefined) updates.recurrenceRule = payload.recurrenceRule;
    // inside app.put('/api/events/:id'...)
    if (payload.attendeeEmail !== undefined) updates.attendeeEmail = payload.attendeeEmail;
    if (payload.reminderMinutesBefore !== undefined) {
        updates.reminderMinutesBefore = payload.reminderMinutesBefore;
        updates.reminderSent = false; // reset if user changes reminder
}
if (payload.reminderSent !== undefined) updates.reminderSent = payload.reminderSent;


    const doc = await EventModel.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return res.status(404).json({ message: 'Event not found' });

    return res.json(toEventDTO(doc));
  } catch (err) {
    console.error('Failed to update event', err);
    return res.status(500).json({ message: 'Failed to update event' });
  }
});

// DELETE /api/events/:id  -> delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id required' });

    const doc = await EventModel.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Event not found' });

    return res.json({ success: true, id: doc._id.toString() });
  } catch (err) {
    console.error('Failed to delete event', err);
    return res.status(500).json({ message: 'Failed to delete event' });
  }
});
  
/// Reminder ----> Checking
async function checkAndSendReminders() {
  try {
    const now = new Date();

    const candidates: EventDocument[] = await EventModel.find({
      attendeeEmail: { $ne: null },
      reminderMinutesBefore: { $ne: null },
      reminderSent: { $ne: true },
      start: { $gt: now }, // future events
    });

    for (const ev of candidates) {
      const minutesBefore = ev.reminderMinutesBefore ?? 0;
      const reminderTime = new Date(ev.start.getTime() - minutesBefore * 60 * 1000);

      if (reminderTime <= now) {
        if (!ev.attendeeEmail) continue;

        console.log(
          `Sending reminder for event ${ev._id.toString()} to ${ev.attendeeEmail}`
        );

        await sendEventReminderMail({
          to: ev.attendeeEmail,
          title: ev.title,
          startISO: ev.start.toISOString(),
        });

        ev.reminderSent = true;
        await ev.save();
      }
    }
  } catch (err) {
    console.error('Error while checking reminders', err);
  }
}

