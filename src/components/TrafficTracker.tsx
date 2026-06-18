import React from 'react';
import { useLocation } from 'react-router-dom';
import { trafficService } from '@/services/trafficService';

const TrafficTracker: React.FC = () => {
  const location = useLocation();
  const sessionIdRef = React.useRef<string>(trafficService.getOrCreateSessionId());
  const currentPathRef = React.useRef<string>('');
  const currentStartRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    const now = Date.now();

    if (currentStartRef.current === null) {
      currentPathRef.current = path;
      currentStartRef.current = now;
      void trafficService
        .trackVisit({
          pagePath: path,
          sessionId: sessionIdRef.current,
          visitedAt: new Date(now).toISOString(),
          viewStartedAt: new Date(now).toISOString(),
          viewEndedAt: new Date(now).toISOString(),
          viewDurationSeconds: 0,
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        })
        .catch((error) => {
          console.warn('Traffic track (initial) failed', error);
        });
      return;
    }

    if (currentPathRef.current) {
      const durationSeconds = Math.max(0, Math.round((now - currentStartRef.current) / 1000));
      void trafficService
        .trackVisit({
          pagePath: currentPathRef.current,
          sessionId: sessionIdRef.current,
          visitedAt: new Date(currentStartRef.current).toISOString(),
          viewStartedAt: new Date(currentStartRef.current).toISOString(),
          viewEndedAt: new Date(now).toISOString(),
          viewDurationSeconds: durationSeconds,
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        })
        .catch((error) => {
          console.warn('Traffic track (route change) failed', error);
        });
    }

    currentPathRef.current = path;
    currentStartRef.current = now;
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    const flushCurrentPage = () => {
      if (!currentPathRef.current) return;
      if (currentStartRef.current === null) return;
      const now = Date.now();
      const durationSeconds = Math.max(0, Math.round((now - currentStartRef.current) / 1000));
      trafficService.sendBeaconTrack({
        pagePath: currentPathRef.current,
        sessionId: sessionIdRef.current,
        visitedAt: new Date(currentStartRef.current).toISOString(),
        viewStartedAt: new Date(currentStartRef.current).toISOString(),
        viewEndedAt: new Date(now).toISOString(),
        viewDurationSeconds: durationSeconds,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      });
    };

    window.addEventListener('beforeunload', flushCurrentPage);
    return () => {
      flushCurrentPage();
      window.removeEventListener('beforeunload', flushCurrentPage);
    };
  }, []);

  return null;
};

export default TrafficTracker;
