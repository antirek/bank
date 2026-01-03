import BusinessSubscription from '../models/BusinessSubscription.js';
import Business from '../models/Business.js';
import User from '../models/User.js';
import mms3Client from '../config/mms3.js';

// Подписаться на бизнес (канал)
export const subscribeToBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user.userId;

    // Проверяем существование бизнеса
    const business = await Business.findOne({ businessId, isActive: true });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Проверяем, не подписан ли уже
    const existingSubscription = await BusinessSubscription.findOne({
      businessId,
      userId,
      isActive: true
    });

    if (existingSubscription) {
      return res.status(409).json({ error: 'Already subscribed to this business' });
    }

    // Создаем подписку
    const subscription = new BusinessSubscription({
      businessId,
      userId,
      subscribedAt: new Date()
    });

    await subscription.save();

    // Добавляем пользователя в канал mms3, если канал существует
    if (business.mms3ChannelDialogId && business.mms3BotId) {
      try {
        // Получаем информацию о пользователе для добавления в диалог
        const user = await User.findOne({ userId });
        
        if (user) {
          await mms3Client.post(`/dialogs/${business.mms3ChannelDialogId}/members/add`, {
            userId: user.mms3UserId || userId,
            type: 'user',
            name: user.name || user.phone
          });
        }
      } catch (error) {
        console.error('Failed to add user to mms3 channel:', error.message);
        // Продолжаем даже если не удалось добавить в mms3
      }
    }

    res.status(201).json({ 
      data: {
        subscription,
        message: 'Successfully subscribed to business channel'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Отписаться от бизнеса
export const unsubscribeFromBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user.userId;

    const subscription = await BusinessSubscription.findOneAndUpdate(
      { businessId, userId, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ 
      data: {
        message: 'Successfully unsubscribed from business channel'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить подписки пользователя
export const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscriptions = await BusinessSubscription.find({
      userId,
      isActive: true
    }).populate('businessId');

    // Получаем информацию о бизнесах
    const businessIds = subscriptions.map(s => s.businessId);
    const businesses = await Business.find({
      businessId: { $in: businessIds },
      isActive: true
    });

    res.json({ 
      data: {
        subscriptions: subscriptions.map(s => ({
          businessId: s.businessId,
          subscribedAt: s.subscribedAt
        })),
        businesses
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получить подписчиков бизнеса (для владельца)
export const getBusinessSubscribers = async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user.userId;

    // Проверяем, что пользователь - владелец бизнеса
    const business = await Business.findOne({ businessId, ownerId: userId });
    if (!business) {
      return res.status(403).json({ error: 'Access denied. You are not the owner of this business' });
    }

    const subscriptions = await BusinessSubscription.find({
      businessId,
      isActive: true
    });

    res.json({ 
      data: {
        count: subscriptions.length,
        subscriptions: subscriptions.map(s => ({
          userId: s.userId,
          subscribedAt: s.subscribedAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
