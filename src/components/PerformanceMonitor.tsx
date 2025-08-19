import { useEffect } from 'react';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ enabled = false }) => {
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('🚀 Performance Metrics:', {
            'DOM Content Loaded': `${navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart}ms`,
            'Load Complete': `${navEntry.loadEventEnd - navEntry.loadEventStart}ms`,
            'Total Load Time': `${navEntry.loadEventEnd - navEntry.fetchStart}ms`,
            'First Paint': navEntry.responseStart - navEntry.fetchStart,
            'Time to Interactive': navEntry.domInteractive - navEntry.fetchStart,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, [enabled]);

  return null;
}; 