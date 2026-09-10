import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StockDashboard from './components/StockDashboard';

// Configure TanStack QueryClient with specific resilience defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Circuit breaker handles failures, disable default retries
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StockDashboard />
    </QueryClientProvider>
  );
}
