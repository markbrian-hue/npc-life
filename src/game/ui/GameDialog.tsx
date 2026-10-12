import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useGameUI, isTyping } from './GameUI';
import type { MenuId } from './menuStore';

const FOCUSABLE = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function GameDialog({ id, label, className = '', onClose, onKeyDown, children }: {
  id: MenuId;
  label: string;
  className?: string;
  onClose: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDialogElement>) => void;
  children: ReactNode;
}) {
  const { menu, store } = useGameUI();
  const ref = useRef<HTMLDialogElement>(null);
  const outsidePress = useRef(false);
  const visible = menu === id;

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!visible || !dialog) return;
    const previous = document.activeElement;
    // Native modality makes all background controls inert, including portals.
    dialog.showModal();
    dialog.focus({ preventScroll: true });
    // Tab switches and minigame starts can remove or disable the focused button.
    // Keep subsequent keyboard input inside the dialog in that case too.
    const containFocus = () => {
      const active = document.activeElement;
      if (dialog.open && (!dialog.contains(active) || active?.matches(':disabled, [hidden]'))) {
        dialog.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(containFocus);
    observer.observe(dialog, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'hidden'] });
    document.addEventListener('focusin', containFocus);
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', containFocus);
      dialog.close();
      if (store.getSnapshot() === null && previous instanceof HTMLElement && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [visible, store]);

  if (!visible) return null;

  function handleKey(event: KeyboardEvent<HTMLDialogElement>) {
    // Keep native button/checkbox activation, but never forward keys to the city.
    event.stopPropagation();
    if (event.code === 'Escape') {
      event.preventDefault();
      if (!event.repeat) onClose();
      return;
    }
    if (event.key === 'Tab') {
      const dialog = ref.current!;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(el => el.tabIndex >= 0 && el.getClientRects().length > 0 && !el.closest('[hidden], [inert]'));
      const index = controls.indexOf(document.activeElement as HTMLElement);
      if (!controls.length) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && index <= 0) {
        event.preventDefault();
        controls[controls.length - 1].focus();
      } else if (!event.shiftKey && (index === -1 || index === controls.length - 1)) {
        event.preventDefault();
        controls[0].focus();
      }
      return;
    }
    onKeyDown?.(event);
    const toggleKey = id === 'controls' ? 'KeyH' : id === 'daily' ? 'KeyK' : null;
    if (!event.defaultPrevented && !event.repeat && !isTyping(event.target) && event.code === toggleKey) {
      event.preventDefault();
      onClose();
    }
  }

  function outside(x: number, y: number) {
    const box = ref.current!.getBoundingClientRect();
    return x < box.left || x > box.right || y < box.top || y > box.bottom;
  }

  return createPortal(
    <dialog
      ref={ref}
      className={`game-dialog ${className}`}
      aria-label={label}
      aria-modal="true"
      tabIndex={-1}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onKeyDown={handleKey}
      onKeyUp={event => event.stopPropagation()}
      onPointerDown={event => { outsidePress.current = outside(event.clientX, event.clientY); }}
      onClick={event => {
        event.stopPropagation();
        if (outsidePress.current && outside(event.clientX, event.clientY)) onClose();
        outsidePress.current = false;
      }}
    >
      {children}
      <div className="game-dialog-footer" aria-hidden="true">
        <span>IDIOT CITY / RESIDENT SERVICES</span><span><kbd>ESC</kbd> BACK</span>
      </div>
    </dialog>,
    document.body
  );
}
