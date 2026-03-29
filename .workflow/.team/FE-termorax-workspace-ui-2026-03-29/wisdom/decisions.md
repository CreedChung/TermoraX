# Design Decisions for TermoraX Workspace UI

## Current Pain Points
1. Hardcoded rgba() values scattered across CSS
2. Inconsistent border styling
3. Missing proper design token hierarchy
4. No systematic shadow/elevation system
5. Panel layouts need spacing refinement

## Goals
1. Unified design token system (colors, spacing, typography)
2. Modernized dark theme with better contrast
3. Consistent component styling
4. Improved visual hierarchy
5. WCAG AA accessibility compliance
6. Better responsive behavior

## Key Design Principles
- Dark-first design (SSH terminal aesthetic)
- Glassmorphism for elevated surfaces (subtle)
- Accent-driven visual hierarchy (orange accent)
- Minimal borders, rely on background contrast
- Consistent 8px grid spacing

## Color Strategy
- Replace hardcoded rgba() with CSS variables
- Define semantic color tokens (--surface, --surface-elevated, etc.)
- Maintain terminal aesthetic (dark backgrounds, bright text)
- Accent color: #f2a05c (warm orange)

## Component Strategy
- Leverage shadcn/ui base components
- Custom variants for TermoraX specific needs
- BEM + Tailwind hybrid approach for styles
- CSS variables for theme overrides
