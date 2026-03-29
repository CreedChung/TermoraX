import { useMediaQuery } from "./useMediaQuery";

/**
 * Tailwind CSS v4 default breakpoints
 * Aligned with project Tailwind configuration
 */
export const BREAKPOINTS = {
  /** Small screens: 640px */
  sm: 640,
  /** Medium screens: 768px */
  md: 768,
  /** Large screens: 1024px */
  lg: 1024,
  /** Extra large screens: 1280px */
  xl: 1280,
  /** 2x Extra large screens: 1536px */
  "2xl": 1536,
} as const;

/** Available breakpoint names */
export type BreakpointName = keyof typeof BREAKPOINTS;

/**
 * Hook to check if current viewport is at or above a breakpoint (min-width)
 *
 * @param breakpoint - Breakpoint name (sm, md, lg, xl, 2xl)
 * @returns boolean - true if viewport width >= breakpoint
 *
 * @example
 * ```tsx
 * function ResponsiveLayout() {
 *   const isMdOrLarger = useBreakpoint("md");
 *   return isMdOrLarger ? <Sidebar /> : <Drawer />;
 * }
 * ```
 */
export function useBreakpoint(breakpoint: BreakpointName): boolean {
  const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`;
  return useMediaQuery(query);
}

/**
 * Hook to check if current viewport is below a breakpoint (max-width)
 *
 * @param breakpoint - Breakpoint name (sm, md, lg, xl, 2xl)
 * @returns boolean - true if viewport width < breakpoint
 *
 * @example
 * ```tsx
 * function ResponsiveLayout() {
 *   const isBelowLg = useBreakpointDown("lg");
 *   return isBelowLg ? <CompactView /> : <FullView />;
 * }
 * ```
 */
export function useBreakpointDown(breakpoint: BreakpointName): boolean {
  const query = `(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`;
  return useMediaQuery(query);
}

/**
 * Hook to check if current viewport is between two breakpoints
 *
 * @param start - Lower breakpoint name (inclusive)
 * @param end - Upper breakpoint name (exclusive)
 * @returns boolean - true if viewport is between start and end breakpoints
 *
 * @example
 * ```tsx
 * function ResponsiveLayout() {
 *   // True when viewport is between md (768px) and lg (1024px)
 *   const isTablet = useBreakpointBetween("md", "lg");
 *   return isTablet ? <TabletView /> : <OtherView />;
 * }
 * ```
 */
export function useBreakpointBetween(
  start: BreakpointName,
  end: BreakpointName
): boolean {
  const query = `(min-width: ${BREAKPOINTS[start]}px) and (max-width: ${BREAKPOINTS[end] - 1}px)`;
  return useMediaQuery(query);
}

/**
 * Hook that returns the active breakpoint name
 *
 * Returns the largest breakpoint that currently matches.
 * Returns "base" if below smallest breakpoint.
 *
 * @returns Current breakpoint name (base, sm, md, lg, xl, 2xl)
 *
 * @example
 * ```tsx
 * function AdaptiveComponent() {
 *   const breakpoint = useActiveBreakpoint();
 *
 *   const fontSize = {
 *     base: "14px",
 *     sm: "14px",
 *     md: "15px",
 *     lg: "16px",
 *     xl: "16px",
 *     "2xl": "18px",
 *   }[breakpoint];
 *
 *   return <div style={{ fontSize }}>Responsive text</div>;
 * }
 * ```
 */
export function useActiveBreakpoint(): "base" | BreakpointName {
  const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS["2xl"]}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);

  if (is2xl) return "2xl";
  if (isXl) return "xl";
  if (isLg) return "lg";
  if (isMd) return "md";
  if (isSm) return "sm";
  return "base";
}

/**
 * Hook to get all breakpoint states at once
 *
 * Returns an object with boolean flags for all breakpoints.
 * Useful when you need to check multiple breakpoints in a component.
 *
 * @returns Object with breakpoint states
 *
 * @example
 * ```tsx
 * function ComplexLayout() {
 *   const { isMd, isLg, isXl } = useBreakpoints();
 *
 *   return (
 *     <div className={isLg ? "sidebar-layout" : "stack-layout"}>
 *       {isMd && <Navigation />}
 *       {isXl && <ExtraPanel />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpoints(): {
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  active: "base" | BreakpointName;
} {
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS["2xl"]}px)`);

  let active: "base" | BreakpointName = "base";
  if (is2xl) active = "2xl";
  else if (isXl) active = "xl";
  else if (isLg) active = "lg";
  else if (isMd) active = "md";
  else if (isSm) active = "sm";

  return { isSm, isMd, isLg, isXl, is2xl, active };
}
