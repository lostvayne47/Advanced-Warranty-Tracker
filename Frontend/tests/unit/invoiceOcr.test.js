import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInvoiceText } from '../../src/utils/invoiceOcr.js';

test('OCR extracts labelled fields without inventing warranty coverage', () => {
  assert.deepEqual(parseInvoiceText('Product: Camera\nInvoice date: 2026-01-20\nTotal: INR 1200.00\nWarranty: one year'), {
    productName: 'Camera', purchaseDate: '2026-01-20', currency: 'INR', purchasePrice: '1200.00',
  });
});
test('OCR leaves ambiguous dates, prices and unlabelled products for manual review', () => {
  assert.deepEqual(parseInvoiceText('Camera\nDate: 01/02/2026\nTotal: 1.200,00'), {});
  assert.deepEqual(parseInvoiceText('Date: 2026-02-30'), {});
});
