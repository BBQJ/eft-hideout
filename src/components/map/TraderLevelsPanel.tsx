import { useI18n } from '../../i18n/useI18n'

interface TraderLevelRow {
  traderId: string
  name: string
  currentLevel: number
  maxRequiredLevel: number
}

interface TraderLevelsPanelProps {
  rows: TraderLevelRow[]
  onSetTraderLevel: (traderId: string, level: number) => void
  onSetAllMaxLevels: () => void
}

export function TraderLevelsPanel({
  rows,
  onSetTraderLevel,
  onSetAllMaxLevels,
}: TraderLevelsPanelProps) {
  const { t } = useI18n()

  return (
    <aside className="map-target-panel trader-levels-panel">
      <details className="toggle-card" open>
        <summary>
          <span>{t('traderPanel.title')}</span>
          <span className="meta-text">{rows.length}</span>
        </summary>
        <div className="toggle-card-body">
          <p className="meta-text">{t('traderPanel.desc')}</p>
          {rows.length > 0 ? (
            <div className="toggle-card-actions">
              <button
                className="inline-button"
                type="button"
                onClick={onSetAllMaxLevels}
              >
                {t('traderPanel.setAllMax')}
              </button>
            </div>
          ) : null}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('traderPanel.trader')}</th>
                  <th>{t('traderPanel.level')}</th>
                  <th>{t('traderPanel.max')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.traderId}>
                    <td>{row.name}</td>
                    <td>
                      <input
                        className="number-input trader-level-input"
                        type="number"
                        min={0}
                        max={4}
                        step={1}
                        value={row.currentLevel}
                        onChange={(event) => {
                          const parsed = Number(event.target.value)
                          onSetTraderLevel(
                            row.traderId,
                            Number.isFinite(parsed) ? parsed : 0,
                          )
                        }}
                      />
                    </td>
                    <td>{row.maxRequiredLevel}</td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="meta-text">
                      {t('traderPanel.none')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </aside>
  )
}
