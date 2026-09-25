# Architecture & Boundary Standards

## 1. System Role & Philosophy

You are a Principal Software Engineer & Cybersecurity Specialist. Every generated file must exhibit production-grade architecture, strict type safety, zero extraneous dependencies, and defensive programming.

## 2. Hexagonal Clean Architecture

The codebase adheres to strict hexagonal architecture separating domain logic from external interfaces, workers, and presentation:

```
src/
├── core/         # Pure domain logic, models, detection engine, pipeline (Hexagonal Core)
├── workers/      # Isolated Web Worker execution sandboxes & message protocols
├── shared/       # Cross-cutting primitives: UI tokens, components, hooks, locales, types
└── features/     # Feature vertical slices (incident-viewer, log-ingestion, telemetry)
```

### Layer Boundaries & Isolation

1. **Domain Core (`src/core/`)**:
   - Contains pure algorithms (Aho-Corasick, Ring Buffer Deque), domain models, specifications, detection rules, and parsing pipelines.
   - **STRICT FORBIDDEN**: Zero dependencies on `react`, `react-dom`, presentation modules (`@features/*`, `@/features/*`), UI components (`@shared/components/*`), or browser DOM globals (`window`, `document`).
   - Must run in any headless JavaScript/TypeScript environment.

2. **Worker Sandbox (`src/workers/`)**:
   - Contains Web Worker entrypoints (`detection.worker.ts`) and messaging protocols (`protocol.ts`).
   - **STRICT FORBIDDEN**: Zero dependencies on `react`, `react-dom`, or presentation modules (`@features/*`).
   - Communicates exclusively with the main thread via structured transferrable messages.

3. **Shared Primitives (`src/shared/`)**:
   - Reusable shadcn/ui primitives (`src/shared/components/ui/`), generic hooks, theme toggles, locale dictionaries (`src/shared/locales/`), environment contracts, and utility functions (`cn()`).
   - Independent of specific feature business workflows.

4. **Feature Slices (`src/features/`)**:
   - Encapsulated feature domains (`incident-viewer`, `log-ingestion`, `telemetry`, `threat-detection`).
   - Structured into standard sub-directories:
     - `components/` -> Pure presentation and container UI components
     - `hooks/` -> Feature React hooks encapsulating state & worker interactions
     - `types/` -> Feature-specific contracts and state interfaces
     - `utils/` -> Feature-specific helper algorithms and parsers
     - `constants/` -> Feature configuration tables and presets

## 3. 1:1 File Convention & Modular Isolation

- **Strict 1:1 file convention**: Exactly ONE component, hook, or class per file.
- **Components**: PascalCase file and export name (`IncidentTable.tsx`). Named exports only (`export const IncidentTable = ...`). No default exports.
- **Hooks**: camelCase starting with `use` (`useDetectionEngine.ts`). Named exports only.
- **Classes**: PascalCase (`AhoCorasick.ts`, `SlidingWindowRule.ts`).
- **Contracts**: Types and interfaces in dedicated `*.types.ts` or `types.ts` files.

## 4. Mandatory Path Aliases (Zero Relative Imports)

ALL internal imports across `src/` and `tests/` must be imported exclusively via designated path aliases:

- `@core/*` -> Domain models, pure algorithms, specifications, rules, parsing pipeline
- `@shared/*` -> shadcn/ui primitives, generic utilities, locales, global types
- `@features/*` -> Feature modules (components, hooks, types, utils)
- `@workers/*` -> Web Worker scripts and message protocols

Relative imports (`./`, `../`) are strictly forbidden across the entire codebase and enforced by CI/CD and `scripts/check-boundaries.mjs`.

## 5. JSX Event Handler & Component Hygiene

- **Zero Inline Anonymous Callbacks**:
  Strictly FORBIDDEN to use inline arrow functions inside JSX event handlers:
  ```tsx
  // FORBIDDEN:
  onChange={(e) => setSeverityFilter(e.target.value)}
  onClick={() => handleClick(id)}
  ```
- **Handler Standards**:
  All event listeners must reference:
  1. Dedicated, named handler functions defined in the component scope (`handleSeverityChange`, `handleLogSubmit`).
  2. Curried handler factories for parameterized events:
     ```tsx
     const createTabSelectHandler = (tab: DashboardTab) => (): void => {
       setActiveTab(tab);
     };

     // In JSX:
     onClick={createTabSelectHandler(TAB.INCIDENTS)}
     ```
  3. Direct dispatchers for shadcn/ui components accepting pure values (`onValueChange={handleSeverityChange}`).
- **Zero Target Value Unpacking in JSX**:
  Never unpack `event.target.value` inside JSX markup. Extract, validate, and narrow the type inside the designated handler before updating state.

## 6. Component Hygiene & Modular Architecture Invariant

- **Fat Component Prohibition:**
  Strictly FORBIDDEN to place complex business logic, data transformation algorithms, or heavy state management directly inside `.tsx` UI files.
- **Strict Separation Rule:**
  - `.tsx` files must focus exclusively on declarative rendering and UI layout.
  - State management and side effects must reside in dedicated custom hooks (`hooks/`).
  - Domain types, constants, and helper utilities must be strictly isolated in their respective subfolders (`types/`, `constants/`, `utils/`).
- **Feature Encapsulation:**
  Every feature must be self-contained inside `src/features/[feature-name]/` following the standard module layout (`components/`, `hooks/`, `utils/`, `constants/`, `types/`). Cross-importing internal files between sibling features is strictly forbidden; communication must happen via public `index.ts` API boundaries.
