import { cp, mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, '..');
const dist = path.join(pkgRoot, 'dist');
const target = path.resolve(pkgRoot, '../../packages/owner-pwa/public');

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(dist, target, { recursive: true });
await writeFile(path.join(target, '.gitkeep'), '');
