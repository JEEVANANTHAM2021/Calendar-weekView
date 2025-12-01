import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

export async function connectMongo() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');
}
