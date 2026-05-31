import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import fs from 'fs';
import path from 'path';

const router = Router();

interface LogEntry {
  timestamp: string;
  systemInstruction: string;
  prompt: string;
  response: string;
}

function parseLogFile(): LogEntry[] {
  const logPath = path.join(process.cwd(), 'logs', 'gemini-debug.log');

  if (!fs.existsSync(logPath)) {
    return [];
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const entries: LogEntry[] = [];

  // Split by timestamp pattern to get individual requests
  const requestPattern = /\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\] GEMINI REQUEST/g;
  const timestamps: { index: number; timestamp: string }[] = [];

  let match;
  while ((match = requestPattern.exec(content)) !== null) {
    timestamps.push({ index: match.index, timestamp: match[1] });
  }

  for (let i = 0; i < timestamps.length; i++) {
    const startIndex = timestamps[i].index;
    const endIndex = i < timestamps.length - 1 ? timestamps[i + 1].index : content.length;
    const block = content.substring(startIndex, endIndex);

    const entry: LogEntry = {
      timestamp: timestamps[i].timestamp,
      systemInstruction: '',
      prompt: '',
      response: '',
    };

    // Extract System Instruction
    const sysMatch = block.match(/=== SYSTEM INSTRUCTION ===\s*([\s\S]*?)(?==== PROMPT ===|$)/);
    if (sysMatch) {
      entry.systemInstruction = sysMatch[1].trim();
    }

    // Extract Prompt
    const promptMatch = block.match(/=== PROMPT ===\s*([\s\S]*?)(?=={10,}|=== GEMINI RESPONSE ===|$)/);
    if (promptMatch) {
      entry.prompt = promptMatch[1].trim();
    }

    // Extract Response
    const responseMatch = block.match(/=== GEMINI RESPONSE ===\s*([\s\S]*?)(?=={10,}|$)/);
    if (responseMatch) {
      entry.response = responseMatch[1].trim();
    }

    entries.push(entry);
  }

  // Return newest first (reverse order)
  return entries.reverse();
}

router.get('/', authenticate, authorize('ADMIN'), (_req, res) => {
  try {
    const entries = parseLogFile();
    res.json({
      success: true,
      data: {
        entries,
        count: entries.length,
      },
    });
  } catch (error) {
    console.error('Log parse error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOG_READ_ERROR',
        message: 'Failed to read log file',
      },
    });
  }
});

router.delete('/', authenticate, authorize('ADMIN'), (_req, res) => {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'gemini-debug.log');
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }
    res.json({
      success: true,
      message: 'Log file cleared',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'LOG_DELETE_ERROR',
        message: 'Failed to clear log file',
      },
    });
  }
});

export default router;
