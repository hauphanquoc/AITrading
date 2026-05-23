import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import type { CreateAIConfigInput, UpdateAIConfigInput } from '../schemas/ai-config.schema.js';

class AIConfigService {
  async getActiveConfig() {
    const config = await prisma.aIConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      return null;
    }

    return config;
  }

  async getAllConfigs() {
    const configs = await prisma.aIConfig.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return configs;
  }

  async getConfigById(id: string) {
    const config = await prisma.aIConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new AppError('AI Config not found', 404, 'CONFIG_NOT_FOUND');
    }

    return config;
  }

  async createConfig(data: CreateAIConfigInput, adminId: string) {
    // If this is set as active, deactivate others
    if (data.isActive !== false) {
      await prisma.aIConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const config = await prisma.aIConfig.create({
      data: {
        systemInstruction: data.systemInstruction,
        promptTemplate: data.promptTemplate,
        responseFormat: data.responseFormat,
        isActive: data.isActive !== false,
        updatedBy: adminId,
      },
    });

    return config;
  }

  async updateConfig(id: string, data: UpdateAIConfigInput, adminId: string) {
    const existing = await prisma.aIConfig.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('AI Config not found', 404, 'CONFIG_NOT_FOUND');
    }

    // If activating this config, deactivate others
    if (data.isActive === true) {
      await prisma.aIConfig.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    const config = await prisma.aIConfig.update({
      where: { id },
      data: {
        systemInstruction: data.systemInstruction,
        promptTemplate: data.promptTemplate,
        responseFormat: data.responseFormat,
        isActive: data.isActive,
        updatedBy: adminId,
      },
    });

    return config;
  }

  async deleteConfig(id: string) {
    const existing = await prisma.aIConfig.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('AI Config not found', 404, 'CONFIG_NOT_FOUND');
    }

    if (existing.isActive) {
      throw new AppError('Cannot delete active config', 400, 'CANNOT_DELETE_ACTIVE');
    }

    await prisma.aIConfig.delete({ where: { id } });

    return { deleted: true };
  }

  async setActiveConfig(id: string, adminId: string) {
    const existing = await prisma.aIConfig.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('AI Config not found', 404, 'CONFIG_NOT_FOUND');
    }

    await prisma.$transaction([
      prisma.aIConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      prisma.aIConfig.update({
        where: { id },
        data: { isActive: true, updatedBy: adminId },
      }),
    ]);

    return await prisma.aIConfig.findUnique({ where: { id } });
  }
}

export const aiConfigService = new AIConfigService();
