import mongoose from 'mongoose';
import dotenv from 'dotenv';
import News from '@boqq/shared-models/News.js';
import Business from '@boqq/shared-models/Business.js';
import { nanoid } from 'nanoid';

dotenv.config();

const newsTemplates = [
  {
    title: 'Специальное предложение',
    content: 'Только сегодня скидка 20% на все товары! Не упустите возможность сэкономить.'
  },
  {
    title: 'Новое поступление',
    content: 'У нас появились новые товары! Приходите и оцените качество и разнообразие нашего ассортимента.'
  },
  {
    title: 'Изменение графика работы',
    content: 'Обратите внимание: мы изменили график работы. Теперь мы работаем с 9:00 до 21:00 без выходных.'
  },
  {
    title: 'Акция для постоянных клиентов',
    content: 'Дорогие клиенты! Для вас действует специальная программа лояльности. Подробности уточняйте у наших менеджеров.'
  },
  {
    title: 'Обновление ассортимента',
    content: 'Мы обновили наш каталог и добавили множество новых позиций. Ждем вас в нашем магазине!'
  },
  {
    title: 'Праздничная акция',
    content: 'В честь праздника мы подготовили для вас особые предложения. Следите за нашими новостями!'
  },
  {
    title: 'Новая услуга',
    content: 'Рады сообщить о запуске новой услуги. Теперь мы можем предложить вам еще больше возможностей.'
  },
  {
    title: 'Благодарность клиентам',
    content: 'Спасибо всем нашим клиентам за доверие! Мы продолжаем работать для вас и улучшать качество обслуживания.'
  }
];

const getRandomNews = (count) => {
  const shuffled = [...newsTemplates].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const addNewsToBusiness = async (businessId, businessName) => {
  const newsCount = Math.floor(Math.random() * 3) + 3; // 3-5 новостей
  const newsItems = getRandomNews(newsCount);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const createdNews = [];
  
  for (let i = 0; i < newsItems.length; i++) {
    const newsItem = newsItems[i];
    
    // Чередуем даты: сегодня и вчера
    const isToday = i % 2 === 0;
    const baseDate = isToday ? today : yesterday;
    
    // Добавляем случайное время в течение дня
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
    
    const createdAt = new Date(baseDate);
    createdAt.setHours(hours, minutes, seconds);
    
    // Если это вчера, добавляем немного вариативности
    if (!isToday) {
      createdAt.setHours(createdAt.getHours() + Math.floor(Math.random() * 8) + 10); // 10-18 часов
    }
    
    const news = new News({
      newsId: `news_${nanoid()}`,
      businessId,
      title: newsItem.title,
      content: newsItem.content,
      createdAt,
      updatedAt: createdAt,
      isActive: true
    });
    
    await news.save();
    createdNews.push({
      title: news.title,
      date: createdAt.toISOString()
    });
    
    console.log(`  ✓ Создана новость: "${news.title}" (${createdAt.toLocaleString('ru-RU')})`);
  }
  
  return createdNews;
};

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bank');
    console.log('Подключено к MongoDB');
    
    const businesses = await Business.find({ isActive: true });
    console.log(`Найдено бизнесов: ${businesses.length}\n`);
    
    if (businesses.length === 0) {
      console.log('Бизнесы не найдены');
      await mongoose.disconnect();
      return;
    }
    
    for (const business of businesses) {
      console.log(`Добавляю новости для бизнеса: ${business.name} (${business.businessId})`);
      
      try {
        const createdNews = await addNewsToBusiness(business.businessId, business.name);
        console.log(`  Всего создано новостей: ${createdNews.length}\n`);
      } catch (error) {
        console.error(`  ✗ Ошибка при создании новостей: ${error.message}\n`);
      }
    }
    
    console.log('Готово! Все новости добавлены.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
};

main();
