import { useScroll } from "@react-three/drei";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";

const GESTURE_IDLE_MS = 180;
const ANCHOR_TOLERANCE = 0.18;
const EDITABLE_OR_CONTROL = "input, textarea, select, button, a[href], [contenteditable='true']";

// Let a description or other nested panel consume its own scrolling first.
function canScrollInside(target, container, direction) {
  for (let node = target instanceof Element ? target : target?.parentElement;
    node && node !== container; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    const limit = node.scrollHeight - node.clientHeight;
    if (limit > 1 && /auto|scroll/.test(overflow)
      && (direction > 0 ? node.scrollTop < limit - 1 : node.scrollTop > 1)) return true;
  }
  return false;
}

export const ScrollManager = ({ section, onSectionChange }) => {
  const data = useScroll();
  const manager = useRef();
  const onChange = useRef(onSectionChange);
  const currentSection = useRef(section);
  const nativeSectionUpdate = useRef(null);
  onChange.current = onSectionChange;
  currentSection.current = section;

  useEffect(() => {
    const el = data.el;
    data.fill.classList.add("top-0", "absolute");
    // This layer clips projected HTML, but must never scroll when a 3D scroll
    // button receives focus; only the outer section container should scroll.
    const resetFixedScroll = () => { data.fixed.scrollTop = 0; data.fixed.scrollLeft = 0; };
    resetFixedScroll();
    data.fixed.addEventListener("scroll", resetFixedScroll, { passive: true });
    const originalTabIndex = el.getAttribute("tabindex");
    if (originalTabIndex === null) el.tabIndex = 0;
    let tween = null;
    let targetSection = null;
    let locked = false;
    let timer;
    let lastInput = -Infinity;
    let lastWheel = -Infinity;
    let previousTop = el.scrollTop;
    let touch = null;
    let key = null;

    const destination = (top, direction) => {
      if (!el.clientHeight) return null;
      const page = top / el.clientHeight;
      const anchor = Math.round(page);
      if (Math.abs(page - anchor) > ANCHOR_TOLERANCE) return null;
      if (direction > 0 && (anchor === 0 || anchor === 1)) return anchor + 1;
      if (direction < 0 && (anchor === 1 || anchor === 2)) return anchor - 1;
      return null;
    };

    const release = () => {
      clearTimeout(timer);
      if (!locked || tween || touch?.owned || key?.owned) return;
      const remaining = GESTURE_IDLE_MS - (performance.now() - lastInput);
      if (remaining > 0) timer = setTimeout(release, remaining);
      else locked = false;
    };
    const activity = () => { lastInput = performance.now(); release(); };

    const moveTo = (next, notify = false) => {
      const clamped = Math.max(0, Math.min(data.pages - 1, next));
      if (tween && targetSection === clamped) return;
      tween?.kill();
      locked = true;
      targetSection = clamped;
      tween = gsap.to(el, {
        duration: currentSection.current <= 1 && clamped <= 1 ? 1.6 : 1,
        scrollTop: clamped * el.clientHeight,
        overwrite: "auto",
        onUpdate: () => { previousTop = el.scrollTop; },
        onComplete: () => {
          tween = null;
          // Recalculate the final anchor if the viewport changed during travel.
          el.scrollTop = clamped * el.clientHeight;
          previousTop = el.scrollTop;
          release();
        },
      });
      if (notify) onChange.current(clamped);
    };
    manager.current = { moveTo };

    const onWheel = (event) => {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const direction = Math.sign(event.deltaY);
      if (!direction || canScrollInside(event.target, el, direction)) return;
      const newGesture = performance.now() - lastWheel > GESTURE_IDLE_MS;
      lastWheel = performance.now();
      activity();
      if (locked) { event.preventDefault(); return; }
      // A native gesture that started beyond the snap anchors stays native.
      if (!newGesture) return;
      const next = destination(el.scrollTop, direction);
      if (next !== null) { event.preventDefault(); moveTo(next, true); }
    };

    const onTouchStart = (event) => {
      if (event.touches.length !== 1) { touch = null; release(); return; }
      const point = event.touches[0];
      touch = { x: point.clientX, y: point.clientY, top: el.scrollTop, owned: false, native: false };
    };
    const onTouchMove = (event) => {
      if (!touch || touch.native || event.touches.length !== 1) return;
      const point = event.touches[0];
      const dy = touch.y - point.clientY;
      const dx = touch.x - point.clientX;
      if (Math.abs(dy) <= Math.abs(dx)) return;
      const direction = Math.sign(dy);
      if (canScrollInside(event.target, el, direction)) { touch.native = true; return; }
      const next = destination(touch.top, direction);
      if (!locked && next === null) { touch.native = true; return; }
      // Cancel the first eligible move so native touch inertia never starts.
      event.preventDefault();
      touch.owned = true;
      activity();
      if (!locked && Math.abs(dy) >= 10) moveTo(next, true);
    };
    const onTouchEnd = (event) => {
      if (event.touches.length) return;
      const owned = touch?.owned;
      touch = null;
      if (owned) activity();
      else release();
    };

    const onKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey
        || event.target.closest?.(EDITABLE_OR_CONTROL)) return;
      const direction = ["ArrowDown", "PageDown"].includes(event.key) ? 1
        : ["ArrowUp", "PageUp"].includes(event.key) ? -1
          : event.key === " " ? (event.shiftKey ? -1 : 1) : 0;
      if (!direction || canScrollInside(event.target, el, direction)) return;
      if (event.repeat) {
        if (locked || key?.owned) { event.preventDefault(); activity(); }
        return;
      }
      const next = destination(el.scrollTop, direction);
      key = { code: event.code, owned: locked || next !== null };
      activity();
      if (key.owned) event.preventDefault();
      if (!locked && next !== null) moveTo(next, true);
    };
    const onKeyUp = (event) => {
      if (key?.code !== event.code) return;
      const owned = key.owned;
      key = null;
      if (owned) activity();
      else release();
    };
    const onBlur = () => { touch = null; key = null; release(); };

    const onScroll = () => {
      const previous = previousTop;
      previousTop = el.scrollTop;
      if (tween) return;
      if (locked) {
        el.scrollTop = targetSection * el.clientHeight;
        previousTop = el.scrollTop;
        return;
      }
      // Keep menu navigation usable after native travel to Contact, without
      // turning that travel into another automatic snap.
      if (el.clientHeight && el.scrollTop / el.clientHeight >= 2.5
        && currentSection.current !== 3) {
        currentSection.current = 3;
        nativeSectionUpdate.current = 3;
        onChange.current(3);
      }
      // Preserve snapping for scrollbar/native input without reinterpreting a
      // wheel, held key, or touch gesture already handled above.
      if (touch || key || performance.now() - lastInput < GESTURE_IDLE_MS) return;
      const delta = el.scrollTop - previous;
      if (Math.abs(delta) < 2) return;
      const next = destination(previous, Math.sign(delta));
      if (next !== null) moveTo(next, true);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      manager.current = null;
      tween?.kill();
      clearTimeout(timer);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      if (originalTabIndex === null) el.removeAttribute("tabindex");
      data.fixed.removeEventListener("scroll", resetFixedScroll);
    };
  }, [data]);

  useEffect(() => {
    if (nativeSectionUpdate.current === section) {
      nativeSectionUpdate.current = null;
      return;
    }
    nativeSectionUpdate.current = null;
    manager.current?.moveTo(section);
  }, [section, data]);
  return null;
};
