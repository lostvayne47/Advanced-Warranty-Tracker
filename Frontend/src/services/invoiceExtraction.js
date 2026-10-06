import api from '@/services/api';
import { appConfig } from '@/config/appConfig';

export async function extractInvoiceData(file, { signal, onProgress = () => {} } = {}) {
  if (!appConfig.apiBaseUrl) throw new Error('Connect the backend to use Gemini invoice parsing.');
  signal?.throwIfAborted();
  onProgress('Reading invoice with Gemini…');
  const form = new FormData();
  form.append('invoiceImage', file);
  try {
    const { data } = await api.post('/invoice-extractions', form, {
      signal, timeout: 75000, headers: { 'Content-Type': undefined },
    });
    signal?.throwIfAborted();
    if (!data || typeof data !== 'object' || !data.fields || typeof data.fields !== 'object' ||
        Array.isArray(data.fields) || Object.values(data.fields).some(value => typeof value !== 'string') ||
        !Array.isArray(data.warnings) || data.warnings.some(value => typeof value !== 'string')) {
      throw new Error('The server returned unreadable invoice details. Please retry extraction.');
    }
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (!error.isAxiosError) throw error;
    throw new Error(error.response?.data?.message ||
      (error.code === 'ECONNABORTED' ? 'Invoice parsing timed out. Please retry.' :
        'Unable to read the invoice. Check your connection and try again.'));
  }
}
