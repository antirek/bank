import Business from '../models/Business.js';
import mms3Client from '../config/mms3.js';

export const getBusinesses = async (req, res) => {
  try {
    const { ownerId } = req.query;
    const query = { isActive: true };
    
    if (ownerId) {
      query.ownerId = ownerId;
    }

    const businesses = await Business.find(query);
    res.json({ data: businesses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBusinessById = async (req, res) => {
  try {
    const business = await Business.findOne({ businessId: req.params.id });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json({ data: business });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBusinessBySlug = async (req, res) => {
  try {
    const business = await Business.findOne({ slug: req.params.slug, isPublic: true });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json({ data: business });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBusiness = async (req, res) => {
  try {
    const { name, description, slug, categoryIds, location } = req.body;
    const ownerId = req.user.userId; // Из токена
    
    // Check if slug already exists
    const existingBusiness = await Business.findOne({ slug });
    if (existingBusiness) {
      return res.status(409).json({ error: 'Business with this slug already exists' });
    }

    // Валидация slug
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'Invalid slug format. Use only lowercase letters, numbers and hyphens' });
    }

    const businessId = `biz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Создаем бота в mms3
    let mms3BotId = null;
    try {
      const botResponse = await mms3Client.post('/users', {
        userId: `bot_${businessId}`,
        name: `${name} Bot`,
        type: 'bot'
      });
      mms3BotId = botResponse.data.data?.userId || botResponse.data.userId;
    } catch (error) {
      console.error('Failed to create bot in mms3:', error.message);
      // Продолжаем создание бизнеса даже если бот не создан
    }

    // Создаем канал в mms3
    let mms3ChannelDialogId = null;
    if (mms3BotId) {
      try {
        const channelResponse = await mms3Client.post('/dialogs', {
          name: `${name} Channel`,
          createdBy: mms3BotId,
          members: [
            {
              userId: mms3BotId,
              type: 'bot',
              name: `${name} Bot`
            }
          ],
          meta: {
            type: 'business_channel',
            businessId: businessId
          }
        });
        mms3ChannelDialogId = channelResponse.data.data?.dialogId || channelResponse.data.dialogId;
      } catch (error) {
        console.error('Failed to create channel in mms3:', error.message);
      }
    }

    const business = new Business({
      businessId,
      ownerId,
      name,
      description: description || '',
      slug,
      categoryIds: categoryIds || [],
      location: location || {},
      mms3BotId,
      mms3ChannelDialogId
    });

    await business.save();
    res.status(201).json({ data: business });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBusiness = async (req, res) => {
  try {
    const { name, description, slug, logo, categoryIds, location, isPublic } = req.body;
    const businessId = req.params.id;
    const userId = req.user?.userId; // Из токена

    // Проверяем существование бизнеса и права доступа
    const business = await Business.findOne({ businessId });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Проверяем, что пользователь - владелец
    if (business.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. You are not the owner of this business' });
    }

    // Если slug изменился, проверяем уникальность
    if (slug && slug !== business.slug) {
      // Валидация формата slug
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Invalid slug format. Use only lowercase letters, numbers and hyphens' });
      }

      const existingBusiness = await Business.findOne({ slug, businessId: { $ne: businessId } });
      if (existingBusiness) {
        return res.status(409).json({ error: 'Business with this slug already exists' });
      }
    }

    // Обновляем бизнес
    const updatedBusiness = await Business.findOneAndUpdate(
      { businessId },
      { 
        name, 
        description,
        slug: slug || business.slug,
        logo, 
        categoryIds, 
        location, 
        isPublic,
        updatedAt: new Date() 
      },
      { new: true, runValidators: true }
    );

    res.json({ data: updatedBusiness });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
