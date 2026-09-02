import { describe, expect, it } from 'vitest';
import { stripHtml } from '@/infrastructure/document-engine/epub/epub-parser';

describe('stripHtml', () => {
  it('removes tags and normalizes whitespace', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });
});
