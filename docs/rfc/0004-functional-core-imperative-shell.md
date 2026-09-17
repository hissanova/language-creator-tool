# RFC-0004: Functional Core, Imperative Shell

## Status

Accepted

## Context

Viewer playback already separates state transitions, media decisions, and media operations. LCT needs a project-wide rule for making similar decisions in the Viewer, future Editor, compiler integration, and other features without prescribing one state management library or a new Core JSON structure.

## Decision

LCT uses Functional Core, Imperative Shell as its default application architecture. Put domain decisions, data transformations, and state transitions in pure functions where practical. A pure function returns the same output for the same input, does not depend on external state, and does not mutate its inputs or shared state. State transitions return new state rather than mutating the input state.

Keep the flow of decisions and effects explicit. A useful pattern is:

```text
external event
  -> pure planner / reducer
  -> next state + explicit instructions
  -> imperative adapter
  -> external API
```

This return shape is an example, not a required interface for every feature. Use the smallest shape that keeps decisions separate from execution. Represent actions, events, commands, and instructions as TypeScript discriminated unions when that makes their possible cases explicit. Local mutation of a newly created temporary value is acceptable; mutation of inputs, React state, or shared domain state is not.

## Scope

This principle applies to Viewer, future Editor, compiler integration, and other LCT application features. Domain logic should remain independent of React, DOM, browser APIs, media elements, storage, network, and filesystem APIs. React components and hooks can connect the pure core to the runtime. This RFC governs decisions, transitions, and effects; the existing [Viewer architecture boundaries](../../AGENTS.md#viewer-architecture-boundaries) separately govern the direction from Core semantics through composition and presentation components. It does not change the LCM, Core JSON, or optional Viewer configuration data flow.

## State Management

Use `useState` for small, independent local UI state. When one event changes several related values, or transition rules become complex, consider a pure reducer that takes the current state and an action and returns the next state without changing the input. `useReducer`, Context, and Redux Toolkit are mechanisms to run or share those transitions; none defines the functional architecture by itself. This RFC does not select Redux. During Editor design, compare `useReducer` plus Context with Redux Toolkit after identifying the needed sharing scope, undo/redo behavior, asynchronous work, and cross-screen state.

## Side-Effect Boundaries

Keep DOM operations, media operations such as `HTMLMediaElement.play()`, `pause()`, and `currentTime`, storage, network requests, filesystem access, timers, logging, clipboard access, browser navigation, and launching a compiler process in an imperative adapter, hook, controller, or equivalent boundary. Mutating an external API is permitted at that boundary. When ordering or conditions matter, a pure planner can return commands or instructions for an adapter to execute. A simple effect does not need a command abstraction merely to follow this principle.

## React Integration

Components should primarily compose, forward events, and render. Move complex business decisions and transitions into React-independent functions where practical. Use `useEffect` to synchronize with external systems, rather than as the main home for complex decisions or transitions. `useRef` is allowed for DOM or media references, synchronous coordination between browser events that cannot wait for a React render, and race protection. When a ref supplements React state, make the reason React state alone is insufficient understandable from code, tests, or the PR description. Hooks and controllers are useful shells for connecting the pure core to React and browser runtime.

## Testing Strategy

Test pure reducers, planners, resolvers, and transformers without starting React or a DOM. Use focused adapter tests for external API contracts and ordered instruction execution. Use hook or component integration tests for the connection between layers and behavior visible to users. When refactoring existing behavior, add characterization tests first where needed. Prefer assertions about transitions, invariants, instruction order, and externally visible results over implementation details.

## Consequences

Pure decisions and explicit effects make transitions easier to reason about, reuse, and test. They can also add types, functions, and instructions to a small feature. Choosing a useful boundary requires judgment, and overly fine abstractions can make a flow harder to follow. Small independent UI state and simple event handlers do not need reducers or planners.

## Alternatives Considered

Keeping decisions inside components, effects, or API adapters reduces initial code, but couples domain rules to runtime timing and makes isolated tests harder. Requiring a reducer and command protocol for every interaction would create unnecessary indirection. Requiring one global state library would decide a separate question without evidence from the Editor's needs.

## Exceptions

This is a default design principle, not an absolute ban on imperative code. When a reasonable exception is needed, record the reason and trade-off in an Issue, RFC, or PR description. Keep the boundary between decisions and effects clear with the minimum abstraction needed; do not build a general framework solely to accommodate an exception.

## Editor Implications

A possible Editor flow is:

```text
editor event
  -> pure editor reducer / planner
  -> next editor state + effect instructions
  -> compiler / persistence / preview adapters
  -> resulting events
```

The eventual interfaces may be simpler or different while preserving the boundary. This RFC does not decide whether LCM or Core JSON is the Editor's source of truth, how bidirectional editing works, or whether Redux is used. It decides the separation of state transitions from effects, not the state management library.

## Existing Example

The current Viewer playback implementation provides a concrete example:

- [`playbackState.ts`](../../app/components/playback/playbackState.ts) defines `playbackReducer` and pure playback state decisions.
- [`playbackMediaPlan.ts`](../../app/components/playback/playbackMediaPlan.ts) makes pure media decisions and returns ordered `PlaybackInstruction` values.
- [`playbackMediaAdapter.ts`](../../app/components/playback/playbackMediaAdapter.ts) executes instructions, including media mutation, `play()`, `pause()`, and logging.
- [`usePlaybackController.ts`](../../app/components/playback/usePlaybackController.ts) integrates React, refs, storage, browser/media events, the planner, and the adapter.

The controller's `stateRef` and `dispatchAndSync` keep consecutive browser/media events synchronized without waiting for React to render. `pendingPlaybackRef` protects a source transition until metadata permits the requested seek. These refs are imperative shell state for runtime coordination, not a violation of the functional core principle.
