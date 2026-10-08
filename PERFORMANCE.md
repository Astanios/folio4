# Performance notes

## Profiling

Open the app with `?perf=1` to show an optional performance overlay. It samples
90 frames and reports average FPS, p95 frame time, draw calls, submitted triangles,
drawing-buffer size, and texture count. Render counters include water reflections
and postprocessing. Without the query parameter, the profiler is not mounted.

Compare settled scenes at the same viewport and drawing-buffer size. Animation
and randomly generated particles cause modest variation. These counters measure
submitted work, not GPU execution time. Test a production build on the actual
phone for representative frame pacing and thermal behavior.

## October 8 optimization pass

- Skip the second bloom pipeline when it contributes zero intensity. Preserve it
  throughout the company/contact blend and restore it on the return journey.
- Pack visible particle cores, rupturing shells, and droplets into their instance
  buffers. Keep all logical particles, original geometry, colors, and pop timing.
  Previously every invisible zero-scale instance was submitted to the GPU too.
- Skip spark transforms and buffer uploads while emission is zero, preserving
  their clock and pointer easing so reappearance keeps the same behavior.

Desktop development preview, 1280 × 720 drawing buffer:

| Settled scene | Before | After |
| --- | ---: | ---: |
| Opening draw calls/frame (sample) | 115 | 97 |
| Thought field triangles/frame (sample) | 1,618,739 | 1,545,015 |

Both runs were approximately 60 FPS. These are reductions in rendering work,
not a claim of a measured FPS improvement on the Pixel. Particle counts,
reflection resolution, render resolution, shaders, and texture quality were not
reduced.

## Remaining opportunities

The public assets occupy roughly 49 MiB on disk (not an initial-transfer figure).
Models account for about 34 MiB; the hand GLB alone is about 17.75 MB. Texture
compression and model LODs could improve loading, memory, and rendering further,
but require close visual comparison before adopting them. The first island model
contains approximately 132,000 triangles and appears repeatedly in the background.
The production JavaScript bundle is about 437 kB gzip. Prioritize actual-device
profiling before reducing effects or detail that contribute to the experience.
