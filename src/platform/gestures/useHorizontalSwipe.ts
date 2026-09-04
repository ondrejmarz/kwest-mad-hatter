import { useEffect, useRef, type RefObject } from 'react';

/**
 * Horizontal swipe navigation for the tab shell. Touch-only: the tab bar is a mobile affordance and
 * desktop users click. The gesture is deliberately WIDE so a stray drag never switches tabs — it
 * commits only past a long throw (or a fast flick) — and it yields to any horizontally scrollable
 * content it starts inside (an `overflow-x` scroller or a `[data-no-swipe]` element), so future
 * swipeable card rows keep working untouched. The current screen tracks the finger 1:1; at the first
 * or last tab it pulls with rubber-band resistance and springs back.
 */
export type SwipeDirection = 'next' | 'prev';

interface SwipeOptions {
  /** Is there a tab to move to in this direction? Chooses rubber-band vs. 1:1 tracking, and commit. */
  readonly hasNeighbor: (dir: SwipeDirection) => boolean;
  /** Fired once a swipe is committed — navigate to the adjacent tab here. */
  readonly onCommit: (dir: SwipeDirection) => void;
  /** Turn the whole gesture off (e.g. on a route that is not a tab). */
  readonly enabled?: boolean;
}

const EDGE_GUARD = 24; // px along each screen edge left to the browser's own back gesture
const ACTIVATE = 10; // px of travel before a drag is claimed as horizontal
const RUBBER_LIMIT = 96; // px the pull past the first/last tab eases toward — no hard stop, so it stays fluid
const FLICK_MS = 300; // a quick flick still commits, but only past a longer throw
const FLICK_DIST = 90; // px

/** Commit distance: a long, deliberate throw — a big chunk of the viewport — so a switch is never accidental. */
function commitDistance(): number {
  return Math.max(96, window.innerWidth * 0.4);
}

/** Walk up from the touch target: bail if the gesture began inside something that scrolls sideways. */
function startedInHorizontalScroller(target: EventTarget | null, root: HTMLElement): boolean {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== root) {
    if (node.dataset.noSwipe !== undefined) return true;
    const style = getComputedStyle(node);
    if (
      (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
      node.scrollWidth > node.clientWidth
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

export function useHorizontalSwipe<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: SwipeOptions,
): void {
  // Keep the latest callbacks without re-attaching listeners every render.
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let tracking = false; // a touch is down in a swipeable spot
    let active = false; // committed to a horizontal drag
    let dragged = false; // moved far enough to count as a drag (so we suppress the ghost click)

    const move = (x: number, animate: boolean) => {
      el.style.transition = animate ? 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
      el.style.transform = `translateX(${x}px)`;
    };

    const reset = () => {
      tracking = false;
      active = false;
    };

    const onStart = (event: TouchEvent) => {
      if (optsRef.current.enabled === false || event.touches.length !== 1) {
        reset();
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      if (touch.clientX < EDGE_GUARD || touch.clientX > window.innerWidth - EDGE_GUARD) return;
      if (startedInHorizontalScroller(event.target, el)) return;
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = event.timeStamp;
      tracking = true;
      active = false;
      dragged = false;
    };

    const onMove = (event: TouchEvent) => {
      if (!tracking) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (!active) {
        // Once a mostly-vertical intent shows, hand the gesture back to the scroller.
        if (Math.abs(dy) > ACTIVATE && Math.abs(dy) >= Math.abs(dx)) {
          tracking = false;
          return;
        }
        if (Math.abs(dx) > ACTIVATE && Math.abs(dx) > Math.abs(dy)) active = true;
        else return;
      }
      if (event.cancelable) event.preventDefault(); // lock the axis: no vertical scroll mid-swipe
      dragged = true;
      const dir: SwipeDirection = dx < 0 ? 'next' : 'prev';
      // Past the first/last tab the pull eases toward RUBBER_LIMIT and never hits a wall, so a swipe
      // into nothing decelerates smoothly instead of snagging.
      const offset = optsRef.current.hasNeighbor(dir)
        ? dx
        : Math.sign(dx) * RUBBER_LIMIT * (1 - Math.exp(-Math.abs(dx) / RUBBER_LIMIT));
      move(offset, false);
    };

    const onEnd = (event: TouchEvent) => {
      if (!active) {
        reset();
        return;
      }
      const touch = event.changedTouches[0];
      if (!touch) {
        reset();
        return;
      }
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const dir: SwipeDirection = dx < 0 ? 'next' : 'prev';
      const far = Math.abs(dx) >= commitDistance();
      const flick =
        event.timeStamp - startTime < FLICK_MS &&
        Math.abs(dx) >= FLICK_DIST &&
        Math.abs(dx) > Math.abs(dy) * 2;
      if (dragged && event.cancelable) event.preventDefault(); // swallow the post-drag ghost click
      if ((far || flick) && optsRef.current.hasNeighbor(dir)) {
        move(0, false); // the destination mounts fresh and plays its own spring-in
        optsRef.current.onCommit(dir);
      } else {
        move(0, true); // snap back
      }
      reset();
    };

    const onCancel = () => {
      if (active) move(0, true);
      reset();
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: false });
    el.addEventListener('touchcancel', onCancel, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
    };
  }, [ref]);
}
