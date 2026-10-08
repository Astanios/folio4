import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

// Opt-in diagnostics: ?perf=1. Counts include water reflections and all
// postprocessing passes, rather than just the renderer's final fullscreen pass.
export default function PerformanceReadout() {
  const gl = useThree((state) => state.gl);
  const output = useRef();
  const frames = useRef([]);
  useEffect(() => {
    const previous = gl.info.autoReset;
    gl.info.autoReset = false;
    const element = document.createElement("output");
    element.id = "scene-performance";
    element.setAttribute("aria-label", "Scene performance");
    element.style.cssText = "position:fixed;bottom:8px;left:8px;z-index:10000;pointer-events:none;white-space:pre;background:#000d;color:#fff;padding:8px;font:11px/1.4 monospace";
    element.textContent = "Measuring scene…";
    document.body.appendChild(element);
    output.current = element;
    return () => { gl.info.autoReset = previous; element.remove(); };
  }, [gl]);
  useFrame((_, delta) => {
    if (!output.current) return;
    // Ignore long pauses caused by switching tabs or resizing the preview.
    if (delta < 0.25) frames.current.push({ ms: delta * 1000,
      calls: gl.info.render.calls, triangles: gl.info.render.triangles });
    gl.info.reset();
    if (frames.current.length < 90) return;
    const samples = frames.current;
    const average = (key) => samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length;
    const times = samples.map((sample) => sample.ms).sort((a, b) => a - b);
    output.current.textContent = `FPS: ${(1000 / average("ms")).toFixed(1)} | p95 frame: ${times[Math.floor(times.length * 0.95)].toFixed(1)} ms\nDraw calls/frame: ${average("calls").toFixed(1)} | triangles/frame: ${Math.round(average("triangles")).toLocaleString()}\nBuffer: ${gl.domElement.width} × ${gl.domElement.height} | textures: ${gl.info.memory.textures}`;
    frames.current = [];
  }, -100);
  return null;
}
