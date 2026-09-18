import { copyFile, mkdir, readdir } from 'node:fs/promises';
const destination = new URL('../public/assets/ocr/', import.meta.url);
await mkdir(destination, { recursive: true });
const modules = new URL('../node_modules/', import.meta.url);
await copyFile(new URL('tesseract.js/dist/worker.min.js', modules), new URL('worker.min.js', destination));
const core = new URL('tesseract.js-core/', modules);
for (const file of await readdir(core)) {
  if (file.endsWith('.wasm.js') || file.endsWith('.wasm')) await copyFile(new URL(file, core), new URL(file, destination));
}
await copyFile(new URL('@tesseract.js-data/eng/4.0.0/eng.traineddata.gz', modules), new URL('eng.traineddata.gz', destination));
