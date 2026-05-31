import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/app-error.js';
import { aiConfigService } from './ai-config.service.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

interface OHLCBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface OHLCResponse {
  success: boolean;
  symbol: string;
  timeframe: string;
  count: number;
  data: OHLCBar[];
}

interface AnalysisResult {
  id: string;
  analysis: string;
  hasEntry: boolean;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  pointsDeducted: number;
  createdAt: Date;
}

interface ParsedAIResponse {
  analysis: string;
  hasEntry: boolean;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
}

async function fetchOHLCData(symbol: string, timeframe: string, count: number = 100): Promise<OHLCBar[]> {
  try {
    const response = await axios.get<OHLCResponse>(`${config.mt5Api.url}/ohlc`, {
      params: { symbol, timeframe, count },
      timeout: 10000,
    });

    if (!response.data.success) {
      throw new AppError('Failed to fetch OHLC data from MT5', 500, 'MT5_FETCH_ERROR');
    }

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        throw new AppError('MT5 API is not available', 503, 'MT5_UNAVAILABLE');
      }
      throw new AppError(`MT5 API error: ${error.message}`, 500, 'MT5_ERROR');
    }
    throw error;
  }
}

function formatOHLCForPrompt(data: OHLCBar[]): string {
  const lines = data.map((bar) => {
    const date = new Date(bar.time * 1000).toISOString();
    return `${date} | O: ${bar.open} | H: ${bar.high} | L: ${bar.low} | C: ${bar.close} | V: ${bar.volume}`;
  });

  return lines.join('\n');
}

function buildPrompt(template: string, timeframe: string, ohlcData: string): string {
  return template
    .replace(/\{\{timeframe\}\}/g, timeframe)
    .replace(/\{\{ohlcData\}\}/g, ohlcData);
}

function parseAIResponse(responseText: string): ParsedAIResponse {
  const result: ParsedAIResponse = {
    analysis: responseText,
    hasEntry: false,
    entry: null,
    stopLoss: null,
    takeProfit: null,
  };

  // Try to parse JSON format first (e.g., from structured AI responses)
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText;

    const parsed = JSON.parse(jsonStr);

    // Handle Vietnamese format: thong_so_lenh.entry/tp/sl
    if (parsed.thong_so_lenh) {
      const params = parsed.thong_so_lenh;
      if (params.entry && Array.isArray(params.entry) && params.entry.length > 0) {
        result.entry = parseFloat(params.entry[0]);
        result.hasEntry = true;
      }
      if (params.sl && Array.isArray(params.sl) && params.sl.length > 0) {
        result.stopLoss = parseFloat(params.sl[0]);
      }
      if (params.tp && Array.isArray(params.tp) && params.tp.length > 0) {
        result.takeProfit = parseFloat(params.tp[0]);
      }
    }

    // Handle English format: entry/stopLoss/takeProfit at root or nested
    if (!result.hasEntry) {
      const entryVal = parsed.entry ?? parsed.Entry;
      if (entryVal !== undefined && entryVal !== null) {
        result.entry = Array.isArray(entryVal) ? parseFloat(entryVal[0]) : parseFloat(entryVal);
        result.hasEntry = !isNaN(result.entry);
      }

      const slVal = parsed.sl ?? parsed.SL ?? parsed.stopLoss ?? parsed.stop_loss;
      if (slVal !== undefined && slVal !== null) {
        result.stopLoss = Array.isArray(slVal) ? parseFloat(slVal[0]) : parseFloat(slVal);
      }

      const tpVal = parsed.tp ?? parsed.TP ?? parsed.takeProfit ?? parsed.take_profit;
      if (tpVal !== undefined && tpVal !== null) {
        result.takeProfit = Array.isArray(tpVal) ? parseFloat(tpVal[0]) : parseFloat(tpVal);
      }
    }
  } catch {
    // JSON parsing failed, fall back to regex patterns
  }

  // Fallback: regex-based extraction for text format
  if (!result.hasEntry) {
    const entryMatch = responseText.match(/Entry[:\s]*(\d+\.?\d*)/i);
    const slMatch = responseText.match(/(?:Stop Loss|SL)[:\s]*(\d+\.?\d*)/i);
    const tpMatch = responseText.match(/(?:Take Profit|TP)[:\s]*(\d+\.?\d*)/i);

    if (entryMatch) {
      result.entry = parseFloat(entryMatch[1]);
      result.hasEntry = true;
    }

    if (slMatch) {
      result.stopLoss = parseFloat(slMatch[1]);
    }

    if (tpMatch) {
      result.takeProfit = parseFloat(tpMatch[1]);
    }
  }

  return result;
}

async function callGeminiAPI(systemInstruction: string, prompt: string): Promise<string> {
  if (!config.gemini.apiKey) {
    throw new AppError('Gemini API key not configured', 500, 'GEMINI_NOT_CONFIGURED');
  }

  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction,
  });

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(`Gemini API error: ${error.message}`, 500, 'GEMINI_ERROR');
    }
    throw error;
  }
}

