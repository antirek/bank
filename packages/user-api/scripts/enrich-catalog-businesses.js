/**
 * Заполняет у публичных бизнесов адрес, контакты, время работы, логотип (LoremFlickr),
 * галерею 3–5 фото (LoremFlickr), синхронизирует card.sections для /b/:slug.
 *
 * @see https://loremflickr.com/
 *
 * Запуск: npm run enrich-catalog -w @boqq/user-api
 */
import mongoose from 'mongoose';
import { config } from '@boqq/shared/config';
import { Business } from '@boqq/shared/models';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const MOSCOW_STREETS = [
  'Тверская',
  'Арбат',
  'Садовая',
  'Кутузовский пр-т',
  'Ленинский пр-т',
  'Покровка',
  'Никольская'
];

/** Плейсхолдеры из LoremFlickr — зафиксированный lock даёт стабильную картинку на кэш-срок. */
const LOGO_KEYWORDS = [
  'shop',
  'cafe',
  'bakery',
  'gym',
  'spa',
  'office',
  'store',
  'salon',
  'hotel',
  'market'
];

const GALLERY_KEYWORDS = [
  'interior',
  'food',
  'coffee',
  'city',
  'workspace',
  'building',
  'retail',
  'design',
  'team',
  'architecture'
];

function loremFlickrUrl(width, height, keyword, lock) {
  let url = `https://loremflickr.com/${width}/${height}`;
  if (keyword) {
    url += `/${keyword}`;
  }
  if (lock != null) {
    url += `${url.includes('?') ? '&' : '?'}lock=${lock}`;
  }
  return url;
}

function hashIdx(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return mod ? h % mod : h;
}

function defaultWorkingHours() {
  const day = (from, to) => ({ enabled: true, from, to });
  return {
    mon: day('09:00', '18:00'),
    tue: day('09:00', '18:00'),
    wed: day('09:00', '18:00'),
    thu: day('09:00', '18:00'),
    fri: day('09:00', '18:00'),
    sat: day('10:00', '16:00'),
    sun: { enabled: false, from: '', to: '' }
  };
}

function hasAnyWorkingDay(wh) {
  if (!wh || typeof wh !== 'object') return false;
  return DAY_KEYS.some((k) => wh[k]?.enabled);
}

function normalizeMessengers(m) {
  return {
    telegram: m?.telegram || '',
    whatsapp: m?.whatsapp || ''
  };
}

function buildCardSections(b) {
  const contacts = {
    phones: Array.isArray(b.contacts?.phones) ? b.contacts.phones.filter(Boolean) : [],
    email: b.contacts?.email || '',
    website: b.contacts?.website || '',
    messengers: normalizeMessengers(b.contacts?.messengers)
  };
  const gallery = Array.isArray(b.gallery) ? b.gallery.filter(Boolean) : [];
  return [
    {
      id: 'hero',
      type: 'hero',
      enabled: true,
      order: 0,
      data: {
        name: b.name || '',
        slug: b.slug || '',
        description: b.description || '',
        logo: b.logo || ''
      }
    },
    { id: 'contacts', type: 'contacts', enabled: true, order: 1, data: contacts },
    { id: 'working_hours', type: 'working_hours', enabled: true, order: 2, data: { ...b.workingHours } },
    {
      id: 'address',
      type: 'address',
      enabled: !!(b.address || '').trim(),
      order: 3,
      data: { address: (b.address || '').trim() }
    },
    {
      id: 'gallery',
      type: 'gallery',
      enabled: gallery.length > 0,
      order: 4,
      data: { images: gallery }
    }
  ];
}

function enrichOne(business) {
  const slugSafe = String(business.slug || 'business').replace(/[^a-z0-9-]/gi, '').slice(0, 40) || 'business';
  const h = hashIdx(business.businessId || slugSafe, 997);

  let changed = false;

  const addr = (business.address || '').trim();
  if (!addr) {
    const street = MOSCOW_STREETS[h % MOSCOW_STREETS.length];
    const house = 1 + (h % 20);
    business.address = `125009, г. Москва, ул. ${street}, д. ${house}`;
    changed = true;
  }

  const phones = business.contacts?.phones?.filter((p) => p && String(p).trim()) || [];
  if (!business.contacts) {
    business.contacts = { phones: [], email: '', website: '', messengers: { telegram: '', whatsapp: '' } };
    changed = true;
  }
  if (phones.length === 0) {
    const p = `+7 (495) ${String(100 + (h % 800)).padStart(3, '0')}-${String(10 + (h % 89)).padStart(2, '0')}-${String(10 + (h % 89)).padStart(2, '0')}`;
    business.contacts.phones = [p];
    changed = true;
  }
  if (!(business.contacts.email || '').trim()) {
    business.contacts.email = `info@${slugSafe}.local`;
    changed = true;
  }
  business.contacts.messengers = normalizeMessengers(business.contacts.messengers);

  if (!hasAnyWorkingDay(business.workingHours)) {
    business.workingHours = defaultWorkingHours();
    changed = true;
  }

  if (business.isPublic !== true) {
    business.isPublic = true;
    changed = true;
  }

  if (!(business.logo || '').trim()) {
    const logoKw = LOGO_KEYWORDS[h % LOGO_KEYWORDS.length];
    business.logo = loremFlickrUrl(200, 200, `${logoKw},business`, 50000 + (h % 9000));
    changed = true;
  }

  const existingGallery = Array.isArray(business.gallery) ? business.gallery.map((x) => String(x).trim()).filter(Boolean) : [];
  const targetGalleryCount = 3 + (h % 3);
  if (existingGallery.length < 3) {
    const urls = [];
    for (let i = 0; i < targetGalleryCount; i++) {
      const kw = GALLERY_KEYWORDS[(h + i) % GALLERY_KEYWORDS.length];
      urls.push(loremFlickrUrl(640, 480, kw, 70000 + (h % 5000) * 20 + i));
    }
    business.gallery = urls;
    changed = true;
  }

  const nextSections = buildCardSections(business);
  const prev = JSON.stringify(business.card?.sections || []);
  const next = JSON.stringify(nextSections);
  if (prev !== next) {
    business.card = business.card || {};
    business.card.sections = nextSections;
    changed = true;
  }

  return changed;
}

async function main() {
  await mongoose.connect(config.mongodbUri);
  console.log('MongoDB подключена\n');

  const all = await Business.find({ isActive: true });
  console.log(`Найдено активных бизнесов: ${all.length}`);

  let updated = 0;
  for (const b of all) {
    const before = b.toObject();
    if (enrichOne(b)) {
      await b.save();
      updated++;
      console.log(`  ✓ ${before.name} (${before.slug})`);
    } else {
      console.log(`  — без изменений: ${before.name} (${before.slug})`);
    }
  }

  console.log(`\nГотово. Обновлено записей: ${updated} из ${all.length}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
