import { parseInvoiceText } from '@/utils/invoiceOcr';

export async function extractInvoiceData(file, { signal, onProgress = () => {} } = {}) {
  const { createWorker } = await import('tesseract.js');
  signal?.throwIfAborted();
  let worker;
  let timeout;
  let abort;
  const canceled = new Promise((_, reject) => {
    abort = () => reject(new DOMException('Extraction canceled.', 'AbortError'));
    signal?.addEventListener('abort', abort, { once: true });
    timeout = setTimeout(() => reject(new Error('Extraction timed out. Try a clearer image or enter details manually.')), 90000);
  });
  let finished = false;
  try {
    const work = (async () => {
      worker = await createWorker('eng', 1, {
        workerPath: '/assets/ocr/worker.min.js', corePath: '/assets/ocr', langPath: '/assets/ocr',
        workerBlobURL: false,
        logger: ({ status, progress }) => { if (!finished) onProgress(`${status} ${Math.round((progress || 0) * 100)}%`); },
      });
      if (finished) { await worker.terminate(); return; }
      const { data } = await worker.recognize(file);
      const text = data.text.trim();
      if (!text) throw new Error('No readable text found. Try a clearer image or enter details manually.');
      return { text, fields: parseInvoiceText(text) };
    })();
    return await Promise.race([work, canceled]);
  } finally {
    finished = true;
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
    if (worker) await worker.terminate();
  }
}
