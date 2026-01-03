import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Business from '../src/models/Business.js';
import BusinessSubscription from '../src/models/BusinessSubscription.js';
import mms3Client from '../src/config/mms3.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bank';

const testUsers = [
  { phone: '+79001111111', name: 'Иван Иванов' },
  { phone: '+79002222222', name: 'Мария Петрова' },
  { phone: '+79003333333', name: 'Алексей Сидоров' }
];

const testBusinesses = [
  { name: 'Кофейня "Уютная"', slug: 'coffee-cozy', description: 'Лучший кофе в городе' },
  { name: 'Магазин "ТехноМир"', slug: 'tech-world', description: 'Электроника и гаджеты' },
  { name: 'Ресторан "Вкусно"', slug: 'tasty-restaurant', description: 'Домашняя кухня' }
];

async function createTestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Очищаем старые данные (опционально)
    // await User.deleteMany({});
    // await Business.deleteMany({});
    // await BusinessSubscription.deleteMany({});

    const createdUsers = [];
    const createdBusinesses = [];

    // Создаем пользователей
    console.log('\n=== Creating users ===');
    for (let i = 0; i < testUsers.length; i++) {
      const userData = testUsers[i];
      
      // Проверяем, существует ли пользователь
      let user = await User.findOne({ phone: userData.phone });
      
      if (!user) {
        user = new User({
          userId: `user_${Date.now()}_${i}`,
          phone: userData.phone,
          name: userData.name
        });
        await user.save();
        console.log(`✓ Created user: ${userData.name} (${userData.phone})`);
      } else {
        console.log(`→ User already exists: ${userData.name} (${userData.phone})`);
      }

      // Создаем пользователя в mms3
      try {
        const mms3User = await mms3Client.post('/users', {
          userId: user.userId,
          name: user.name || user.phone,
          type: 'user'
        });
        user.mms3UserId = mms3User.data.data?.userId || mms3User.data.userId;
        await user.save();
        console.log(`  → Created in mms3: ${user.mms3UserId}`);
      } catch (error) {
        console.log(`  → mms3 user creation skipped: ${error.message}`);
      }

      createdUsers.push(user);
    }

    // Создаем бизнесы
    console.log('\n=== Creating businesses ===');
    for (let i = 0; i < testBusinesses.length; i++) {
      const businessData = testBusinesses[i];
      const owner = createdUsers[i];

      // Проверяем, существует ли бизнес
      let business = await Business.findOne({ slug: businessData.slug });
      
      if (!business) {
        const businessId = `biz_${Date.now()}_${i}`;

        // Создаем бота в mms3
        let mms3BotId = null;
        try {
          const botResponse = await mms3Client.post('/users', {
            userId: `bot_${businessId}`,
            name: `${businessData.name} Bot`,
            type: 'bot'
          });
          mms3BotId = botResponse.data.data?.userId || botResponse.data.userId;
          console.log(`  → Created bot in mms3: ${mms3BotId}`);
        } catch (error) {
          console.log(`  → Bot creation skipped: ${error.message}`);
        }

        // Создаем канал в mms3
        let mms3ChannelDialogId = null;
        if (mms3BotId) {
          try {
            const channelResponse = await mms3Client.post('/dialogs', {
              name: `${businessData.name} Channel`,
              createdBy: mms3BotId,
              members: [
                {
                  userId: mms3BotId,
                  type: 'bot',
                  name: `${businessData.name} Bot`
                }
              ],
              meta: {
                type: 'business_channel',
                businessId: businessId
              }
            });
            mms3ChannelDialogId = channelResponse.data.data?.dialogId || channelResponse.data.dialogId;
            console.log(`  → Created channel in mms3: ${mms3ChannelDialogId}`);
          } catch (error) {
            console.log(`  → Channel creation skipped: ${error.message}`);
          }
        }

        business = new Business({
          businessId,
          ownerId: owner.userId,
          name: businessData.name,
          description: businessData.description,
          slug: businessData.slug,
          mms3BotId,
          mms3ChannelDialogId
        });

        await business.save();
        console.log(`✓ Created business: ${businessData.name} (${businessData.slug})`);
      } else {
        console.log(`→ Business already exists: ${businessData.name} (${businessData.slug})`);
      }

      createdBusinesses.push(business);
    }

    // Подписываем пользователей на бизнесы (каждый на все, кроме своего)
    console.log('\n=== Creating subscriptions ===');
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      
      for (let j = 0; j < createdBusinesses.length; j++) {
        const business = createdBusinesses[j];
        
        // Пропускаем свой бизнес
        if (business.ownerId === user.userId) {
          continue;
        }

        // Проверяем, не подписан ли уже
        const existing = await BusinessSubscription.findOne({
          businessId: business.businessId,
          userId: user.userId
        });

        if (!existing) {
          const subscription = new BusinessSubscription({
            businessId: business.businessId,
            userId: user.userId
          });
          await subscription.save();

          // Добавляем в канал mms3
          if (business.mms3ChannelDialogId && user.mms3UserId) {
            try {
              await mms3Client.post(`/dialogs/${business.mms3ChannelDialogId}/members/add`, {
                userId: user.mms3UserId,
                type: 'user',
                name: user.name || user.phone
              });
              console.log(`  → Added ${user.name} to ${business.name} channel in mms3`);
            } catch (error) {
              console.log(`  → Failed to add to mms3 channel: ${error.message}`);
            }
          }

          console.log(`✓ ${user.name} subscribed to ${business.name}`);
        } else {
          console.log(`→ ${user.name} already subscribed to ${business.name}`);
        }
      }
    }

    console.log('\n=== Test data created successfully! ===');
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Businesses: ${createdBusinesses.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();
