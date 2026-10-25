---
name: Deep Celestial Technical System
colors:
  surface: '#00132f'
  surface-dim: '#00132f'
  surface-bright: '#23395e'
  surface-container-lowest: '#000e26'
  surface-container-low: '#001b3f'
  surface-container: '#041f43'
  surface-container-high: '#122a4e'
  surface-container-highest: '#1e3559'
  on-surface: '#d7e3ff'
  on-surface-variant: '#bfc8c9'
  inverse-surface: '#d7e3ff'
  inverse-on-surface: '#193055'
  outline: '#899293'
  outline-variant: '#3f4849'
  surface-tint: '#8ed2d9'
  primary: '#f3feff'
  on-primary: '#00363b'
  primary-container: '#a7ebf2'
  on-primary-container: '#236c72'
  inverse-primary: '#1d686e'
  secondary: '#7dd3e7'
  on-secondary: '#00363f'
  secondary-container: '#007587'
  on-secondary-container: '#c7f4ff'
  tertiary: '#fffaff'
  on-tertiary: '#3a2f0b'
  tertiary-container: '#f1deab'
  on-tertiary-container: '#6f6139'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#aaeef5'
  primary-fixed-dim: '#8ed2d9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f55'
  secondary-fixed: '#a6eeff'
  secondary-fixed-dim: '#7dd3e7'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5b'
  tertiary-fixed: '#f5e1ae'
  tertiary-fixed-dim: '#d8c594'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#524620'
  background: '#00132f'
  on-background: '#d7e3ff'
  surface-variant: '#1e3559'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
spacing:
  gutter: 1.25rem
  gutter-sm: 0.75rem
  gutter-lg: 2rem
  margin: 1.5rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system blends deep-space oceanic tonality with technical, aerospace instrumentation aesthetics. Tailored for advanced developer tools, observability platforms, deep-tech telemetry, and mission-critical workflows, it conveys intense operational precision, high focus, and understated prestige.

The design movement fuses **Technical Futurism** with **Angular Constructivism**:
- Surfaces remain deeply anchored in layered midnight blues.
- Edges reject generic consumer-tier border radii in favor of distinct chamfered (angled cut) corners reminiscent of precision optics, military hardware, and specialized industrial consoles.
- High-contrast phosphorescent accents (ice cyan, deep teal, champagne gold, and ethereal lavender) direct visual velocity across complex visual data without introducing visual fatigue.

## Colors

The palette leverages high-order luminance contrasts set against low-noise, oceanic depths:

- **Canvas & Layering**: The primary viewport is rooted in Deep Navy (`#011C40`), with navigation trees, shell sidebars, and nested troughs stepping deeper into `#01142E`. Active workspaces and panels sit forward on `#023859`, bound by sharp 1px `#26658C` framing.
- **Accents & Interactivity**: Primary CTAs and focal anchors utilize Ice Cyan (`#A7EBF2`) paired with strict `#011C40` core ink for absolute legibility. Interactive teal (`#54ACBF`) is reserved for standard action links, interactive affordances, and unselected toolheads.
- **Precision Accents**:
  - **Champagne Gold (`#E8D5A3`)**: Designates deployment states ("Production"), active process milestones, critical KPI values, and non-critical alert beacons.
  - **Lavender (`#A78BFA`)**: Dedicated exclusively to automated intelligence, LLM outputs, machine learning inferences, and automated telemetry tags.
- **System States**: Mint (`#4ADE9A`), Amber-Orange (`#FF9F43`), and Crimson (`#F2465E`) provide uncompromised status differentiation calibrated against deep slate-navy surfaces.

## Typography

Typography balances clean geometric legibility with rigorous data-dense character structure:
- **Headlines & Interface Body (`Space Grotesk`)**: Provides sharp geometric proportions that align naturally with chamfered visual architecture, maintaining rhythm across both dense data walls and macro dashboards.
- **Telemetry, Metrics & Meta (`JetBrains Mono`)**: Injected into all micro-labels, code sequences, tabular digits, telemetry outputs, and workflow badges. The uppercase label styles (`label-sm`, `label-md`) use extended tracking for immediate scanability against midnight background surfaces.

## Layout & Spacing

The structural layout relies on an architected 12-column fluid grid locked between a maximum content boundary of `1600px` and a minimum baseline mobile boundary of `320px`:

- **Desktop (1024px+)**: 12 columns with `1.25rem` gutters and `3rem` canvas margins. Persistent sidebar shell on the deepest surface (`#01142E`) locks at `260px` fixed width, with primary cards flowing freely on `#011C40`.
- **Tablet (768px - 1023px)**: 8 columns with `1rem` gutters and `1.5rem` margins. Sidebars collapse to icon-only rails (`64px`) or contextual drawers.
- **Mobile (<768px)**: 4 columns with `0.75rem` gutters and `1rem` external margins. Heavy dashboards break multi-metric clusters into vertically stacked tab segments.

