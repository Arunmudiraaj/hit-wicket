import { getErrorMessage } from "../utils/utils.js";

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) return;
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(getErrorMessage(err));
    process.exit(1);
  }
};

export default connectDB;
