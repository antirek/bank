import mongoose from 'mongoose';
import { config } from '@boqq/shared/config';
import { User, Business, News } from '@boqq/shared/models';
import { nanoid } from 'nanoid';

// Шаблоны бизнесов по категориям
const businessTemplates = {
  турагентство: [
    { name: 'Турагентство "{name}"', description: 'Организация туров и путешествий' },
    { name: 'Турфирма "{name}"', description: 'Экскурсии и отдых по всему миру' },
    { name: 'Travel "{name}"', description: 'Международный туризм и визы' }
  ],
  салон: [
    { name: 'Салон красоты "{name}"', description: 'Парикмахерские услуги, маникюр, педикюр' },
    { name: 'Барбершоп "{name}"', description: 'Мужская стрижка и бритье' },
    { name: 'Студия красоты "{name}"', description: 'Косметология и уход за кожей' },
    { name: 'Ногтевая студия "{name}"', description: 'Маникюр, педикюр, дизайн ногтей' }
  ],
  торговля: [
    { name: 'Магазин "{name}"', description: 'Товары повседневного спроса' },
    { name: 'Супермаркет "{name}"', description: 'Продукты и товары для дома' },
    { name: 'Торговый центр "{name}"', description: 'Множество магазинов под одной крышей' },
    { name: 'Онлайн-магазин "{name}"', description: 'Интернет-торговля с доставкой' },
    { name: 'Бутик "{name}"', description: 'Одежда и аксессуары' }
  ],
  клиника: [
    { name: 'Медицинский центр "{name}"', description: 'Многопрофильная клиника' },
    { name: 'Стоматология "{name}"', description: 'Лечение и протезирование зубов' },
    { name: 'Ветеринарная клиника "{name}"', description: 'Лечение домашних животных' },
    { name: 'Клиника "{name}"', description: 'Общая медицина и диагностика' }
  ],
  ресторан: [
    { name: 'Ресторан "{name}"', description: 'Европейская кухня' },
    { name: 'Кафе "{name}"', description: 'Кофе, десерты, легкие закуски' },
    { name: 'Пиццерия "{name}"', description: 'Итальянская кухня и пицца' },
    { name: 'Столовая "{name}"', description: 'Домашняя кухня' }
  ],
  фитнес: [
    { name: 'Фитнес-клуб "{name}"', description: 'Тренажерный зал и групповые занятия' },
    { name: 'Йога-студия "{name}"', description: 'Йога и медитация' },
    { name: 'Спортивный клуб "{name}"', description: 'Различные виды спорта' }
  ],
  авто: [
    { name: 'Автосервис "{name}"', description: 'Ремонт и обслуживание автомобилей' },
    { name: 'Автомойка "{name}"', description: 'Мойка и полировка автомобилей' },
    { name: 'Шиномонтаж "{name}"', description: 'Замена и ремонт шин' }
  ],
  образование: [
    { name: 'Языковая школа "{name}"', description: 'Изучение иностранных языков' },
    { name: 'Учебный центр "{name}"', description: 'Курсы и тренинги' },
    { name: 'Детский сад "{name}"', description: 'Дошкольное образование' }
  ]
};

