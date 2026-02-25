import { useEffect, useMemo, useRef, useState, type WheelEvent } from 'react'
import { HIDEOUT_LAYOUT } from '../../data/layout.hideout'
import { useI18n } from '../../i18n/useI18n'
import { getUpgradeStationName } from '../../lib/upgradeLabel'
import type { HideoutStation, HideoutUpgrade } from '../../types/domain'
import { MapEdge } from './MapEdge'
import { MapNode, type HideoutNodeState } from './MapNode'

interface StationClusterLayout {
  stationId: string
  stationName: string
  x: number
  y: number
  width: number
  height: number
}

interface NodePoint {
  x: number
  y: number
}

interface HideoutMapLayout {
  width: number
  height: number
  roomOutlines: Array<{ id: string; path: string }>
  clusters: StationClusterLayout[]
  nodePointsByStationId: Record<string, NodePoint>
}

interface HideoutMapCanvasProps {
  stations: HideoutStation[]
  prereqGraph: Record<string, string[]>
  nodeStateByUpgradeId: Record<string, HideoutNodeState>
  visibleUpgradeIds: Set<string>
  selectedUpgradeId: string | null
  onSelectUpgrade: (upgradeId: string) => void
}

const MIN_ZOOM = 0.6
const MAX_ZOOM = 2.4
const PAN_OVERSCROLL = 36
const PAN_OVERSCROLL_X_LEFT = 220
const PAN_OVERSCROLL_X_RIGHT = 24
const INITIAL_CONTENT_PADDING = 20
const NODE_BOUNDS_PADDING = 30
const INITIAL_LEFT_BIAS = 152

function buildMapLayout(stations: HideoutStation[]): HideoutMapLayout {
  const clusters: StationClusterLayout[] = []
  const nodePointsByStationId: Record<string, NodePoint> = {}
  const orderedStations = [...stations].sort((left, right) => left.name.localeCompare(right.name))

  let fallbackIndex = 0
  orderedStations.forEach((station) => {
    const anchor = HIDEOUT_LAYOUT.stationAnchors[station.name]
    const fallbackColumn = fallbackIndex % 5
    const fallbackRow = Math.floor(fallbackIndex / 5)
    const fallbackX = 520 + fallbackColumn * 56
    const fallbackY = 565 + fallbackRow * 42
    const nodeCenterX = anchor?.x ?? fallbackX
    const nodeCenterY = anchor?.y ?? fallbackY
    const clusterWidth = 112
    const clusterHeight = 58
    const clusterX = nodeCenterX - clusterWidth / 2
    const clusterY = nodeCenterY - 33
    fallbackIndex += anchor ? 0 : 1

    clusters.push({
      stationId: station.id,
      stationName: station.name,
      x: clusterX,
      y: clusterY,
      width: clusterWidth,
      height: clusterHeight,
    })

    nodePointsByStationId[station.id] = {
      x: nodeCenterX,
      y: nodeCenterY,
    }
  })

  return {
    width: HIDEOUT_LAYOUT.width,
    height: HIDEOUT_LAYOUT.height,
    roomOutlines: HIDEOUT_LAYOUT.roomOutlines,
    clusters,
    nodePointsByStationId,
  }
}

function pickDisplayedUpgradeForStation(
  upgrades: HideoutUpgrade[],
  nodeStateByUpgradeId: Record<string, HideoutNodeState>,
  selectedUpgradeId: string | null,
): HideoutUpgrade | null {
  const visible = [...upgrades].sort((left, right) => left.level - right.level)

  if (visible.length === 0) {
    return null
  }

  if (selectedUpgradeId) {
    const selected = visible.find((upgrade) => upgrade.id === selectedUpgradeId)
    if (selected) {
      return selected
    }
  }

  const completed = visible.filter(
    (upgrade) => nodeStateByUpgradeId[upgrade.id] === 'completed',
  )
  if (completed.length > 0) {
    return completed[completed.length - 1]
  }

  const targeted = visible.filter(
    (upgrade) => nodeStateByUpgradeId[upgrade.id] === 'targeted',
  )
  if (targeted.length > 0) {
    return targeted[targeted.length - 1]
  }

  const available = visible.filter(
    (upgrade) => nodeStateByUpgradeId[upgrade.id] === 'available',
  )
  if (available.length > 0) {
    return available[0]
  }

  const locked = visible.filter(
    (upgrade) => nodeStateByUpgradeId[upgrade.id] === 'locked',
  )
  if (locked.length > 0) {
    return locked[0]
  }

  return visible[0]
}

