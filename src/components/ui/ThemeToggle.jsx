import { useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import useUIStore from '../../store/uiStore'

export default function ThemeToggle() {
  const { theme, setTheme } = useUIStore()

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('light', 'dark')
    html.classList.add(theme)
  }, [theme])

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <button
      onClick={toggle}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200
        text-slate-400 hover:text-slate-200 hover:bg-helm-700 border border-transparent hover:border-helm-600"
    >
      {theme === 'dark'
        ? <Sun  className="w-4 h-4 text-amber-400" />
        : <Moon className="w-4 h-4 text-slate-400" />
      }
    </button>
  )
}
