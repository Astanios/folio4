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
The production JavaScript bundle is about 444 kB gzip. Prioritize actual-device
profiling before reducing effects or detail that contribute to the experience.

## October 10 cinematic opening

The opening uses detailed procedural cloud banks, a sun and reflection driven
by the same solar position, and hazed terrain reusing the existing mountain.
Terrain bases follow the ocean tilt and sit below its surface; responsive
placement keeps the mountains at the frame borders. Rock roughness and grain
are opt-in, preserving the contact scene's existing material.

A shared animated cloud field masks both the sky and the solar material.
GodRays renders that masked material, and additional warm shafts sample the
same cloud gaps across the source. This approximates scattering without a
raymarched volume or an additional cloud render pass. Five noise octaves and
separate wisps improve cloud detail; source sampling skips distant sky pixels.

After visual review, the initial procedural water was replaced with the earlier
three-stdlib Water appearance and its existing normal texture. Its 512 × 512
reflection-camera scene render is restored. This prioritizes the preferred
water appearance over the initial reduction in submitted rendering work.
Wave normals now follow the composed sea tilt. No new model or texture downloads
are required, and contact water remains unchanged.

The composed horizon is the finite ocean edge rather than the infinite water
plane. Within the existing reflection render, the sun and atmosphere mirror
their main-camera image around that visible horizon. This keeps the solar crop,
cloud mask and halo aligned with the waterline without an extra rendering pass.
Other models retain their physical reflections. Ridge centres sit on the frame
edges, leaving approximately half of each distant silhouette inside the view.

Representative revised opening samples:

| Preview | Average FPS | Draw calls/frame | Submitted triangles/frame |
| --- | ---: | ---: | ---: |
| Development, 1440 × 900 | 59.8 | 101.4 | 623,774 |
| Production, 390 × 844 | 59.8 | 85.0 | 585,177 |

Floating islands move in and out of view, so these are samples rather than fixed
budgets or GPU benchmarks. Production JavaScript is 443.74 kB gzip.

Visual checks covered portrait/mobile, desktop and wide layouts and forward/
return opening travel. The production preview reported no console errors or
warnings. Sky/cloud and water clocks stop under reduced-motion preferences.
Actual phone GPU/thermal testing remains necessary before claiming mobile
performance from desktop browser viewport tests.