function trimLogFile(filePath: string, maxEntries: number): void {
  try {
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf8');

    // Find all request timestamps to identify entry boundaries
    const requestPattern = /\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\] GEMINI REQUEST/g;
    const matches: { index: number }[] = [];

    let match;
    while ((match = requestPattern.exec(content)) !== null) {
      matches.push({ index: match.index });
    }

    // If we have more entries than maxEntries, trim the file
    if (matches.length > maxEntries) {
      // Keep only the last maxEntries
      const startIndex = matches[matches.length - maxEntries].index;
      const trimmedContent = content.substring(startIndex);
      fs.writeFileSync(filePath, trimmedContent, 'utf8');
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to trim log file');
  }
}

export const analysisService = {
  async analyze(userId: string, timeframe: string, symbol: string = 'XAUUSD'): Promise<AnalysisResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, points: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.points <= 0) {
      throw new AppError('Insufficient points. Please contact admin to get more points.', 400, 'INSUFFICIENT_POINTS');
    }

    const aiConfig = await aiConfigService.getActiveConfig();
    if (!aiConfig) {
      throw new AppError('No active AI configuration found', 500, 'NO_AI_CONFIG');
    }

    const ohlcData = await fetchOHLCData(symbol, timeframe, 100);
    const formattedOHLC = formatOHLCForPrompt(ohlcData);

    const systemInstruction = typeof aiConfig.systemInstruction === 'object'
      ? (aiConfig.systemInstruction as { content?: string; role?: string }).content
        || (aiConfig.systemInstruction as { role?: string }).role
        || JSON.stringify(aiConfig.systemInstruction)
      : String(aiConfig.systemInstruction);

    const prompt = buildPrompt(aiConfig.promptTemplate, timeframe, formattedOHLC);

    logger.info({
      event: 'gemini.request',
      systemInstruction: systemInstruction.substring(0, 500) + (systemInstruction.length > 500 ? '...' : ''),
      promptPreview: prompt.substring(0, 1000) + (prompt.length > 1000 ? '...' : ''),
      promptLength: prompt.length,
      ohlcBarsCount: ohlcData.length,
      timeframe,
      symbol,
    }, 'Sending request to Gemini AI');

    // Write full request to debug file
    const debugDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    const debugFile = path.join(debugDir, 'gemini-debug.log');
    const debugContent = `
================================================================================
[${new Date().toISOString()}] GEMINI REQUEST
================================================================================

=== SYSTEM INSTRUCTION ===
${systemInstruction}

=== PROMPT ===
${prompt}

================================================================================
`;
    fs.appendFileSync(debugFile, debugContent, 'utf8');

    const aiResponseText = await callGeminiAPI(systemInstruction, prompt);

    logger.info({
      event: 'gemini.response',
      responsePreview: aiResponseText.substring(0, 500) + (aiResponseText.length > 500 ? '...' : ''),
      responseLength: aiResponseText.length,
    }, 'Received response from Gemini AI');

    // Write full response to debug file
    const responseDebug = `
=== GEMINI RESPONSE ===
${aiResponseText}

================================================================================
`;
    fs.appendFileSync(debugFile, responseDebug, 'utf8');

    // Keep only last 3 entries in log file
    trimLogFile(debugFile, 3);

    const parsed = parseAIResponse(aiResponseText);

    const pointsToDeduct = parsed.hasEntry ? 1 : 0;

    const [analysis] = await prisma.$transaction([
      prisma.analysisHistory.create({
        data: {
          userId,
          timeframe,
          ohlcData: ohlcData as unknown as object,
          aiResponse: aiResponseText,
          hasEntry: parsed.hasEntry,
          entry: parsed.entry,
          stopLoss: parsed.stopLoss,
          takeProfit: parsed.takeProfit,
          pointsDeducted: pointsToDeduct,
        },
      }),
      ...(pointsToDeduct > 0
        ? [
            prisma.user.update({
              where: { id: userId },
              data: { points: { decrement: pointsToDeduct } },
            }),
            prisma.pointTransaction.create({
              data: {
                userId,
                amount: -pointsToDeduct,
                type: 'USAGE',
                reason: `AI analysis for ${symbol} ${timeframe}`,
                createdBy: 'SYSTEM',
              },
            }),
          ]
        : []),
    ]);

    return {
      id: analysis.id,
      analysis: aiResponseText,
      hasEntry: parsed.hasEntry,
      entry: parsed.entry,
      stopLoss: parsed.stopLoss,
      takeProfit: parsed.takeProfit,
      pointsDeducted: pointsToDeduct,
      createdAt: analysis.createdAt,
    };
  },

  async getHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.analysisHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          timeframe: true,
          aiResponse: true,
          hasEntry: true,
          entry: true,
          stopLoss: true,
          takeProfit: true,
          pointsDeducted: true,
          createdAt: true,
        },
      }),
      prisma.analysisHistory.count({ where: { userId } }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(userId: string, analysisId: string) {
    const analysis = await prisma.analysisHistory.findFirst({
      where: {
        id: analysisId,
        userId,
      },
    });

    if (!analysis) {
      throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
    }

    return analysis;
  },
};
