import {
  createContext, useCallback, useContext, useState, useSyncExternalStore,
  type Dispatch, type ReactNode, type SetStateAction,
} from 'react';
import { createMenuStore, type MenuId, type MenuStore } from './menuStore';

const UIContext = createContext<MenuStore | null>(null);

export function GameUIProvider({ initialMenu, children }: {
  initialMenu: MenuId;
  children: ReactNode;
}) {
  const [store] = useState(() => createMenuStore(initialMenu));
  return <UIContext.Provider value={store}>{children}</UIContext.Provider>;
}

export function useGameUI() {
  const store = useContext(UIContext);
  if (!store) throw new Error('GameUIProvider is required');
  const menu = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { menu, store };
}

export function useMenuState(id: MenuId): [boolean, Dispatch<SetStateAction<boolean>>] {
  const { menu, store } = useGameUI();
  const setOpen = useCallback<Dispatch<SetStateAction<boolean>>>((value) => {
    const next = typeof value === 'function' ? value(store.getSnapshot() === id) : value;
    if (next) store.open(id);
    else store.close(id);
  }, [id, store]);
  return [menu === id, setOpen];
}

export function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && !!target.closest(
    'input, textarea, select, [contenteditable="true"]'
  );
}
