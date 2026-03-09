import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '../../temp');

// Ensure temp directory exists
await fs.mkdir(TEMP_DIR, { recursive: true });

// Helper to run a command and return promise
function runCommand(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      if (error) reject({ error, stdout, stderr });
      else resolve({ stdout, stderr });
    });
  });
}

router.post('/create', async (req, res) => {
  const { files, startCommand = 'npm run dev' } = req.body;
  if (!files || typeof files !== 'object') {
    return res.status(400).json({ error: 'Invalid files object' });
  }

  const sessionId = uuidv4().slice(0, 8);
  const workDir = path.join(TEMP_DIR, sessionId);

  try {
    // Write files
    await fs.mkdir(workDir, { recursive: true });
    for (const [filePath, content] of Object.entries(files)) {
      const full = path.join(workDir, filePath);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, content);
    }

    // Install dependencies if package.json exists
    if (files['package.json']) {
      await runCommand('npm install', workDir);
    }

    // Start the dev server in the background
    const serverProcess = exec(startCommand, { cwd: workDir });
    let serverOutput = '';

    serverProcess.stdout.on('data', (data) => { serverOutput += data; });
    serverProcess.stderr.on('data', (data) => { serverOutput += data; });

    // Wait a moment for the server to start (adjust timeout as needed)
    await new Promise(r => setTimeout(r, 5000));

    // The preview URL – Render will route this to your service
    const previewUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/preview/${sessionId}`;

    res.json({
      success: true,
      sessionId,
      previewUrl,
      logs: serverOutput,
    });

    // Clean up after some time (optional)
    setTimeout(() => {
      serverProcess.kill();
      fs.rm(workDir, { recursive: true, force: true }).catch(console.error);
    }, 30 * 60 * 1000); // 30 minutes

  } catch (err) {
    console.error('Preview creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve static preview files (for simple HTML/JS projects)
router.get('/:sessionId/*', async (req, res) => {
  const { sessionId, 0: filePath } = req.params;
  const fullPath = path.join(TEMP_DIR, sessionId, filePath || 'index.html');

  try {
    await fs.access(fullPath);
    res.sendFile(fullPath);
  } catch {
    res.status(404).send('File not found');
  }
});

export default router;
