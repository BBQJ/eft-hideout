import { useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { BACKUP_SCHEMA_VERSION, createBackupPayload, parseBackupPayload } from '../lib/backup'
import { useUserStore } from '../store/userStore'

export function BackupPage() {
  const { locale, t } = useI18n()
  const completedUpgradeIds = useUserStore((state) => state.completedUpgradeIds)
  const targetUpgradeIds = useUserStore((state) => state.targetUpgradeIds)
  const inventoryByItemId = useUserStore((state) => state.inventoryByItemId)
  const traderLevelsByTraderId = useUserStore((state) => state.traderLevelsByTraderId)
  const replaceFromSnapshot = useUserStore((state) => state.replaceFromSnapshot)
  const [status, setStatus] = useState<string | null>(null)

  const handleExport = () => {
    const payload = createBackupPayload({
      completedUpgradeIds,
      targetUpgradeIds,
      inventoryByItemId,
      traderLevelsByTraderId,
    })

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    anchor.href = url
    anchor.download = `eft-hideout-backup-${timestamp}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus(t('backup.exported'))
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const payload = parseBackupPayload(text)
      replaceFromSnapshot(payload.user)
      setStatus(t('backup.imported', { time: new Date(payload.exportedAt).toLocaleString(locale) }))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('backup.importFailed')
      setStatus(t('backup.importError', { message }))
    }
  }

  return (
    <section>
      <h2>{t('backup.title')}</h2>
      <p className="meta-text">
        {t('backup.desc', { version: BACKUP_SCHEMA_VERSION })}
      </p>

      <div className="backup-actions">
        <button className="action-button" type="button" onClick={handleExport}>
          {t('backup.export')}
        </button>

        <label className="action-button upload-button">
          {t('backup.import')}
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void handleImport(file)
              }
              event.currentTarget.value = ''
            }}
          />
        </label>
      </div>

      {status ? <p className="meta-text">{status}</p> : null}
    </section>
  )
}
