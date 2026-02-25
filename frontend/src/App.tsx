import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import WageCalculator from './pages/WageCalculator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-surface flex flex-col">
        <header className="bg-header-bg border-b border-border shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-emerald flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight leading-none">Lohnabrechnung</h1>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">Lohnarten & Betragsberechnung</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <WageCalculator />
        </main>

        <footer className="border-t border-border bg-header-bg mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Lohnabrechnung</span>
            <span className="flex items-center gap-1">
              Built with{' '}
              <svg className="w-3 h-3 text-emerald inline" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>{' '}
              using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'wage-calculator')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </span>
          </div>
        </footer>
      </div>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
