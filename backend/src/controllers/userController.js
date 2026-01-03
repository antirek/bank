import User from '../models/User.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true });
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { userId, phone, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this phone already exists' });
    }

    const user = new User({
      userId: userId || `user_${Date.now()}`,
      phone,
      name: name || ''
    });

    await user.save();
    res.status(201).json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const userId = req.params.userId;
    const currentUserId = req.user?.userId; // Из токена

    // Проверяем, что пользователь обновляет свой профиль
    if (userId !== currentUserId) {
      return res.status(403).json({ error: 'Access denied. You can only update your own profile' });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { name, avatar, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