function extractPathPoints(path: string): Array<{ x: number; y: number }> {
  const values = path.match(/-?\d*\.?\d+/g)
  if (!values) {
    return []
  }

  const points: Array<{ x: number; y: number }> = []
  for (let index = 0; index + 1 < values.length; index += 2) {
    points.push({
      x: Number(values[index]),
      y: Number(values[index + 1]),
    })
  }
  return points
}

function getContentBounds(layout: HideoutMapLayout) {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  const includePoint = (x: number, y: number, padding = 0) => {
    minX = Math.min(minX, x - padding)
    minY = Math.min(minY, y - padding)
    maxX = Math.max(maxX, x + padding)
    maxY = Math.max(maxY, y + padding)
  }

  Object.values(layout.nodePointsByStationId).forEach((point) => {
    includePoint(point.x, point.y, NODE_BOUNDS_PADDING)
  })

  layout.roomOutlines.forEach((outline) => {
    const points = extractPathPoints(outline.path)
    points.forEach((point) => includePoint(point.x, point.y))
  })

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return {
      minX: 0,
      minY: 0,
      maxX: layout.width,
      maxY: layout.height,
    }
  }

  return {
    minX: Math.max(0, minX - INITIAL_CONTENT_PADDING),
    minY: Math.max(0, minY - INITIAL_CONTENT_PADDING),
    maxX: Math.min(layout.width, maxX + INITIAL_CONTENT_PADDING),
    maxY: Math.min(layout.height, maxY + INITIAL_CONTENT_PADDING),
  }
}

function getInitialViewState(layout: HideoutMapLayout) {
  const bounds = getContentBounds(layout)
  const contentWidth = Math.max(bounds.maxX - bounds.minX, 1)
  const contentHeight = Math.max(bounds.maxY - bounds.minY, 1)
  const contentCenterX = (bounds.minX + bounds.maxX) / 2
  const contentCenterY = (bounds.minY + bounds.maxY) / 2
  const fitZoom = Math.min(layout.width / contentWidth, layout.height / contentHeight)
  const zoom = Math.min(MAX_ZOOM, Math.max(1, Number((fitZoom * 0.985).toFixed(2))))

  return {
    zoom,
    pan: {
      x: Number((layout.width / (2 * zoom) - contentCenterX - INITIAL_LEFT_BIAS).toFixed(2)),
      y: Number((layout.height / (2 * zoom) - contentCenterY).toFixed(2)),
    },
  }
}

function clampPan(
  pan: { x: number; y: number },
  zoom: number,
  layout: HideoutMapLayout,
) {
  const clampAxis = (value: number, size: number, axis: 'x' | 'y') => {
    if (zoom >= 1) {
      const minOverscroll = axis === 'x' ? PAN_OVERSCROLL_X_LEFT : PAN_OVERSCROLL
      const maxOverscroll = axis === 'x' ? PAN_OVERSCROLL_X_RIGHT : PAN_OVERSCROLL
      const min = -(size - size / zoom) - minOverscroll
      const max = maxOverscroll
      return Math.min(max, Math.max(min, value))
    }

    const centered = (size * (1 - zoom)) / 2
    const freeRange = (size * (1 / zoom - 1)) / 2 + PAN_OVERSCROLL
    const min = centered - freeRange
    const max = centered + freeRange
    return Math.min(max, Math.max(min, value))
  }

  return {
    x: Number(clampAxis(pan.x, layout.width, 'x').toFixed(2)),
    y: Number(clampAxis(pan.y, layout.height, 'y').toFixed(2)),
  }
}