// Шаблоны новостей по категориям
const newsTemplates = {
  турагентство: [
    { title: 'Новые туры в {location}', content: 'Представляем новые туры в {location}! Специальные цены для раннего бронирования.' },
    { title: 'Акция: скидка на отдых', content: 'Скидка до 30% на все туры при бронировании до конца месяца!' },
    { title: 'Открытие нового направления', content: 'Теперь мы предлагаем туры в {location}. Экскурсии, отели, трансферы - все включено!' },
    { title: 'Визовая поддержка', content: 'Помогаем с оформлением виз для путешествий. Быстро и надежно!' },
    { title: 'Групповые туры', content: 'Набираем группы на экскурсионные туры. Присоединяйтесь!' }
  ],
  салон: [
    { title: 'Новая услуга: {service}', content: 'Представляем новую услугу {service}. Записывайтесь на консультацию!' },
    { title: 'Акция на стрижки', content: 'Скидка 20% на все виды стрижек в будние дни!' },
    { title: 'Мастер-класс по макияжу', content: 'Приглашаем на мастер-класс по профессиональному макияжу. Запись обязательна.' },
    { title: 'Новые мастера', content: 'В нашу команду пришли новые специалисты. Записывайтесь на прием!' },
    { title: 'Подарочные сертификаты', content: 'Подарите красоту близким! Подарочные сертификаты на любую сумму.' }
  ],
  торговля: [
    { title: 'Распродажа: скидки до 50%', content: 'Большая распродажа! Скидки до 50% на весь ассортимент. Торопитесь!' },
    { title: 'Новое поступление товаров', content: 'Поступили новые товары от ведущих производителей. Приходите и выбирайте!' },
    { title: 'Акция: 2+1', content: 'При покупке двух товаров третий в подарок! Акция действует до конца недели.' },
    { title: 'Открытие нового отдела', content: 'Рады сообщить об открытии нового отдела. Широкий ассортимент и выгодные цены!' },
    { title: 'Программа лояльности', content: 'Новая программа лояльности! Копите баллы и получайте скидки.' }
  ],
  клиника: [
    { title: 'Новое оборудование', content: 'Установили новое современное оборудование для диагностики. Записывайтесь на обследование!' },
    { title: 'Акция: бесплатная консультация', content: 'Бесплатная консультация врача при первичном обращении!' },
    { title: 'Новый специалист', content: 'В клинику пришел новый специалист. Запись на прием открыта.' },
    { title: 'Профилактический осмотр', content: 'Проводим профилактические осмотры. Забота о вашем здоровье!' },
    { title: 'Вакцинация', content: 'Проводим вакцинацию. Защитите себя и своих близких!' }
  ],
  ресторан: [
    { title: 'Новое меню', content: 'Представляем обновленное меню с новыми блюдами от нашего шеф-повара!' },
    { title: 'Акция: бизнес-ланч', content: 'Вкусный бизнес-ланч всего за {price} рублей. С понедельника по пятницу!' },
    { title: 'Живая музыка', content: 'По выходным у нас играет живая музыка. Приходите провести вечер!' },
    { title: 'Детское меню', content: 'Специальное детское меню для маленьких гостей. Игровая зона для детей!' },
    { title: 'Доставка еды', content: 'Теперь мы доставляем еду! Заказывайте через приложение или по телефону.' }
  ],
  фитнес: [
    { title: 'Новые групповые занятия', content: 'Запускаем новые групповые занятия. Расписание на сайте!' },
    { title: 'Акция: первый месяц со скидкой', content: 'Скидка 50% на первый месяц абонемента для новых клиентов!' },
    { title: 'Открытие нового зала', content: 'Открыли новый просторный зал с современным оборудованием!' },
    { title: 'Персональные тренировки', content: 'Записывайтесь на персональные тренировки с опытными инструкторами.' },
    { title: 'Йога на свежем воздухе', content: 'Летние занятия йогой в парке. Присоединяйтесь!' }
  ],
  авто: [
    { title: 'Акция на ТО', content: 'Скидка 15% на техническое обслуживание автомобилей. Записывайтесь!' },
    { title: 'Новое оборудование', content: 'Установили новое диагностическое оборудование. Точная диагностика за 30 минут!' },
    { title: 'Шиномонтаж со скидкой', content: 'Скидка на шиномонтаж при покупке шин у нас!' },
    { title: 'Карта клиента', content: 'Новая карта постоянного клиента. Копите баллы и получайте скидки!' },
    { title: 'Выездной сервис', content: 'Теперь мы выезжаем к вам! Вызов мастера на дом или в офис.' }
  ],
  образование: [
    { title: 'Набор в новые группы', content: 'Набираем новые группы для изучения языков. Начало занятий на следующей неделе!' },
    { title: 'Бесплатное пробное занятие', content: 'Приходите на бесплатное пробное занятие. Узнайте, подходит ли вам наш формат!' },
    { title: 'Новые курсы', content: 'Запускаем новые курсы. Следите за расписанием на сайте!' },
    { title: 'Скидка для студентов', content: 'Специальная скидка для студентов на все курсы!' },
    { title: 'Онлайн-обучение', content: 'Теперь доступно онлайн-обучение. Учитесь из любой точки мира!' }
  ]
};

// Имена для пользователей
const userNames = [
  'Иван Петров', 'Мария Сидорова', 'Александр Козлов', 'Елена Волкова', 'Дмитрий Новиков',
  'Ольга Морозова', 'Сергей Павлов', 'Анна Лебедева', 'Андрей Соколов', 'Татьяна Козлова',
  'Михаил Новиков', 'Наталья Петрова', 'Владимир Смирнов', 'Екатерина Федорова', 'Павел Иванов',
  'Юлия Кузнецова', 'Николай Попов', 'Светлана Васильева', 'Алексей Семенов', 'Ирина Романова'
];

// Города для туров
const cities = ['Париж', 'Рим', 'Барселона', 'Прага', 'Вена', 'Амстердам', 'Лондон', 'Дубай', 'Токио', 'Бали'];

// Услуги для салонов
const salonServices = ['ламинирование ресниц', 'наращивание волос', 'перманентный макияж', 'лазерная эпиляция', 'массаж лица'];

// Цены для ресторанов
const prices = [299, 349, 399, 449, 499];

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
};

