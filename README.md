# BDHVS-TEMPLE-RUN

A simple Temple Run-like game.

## What you need?

- Node.js latest LTS (v24+)
- PNPM

## Design decisions (must read before continuing)

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

### Jotai drives surgical UI subscriptions

The game simulation is authoritative inside the runtime. A `MetricsSink` pushes fine-grained atoms from the runtime to Jotai's default store each frame. React and Pixi components subscribe to exactly the atoms they need — no more, no less.

That gives us:

- zero unnecessary re-renders: a score change does not re-render the FPS display
- a stable seam between gameplay and UI via the `MetricsSink` interface
- ~33 individual atoms across metrics, render, preview, settings, and dialog state
- `atomWithStorage` for automatic localStorage persistence of game settings

The runtime writes to individual atoms via `getDefaultStore().set(atom, value)` — no store object, no action dispatch, no selector memoization.

### MediaPipe is wrapped behind an adapter

Pose tracking is a volatile dependency surface: camera permissions, model loading, calibration, tracking loss, and package evolution all deserve isolation.

The runtime talks to a `PoseCommandProvider` contract, not directly to MediaPipe internals. That keeps pose classification swappable and testable.

### Obstacle scoring is LUT-driven

Obstacle outcomes are defined in a lookup table:

```ts
const obstacleScoreDelta: Record<ObstacleType, number>
```

That table is the canonical award/punishment layer for obstacle collisions. The runtime consumes the LUT rather than scattering score penalties across switch statements.

### Assets use a manifest pipeline

The setup is rock-solid and ready for customizations, as everything is split down as engines or similar patterns for both bundle efficiency, ease of maintenance, and easy future optimization (if needed).

## Project layout

- `src/app`: React entrypoints and providers
- `src/components`: DOM/Chakra shell surfaces
- `src/game/domain`: shared enums and world types
- `src/game/runtime`: simulation, lifecycle, and world stepping
- `src/game/rendering`: Pixi renderer adapter
- `src/game/input`: MediaPipe Tasks integration and pose classification
- `src/game/assets`: typed asset manifest and pipeline
- `src/store`: Jotai atoms and runtime metrics bridge

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
# should note that this only works for the React side of things.
# to test the game logic, it's required to use the production build.
pnpm dev 
```

Common commands:

```bash
pnpm test
pnpm typecheck
pnpm check
pnpm build
```

URL is prefixed with `/BDHVS-TEMPLE-RUN/`

## Current gameplay scope

This game intentionally keeps the loop narrow:

- left, right
- endless lane runner
- obstacles, score, lives
- speed ramp
- restart loop
- webcam pose input plus keyboard fallback

## License

MIT

This project uses: 
- The [Tiny Dungeon asset pack](https://kenney.nl/assets/tiny-dungeon) - CC0
- Simple Web Audio API sound engine from Hoàng Minh Thiên, originally crafted for The Gifted Battlefield
- SFXes chopped from various sources, reduced qualities, ensuring fair use
- [Andrah - pretty afternoon \[NCS Release\]](http://ncs.io/prettyafternoon) - NCS

Special thanks to the creators of these arts/software.