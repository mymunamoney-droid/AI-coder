import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import createOrchestrateRouter from './routes/orchestrate.js';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/api', createOrchestrateRouter(io));

app.get('/health', (_, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Server running on ${port}`));
