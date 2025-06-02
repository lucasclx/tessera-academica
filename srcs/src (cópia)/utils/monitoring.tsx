export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  trackApiCall(endpoint: string, duration: number) {
    const key = `api_${endpoint}`;
    const times = this.metrics.get(key) || [];
    times.push(duration);
    
    // Manter apenas os últimos 100 registros
    if (times.length > 100) {
      times.shift();
    }
    
    this.metrics.set(key, times);
  }

  trackCacheHit(endpoint: string) {
    const key = `cache_hit_${endpoint}`;
    const hits = this.metrics.get(key) || [];
    hits.push(Date.now());
    this.metrics.set(key, hits);
  }

  trackCacheMiss(endpoint: string) {
    const key = `cache_miss_${endpoint}`;
    const misses = this.metrics.get(key) || [];
    misses.push(Date.now());
    this.metrics.set(key, misses);
  }

  getAverageResponseTime(endpoint: string): number {
    const times = this.metrics.get(`api_${endpoint}`) || [];
    if (times.length === 0) return 0;
    
    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }

  getCacheHitRate(endpoint: string): number {
    const hits = this.metrics.get(`cache_hit_${endpoint}`) || [];
    const misses = this.metrics.get(`cache_miss_${endpoint}`) || [];
    const total = hits.length + misses.length;
    
    if (total === 0) return 0;
    return (hits.length / total) * 100;
  }

  getMetricsReport(): Record<string, any> {
    const report: Record<string, any> = {};
    
    // Calcular métricas gerais
    for (const [key, values] of this.metrics.entries()) {
      if (key.startsWith('api_')) {
        const endpoint = key.replace('api_', '');
        report[endpoint] = {
          averageResponseTime: this.getAverageResponseTime(endpoint),
          cacheHitRate: this.getCacheHitRate(endpoint),
          totalCalls: values.length,
        };
      }
    }
    
    return report;
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

// Instância global para monitoramento
export const performanceMonitor = new PerformanceMonitor();