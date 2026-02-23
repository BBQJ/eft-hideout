export type HideoutNodeState = 'locked' | 'available' | 'completed' | 'targeted'

interface MapNodeProps {
  nodeId: string
  x: number
  y: number
  levelLabel: string
  title: string
  iconUrl: string | null
  state: HideoutNodeState
  isSelected: boolean
  onSelect: () => void
}

export function MapNode({
  nodeId,
  x,
  y,
  levelLabel,
  title,
  iconUrl,
  state,
  isSelected,
  onSelect,
}: MapNodeProps) {
  const clipPathId = `map-node-clip-${nodeId.replace(/[^a-zA-Z0-9_-]/g, '_')}`

  return (
    <g
      className={[
        'map-node',
        `is-${state}`,
        isSelected ? 'is-selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <title>{title}</title>
      <defs>
        <clipPath id={clipPathId}>
          <circle cx={x} cy={y} r={14} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={17} />
      {iconUrl ? (
        <image
          href={iconUrl}
          x={x - 14}
          y={y - 14}
          width={28}
          height={28}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipPathId})`}
        />
      ) : (
        <text x={x} y={y + 3}>
          {levelLabel}
        </text>
      )}
      <text className="map-node-level" x={x + 14} y={y - 13}>
        {levelLabel}
      </text>
    </g>
  )
}
