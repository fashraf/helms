import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar  from './TopBar'

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
  return (
    <div className="flex h-screen overflow-hidden bg-helm-900 helm-grid-bg">
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
