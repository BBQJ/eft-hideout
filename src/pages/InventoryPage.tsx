import { useMemo, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { getItemName, getItemShortName, itemMatchesQuery } from '../lib/itemLabel'
import { useHideoutDataStore } from '../store/hideoutDataStore'
import { useUserStore } from '../store/userStore'

export function InventoryPage() {
  const { language, t } = useI18n()
  const data = useHideoutDataStore((state) => state.data)
  const inventoryByItemId = useUserStore((state) => state.inventoryByItemId)
  const setInventory = useUserStore((state) => state.setInventory)
  const [searchTerm, setSearchTerm] = useState('')

  const rows = useMemo(() => {
    if (!data) {
      return []
    }

    return Object.values(data.itemsById)
      .filter((item) => itemMatchesQuery(item, searchTerm.trim()))
      .sort((left, right) =>
        getItemName(left, language).localeCompare(getItemName(right, language)),
      )
  }, [data, language, searchTerm])

  if (!data) {
    return <p>{t('common.loadingItems')}</p>
  }

  return (
    <section>
      <h2>{t('inventory.title')}</h2>
      <p className="meta-text">{t('inventory.desc')}</p>
      <label className="search-label">
        {t('inventory.searchLabel')}
        <input
          className="text-input"
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t('inventory.searchPlaceholder')}
        />
      </label>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('common.item')}</th>
              <th>{t('inventory.short')}</th>
              <th>{t('common.owned')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="item-cell">
                    {item.iconLink ? (
                      <img className="item-thumb" src={item.iconLink} alt="" loading="lazy" />
                    ) : (
                      <span className="item-thumb is-empty" aria-hidden="true" />
                    )}
                    <span className="item-label">{getItemName(item, language)}</span>
                  </div>
                </td>
                <td>{getItemShortName(item, language)}</td>
                <td>
                  <input
                    className="number-input"
                    type="number"
                    min={0}
                    step={1}
                    value={inventoryByItemId[item.id] ?? 0}
                    onChange={(event) => {
                      const parsed = Number(event.target.value)
                      setInventory(item.id, Number.isFinite(parsed) ? parsed : 0)
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
