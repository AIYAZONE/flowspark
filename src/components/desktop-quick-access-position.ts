export type FabPosition = { left: number; top: number }

export function clampPosition(
  position: FabPosition,
  params: {
    viewportWidth: number
    viewportHeight: number
    fabWidth: number
    fabHeight: number
    edgeMargin: number
    bottomReservedArea: number
  }
): FabPosition {
  const { viewportWidth, viewportHeight, fabWidth, fabHeight, edgeMargin, bottomReservedArea } = params
  const maxLeft = Math.max(edgeMargin, viewportWidth - fabWidth - edgeMargin)
  const maxTop = Math.max(edgeMargin, viewportHeight - fabHeight - bottomReservedArea)
  return {
    left: Math.min(Math.max(position.left, edgeMargin), maxLeft),
    top: Math.min(Math.max(position.top, edgeMargin), maxTop),
  }
}

export function snapToNearestSide(
  position: FabPosition,
  params: { viewportWidth: number; fabWidth: number; edgeMargin: number }
): FabPosition {
  const { viewportWidth, fabWidth, edgeMargin } = params
  const centerX = position.left + fabWidth / 2
  const leftCenterX = edgeMargin + fabWidth / 2
  const rightCenterX = viewportWidth - edgeMargin - fabWidth / 2
  const distLeft = Math.abs(centerX - leftCenterX)
  const distRight = Math.abs(centerX - rightCenterX)
  return { left: distLeft <= distRight ? edgeMargin : viewportWidth - fabWidth - edgeMargin, top: position.top }
}

