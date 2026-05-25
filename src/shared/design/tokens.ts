/**
 * SPACEART design tokens (TypeScript reference)
 * CSS source of truth: src/styles/tokens.css + brand.css
 */

export const brandColors = {
  black: "#000000",
  charcoal: "#0a0a0a",
  charcoalElevated: "#141414",
  charcoalMuted: "#1a1a1a",
  white: "#ffffff",
  cream: "#f5f5f2",
  orange: "#ff5722",
  orangeHover: "#ff6b3d",
} as const;

export const brandMotion = {
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  durationFast: 150,
  durationNormal: 280,
  durationSlow: 450,
} as const;

export const brandSpacing = {
  sectionY: "py-20 md:py-28",
  containerX: "px-6 lg:px-8",
} as const;
