// src/lib/queryClient.tsx - CORRIGIDO
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { toastManager } from '../utils/toastManager';
import { analytics } from '../utils/analytics';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache strategies
      staleTime: 5 * 60 * 1000, // 5min
      gcTime: 10 * 60 * 1000, // 10min (antiga cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      
      // Retry strategy
      retry: (failureCount, error: any) => {
        // Não retry em erros de autenticação
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry até 2x para outros erros
        return failureCount < 2;
      },
      
      retryDelay: (attemptIndex) => 
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    
    mutations: {
      // Error handling global para mutations
      onError: (error: any) => {
        if (error?.status !== 401) { // Auth errors são tratados no interceptor
          const toastId = `mutation-error-${Date.now()}`;
          if (!toastManager.isActive(toastId)) {
            toastManager.add(toastId);
            toast.error(error?.message || 'Algo deu errado', { id: toastId });
          }
        }
      }
    }
  },
  
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      // Log de erros em queries
      console.error('Query Error:', error, query.queryKey);
      
      // Tracking de erros
      try {
        analytics?.track('query_error', {
          queryKey: query.queryKey,
          error: error.message,
          timestamp: Date.now()
        });
      } catch (analyticsError) {
        console.warn('Erro ao registrar analytics para query error:', analyticsError);
      }
    }
  }),
  
  mutationCache: new MutationCache({
    onError: (error: any, variables, context, mutation) => {
      console.error('Mutation Error:', error, mutation);
      
      try {
        analytics?.track('mutation_error', {
          error: error.message,
          timestamp: Date.now()
        });
      } catch (analyticsError) {
        console.warn('Erro ao registrar analytics para mutation error:', analyticsError);
      }
    }
  })
});