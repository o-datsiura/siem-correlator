# Styling & Design System Standards

## 1. Semantic Design Tokens (Zero Arbitrary Palette Colors)

- **Strictly FORBIDDEN**: Using arbitrary or direct Tailwind color utilities (e.g., `text-cyan-400`, `bg-slate-900`, `border-blue-500`, `text-emerald-400`, `bg-red-600`).
- **Mandatory Semantic Tokens**: All UI components must strictly consume shadcn/ui semantic design tokens driven by CSS variables:

| Semantic Category        | Tokens to Use                                                                                  | Prohibited Examples                               |
| :----------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| **Surfaces**             | `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-secondary`                           | `bg-slate-900`, `bg-black`, `bg-zinc-800`         |
| **Typography**           | `text-foreground`, `text-muted-foreground`, `text-card-foreground`, `text-primary-foreground`  | `text-gray-300`, `text-white`, `text-slate-400`   |
| **Borders**              | `border-border`, `border-input`                                                                | `border-slate-700`, `border-gray-800`             |
| **Interactive & Accent** | `bg-primary`, `text-primary`, `border-primary`, `bg-secondary`, `bg-accent`, `hover:bg-accent` | `bg-cyan-500`, `text-cyan-400`, `border-cyan-400` |
| **Alerts & Destructive** | `text-destructive`, `bg-destructive`, `border-destructive`                                     | `text-red-500`, `bg-red-600`, `border-red-400`    |

This enforces 100% WCAG 2.1 contrast compliance and guarantees seamless Light and Dark mode transitions without ad-hoc conditional styles.

## 2. Relative Sizing & Tailwind Spacing Scale (Zero Arbitrary Pixels)

- **Strictly FORBIDDEN**: Hardcoded arbitrary pixel values (e.g., `w-[320px]`, `p-[14px]`, `text-[13px]`, `h-[60px]`).
- **Tailwind Spacing Scale**: All sizing, padding, margins, gaps, widths, and heights must adhere strictly to the standard Tailwind spacing scale (multiples of 4 / 0.25rem):
  - `1` = 4px / 0.25rem
  - `2` = 8px / 0.5rem
  - `3` = 12px / 0.75rem
  - `4` = 16px / 1rem
  - `6` = 24px / 1.5rem
  - `8` = 32px / 2rem
  - `12` = 48px / 3rem
  - `16` = 64px / 4rem
- **Typography Sizing**: Must strictly use relative semantic utility classes:
  - `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- **Proportional Dimensions**: If an exact custom proportion is mathematically required, express it strictly in `rem` units (e.g., `max-w-[48rem]`, `min-h-[20rem]`), never in raw pixels (`px`).

## 3. "Cyber-Slate & Cyan" Theme Configuration

The application theme configured in `src/index.css` (referenced as `globals.css` in standard shadcn documentation) establishes a specialized cybersecurity palette using modern OKLCH color spaces:

### Dark Mode Architecture (Default SOC Cockpit)

- **Level 0 Surface (Canvas)**: `--background: oklch(0.13 0.025 255)` (`bg-background`)
  Deep cyber-slate base canvas simulating an isolated SOC command console.
- **Level 1 Surface (Cards & Panels)**: `--card: oklch(0.18 0.03 255)` (`bg-card`)
  Elevated card and container surfaces for high visual separation.
- **Level 2 Surface (Nested Elements)**: `--secondary: oklch(0.24 0.03 255)` (`bg-secondary`)
  Elevated interactive areas, inputs, and selected items.
- **Subtle Borders**: `--border: oklch(0.28 0.025 255)` (`border-border`)
  Crisp slate dividers maintaining hierarchy without visual clutter.
- **Muted Slate Typography**: `--muted-foreground: oklch(0.7 0.025 255)` (`text-muted-foreground`)
  High-legibility secondary text meeting contrast ratios.
- **Cyber-Cyan Highlights**: `--primary: oklch(0.75 0.16 215)` (`text-primary`, `bg-primary`, `border-primary`)
  High-contrast vibrant cyan for primary actions, active indicators, and critical telemetry.

### Custom Aesthetic Utilities

Declared in `src/index.css` under `@layer utilities`:

- `.glass`: Translucent slate backdrop with `backdrop-filter: blur(12px)` and subtle border.
- `.glass-strong`: Dense slate modal backdrop with `backdrop-filter: blur(20px)`.
- `.glow-primary`: Neon cyan shadow glow for active alerts and live worker status.
- `.glow-destructive`: Neon red shadow glow for critical threat alerts.
- `.scrollbar-thin`: Minimalist theme-adaptive scrollbar.
