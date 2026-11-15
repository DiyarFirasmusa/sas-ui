import { createContext, useContext } from 'react';

export interface ItemEntry {
  value: string;
  keywords: string[];
  group: string | null;
}

export interface CommandContextValue {
  listId: string;
  search: string;
  setSearch: (search: string) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  hasResults: boolean;
  ready: boolean;
  isMatch: (entry: ItemEntry) => boolean;
  groupVisible: (group: string) => boolean;
  register: (id: string, entry: ItemEntry) => () => void;
  options: () => HTMLElement[];
}

export const CommandContext = createContext<CommandContextValue | null>(null);
export const GroupContext = createContext<string | null>(null);

export function useCommand(): CommandContextValue {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('Command parts must be used inside <Command> or <CommandDialog>');
  }
  return context;
}
