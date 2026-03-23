import { Business } from '@boqq/shared/models';
import mms3Client from '@boqq/shared/api-clients/mms3';

const ALLOWED_SECTION_TYPES = new Set(['hero', 'contacts', 'working_hours', 'address', 'gallery']);
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function requireUser(req, res) {
  if (!req.user?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function normalizeDayHours(day = {}) {
  return {
    enabled: Boolean(day.enabled),
    from: day.from || '',
    to: day.to || ''
  };
}

function normalizeWorkingHours(workingHours = {}) {
  return DAY_KEYS.reduce((acc, key) => {
    acc[key] = normalizeDayHours(workingHours[key]);
    return acc;
  }, {});
}

function normalizeContacts(contacts = {}) {
  return {
    phones: Array.isArray(contacts.phones) ? contacts.phones.filter(Boolean) : [],
    email: contacts.email || '',
    website: contacts.website || '',
    messengers: {
      telegram: contacts.messengers?.telegram || '',
      whatsapp: contacts.messengers?.whatsapp || ''
    }
  };
}

function normalizeLocation(location = {}, address = '') {
  const safeLocation = location && typeof location === 'object' ? location : {};
  const safeCoordinates =
    safeLocation.coordinates && typeof safeLocation.coordinates === 'object'
      ? safeLocation.coordinates
      : {};

  return {
    ...safeLocation,
    address: address || safeLocation.address || '',
    coordinates: {
      lat: safeCoordinates.lat ?? null,
      lng: safeCoordinates.lng ?? null
    }
  };
}

function buildDefaultSections(data) {
  return [
    { id: 'hero', type: 'hero', enabled: true, order: 0, data: { name: data.name || '', slug: data.slug || '', description: data.description || '', logo: data.logo || '' } },
    { id: 'contacts', type: 'contacts', enabled: true, order: 1, data: data.contacts || normalizeContacts() },
    { id: 'working_hours', type: 'working_hours', enabled: true, order: 2, data: data.workingHours || normalizeWorkingHours() },
    { id: 'address', type: 'address', enabled: true, order: 3, data: { address: data.address || '' } },
    { id: 'gallery', type: 'gallery', enabled: true, order: 4, data: { images: Array.isArray(data.gallery) ? data.gallery : [] } }
  ];
}

function normalizeSections(sections = []) {
  if (!Array.isArray(sections)) return null;
  const orders = new Set();
  const normalized = [];
  for (const section of sections) {
    if (!ALLOWED_SECTION_TYPES.has(section?.type)) {
      return null;
    }
    const order = Number(section.order);
    if (!Number.isFinite(order) || orders.has(order)) {
      return null;
    }
    orders.add(order);
    normalized.push({
      id: section.id || `${section.type}_${order}`,
      type: section.type,
      enabled: section.enabled !== false,
      order,
      data: section.data || {}
    });
  }
  return normalized.sort((a, b) => a.order - b.order);
}

function validateRequiredBusinessFields(payload) {
  if (!payload.name?.trim() || !payload.slug?.trim() || !payload.description?.trim() || !payload.address?.trim()) {
    return 'Required fields: name, slug, description, address';
  }
  return null;
}

/** Собирает плоские поля бизнеса из нормализованных секций карточки. */
function extractBusinessFromSections(sections) {
  const byType = {};
  for (const s of sections) {
    byType[s.type] = s.data || {};
  }
  const hero = byType.hero || {};
  return {
    name: (hero.name || '').trim(),
    slug: (hero.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
    description: (hero.description || '').trim(),
    logo: (hero.logo || '').trim(),
    address: (byType.address?.address || '').trim(),
    contacts: normalizeContacts(byType.contacts),
    workingHours: normalizeWorkingHours(byType.working_hours),
    gallery: Array.isArray(byType.gallery?.images) ? byType.gallery.images.filter(Boolean) : []
  };
}

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
  if (!requireUser(req, res)) return;
  try {
    let { name, description, slug, categoryIds, location, logo, address, contacts, workingHours, gallery } = req.body;
    const ownerId = req.user.userId;

    if (Array.isArray(req.body.sections)) {
      const normalized = normalizeSections(req.body.sections);
      if (!normalized) {
        return res.status(400).json({ error: 'Invalid sections payload' });
      }
      const extracted = extractBusinessFromSections(normalized);
      name = extracted.name;
      description = extracted.description;
      slug = extracted.slug;
      logo = extracted.logo;
      address = extracted.address;
      contacts = extracted.contacts;
      workingHours = extracted.workingHours;
      gallery = extracted.gallery;
    }

    const requiredErr = validateRequiredBusinessFields({ name, slug, description, address });
    if (requiredErr) {
      return res.status(400).json({ error: requiredErr });
    }
    
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

    const normalizedContacts = normalizeContacts(contacts);
    const normalizedWorking = normalizeWorkingHours(workingHours);
    const galleryArr = Array.isArray(gallery) ? gallery.filter(Boolean) : [];

    let cardSections;
    if (Array.isArray(req.body.sections)) {
      const normalized = normalizeSections(req.body.sections);
      cardSections = normalized;
    } else {
      cardSections = buildDefaultSections({
        name,
        slug,
        description,
        logo,
        contacts: normalizedContacts,
        workingHours: normalizedWorking,
        address,
        gallery: galleryArr
      });
    }

    const business = new Business({
      businessId,
      ownerId,
      name,
      description: description || '',
      address: address || '',
      contacts: normalizedContacts,
      workingHours: normalizedWorking,
      gallery: galleryArr,
      slug,
      logo: logo || '',
      categoryIds: categoryIds || [],
      location: normalizeLocation(location, address),
      card: { sections: cardSections, version: 1 },
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
  if (!requireUser(req, res)) return;
  try {
    const { name, description, slug, logo, categoryIds, location, isPublic, address, contacts, workingHours, gallery } = req.body;
    const businessId = req.params.id;
    const userId = req.user.userId;

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

    const nextName = typeof name === 'string' ? name : business.name;
    const nextSlug = typeof slug === 'string' ? slug : business.slug;
    const nextDescription = typeof description === 'string' ? description : (business.description || '');
    const nextAddress = typeof address === 'string' ? address : (business.address || business.location?.address || '');
    const requiredErr = validateRequiredBusinessFields({
      name: nextName,
      slug: nextSlug,
      description: nextDescription,
      address: nextAddress
    });
    if (requiredErr) {
      return res.status(400).json({ error: requiredErr });
    }

    const normalizedContacts = contacts ? normalizeContacts(contacts) : (business.contacts || normalizeContacts());
    const normalizedWorkingHours = workingHours ? normalizeWorkingHours(workingHours) : (business.workingHours || normalizeWorkingHours());
    const normalizedGallery = Array.isArray(gallery) ? gallery.filter(Boolean) : (business.gallery || []);
    const sections = business.card?.sections?.length
      ? business.card.sections.map((section) => {
          if (section.type === 'hero') {
            return { ...section, data: { ...section.data, name: nextName, slug: nextSlug, description: nextDescription, logo: logo ?? business.logo ?? '' } };
          }
          if (section.type === 'contacts') {
            return { ...section, data: normalizedContacts };
          }
          if (section.type === 'working_hours') {
            return { ...section, data: normalizedWorkingHours };
          }
          if (section.type === 'address') {
            return { ...section, data: { address: nextAddress } };
          }
          if (section.type === 'gallery') {
            return { ...section, data: { images: normalizedGallery } };
          }
          return section;
        })
      : buildDefaultSections({
          name: nextName,
          slug: nextSlug,
          description: nextDescription,
          logo: logo ?? business.logo ?? '',
          contacts: normalizedContacts,
          workingHours: normalizedWorkingHours,
          address: nextAddress,
          gallery: normalizedGallery
        });

    // Обновляем бизнес
    const updatedBusiness = await Business.findOneAndUpdate(
      { businessId },
      { 
        name: nextName,
        description: nextDescription,
        slug: nextSlug,
        address: nextAddress,
        logo: logo ?? business.logo ?? '',
        contacts: normalizedContacts,
        workingHours: normalizedWorkingHours,
        gallery: normalizedGallery,
        categoryIds, 
        location: normalizeLocation(location || business.location, nextAddress),
        isPublic,
        card: { sections, version: (business.card?.version || 1) + 1 },
        updatedAt: new Date() 
      },
      { new: true, runValidators: true }
    );

    res.json({ data: updatedBusiness });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCardConfig = async (req, res) => {
  if (!requireUser(req, res)) return;
  try {
    const businessId = req.params.businessId || req.params.id;
    const business = await Business.findOne({ businessId });
    if (!business) return res.status(404).json({ error: 'Business not found' });
    if (business.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You are not the owner of this business' });
    }
    const sections = business.card?.sections?.length
      ? business.card.sections
      : buildDefaultSections(business);
    return res.json({ data: { sections, version: business.card?.version || 1 } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateCardConfig = async (req, res) => {
  if (!requireUser(req, res)) return;
  try {
    const businessId = req.params.businessId || req.params.id;
    const business = await Business.findOne({ businessId });
    if (!business) return res.status(404).json({ error: 'Business not found' });
    if (business.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You are not the owner of this business' });
    }
    const normalized = normalizeSections(req.body?.sections);
    if (!normalized) {
      return res.status(400).json({ error: 'Invalid sections payload' });
    }
    const extracted = extractBusinessFromSections(normalized);
    const requiredErr = validateRequiredBusinessFields(extracted);
    if (requiredErr) {
      return res.status(400).json({ error: requiredErr });
    }
    if (!extracted.slug || !/^[a-z0-9-]+$/.test(extracted.slug)) {
      return res.status(400).json({ error: 'Invalid slug format. Use only lowercase letters, numbers and hyphens' });
    }
    if (extracted.slug !== business.slug) {
      const existingBusiness = await Business.findOne({ slug: extracted.slug, businessId: { $ne: businessId } });
      if (existingBusiness) {
        return res.status(409).json({ error: 'Business with this slug already exists' });
      }
    }

    business.name = extracted.name;
    business.slug = extracted.slug;
    business.description = extracted.description;
    business.logo = extracted.logo || '';
    business.address = extracted.address;
    business.contacts = extracted.contacts;
    business.workingHours = extracted.workingHours;
    business.gallery = extracted.gallery;
    business.location = normalizeLocation(business.location, extracted.address);
    business.card = { sections: normalized, version: (business.card?.version || 1) + 1 };
    business.updatedAt = new Date();
    await business.save();
    return res.json({ data: business.card });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