export function HideoutMapCanvas({
  stations,
  prereqGraph,
  nodeStateByUpgradeId,
  visibleUpgradeIds,
  selectedUpgradeId,
  onSelectUpgrade,
}: HideoutMapCanvasProps) {
  const { language, t } = useI18n()
  const layout = useMemo(() => buildMapLayout(stations), [stations])
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const userAdjustedViewRef = useRef(false)
  const stationById = useMemo(
    () =>
      stations.reduce<Record<string, HideoutStation>>((map, station) => {
        map[station.id] = station
        return map
      }, {}),
    [stations],
  )
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [isViewPinned, setIsViewPinned] = useState(true)
  const dragRef = useRef({
    dragging: false,
    moved: false,
    startClientX: 0,
    startClientY: 0,
    startPanX: 0,
    startPanY: 0,
  })

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    const applyInitialView = () => {
      if (userAdjustedViewRef.current) {
        return
      }
      const initial = getInitialViewState(layout)
      setZoom(initial.zoom)
      setPan(clampPan(initial.pan, initial.zoom, layout))
    }

    applyInitialView()

    const observer = new ResizeObserver(() => {
      applyInitialView()
    })
    observer.observe(viewport)

    return () => {
      observer.disconnect()
    }
  }, [layout])

  const stationIdByUpgradeId = useMemo(
    () =>
      stations.reduce<Record<string, string>>((map, station) => {
        station.upgrades.forEach((upgrade) => {
          map[upgrade.id] = station.id
        })
        return map
      }, {}),
    [stations],
  )

  const displayedUpgradeByStationId = useMemo(
    () =>
      stations.reduce<Record<string, HideoutUpgrade>>((map, station) => {
        const picked = pickDisplayedUpgradeForStation(
          station.upgrades,
          nodeStateByUpgradeId,
          selectedUpgradeId,
        )
        if (picked) {
          map[station.id] = picked
        }
        return map
      }, {}),
    [nodeStateByUpgradeId, selectedUpgradeId, stations],
  )

  const edges = useMemo(() => {
    const dedupe = new Set<string>()

    return Object.entries(displayedUpgradeByStationId).flatMap(([stationId, upgrade]) => {
      const toPoint = layout.nodePointsByStationId[stationId]
      if (!toPoint) {
        return []
      }

      const prereqs = prereqGraph[upgrade.id] ?? []
      return prereqs.flatMap((prereqUpgradeId) => {
        const fromStationId = stationIdByUpgradeId[prereqUpgradeId]
        if (!fromStationId) {
          return []
        }

        const fromUpgrade = displayedUpgradeByStationId[fromStationId]
        const fromPoint = layout.nodePointsByStationId[fromStationId]
        if (!fromUpgrade || !fromPoint) {
          return []
        }

        const edgeKey = `${fromStationId}:${stationId}`
        if (dedupe.has(edgeKey)) {
          return []
        }
        dedupe.add(edgeKey)

        return [
          {
            fromUpgradeId: fromUpgrade.id,
            toUpgradeId: upgrade.id,
            from: fromPoint,
            to: toPoint,
          },
        ]
      })
    })
  }, [
    displayedUpgradeByStationId,
    layout.nodePointsByStationId,
    prereqGraph,
    stationIdByUpgradeId,
  ])

  const stationHasVisibleUpgrade = useMemo(
    () =>
      stations.reduce<Record<string, boolean>>((map, station) => {
        map[station.id] = station.upgrades.some((upgrade) => visibleUpgradeIds.has(upgrade.id))
        return map
      }, {}),
    [stations, visibleUpgradeIds],
  )

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (isViewPinned) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    userAdjustedViewRef.current = true

    const zoomDelta = event.deltaY < 0 ? 0.1 : -0.1
    setZoom((current) => {
      const next = current + zoomDelta
      if (next < MIN_ZOOM) {
        setPan((currentPan) => clampPan(currentPan, MIN_ZOOM, layout))
        return MIN_ZOOM
      }
      if (next > MAX_ZOOM) {
        setPan((currentPan) => clampPan(currentPan, MAX_ZOOM, layout))
        return MAX_ZOOM
      }
      const nextZoom = Number(next.toFixed(2))
      setPan((currentPan) => clampPan(currentPan, nextZoom, layout))
      return nextZoom
    })
  }

  return (
    <section className="map-board">
      <div className="map-canvas-controls">
        <button
          type="button"
          className={`inline-button map-canvas-pin ${isViewPinned ? 'is-active' : ''}`}
          onClick={() => {
            dragRef.current.dragging = false
            setIsPanning(false)
            setIsViewPinned((current) => !current)
          }}
        >
          {isViewPinned ? t('overview.unpinCanvas') : t('overview.pinCanvas')}
        </button>
      </div>
      <div
        ref={viewportRef}
        className={`map-viewport ${isPanning ? 'is-panning' : ''} ${isViewPinned ? 'is-pinned' : ''}`}
        onWheelCapture={handleWheel}
        onMouseDown={(event) => {
          if (isViewPinned) {
            return
          }
          if (event.button !== 0) {
            return
          }
          dragRef.current.dragging = true
          dragRef.current.moved = false
          dragRef.current.startClientX = event.clientX
          dragRef.current.startClientY = event.clientY
          dragRef.current.startPanX = pan.x
          dragRef.current.startPanY = pan.y
          setIsPanning(true)
        }}
        onMouseMove={(event) => {
          if (isViewPinned) {
            return
          }
          if (!dragRef.current.dragging) {
            return
          }

          const deltaX = event.clientX - dragRef.current.startClientX
          const deltaY = event.clientY - dragRef.current.startClientY
          if (Math.abs(deltaX) + Math.abs(deltaY) > 4) {
            dragRef.current.moved = true
            userAdjustedViewRef.current = true
          }

          setPan({
            ...clampPan(
              {
                x: dragRef.current.startPanX + deltaX / zoom,
                y: dragRef.current.startPanY + deltaY / zoom,
              },
              zoom,
              layout,
            ),
          })
        }}
        onMouseUp={() => {
          dragRef.current.dragging = false
          setIsPanning(false)
          window.setTimeout(() => {
            dragRef.current.moved = false
          }, 0)
        }}
        onMouseLeave={() => {
          dragRef.current.dragging = false
          setIsPanning(false)
        }}
      >
        <svg
          className="map-svg"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {layout.roomOutlines.map((outline) => (
              <path key={outline.id} className="map-room-outline" d={outline.path} />
            ))}

            {edges.map((edge) => {
              if (!edge) {
                return null
              }
              if (
                !visibleUpgradeIds.has(edge.fromUpgradeId) ||
                !visibleUpgradeIds.has(edge.toUpgradeId)
              ) {
                return null
              }

              const destinationState = nodeStateByUpgradeId[edge.toUpgradeId]
              const status =
                destinationState === 'completed'
                  ? 'completed'
                  : destinationState === 'available' || destinationState === 'targeted'
                    ? 'active'
                    : 'locked'

              return (
                <MapEdge
                  key={`${edge.fromUpgradeId}:${edge.toUpgradeId}`}
                  fromX={edge.from.x}
                  fromY={edge.from.y}
                  toX={edge.to.x}
                  toY={edge.to.y}
                  status={status}
                />
              )
            })}

            {layout.clusters.map((cluster) => {
              const station = stationById[cluster.stationId]
              if (!station) {
                return null
              }

              const displayedUpgrade = displayedUpgradeByStationId[station.id]
              if (!displayedUpgrade) {
                return null
              }
              if (!stationHasVisibleUpgrade[station.id]) {
                return null
              }

              const point = layout.nodePointsByStationId[station.id]
              if (!point) {
                return null
              }

              return (
                <g key={cluster.stationId} className="map-cluster">
                  <MapNode
                    key={displayedUpgrade.id}
                    nodeId={displayedUpgrade.id}
                    x={point.x}
                    y={point.y}
                    levelLabel={`${t('common.level')}${displayedUpgrade.level}`}
                    title={`${getUpgradeStationName(displayedUpgrade, language)} ${t('common.level')}${displayedUpgrade.level}`}
                    iconUrl={station.imageLink}
                    state={nodeStateByUpgradeId[displayedUpgrade.id] ?? 'locked'}
                    isSelected={selectedUpgradeId === displayedUpgrade.id}
                    onSelect={() => {
                      if (!dragRef.current.moved) {
                        onSelectUpgrade(displayedUpgrade.id)
                      }
                    }}
                  />
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </section>
  )
}
