import { useEffect, useRef, useState } from "react";

const CURSOR_SPEED = 0.08;

let mouseX = -10;
let mouseY = -10;
let outlineX = 0;
let outlineY = 0;

export const Cursor = () => {
  const cursorOutline = useRef();
  const [hoverButton, setHoverButton] = useState(false);

  useEffect(() => {
    let frame;
    const animate = () => {
      if (!cursorOutline.current) return;
      outlineX += (mouseX - outlineX) * CURSOR_SPEED;
      outlineY += (mouseY - outlineY) * CURSOR_SPEED;
      cursorOutline.current.style.left = `${outlineX}px`;
      cursorOutline.current.style.top = `${outlineY}px`;
      frame = requestAnimationFrame(animate);
    };
    const mouseEventsListener = (event) => {
      mouseX = event.pageX;
      mouseY = event.pageY;
    };
    document.addEventListener("mousemove", mouseEventsListener);
    frame = requestAnimationFrame(animate);
    return () => {
      document.removeEventListener("mousemove", mouseEventsListener);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const mouseEventListener = (event) => {
      setHoverButton(Boolean(event.target.closest?.("button, input, textarea")));
    };
    document.addEventListener("mouseover", mouseEventListener);
    return () => {
      document.removeEventListener("mouseover", mouseEventListener);
    };
  }, []);

  return (
    <>
      <div
        className={`invisible md:visible  z-50 fixed -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-transform
        ${
          hoverButton
            ? "bg-transparent border-2 border-indigo-900 w-5 h-5"
            : "bg-indigo-500 w-3 h-3"
        }`}
        ref={cursorOutline}
      ></div>
    </>
  );
};
