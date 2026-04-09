/**
 * Генерирует PNG для манифеста (критерии установки Chrome: 192 и 512, не только SVG).
 */
import { readFile, writeFile, access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'public', 'icon-pwa.svg');

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    console.warn(
      '[owner-pwa] sharp не установлен — пропуск генерации PNG. Выполните: npm install -w @boqq/owner-pwa'
    );
    process.exit(0);
  }

  if (!(await fileExists(svgPath))) {
    console.warn('[owner-pwa] Нет public/icon-pwa.svg — пропуск генерации PNG');
    process.exit(0);
  }

  const svg = await readFile(svgPath);
  const out192 = path.join(root, 'public', 'pwa-192.png');
  const out512 = path.join(root, 'public', 'pwa-512.png');

  await sharp(svg).resize(192, 192).png({ compressionLevel: 9 }).toFile(out192);
  await sharp(svg).resize(512, 512).png({ compressionLevel: 9 }).toFile(out512);
  console.log('[owner-pwa] Созданы', path.relative(root, out192), path.relative(root, out512));
}

main().catch((e) => {
  console.error('[owner-pwa] generate-pwa-png:', e);
  process.exit(1);
});
