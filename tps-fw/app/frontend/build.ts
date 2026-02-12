/**
 * Build script untuk frontend baru
 * Jalankan dengan: bun run app/frontend/build.ts
 */

import { join } from 'path';
import { $ } from 'bun';

const frontendDir = import.meta.dir;
const entrypoint = join(frontendDir, 'client.tsx');
const outdir = join(frontendDir, '../../dist');

// Build CSS with Tailwind
console.log('Building CSS...');
try {
  await $`bunx tailwindcss -c ${join(frontendDir, 'tailwind.config.js')} -i ${join(frontendDir, 'styles.css')} -o ${join(outdir, 'frontend.css')} --minify`.quiet();
  console.log('CSS built successfully!');
} catch (e) {
  console.error('CSS build warning:', e);
}

console.log('Building frontend JS...');
console.log('Entry:', entrypoint);
console.log('Output:', outdir);

const result = await Bun.build({
  entrypoints: [entrypoint],
  outdir,
  target: 'browser',
  format: 'esm',
  splitting: true,
  minify: true,
  sourcemap: 'external',
  naming: {
    entry: 'frontend.js',
    chunk: '[name]-[hash].js',
  },
  external: [],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

if (!result.success) {
  console.error('Build failed:');
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log('Build success!');
console.log('Output files:');
for (const output of result.outputs) {
  console.log(' -', output.path);
}
