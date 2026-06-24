# Temple Run Lite

Temple Run Lite is a deliberate reinitialization of a previously tangled prototype into a game-first TypeScript codebase with explicit boundaries between UI, simulation, rendering, and pose input.

## Why this repo was reinitialized

The old project was effectively a single HTML file with inline state, rendering, controls, and diagnostics all intertwined. That was useful for proving the idea, but it made the next steps expensive:

- changing one subsystem risked breaking several others
- runtime logic lived too close to the UI surface
- there was no strict TypeScript safety net
- tooling, formatting, hooks, and tests were missing

This rebuild treats the prototype as reference material, not as a foundation.

## Design decisions

### React/DOM and Pixi are intentionally split

The application shell is text-heavy: setup copy, HUD labels, buttons, debug messages, calibration prompts, and future menus/settings all benefit from DOM ergonomics and Chakra UI consistency.

The game viewport is not text-heavy. It benefits from a rendering stack built for sprites, animation, and draw-call-oriented work. That is why PixiJS owns the gameplay surface and React does not participate in the frame loop.

### The runtime is static on purpose

The game lifecycle is centralized in static modules so the hot path avoids React component churn and unnecessary object virtualization. The runtime owns:

- boot and teardown
- frame stepping
- spawn cadence
- collision resolution
- speed and distance progression
- input command application

Data remains plain and serializable. The architecture aims for low overhead without turning the codebase into a bundle of hidden mutable state.

### Zustand mirrors metrics instead of owning the simulation

The game simulation is authoritative inside the runtime. Zustand receives selected snapshots so React can subscribe to exactly what it needs.

That gives us:

- minimal re-renders for DOM HUD/debug surfaces
- a stable seam between gameplay and UI
- room for manual selector-based optimization where helpful

### MediaPipe is wrapped behind an adapter

Pose tracking is a volatile dependency surface: camera permissions, model loading, calibration, tracking loss, and package evolution all deserve isolation.

The runtime talks to a `PoseCommandProvider` contract, not directly to MediaPipe internals. That keeps pose classification swappable and testable.

### Obstacle scoring is LUT-driven

Obstacle outcomes are defined in a lookup table:

```ts
const obstacleScoreDelta: Record<ObstacleType, number>
```

That table is the canonical award/punishment layer for obstacle collisions. The runtime consumes the LUT rather than scattering score penalties across switch statements.

### Assets use a manifest pipeline even though v1 is placeholder-heavy

The current build leans on programmatic Pixi rendering and lightweight placeholder assets. Even so, the repo already includes a typed bundle-oriented asset pipeline so real art and audio can be introduced later without changing runtime boundaries.

## Project layout

- `src/app`: React entrypoints and providers
- `src/components`: DOM/Chakra shell surfaces
- `src/game/domain`: shared enums and world types
- `src/game/runtime`: simulation, lifecycle, and world stepping
- `src/game/rendering`: Pixi renderer adapter
- `src/game/input`: MediaPipe Tasks integration and pose classification
- `src/game/assets`: typed asset manifest and pipeline
- `src/store`: Zustand store and runtime metrics bridge

## Tooling choices

- `Vite` for the React + TypeScript app scaffold
- `PNPM` as package manager
- `Biome` initialized from its default CLI config
- `Husky` for a fast pre-commit formatting/check pass
- `Vitest` for unit and integration-oriented runtime tests
- strict TypeScript settings for early failure and cleaner interfaces

## Local setup

```bash
pnpm install
pnpm dev
```

Common commands:

```bash
pnpm test
pnpm typecheck
pnpm check
pnpm build
```

## Current gameplay scope

This v1 rebuild intentionally keeps the loop narrow:

- left, right, jump
- endless lane runner
- obstacles, coins, score, lives
- speed ramp
- restart loop
- webcam pose input plus keyboard fallback

## Extension points

The current structure is designed to grow without collapsing boundaries. Natural next steps include:

- adding `SLIDE` as a fourth action
- replacing placeholder visuals with authored sprites and audio
- richer obstacle behavior and non-score effect payloads
- more advanced calibration heuristics
- persistence, settings, and accessibility tuning
