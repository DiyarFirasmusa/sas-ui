import { renderHook } from '@testing-library/react';
import { createElement, useContext, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CommandContext, GroupContext, useCommand } from '@/hooks/use-command';
import type { CommandContextValue } from '@/hooks/use-command';

const value: CommandContextValue = {
  listId: 'list',
  search: 'abc',
  setSearch: () => {},
  activeId: null,
  setActiveId: () => {},
  hasResults: true,
  ready: true,
  isMatch: () => true,
  groupVisible: () => true,
  register: () => () => {},
  options: () => [],
};

describe('useCommand', () => {
  it('returns the value of the enclosing Command', () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(CommandContext, { value }, children);
    const { result } = renderHook(() => useCommand(), { wrapper });
    expect(result.current).toBe(value);
  });

  it('throws a helpful error outside a Command', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCommand())).toThrow(
      'Command parts must be used inside <Command> or <CommandDialog>',
    );
    vi.restoreAllMocks();
  });

  it('has no group until a CommandGroup provides one', () => {
    const { result } = renderHook(() => useContext(GroupContext));
    expect(result.current).toBeNull();
  });
});
