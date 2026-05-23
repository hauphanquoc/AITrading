import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aitrading.com' },
    update: {},
    create: {
      email: 'admin@aitrading.com',
      passwordHash: adminPassword,
      name: 'Admin',
      role: Role.ADMIN,
      points: 9999,
      isActive: true,
    },
  });

  console.log('Created admin user:', admin.email);

  const testUserPassword = await bcrypt.hash('user123', 12);

  const testUser = await prisma.user.upsert({
    where: { email: 'user@aitrading.com' },
    update: {},
    create: {
      email: 'user@aitrading.com',
      passwordHash: testUserPassword,
      name: 'Test User',
      role: Role.USER,
      points: 10,
      isActive: true,
    },
  });

  console.log('Created test user:', testUser.email);

  const aiConfig = await prisma.aIConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      systemInstruction: {
        role: 'Bạn là chuyên gia phân tích kỹ thuật XAUUSD với hơn 10 năm kinh nghiệm.',
        tradingStyle: 'Intraday',
        riskRewardRatio: '1:2',
        indicators: ['EMA', 'RSI', 'MACD', 'Support/Resistance'],
        rules: [
          'Luôn đặt Stop Loss',
          'Không trade khi có tin quan trọng',
          'Risk tối đa 2% mỗi lệnh',
        ],
      },
      promptTemplate: `Phân tích dữ liệu OHLC sau cho khung thời gian {{timeframe}}:

{{ohlcData}}

Hãy đưa ra:
1. Nhận định xu hướng hiện tại
2. Các mức hỗ trợ/kháng cự quan trọng
3. Tín hiệu giao dịch (nếu có điểm vào lệnh tốt)

Nếu có tín hiệu vào lệnh, hãy cung cấp:
- Entry: [giá vào lệnh]
- Stop Loss: [giá cắt lỗ]
- Take Profit: [giá chốt lời]

Nếu không có tín hiệu rõ ràng, hãy nói "Chưa có tín hiệu vào lệnh" và giải thích lý do.`,
      responseFormat: {
        requireEntry: false,
        fields: ['analysis', 'trend', 'entry', 'stopLoss', 'takeProfit'],
      },
      isActive: true,
      updatedBy: admin.id,
    },
  });

  console.log('Created AI config:', aiConfig.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
