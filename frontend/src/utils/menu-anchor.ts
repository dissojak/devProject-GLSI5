type Viewport = { width: number; height: number };

/** Estimated menus may grow to this height; anything tighter below the trigger flips up. */
const MIN_MENU_CLEARANCE = 150;

/** Gap between the trigger edge and the menu edge. */
const MENU_GAP = 6;

/**
 * Viewport-anchored placement for a transient popup panel:
 * - `topEdge` — CSS `top` for opening downwards (below the trigger).
 * - `bottomEdge` — CSS `bottom` for opening upwards (above the trigger).
 * Exactly one of the two is set per placement.
 */
export interface MenuAnchor {
  flipUp: boolean;
  /** CSS `right` — menu right edge pinned to the trigger's right edge. */
  right: number;
  topEdge?: number;
  bottomEdge?: number;
}

/**
 * Bottom edge of the nearest ancestor whose overflow clips children
 * (table panels close overflow for rounded corners), or the viewport.
 * Walks `overflow`/`overflowX`/`overflowY` so either syntax matches.
 */
function nearestClipBottom(start: Element | null): number {
  let cursor: Element | null = start;
  while (cursor instanceof Element) {
    const style = window.getComputedStyle(cursor);
    if (
      style.overflow === "hidden" ||
      style.overflowX === "hidden" ||
      style.overflowY === "hidden"
    ) {
      return cursor.getBoundingClientRect().bottom;
    }
    cursor = cursor.parentElement;
  }
  return window.innerHeight;
}

/**
 * Placement for a popup anchored to `trigger`: right-aligned to the trigger,
 * below it when the clip boundary leaves clearance, otherwise above it.
 */
export function menuAnchor(trigger: Element | null, viewport: Viewport): MenuAnchor {
  const rect = trigger?.getBoundingClientRect();
  if (!rect) {
    return { flipUp: false, right: 0, topEdge: 0 };
  }
  const right = viewport.width - rect.right;
  const flipUp = nearestClipBottom(trigger) - rect.bottom < MIN_MENU_CLEARANCE;
  if (flipUp) {
    return {
      flipUp: true,
      right,
      bottomEdge: viewport.height - (rect.top - MENU_GAP),
    };
  }
  return {
    flipUp: false,
    right,
    topEdge: rect.bottom + MENU_GAP,
  };
}
