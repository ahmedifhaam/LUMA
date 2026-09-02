import { describe, expect, it } from 'vitest';
import {
  isEditableTarget,
  pageForShortcut,
  resolveReaderShortcut,
  type ReaderShortcutState,
} from './reader-shortcuts';

const baseState: ReaderShortcutState = {
  currentPage: 5,
  pageCount: 100,
  viewMode: 'continuous',
  activePanel: null,
  hasSelection: false,
};

function key(
  keyName: string,
  overrides: Partial<KeyboardEvent> & { target?: EventTarget | null } = {},
) {
  return {
    key: keyName,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    target: document.body,
    ...overrides,
  };
}

describe('resolveReaderShortcut', () => {
  it('navigates pages with arrow keys and space', () => {
    expect(resolveReaderShortcut(key('ArrowLeft'), baseState)).toEqual({
      type: 'previous-page',
    });
    expect(resolveReaderShortcut(key('ArrowRight'), baseState)).toEqual({
      type: 'next-page',
    });
    expect(resolveReaderShortcut(key(' '), baseState)).toEqual({ type: 'next-page' });
    expect(resolveReaderShortcut(key('PageUp'), baseState)).toEqual({
      type: 'previous-page',
    });
    expect(resolveReaderShortcut(key('PageDown'), baseState)).toEqual({
      type: 'next-page',
    });
  });

  it('jumps to first and last page', () => {
    expect(resolveReaderShortcut(key('Home'), baseState)).toEqual({ type: 'first-page' });
    expect(resolveReaderShortcut(key('End'), baseState)).toEqual({ type: 'last-page' });
  });

  it('toggles bookmark with b', () => {
    expect(resolveReaderShortcut(key('b'), baseState)).toEqual({ type: 'toggle-bookmark' });
    expect(resolveReaderShortcut(key('B'), baseState)).toEqual({ type: 'toggle-bookmark' });
  });

  it('opens search with slash or find shortcut', () => {
    expect(resolveReaderShortcut(key('/'), baseState)).toEqual({
      type: 'open-panel',
      panel: 'search',
    });
    expect(
      resolveReaderShortcut(key('f', { ctrlKey: true }), baseState),
    ).toEqual({ type: 'open-panel', panel: 'search' });
    expect(
      resolveReaderShortcut(key('f', { metaKey: true }), baseState),
    ).toEqual({ type: 'open-panel', panel: 'search' });
  });

  it('closes panel or clears selection on Escape', () => {
    expect(
      resolveReaderShortcut(key('Escape'), { ...baseState, activePanel: 'search' }),
    ).toEqual({ type: 'close-panel' });
    expect(
      resolveReaderShortcut(key('Escape'), { ...baseState, hasSelection: true }),
    ).toEqual({ type: 'clear-selection' });
  });

  it('ignores shortcuts while typing in inputs', () => {
    const input = document.createElement('input');
    expect(resolveReaderShortcut(key('ArrowRight', { target: input }), baseState)).toBeNull();
    expect(resolveReaderShortcut(key('b', { target: input }), baseState)).toBeNull();
  });

  it('ignores modified navigation keys', () => {
    expect(resolveReaderShortcut(key('ArrowRight', { shiftKey: true }), baseState)).toBeNull();
    expect(resolveReaderShortcut(key('ArrowRight', { ctrlKey: true }), baseState)).toBeNull();
  });
});

describe('pageForShortcut', () => {
  it('clamps page navigation', () => {
    expect(
      pageForShortcut({ type: 'previous-page' }, { ...baseState, currentPage: 1 }),
    ).toBe(1);
    expect(
      pageForShortcut({ type: 'next-page' }, { ...baseState, currentPage: 100 }),
    ).toBe(100);
    expect(pageForShortcut({ type: 'first-page' }, baseState)).toBe(1);
    expect(pageForShortcut({ type: 'last-page' }, baseState)).toBe(100);
  });

  it('steps by spread in double view', () => {
    const doubleState = { ...baseState, viewMode: 'double' as const, pageCount: 24 };
    expect(pageForShortcut({ type: 'next-page' }, { ...doubleState, currentPage: 1 })).toBe(3);
    expect(pageForShortcut({ type: 'previous-page' }, { ...doubleState, currentPage: 3 })).toBe(1);
    expect(pageForShortcut({ type: 'last-page' }, doubleState)).toBe(23);
  });
});

describe('isEditableTarget', () => {
  it('detects form fields', () => {
    expect(isEditableTarget(document.createElement('input'))).toBe(true);
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true);
    expect(isEditableTarget(document.body)).toBe(false);
  });
});
