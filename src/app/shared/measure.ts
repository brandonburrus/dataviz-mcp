export interface Dimensions {
  width: number
  height: number
}

export const DEFAULT_DIMENSIONS: Dimensions = { width: 800, height: 500 }

/** Container size with a fixed fallback for environments that report zero layout (happy-dom). */
export function measure(container: HTMLElement): Dimensions {
  const rect = container.getBoundingClientRect()
  return {
    width: rect.width || DEFAULT_DIMENSIONS.width,
    height: rect.height || DEFAULT_DIMENSIONS.height,
  }
}
