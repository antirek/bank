import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Business from '../src/models/Business.js';
import mms3Client from '../src/config/mms3.js';

dotenv.config();

// Инициализация пользователей в mms3
const initUsersInMms3 = async () => {
  console.log('Проверка и создание пользователей в mms3...\n');
  
  const users = await User.find({ isActive: true });
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const user of users) {
    try {
      // Проверяем, существует ли пользователь в mms3
      const mms3UserId = user.mms3UserId || user.userId.replace(/\./g, '_');
      
      try {
        const response = await mms3Client.get(`/users/${mms3UserId}`);
        // Пользователь существует, обновляем его данные
        try {
          await mms3Client.put(`/users/${mms3UserId}`, {
            name: user.name || user.phone
          });
          if (!user.mms3UserId) {
            user.mms3UserId = mms3UserId;
            await user.save();
          }
          updated++;
          console.log(`  ✓ Обновлен: ${user.name || user.phone} (${mms3UserId})`);
        } catch (updateError) {
          console.log(`  - Пользователь существует: ${user.name || user.phone} (${mms3UserId})`);
        }
      } catch (getError) {
        // Пользователь не существует, создаем
        if (getError.response?.status === 404) {
          try {
            await mms3Client.post('/users', {
              userId: mms3UserId,
              name: user.name || user.phone,
              type: 'user'
            });
            user.mms3UserId = mms3UserId;
            await user.save();
            created++;
            console.log(`  ✓ Создан: ${user.name || user.phone} (${mms3UserId})`);
          } catch (createError) {
            console.error(`  ✗ Ошибка создания пользователя ${user.name || user.phone}:`, createError.response?.data || createError.message);
            errors++;
          }
        } else {
          console.error(`  ✗ Ошибка проверки пользователя ${user.name || user.phone}:`, getError.response?.data || getError.message);
          errors++;
        }
      }
    } catch (error) {
      console.error(`  ✗ Ошибка обработки пользователя ${user.name || user.phone}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\nПользователи: создано ${created}, обновлено ${updated}, ошибок ${errors}\n`);
};

// Инициализация ботов и каналов для бизнесов
const initBusinessesInMms3 = async () => {
  console.log('Проверка и создание ботов/каналов для бизнесов в mms3...\n');
  
  const businesses = await Business.find({ isActive: true });
  let botsCreated = 0;
  let channelsCreated = 0;
  let errors = 0;
  
  for (const business of businesses) {
    try {
      // Проверяем, есть ли у бизнеса бот
      if (!business.mms3BotId) {
        try {
          const botResponse = await mms3Client.post('/users', {
            userId: `bot_${business.businessId}`,
            name: `${business.name} Bot`,
            type: 'bot'
          });
          business.mms3BotId = botResponse.data.data?.userId || botResponse.data.userId;
          botsCreated++;
          console.log(`  ✓ Создан бот для бизнеса: ${business.name} (${business.mms3BotId})`);
        } catch (botError) {
          if (botError.response?.status === 409) {
            // Бот уже существует
            business.mms3BotId = `bot_${business.businessId}`;
            console.log(`  - Бот уже существует: ${business.name} (${business.mms3BotId})`);
          } else {
            console.error(`  ✗ Ошибка создания бота для ${business.name}:`, botError.response?.data || botError.message);
            errors++;
            continue;
          }
        }
      }
      
      // Проверяем, есть ли у бизнеса канал
      if (!business.mms3ChannelDialogId && business.mms3BotId) {
        try {
          const channelResponse = await mms3Client.post('/dialogs', {
            name: `${business.name} Channel`,
            createdBy: business.mms3BotId,
            members: [
              {
                userId: business.mms3BotId,
                type: 'bot',
                name: `${business.name} Bot`
              }
            ],
            meta: {
              type: 'business_channel',
              businessId: business.businessId
            }
          });
          business.mms3ChannelDialogId = channelResponse.data.data?.dialogId || channelResponse.data.dialogId;
          channelsCreated++;
          console.log(`  ✓ Создан канал для бизнеса: ${business.name} (${business.mms3ChannelDialogId})`);
        } catch (channelError) {
          console.error(`  ✗ Ошибка создания канала для ${business.name}:`, channelError.response?.data || channelError.message);
          errors++;
        }
      }
      
      // Сохраняем изменения
      if (business.isModified()) {
        await business.save();
      }
    } catch (error) {
      console.error(`  ✗ Ошибка обработки бизнеса ${business.name}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\nБизнесы: создано ботов ${botsCreated}, создано каналов ${channelsCreated}, ошибок ${errors}\n`);
};

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bank');
    console.log('Подключено к MongoDB\n');
    
    // Проверяем подключение к mms3
    try {
      const tenantsResponse = await mms3Client.get('/tenants');
      console.log('✓ Подключение к mms3 успешно\n');
    } catch (error) {
      console.error('✗ Ошибка подключения к mms3:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('  mms3 сервис не запущен на порту 3005');
      }
      await mongoose.disconnect();
      process.exit(1);
    }
    
    // Инициализируем пользователей
    await initUsersInMms3();
    
    // Инициализируем бизнесы
    await initBusinessesInMms3();
    
    console.log('='.repeat(50));
    console.log('Инициализация mms3 завершена!');
    console.log('='.repeat(50));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
};

main();
