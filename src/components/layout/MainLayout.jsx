import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar  from './TopBar'
import { BlockUI } from '../ui/BlockUI'

/**
 * MainLayout — wraps all authenticated pages.
 * Structure:
 *   ┌──────────┬───────────────────────────┐
 *   │          │  TopBar                   │
 *   │ Sidebar  ├───────────────────────────┤
 *   │          │  <Outlet /> (page content)│
 *   └──────────┴───────────────────────────┘
 */
export default function MainLayout() {
  // ─── Google Analytics SPA page-view tracking ───────────────────────────
  // gtag.js is loaded in index.html. Here we fire a `page_view` event on
  // every route change so navigations inside the SPA are counted as
  // distinct page-views in GA4.
  const loc = useLocation()
  useEffect(() => {
    if (typeof window.gtag !== 'function') return
    window.gtag('event', 'page_view', {
      page_path:     loc.pathname + loc.search,
      page_location: window.location.href,
      page_title:    document.title,
    })
  }, [loc.pathname, loc.search])

  return (
    <div className="flex h-screen overflow-hidden bg-helm-900 helm-grid-bg">
      {/* Global blocking overlay — fires on long-running operations via useBlockUI */}
      <BlockUI />

      {/* Left sidebar */}
      <Sidebar />

      {/* Right content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 min-h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
