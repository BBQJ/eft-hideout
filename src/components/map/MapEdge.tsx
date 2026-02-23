interface MapEdgeProps {
  fromX: number
  fromY: number
  toX: number
  toY: number
  status: 'locked' | 'active' | 'completed'
}

export function MapEdge({ fromX, fromY, toX, toY, status }: MapEdgeProps) {
  const controlX = (fromX + toX) / 2
  const path = `M ${fromX} ${fromY} C ${controlX} ${fromY}, ${controlX} ${toY}, ${toX} ${toY}`

  return <path className={`map-edge is-${status}`} d={path} />
}
