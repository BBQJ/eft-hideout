import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'

interface TargetRequirementRow {
  itemId: string
  name: string
  iconLink: string | null
  foundInRaidRequired: boolean
  required: number
  owned: number
  missing: number
}

interface TargetRequirementsPanelProps {
  rows: TargetRequirementRow[]
  onSetOwned: (itemId: string, amount: number) => void
}

export function TargetRequirementsPanel({
  rows,
  onSetOwned,
}: TargetRequirementsPanelProps) {
  const { t } = useI18n()
  const [showOnlyFoundInRaid, setShowOnlyFoundInRaid] = useState(false)

  const filteredRows = useMemo(
    () =>
      showOnlyFoundInRaid
        ? rows.filter((row) => row.foundInRaidRequired)
        : rows,
    [rows, showOnlyFoundInRaid],
  )

  return (
    <aside className="map-target-panel">
      <h3>{t('targetPanel.title', { count: filteredRows.length })}</h3>
      <p className="meta-text">{t('targetPanel.desc')}</p>
      <label className="toggle-chip target-panel-toggle">
        <input
          type="checkbox"
          checked={showOnlyFoundInRaid}
          onChange={(event) => setShowOnlyFoundInRaid(event.target.checked)}
        />
        {t('targetPanel.onlyFoundInRaid')}
      </label>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('common.item')}</th>
              <th>{t('targetPanel.req')}</th>
              <th>{t('targetPanel.own')}</th>
              <th>{t('targetPanel.miss')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.itemId}>
                <td>
                  <div className="item-cell">
                    <span className="item-thumb-wrap">
                      {row.iconLink ? (
                        <img className="item-thumb" src={row.iconLink} alt="" loading="lazy" />
                      ) : (
                        <span className="item-thumb is-empty" aria-hidden="true" />
                      )}
                      {row.foundInRaidRequired ? (
                        <span
                          className="item-thumb-badge"
                          title={t('common.foundInRaid')}
                          aria-label={t('common.foundInRaid')}
                        >
                          ✓
                        </span>
                      ) : null}
                    </span>
                    <span className="item-label">{row.name}</span>
                  </div>
                </td>
                <td>{row.required}</td>
                <td>
                  <input
                    className="number-input map-target-owned-input"
                    type="number"
                    min={0}
                    step={1}
                    value={row.owned}
                    onChange={(event) => {
                      const parsed = Number(event.target.value)
                      onSetOwned(row.itemId, Number.isFinite(parsed) ? parsed : 0)
                    }}
                  />
                </td>
                <td className={row.missing > 0 ? 'missing-cell' : 'ok-cell'}>
                  {row.missing}
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="meta-text">
                  {t('targetPanel.noTargets')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </aside>
  )
}
