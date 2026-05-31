import { Request, Response } from 'express';
import { aiConfigService } from '../services/ai-config.service.js';
import { createAIConfigSchema, updateAIConfigSchema } from '../schemas/ai-config.schema.js';
import { AppError } from '../utils/app-error.js';

class AIConfigController {
  async getActiveConfig(req: Request, res: Response) {
    const config = await aiConfigService.getActiveConfig();

    res.json({
      success: true,
      data: config,
    });
  }

  async getAllConfigs(req: Request, res: Response) {
    const configs = await aiConfigService.getAllConfigs();

    res.json({
      success: true,
      data: configs,
    });
  }

  async getConfigById(req: Request, res: Response) {
    const id = req.params.id as string;
    const config = await aiConfigService.getConfigById(id);

    res.json({
      success: true,
      data: config,
    });
  }

  async createConfig(req: Request, res: Response) {
    const parsed = createAIConfigSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR');
    }

    const adminId = req.user!.userId;
    const config = await aiConfigService.createConfig(parsed.data, adminId);

    res.status(201).json({
      success: true,
      data: config,
      message: 'AI Config created successfully',
    });
  }

  async updateConfig(req: Request, res: Response) {
    const id = req.params.id as string;
    const parsed = updateAIConfigSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR');
    }

    const adminId = req.user!.userId;
    const config = await aiConfigService.updateConfig(id, parsed.data, adminId);

    res.json({
      success: true,
      data: config,
      message: 'AI Config updated successfully',
    });
  }

  async deleteConfig(req: Request, res: Response) {
    const id = req.params.id as string;
    await aiConfigService.deleteConfig(id);

    res.json({
      success: true,
      message: 'AI Config deleted successfully',
    });
  }

  async setActiveConfig(req: Request, res: Response) {
    const id = req.params.id as string;
    const adminId = req.user!.userId;
    const config = await aiConfigService.setActiveConfig(id, adminId);

    res.json({
      success: true,
      data: config,
      message: 'AI Config activated successfully',
    });
  }
}

export const aiConfigController = new AIConfigController();
