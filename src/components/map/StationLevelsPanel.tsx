import { useI18n } from '../../i18n/useI18n'

interface StationLevelRow {
  stationId: string
  name: string
  iconLink: string | null
  currentLevel: number
  maxLevel: number
}

interface StationLevelsPanelProps {
  rows: StationLevelRow[]
  onSetStationLevel: (stationId: string, level: number) => void
}

export function StationLevelsPanel({
  rows,
  onSetStationLevel,
}: StationLevelsPanelProps) {
  const { t } = useI18n()

  return (
    <section className="station-levels-panel">
      <div className="station-levels-head">
        <h3>{t('stationLevels.title')}</h3>
        <p className="meta-text">{t('stationLevels.desc')}</p>
      </div>

      <div className="station-levels-grid">
        {rows.map((row) => (
          <article key={row.stationId} className="station-level-card">
            <header className="station-level-card-head">
              <div className="item-cell">
                {row.iconLink ? (
                  <img className="item-thumb" src={row.iconLink} alt="" loading="lazy" />
                ) : (
                  <span className="item-thumb is-empty" aria-hidden="true" />
                )}
                <span className="item-label">{row.name}</span>
              </div>
              <strong>
                {t('common.level')}
                {row.currentLevel}
              </strong>
            </header>

            <div className="station-level-chip-row" role="group" aria-label={row.name}>
              {Array.from({ length: row.maxLevel + 1 }, (_, index) => {
                const level = index
                const isActive = row.currentLevel === level
                return (
                  <button
                    key={`${row.stationId}:${level}`}
                    type="button"
                    className={`level-chip ${isActive ? 'is-active' : ''}`}
                    onClick={() => onSetStationLevel(row.stationId, level)}
                    title={`${row.name} ${t('common.level')}${level}`}
                  >
                    {level}
                  </button>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
