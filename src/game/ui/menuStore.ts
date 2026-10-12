export type MenuId =
  | 'resident-phone' | 'basketball' | 'city-journal' | 'multiplayer' | 'controls' | 'welcome' | 'release' | 'shop' | 'marty' | 'encounter'
  | 'wardrobe' | 'achievements' | 'daily' | 'pigeon-panic' | 'work-dodge';

/** Local UI ownership only. Opening a menu must never pause a shared world. */
export function createMenuStore(initial: MenuId | null = null) {
  let active = initial;
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach(listener => listener());

  return {
    getSnapshot: () => active,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    open(id: MenuId) {
      if (active !== null) return false;
      active = id;
      publish();
      return true;
    },
    close(id: MenuId) {
      // A stale close callback cannot dismiss a different menu.
      if (active !== id) return;
      active = null;
      publish();
    },
  };
}

export type MenuStore = ReturnType<typeof createMenuStore>;
