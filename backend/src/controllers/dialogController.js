import Dialog from '../models/Dialog.js';
import Business from '../models/Business.js';
import User from '../models/User.js';
import mms3Client from '../config/mms3.js';

// Начать диалог с бизнесом
export const startDialog = async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user.userId;

    // Проверяем, есть ли уже активный диалог
    const existingDialog = await Dialog.findOne({
      businessId,
      userId,
      isActive: true
    });

    if (existingDialog) {
      // Возвращаем существующий диалог
      const business = await Business.findOne({ businessId });
      const user = await User.findOne({ userId });
      const owner = await User.findOne({ userId: business.ownerId });

      return res.json({
        data: {
          dialogId: existingDialog.dialogId,
          mms3DialogId: existingDialog.mms3DialogId,
          businessId: existingDialog.businessId,
          businessName: business.name,
          businessSlug: business.slug,
          ownerId: existingDialog.ownerId,
          ownerName: owner?.name || owner?.phone,
          createdAt: existingDialog.createdAt
        }
      });
    }

    // Получаем данные бизнеса и владельца
    const business = await Business.findOne({ businessId, isActive: true });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const owner = await User.findOne({ userId: business.ownerId });
    if (!owner) {
      return res.status(404).json({ error: 'Business owner not found' });
    }

    // Проверяем, что у пользователей есть mms3UserId
    if (!user.mms3UserId) {
      return res.status(400).json({ error: 'User not registered in mms3' });
    }
    if (!owner.mms3UserId) {
      return res.status(400).json({ error: 'Business owner not registered in mms3' });
    }

    // Создаем диалог в mms3
    const dialogName = `Диалог с ${business.name}`;
    const mms3DialogResponse = await mms3Client.post('/dialogs', {
      name: dialogName,
      createdBy: user.mms3UserId,
      members: [
        {
          userId: user.mms3UserId,
          type: 'user',
          name: user.name || user.phone
        },
        {
          userId: owner.mms3UserId,
          type: 'user',
          name: owner.name || owner.phone
        }
      ],
      meta: {
        type: 'business_client',
        businessId: businessId,
        userId: userId,
        ownerId: business.ownerId
      }
    });

    // mms3 возвращает dialogId в data.data.dialogId или data.dialogId
    const mms3DialogId = mms3DialogResponse.data.data?.dialogId || mms3DialogResponse.data.dialogId;
    
    if (!mms3DialogId) {
      console.error('mms3 dialog response:', JSON.stringify(mms3DialogResponse.data, null, 2));
      return res.status(500).json({ error: 'Failed to create dialog in mms3: dialogId not found in response' });
    }

    // Создаем запись в нашей БД
    const dialogId = `dlg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const dialog = new Dialog({
      dialogId,
      businessId,
      userId,
      ownerId: business.ownerId,
      mms3DialogId,
      lastMessageAt: new Date(),
      unreadCountUser: 0,
      unreadCountOwner: 0,
      isActive: true
    });

    await dialog.save();

    res.json({
      data: {
        dialogId: dialog.dialogId,
        mms3DialogId: dialog.mms3DialogId,
        businessId: dialog.businessId,
        businessName: business.name,
        businessSlug: business.slug,
        ownerId: dialog.ownerId,
        ownerName: owner.name || owner.phone,
        createdAt: dialog.createdAt
      }
    });
  } catch (error) {
    console.error('Error starting dialog:', error);
    res.status(500).json({ 
      error: error.response?.data?.error || error.message || 'Failed to start dialog' 
    });
  }
};

// Получить мои диалоги (для пользователя)
export const getMyDialogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const dialogs = await Dialog.find({
      userId,
      isActive: true
    })
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Получаем информацию о бизнесах
    const businessIds = dialogs.map(d => d.businessId);
    const businesses = await Business.find({ businessId: { $in: businessIds } });

    const businessMap = {};
    businesses.forEach(b => {
      businessMap[b.businessId] = b;
    });

    // Получаем последние сообщения из mms3
    const dialogsWithMessages = await Promise.all(
      dialogs.map(async (dialog) => {
        try {
          const messagesResponse = await mms3Client.get(
            `/dialogs/${dialog.mms3DialogId}/messages`,
            {
              params: {
                limit: 1,
                sort: '(createdAt,desc)'
              }
            }
          );

          const lastMessage = messagesResponse.data.data?.[0] || null;

          return {
            dialogId: dialog.dialogId,
            businessId: dialog.businessId,
            businessName: businessMap[dialog.businessId]?.name || 'Unknown',
            businessSlug: businessMap[dialog.businessId]?.slug || '',
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt
            } : null,
            lastMessageAt: dialog.lastMessageAt,
            unreadCount: dialog.unreadCountUser
          };
        } catch (error) {
          console.error(`Error fetching messages for dialog ${dialog.dialogId}:`, error);
          return {
            dialogId: dialog.dialogId,
            businessId: dialog.businessId,
            businessName: businessMap[dialog.businessId]?.name || 'Unknown',
            businessSlug: businessMap[dialog.businessId]?.slug || '',
            lastMessage: null,
            lastMessageAt: dialog.lastMessageAt,
            unreadCount: dialog.unreadCountUser
          };
        }
      })
    );

    res.json({
      data: dialogsWithMessages
    });
  } catch (error) {
    console.error('Error getting my dialogs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Получить диалоги бизнеса (для владельца)
export const getBusinessDialogs = async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 20, search } = req.query;

    // Проверяем, что пользователь - владелец бизнеса
    const business = await Business.findOne({ businessId, isActive: true });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. Only business owner can view dialogs' });
    }

    // Строим запрос
    const query = {
      businessId,
      isActive: true
    };

    // Поиск по userId (если есть search, ищем пользователей)
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      });
      const userIds = users.map(u => u.userId);
      query.userId = { $in: userIds };
    }

    const dialogs = await Dialog.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Получаем информацию о пользователях
    const userIds = dialogs.map(d => d.userId);
    const users = await User.find({ userId: { $in: userIds } });

    const userMap = {};
    users.forEach(u => {
      userMap[u.userId] = u;
    });

    // Получаем mms3UserId владельца
    const owner = await User.findOne({ userId });
    if (!owner || !owner.mms3UserId) {
      return res.status(400).json({ error: 'Owner not registered in mms3' });
    }

    // Получаем последние сообщения и unreadCount из mms3
    const dialogsWithMessages = await Promise.all(
      dialogs.map(async (dialog) => {
        try {
          // Получаем последнее сообщение
          const messagesResponse = await mms3Client.get(
            `/dialogs/${dialog.mms3DialogId}/messages`,
            {
              params: {
                limit: 1,
                sort: '(createdAt,desc)'
              }
            }
          );

          const lastMessage = messagesResponse.data.data?.[0] || null;

          // Получаем unreadCount для владельца из mms3
          let unreadCount = 0;
          try {
            const membersResponse = await mms3Client.get(
              `/dialogs/${dialog.mms3DialogId}/members`,
              {
                params: {
                  filter: `(userId,eq,${owner.mms3UserId})`
                }
              }
            );
            const ownerMember = membersResponse.data.data?.find(m => m.userId === owner.mms3UserId);
            unreadCount = ownerMember?.state?.unreadCount || 0;
          } catch (memberError) {
            console.error(`Error fetching member info for dialog ${dialog.dialogId}:`, memberError);
          }

          return {
            dialogId: dialog.dialogId,
            userId: dialog.userId,
            userName: userMap[dialog.userId]?.name || 'Без имени',
            userPhone: userMap[dialog.userId]?.phone || '',
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt
            } : null,
            lastMessageAt: dialog.lastMessageAt,
            unreadCount: unreadCount
          };
        } catch (error) {
          console.error(`Error fetching messages for dialog ${dialog.dialogId}:`, error);
          return {
            dialogId: dialog.dialogId,
            userId: dialog.userId,
            userName: userMap[dialog.userId]?.name || 'Без имени',
            userPhone: userMap[dialog.userId]?.phone || '',
            lastMessage: null,
            lastMessageAt: dialog.lastMessageAt,
            unreadCount: 0
          };
        }
      })
    );

    res.json({
      data: dialogsWithMessages
    });
  } catch (error) {
    console.error('Error getting business dialogs:', error);
    res.status(500).json({ error: error.message });
  }
};

// Получить диалог по ID
export const getDialog = async (req, res) => {
  try {
    const { dialogId } = req.params;
    const userId = req.user.userId;

    const dialog = await Dialog.findOne({ dialogId, isActive: true });
    if (!dialog) {
      return res.status(404).json({ error: 'Dialog not found' });
    }

    // Проверяем права доступа
    if (dialog.userId !== userId && dialog.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const business = await Business.findOne({ businessId: dialog.businessId });
    const user = await User.findOne({ userId: dialog.userId });
    const owner = await User.findOne({ userId: dialog.ownerId });

    res.json({
      data: {
        dialogId: dialog.dialogId,
        mms3DialogId: dialog.mms3DialogId,
        businessId: dialog.businessId,
        businessName: business?.name || 'Unknown',
        businessSlug: business?.slug || '',
        userId: dialog.userId,
        userName: user?.name || user?.phone || 'Unknown',
        userPhone: user?.phone || '',
        ownerId: dialog.ownerId,
        ownerName: owner?.name || owner?.phone || 'Unknown',
        createdAt: dialog.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting dialog:', error);
    res.status(500).json({ error: error.message });
  }
};

// Получить сообщения диалога
export const getDialogMessages = async (req, res) => {
  try {
    const { dialogId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 50, before } = req.query;

    const dialog = await Dialog.findOne({ dialogId, isActive: true });
    if (!dialog) {
      return res.status(404).json({ error: 'Dialog not found' });
    }

    // Проверяем права доступа
    if (dialog.userId !== userId && dialog.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Получаем сообщения из mms3
    const params = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: '(createdAt,desc)'
    };

    if (before) {
      params.filter = `(createdAt,lt,${before})`;
    }

    const messagesResponse = await mms3Client.get(
      `/dialogs/${dialog.mms3DialogId}/messages`,
      { params }
    );

    // Получаем информацию о пользователях для отображения имен
    const senderIds = [...new Set(messagesResponse.data.data?.map(m => m.senderId) || [])];
    const users = await User.find({ mms3UserId: { $in: senderIds } });
    const userMap = {};
    users.forEach(u => {
      if (u.mms3UserId) {
        userMap[u.mms3UserId] = u;
      }
    });

    const messages = (messagesResponse.data.data || []).map(message => ({
      messageId: message.messageId,
      senderId: message.senderId,
      senderName: userMap[message.senderId]?.name || userMap[message.senderId]?.phone || 'Unknown',
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      status: message.statuses?.[0]?.status || 'sent'
    }));

    res.json({
      data: {
        messages: messages.reverse(), // Обращаем порядок для хронологического отображения
        hasMore: messagesResponse.data.hasMore || false,
        total: messagesResponse.data.total || messages.length
      }
    });
  } catch (error) {
    console.error('Error getting dialog messages:', error);
    res.status(500).json({ 
      error: error.response?.data?.error || error.message || 'Failed to get messages' 
    });
  }
};

// Отправить сообщение
export const sendMessage = async (req, res) => {
  try {
    const { dialogId } = req.params;
    const userId = req.user.userId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const dialog = await Dialog.findOne({ dialogId, isActive: true });
    if (!dialog) {
      return res.status(404).json({ error: 'Dialog not found' });
    }

    // Проверяем права доступа
    if (dialog.userId !== userId && dialog.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Получаем mms3UserId пользователя
    const user = await User.findOne({ userId });
    if (!user || !user.mms3UserId) {
      return res.status(400).json({ error: 'User not registered in mms3' });
    }

    // Отправляем сообщение через mms3
    const messageResponse = await mms3Client.post(
      `/dialogs/${dialog.mms3DialogId}/messages`,
      {
        senderId: user.mms3UserId,
        content: content.trim(),
        type: 'internal.text'
      }
    );

    // Обновляем диалог
    dialog.lastMessageAt = new Date();
    
    // Обновляем счетчик непрочитанных для другого участника
    if (dialog.userId === userId) {
      dialog.unreadCountOwner += 1;
    } else {
      dialog.unreadCountUser += 1;
    }

    await dialog.save();

    res.json({
      data: {
        messageId: messageResponse.data.messageId,
        senderId: user.mms3UserId,
        senderName: user.name || user.phone,
        content: content.trim(),
        type: 'internal.text',
        createdAt: messageResponse.data.createdAt,
        status: 'sent'
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: error.response?.data?.error || error.message || 'Failed to send message' 
    });
  }
};

// Отметить диалог как прочитанный
export const markAsRead = async (req, res) => {
  try {
    const { dialogId } = req.params;
    const userId = req.user.userId;

    const dialog = await Dialog.findOne({ dialogId, isActive: true });
    if (!dialog) {
      return res.status(404).json({ error: 'Dialog not found' });
    }

    // Проверяем права доступа
    if (dialog.userId !== userId && dialog.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Обнуляем счетчик непрочитанных
    if (dialog.userId === userId) {
      dialog.unreadCountUser = 0;
    } else {
      dialog.unreadCountOwner = 0;
    }

    await dialog.save();

    res.json({
      data: {
        unreadCount: dialog.userId === userId ? dialog.unreadCountUser : dialog.unreadCountOwner
      }
    });
  } catch (error) {
    console.error('Error marking dialog as read:', error);
    res.status(500).json({ error: error.message });
  }
};