## Elevation & Depth

This system avoids blurred, diffuse shadows in favor of architectural surface layering, illuminated keylines, and subtle glow gradients:

- **Level 0 (Recessed Core)**: `#01142E`. Zero elevation, zero shadows. Used for primary tool panels, application bars, and deep workspace basins.
- **Level 1 (Base Floor)**: `#011C40`. Standard page canvas.
- **Level 2 (Panels & Cards)**: `#023859`. Encased in an unyielding `1px solid #26658C` border. When hovering, the border shifts to `#54ACBF` accompanied by an inner cyan highlight (`inset 0 0 12px rgba(84, 172, 191, 0.12)`).
- **Level 3 (Overlays & Dialogs)**: `#023859` background flanked by a high-contrast `#54ACBF` 1px border with a directional drop glow: `0 12px 32px -4px rgba(1, 20, 46, 0.8), 0 0 16px rgba(167, 235, 242, 0.1)`.
- **Level 4 (Telemetry Highlights & Focal Points)**: Translucent linear gradients across `#023859` bleeding into `#26658C` at 45-degree angles, creating dynamic visual paths for active streams.

## Shapes

The design system entirely departs from radial roundness, adopting a **Precision Angular Chamfer** geometry:

- **Cut Corners via CSS Clip-Path**: Key cards, interactive buttons, tabs, and status badges use 45-degree corner notches.
  - **Standard Card/Panel Chamfer**: Cut size is `8px` (`polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)`).
  - **Interactive Button Chamfer**: Symmetric opposite-corner cut at `6px` on top-left and bottom-right edges.
  - **Badges & Chips**: Micro chamfers at `3px`.
- **Borders & Chamfers**: Panels simulate angular cut borders using SVG path overlays or dual-layered linear gradients to preserve the crisp `1px #26658C` perimeter across angled intersections.

## Components

### Buttons
- **Primary**: Solid Ice Cyan (`#A7EBF2`) fill with Deep Navy (`#011C40`) bold label typography. Chamfered opposite corners (top-left/bottom-right: 6px). Hover state shifts background to a radiant glow with subtle edge brightening; active state slightly scales down (`scale(0.98)`).
- **Secondary (Champagne)**: Transparent backdrop with a 1px Champagne Gold (`#E8D5A3`) outline and `#E8D5A3` text. Hover fills surface with `rgba(232, 213, 163, 0.1)`.
- **Ghost/Tertiary**: No border, `#54ACBF` text. Hover adds `#26658C` background tint with zero corner radius.

### Badges & Chips
- **Production Badge**: Champagne Gold (`#E8D5A3`) border with matching text on `rgba(232, 213, 163, 0.08)` surface. Prefixed by a pulsing 6px gold geometric diamond indicator.
- **AI / Machine Learning**: Ethereal Lavender (`#A78BFA`) text and border on `rgba(167, 139, 250, 0.1)` surface. Used for automated query results, synthetic generation tags, and smart recommendations.
- **System States**: Success (`#4ADE9A`), Warning (`#FF9F43`), and Error (`#F2465E`) are styled with low-opacity fills and monospaced `JetBrains Mono` status labels.

### Input Fields & Controls
- **Text Inputs**: Flat `#01142E` basin encased in `1px #26658C`. Text in `#EAF9FB` with `#8DB8C8` placeholder. Focus transitions border to `#54ACBF` with an inner 2px angular accent tab on the top-right notch.
- **Checkboxes & Radios**: Angular hexagonal or clipped-square outlines in `#26658C`. Checked state floods the interior with `#A7EBF2`, deploying a `#011C40` geometric checkmark.

### Cards & Panels
- **Structure**: `#023859` background with outer 1px `#26658C` frame and 8px cut corners.
- **Headers**: Separated by an internal 1px line in `#26658C`. Title text in `#EAF9FB` accompanied by metadata in `#8DB8C8` (`label-sm`).
- **Telemetry Cards**: Metric displays present primary figures in `#E8D5A3` or `#A7EBF2` using large monospace weights, contextualized by sparklines drawn in `#54ACBF`.

### Steppers & Flow Trackers
- **Process Steps**: Nodes rendered as angled rhomboids. Inactive steps feature `#26658C` strokes; completed steps show `#4ADE9A`; active steps glow in Champagne Gold (`#E8D5A3`) with connecting gradient conduits.