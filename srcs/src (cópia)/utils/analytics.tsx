interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private isInitialized = false;

  init() {
    this.isInitialized = true;
    // Flush queue
    this.queue.forEach(event => this.sendEvent(event));
    this.queue = [];
  }

  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };

    if (this.isInitialized) {
      this.sendEvent(analyticsEvent);
    } else {
      this.queue.push(analyticsEvent);
    }
  }

  private sendEvent(event: AnalyticsEvent) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics:', event);
      return;
    }

    // Enviar para serviço de analytics
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(console.error);
  }

  // Performance monitoring
  measurePagePerformance() {
    if ('web-vitals' in window) {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS(this.trackWebVital);
        onFID(this.trackWebVital);
        onFCP(this.trackWebVital);
        onLCP(this.trackWebVital);
        onTTFB(this.trackWebVital);
      });
    }
  }

  private trackWebVital = (metric: any) => {
    this.track('web_vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating
    });
  };
}

export const analytics = new Analytics();

