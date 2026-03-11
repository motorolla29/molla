import Script from 'next/script';

export default function OfflineChunkHandler() {
  return (
    <Script id="offline-chunk-handler" strategy="beforeInteractive">
      {`
        (function() {
          function shouldHandle(errorLike) {
            if (!errorLike) return false;
            var name = errorLike.name || '';
            var message = String(errorLike.message || errorLike) || '';
            var isChunkError = name === 'ChunkLoadError' ||
              message.indexOf('ChunkLoadError') !== -1 ||
              message.indexOf('Failed to load chunk') !== -1;
            if (!isChunkError) return false;
            if (typeof window !== 'undefined' && window.location.pathname === '/offline') return false;
            return true;
          }
          function rememberUrlAndGoOffline() {
            try { if (typeof window !== 'undefined') window.sessionStorage.setItem('offline:last-url', window.location.href); } catch (e) {}
            if (typeof window !== 'undefined') window.location.href = '/offline';
          }
          if (typeof window === 'undefined') return;
          window.addEventListener('error', function(e) {
            var err = e.error || e;
            if (shouldHandle(err)) { if (e.preventDefault) e.preventDefault(); rememberUrlAndGoOffline(); }
          });
          window.addEventListener('unhandledrejection', function(e) {
            if (shouldHandle(e.reason)) { if (e.preventDefault) e.preventDefault(); rememberUrlAndGoOffline(); }
          });
          function fixOfflineUrl() {
            if (window.location.pathname !== '/offline' && document.getElementById('offline-page')) {
              try { sessionStorage.setItem('offline:last-url', window.location.href); } catch (e) {}
              window.location.replace('/offline');
              return true;
            }
            return false;
          }
          function initRetryLinks() {
            var target = window.location.pathname !== '/offline' ? window.location.href : (function() { try { var s = sessionStorage.getItem('offline:last-url'); return s || '/'; } catch (e) { return '/'; } })();
            document.querySelectorAll('.retry-link').forEach(function(link) { link.href = target; });
          }
          function runOfflineInit() {
            if (fixOfflineUrl()) return;
            initRetryLinks();
          }
          if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runOfflineInit);
          else setTimeout(runOfflineInit, 0);
        })();
      `}
    </Script>
  );
}
