/**
 * Плейсхолдер-картинки через LoremFlickr.
 * @see https://loremflickr.com/
 *
 * Примеры:
 * - https://loremflickr.com/320/240
 * - https://loremflickr.com/320/240/dog
 * - https://loremflickr.com/320/240?lock=1 — стабильное изображение при том же lock
 */

export function loremFlickrUrl(width, height, keyword = '', lock = null) {
  let url = `https://loremflickr.com/${width}/${height}`;
  if (keyword) {
    url += `/${keyword}`;
  }
  if (lock != null && lock !== '') {
    url += `${url.includes('?') ? '&' : '?'}lock=${encodeURIComponent(String(lock))}`;
  }
  return url;
}

/** Пример URL логотипа (квадрат). */
export const EXAMPLE_LOGO_URL = loremFlickrUrl(200, 200, 'business,shop', 101);

/** Примеры строк для галереи (по одному URL в строке). */
export const EXAMPLE_GALLERY_URLS = [
  loremFlickrUrl(480, 360, 'cafe', 201),
  loremFlickrUrl(480, 360, 'coffee', 202),
  loremFlickrUrl(480, 360, 'restaurant', 203)
];

export const EXAMPLE_GALLERY_TEXT = EXAMPLE_GALLERY_URLS.join('\n');
