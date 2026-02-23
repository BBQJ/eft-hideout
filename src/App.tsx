import { useEffect } from 'react'
import {
  HashRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { BackupPage } from './pages/BackupPage'
import { DashboardPage } from './pages/DashboardPage'
import { useI18n } from './i18n/useI18n'
import type { Language } from './i18n/translations'
import { InventoryPage } from './pages/InventoryPage'
import { OverviewPage } from './pages/OverviewPage'
import { useHideoutDataStore } from './store/hideoutDataStore'

function App() {
  const { language, locale, setLanguage, t } = useI18n()
  const data = useHideoutDataStore((state) => state.data)
  const error = useHideoutDataStore((state) => state.error)
  const isLoading = useHideoutDataStore((state) => state.isLoading)
  const loadData = useHideoutDataStore((state) => state.loadData)

  useEffect(() => {
    void loadData(false)
  }, [loadData])

  const updatedLabel = data
    ? new Date(data.fetchedAt).toLocaleString(locale)
    : t('app.notLoaded')
  const sourceLabel =
    data?.source === 'network'
      ? t('app.source.network')
      : data?.source === 'cache'
        ? t('app.source.cache')
        : t('app.source.none')

  return (
    <HashRouter>
      <div className="app-shell">
        <header className="app-header">
          <div className="brand-block">
            <h1>{t('app.title')}</h1>
            <p>{t('app.subtitle')}</p>
          </div>

          <div className="header-actions">
            <div className="header-controls">
              <label className="lang-select-wrap">
                <span>{t('app.language')}</span>
                <select
                  className="lang-select"
                  value={language}
                  onChange={(event) => {
                    setLanguage(event.target.value as Language)
                  }}
                >
                  <option value="en">{t('app.lang.en')}</option>
                  <option value="ko">{t('app.lang.ko')}</option>
                </select>
              </label>
              <button
                className="action-button"
                type="button"
                onClick={() => {
                  void loadData(true)
                }}
                disabled={isLoading}
              >
                {isLoading ? t('app.refreshingData') : t('app.refreshData')}
              </button>
            </div>
            <p className="meta-text">
              {t('app.sourceLabel')}: <strong>{sourceLabel}</strong> | {t('app.updatedLabel')}:{' '}
              {updatedLabel}
            </p>
          </div>
        </header>

        <nav className="app-nav">
          <NavLink to="/overview">{t('app.nav.overview')}</NavLink>
          <NavLink to="/inventory">{t('app.nav.inventory')}</NavLink>
          <NavLink to="/dashboard">{t('app.nav.dashboard')}</NavLink>
          <NavLink to="/backup">{t('app.nav.backup')}</NavLink>
        </nav>

        {error ? <p className="error-banner">{error}</p> : null}

        <main className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/backup" element={<BackupPage />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p className="meta-text">{t('app.disclaimer')}</p>
          <p className="meta-text">{t('app.disclaimerTrademark')}</p>
        </footer>
      </div>
    </HashRouter>
  )
}

export default App
