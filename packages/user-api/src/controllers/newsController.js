import { News, Business, BusinessSubscription } from '@boqq/shared/models';
import { nanoid } from 'nanoid';

// Получить последние новости бизнеса
export const getBusinessNews = async (req, res) => {
  try {
    const { businessId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const news = await News.find({
      businessId,
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ data: news });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Создать новость
export const createNews = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.userId; // Из токена

    // Проверяем, что бизнес существует и пользователь является владельцем
    const business = await Business.findOne({ businessId });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. Only business owner can create news' });
    }

    // Валидация
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const news = new News({
      newsId: `news_${nanoid()}`,
      businessId,
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await news.save();
    res.status(201).json({ data: news });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Обновить новость
export const updateNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.userId;

    const news = await News.findOne({ newsId });
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    // Проверяем права доступа
    const business = await Business.findOne({ businessId: news.businessId });
    if (!business || business.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. Only business owner can update news' });
    }

    if (title !== undefined) news.title = title.trim();
    if (content !== undefined) news.content = content.trim();
    news.updatedAt = new Date();

    await news.save();
    res.json({ data: news });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Удалить новость
export const deleteNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    const userId = req.user?.userId;

    const news = await News.findOne({ newsId });
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    // Проверяем права доступа
    const business = await Business.findOne({ businessId: news.businessId });
    if (!business || business.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. Only business owner can delete news' });
    }

    news.isActive = false;
    await news.save();

    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить ленту новостей пользователя (новости всех подписанных бизнесов)
export const getUserNewsFeed = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit) || 20;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Получаем все активные подписки пользователя
    const subscriptions = await BusinessSubscription.find({
      userId,
      isActive: true
    });

    if (subscriptions.length === 0) {
      return res.json({ data: [] });
    }

    // Получаем ID всех подписанных бизнесов
    const businessIds = subscriptions.map(s => s.businessId);

    // Получаем все новости из подписанных бизнесов
    const news = await News.find({
      businessId: { $in: businessIds },
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    // Получаем информацию о бизнесах для каждой новости
    const businessIdsInNews = [...new Set(news.map(n => n.businessId))];
    const businesses = await Business.find({
      businessId: { $in: businessIdsInNews }
    });

    const businessMap = {};
    businesses.forEach(b => {
      businessMap[b.businessId] = b;
    });

    // Добавляем информацию о бизнесе к каждой новости
    const newsWithBusiness = news.map(newsItem => ({
      ...newsItem.toObject(),
      business: businessMap[newsItem.businessId] ? {
        businessId: businessMap[newsItem.businessId].businessId,
        name: businessMap[newsItem.businessId].name,
        slug: businessMap[newsItem.businessId].slug
      } : null
    }));

    res.json({ data: newsWithBusiness });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