const getBusinessCategory = (businessName) => {
  if (businessName.includes('Турагентство') || businessName.includes('Турфирма') || businessName.includes('Travel')) {
    return 'турагентство';
  } else if (businessName.includes('Салон') || businessName.includes('Барбершоп') || businessName.includes('Студия красоты') || businessName.includes('Ногтевая')) {
    return 'салон';
  } else if (businessName.includes('Магазин') || businessName.includes('Супермаркет') || businessName.includes('Торговый') || businessName.includes('Бутик')) {
    return 'торговля';
  } else if (businessName.includes('Медицинский') || businessName.includes('Стоматология') || businessName.includes('Ветеринарная') || businessName.includes('Клиника')) {
    return 'клиника';
  } else if (businessName.includes('Ресторан') || businessName.includes('Кафе') || businessName.includes('Пиццерия') || businessName.includes('Столовая')) {
    return 'ресторан';
  } else if (businessName.includes('Фитнес') || businessName.includes('Йога') || businessName.includes('Спортивный')) {
    return 'фитнес';
  } else if (businessName.includes('Автосервис') || businessName.includes('Автомойка') || businessName.includes('Шиномонтаж')) {
    return 'авто';
  } else {
    return 'образование';
  }
};

const generateNews = async (businessId, businessName, category) => {
  const newsCount = getRandomInt(1, 10);
  const templates = newsTemplates[category] || newsTemplates.образование;
  
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const createdNews = [];
  
  for (let i = 0; i < newsCount; i++) {
    const template = getRandomItem(templates);
    let title = template.title;
    let content = template.content;
    
    // Заменяем плейсхолдеры
    if (title.includes('{location}')) {
      title = title.replace('{location}', getRandomItem(cities));
    }
    if (title.includes('{service}')) {
      title = title.replace('{service}', getRandomItem(salonServices));
    }
    if (content.includes('{location}')) {
      content = content.replace('{location}', getRandomItem(cities));
    }
    if (content.includes('{price}')) {
      content = content.replace('{price}', getRandomItem(prices));
    }
    
    // Генерируем случайную дату за последнюю неделю
    const daysAgo = Math.random() * 7;
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(getRandomInt(8, 20), getRandomInt(0, 59), getRandomInt(0, 59));
    
    const news = new News({
      newsId: `news_${nanoid()}`,
      businessId,
      title,
      content,
      createdAt,
      updatedAt: createdAt,
      isActive: true
    });
    
    await news.save();
    createdNews.push(news);
  }
  
  return createdNews;
};

const generateBusiness = async (ownerId, ownerName) => {
  const categories = Object.keys(businessTemplates);
  const category = getRandomItem(categories);
  const templates = businessTemplates[category];
  const template = getRandomItem(templates);
  
  const businessName = template.name.replace('{name}', ownerName.split(' ')[0]);
  const slug = generateSlug(businessName) + '-' + nanoid(8);
  
  const business = new Business({
    businessId: `biz_${Date.now()}_${nanoid(8)}`,
    ownerId,
    name: businessName,
    description: template.description,
    slug,
    isPublic: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await business.save();
  
  // Генерируем новости
  const categoryForNews = getBusinessCategory(businessName);
  const news = await generateNews(business.businessId, businessName, categoryForNews);
  
  return { business, newsCount: news.length };
};

const generateUser = async (index) => {
  const name = userNames[index];
  const phone = `+7900${String(1000000 + index).padStart(7, '0')}`;
  const userId = `user_${Date.now()}_${nanoid(8)}`;
  
  const user = new User({
    userId,
    phone,
    name,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await user.save();
  
  // Генерируем бизнесы
  const businessCount = getRandomInt(1, 10);
  const businesses = [];
  
  for (let i = 0; i < businessCount; i++) {
    const businessData = await generateBusiness(userId, name);
    businesses.push(businessData);
  }
  
  return { user, businesses };
};

const main = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Подключено к MongoDB\n');
    
    console.log('Начинаю генерацию тестовых данных...\n');
    
    let totalUsers = 0;
    let totalBusinesses = 0;
    let totalNews = 0;
    
    for (let i = 0; i < 20; i++) {
      console.log(`[${i + 1}/20] Создаю пользователя: ${userNames[i]}`);
      
      const { user, businesses } = await generateUser(i);
      totalUsers++;
      
      const businessCount = businesses.length;
      const newsCount = businesses.reduce((sum, b) => sum + b.newsCount, 0);
      totalBusinesses += businessCount;
      totalNews += newsCount;
      
      console.log(`  ✓ Пользователь создан: ${user.name} (${user.phone})`);
      console.log(`  ✓ Создано бизнесов: ${businessCount}`);
      console.log(`  ✓ Создано новостей: ${newsCount}\n`);
    }
    
    console.log('='.repeat(50));
    console.log('Генерация завершена!');
    console.log('='.repeat(50));
    console.log(`Всего создано:`);
    console.log(`  - Пользователей: ${totalUsers}`);
    console.log(`  - Бизнесов: ${totalBusinesses}`);
    console.log(`  - Новостей: ${totalNews}`);
    console.log('='.repeat(50));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
};

main();
