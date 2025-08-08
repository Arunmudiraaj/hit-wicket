import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { initSocket } from './socket/index.js';

dotenv.config();
cors({ origin: "*" });

const app = express();
const server = http.createServer(app);
initSocket(server); // Pass HTTP server to initialize socket.io

connectDB();

app.get('/', (req, res) => {
  res.send("HitWicket Game Server is running.");
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
