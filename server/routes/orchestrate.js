import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { callGemini, callGroq, callOpenRouter } from '../agents/aiClients.js';
import { parseMultiFileOutput } from '../utils/fileParser.js';
import { autoProjectName, writeProjectFiles } from '../utils/projectUtils.js';
import { readMemory, writeMemory } from '../utils/memoryStore.js';

export default function createOrchestrateRouter(io) {
  const router = express.Router();

  router.post('/run', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

    const runId = `${Date.now()}`;
    res.json({ runId });

    const send = (event, payload) => io.emit(event, { runId, ...payload });

    try {
      const memory = await readMemory();
      const memoryContext = JSON.stringify(memory.history.slice(-5));

      send('status', { agent: 'Gemini', state: 'running' });
      const planPrompt = `You are planner. User prompt: ${prompt}\nMemory: ${memoryContext}\nReturn project plan, architecture, and file structure.`;
      const plan = await callGemini({ apiKey: process.env.GEMINI_API_KEY, prompt: planPrompt });
      if (!plan) throw new Error('Gemini returned empty response');
      send('log', { message: 'Gemini plan complete' });
      send('stream', { agent: 'Gemini', chunk: plan });

      send('status', { agent: 'Qwen', state: 'running' });
      const codePrompt = `User prompt: ${prompt}\nPlan:\n${plan}\nReturn multi-file code with format FILE: path\\n<code>`;
      const qwenCode = await callGroq({ apiKey: process.env.GROQ_API_KEY, prompt: codePrompt });
      if (!qwenCode) throw new Error('Qwen returned empty response');
      send('stream', { agent: 'Qwen', chunk: qwenCode });

      send('status', { agent: 'Nemotron', state: 'running' });
      const reviewPrompt = `Prompt: ${prompt}\nPlan:${plan}\nCode:\n${qwenCode}\nReview bugs, improvements, optimization.`;
      const review = await callOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY, model: 'nvidia/nemotron-3-super-120b-a12b:free', prompt: reviewPrompt });
      if (!review) throw new Error('Nemotron returned empty response');
      send('stream', { agent: 'Nemotron', chunk: review });

      send('status', { agent: 'Owl', state: 'running' });
      const fixPrompt = `Prompt:${prompt}\nPlan:${plan}\nCode:${qwenCode}\nReview:${review}\nReturn final corrected multi-file output in FILE format.`;
      const fixed = await callOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY, model: 'owl/owl-alpha', prompt: fixPrompt });
      if (!fixed) throw new Error('Owl returned empty response');
      send('stream', { agent: 'Owl', chunk: fixed });

      const parsed = parseMultiFileOutput(fixed);
      if (!Object.keys(parsed).length) throw new Error('Invalid multi-file output from Owl');

      const projectName = autoProjectName(prompt);
      const dir = path.join(process.cwd(), '..', 'projects', 'generated-projects', projectName);
      await fs.mkdir(dir, { recursive: true });
      await writeProjectFiles(dir, parsed);

      memory.history.push({ timestamp: new Date().toISOString(), prompt, plan });
      memory.projects.push({ runId, projectName, files: Object.keys(parsed) });
      await writeMemory(memory);

      send('complete', { projectName, files: parsed, review, plan });
    } catch (error) {
      send('error', { message: error.message || 'Unexpected orchestration error' });
    }
  });

  router.get('/download/:projectName', async (req, res) => {
    const folderPath = path.join(process.cwd(), '..', 'projects', 'generated-projects', req.params.projectName);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.projectName}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => res.status(500).send(err.message));
    archive.pipe(res);
    archive.directory(folderPath, false);
    archive.finalize();
  });

  return router;
}
