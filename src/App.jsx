import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import AppRouter      from './router'
import useUIStore     from './store/uiStore'
import ToastContainer from './components/ui/ToastContainer'
import { BlockUI } from './components/ui/BlockUI'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
    },
  },
})

function ThemeApplier() {
  const theme = useUIStore((s) => s.theme)
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('light', 'dark')
    html.classList.add(theme)
  }, [theme])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <AppRouter />
      <ToastContainer />
      <BlockUI />
    </QueryClientProvider>
  )
}
