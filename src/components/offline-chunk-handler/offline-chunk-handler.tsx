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
            // На мобильных navigator.onLine может врать, поэтому ориентируемся по тексту ошибки.
            // Это позволяет уходить на /offline вместо белого экрана при реальном офлайне.
            var isNetworkError =
              (name === 'TypeError' ||
                message.indexOf('Failed to fetch') !== -1 ||
                message.indexOf('NetworkError') !== -1 ||
                message.indexOf('ERR_INTERNET_DISCONNECTED') !== -1 ||
                message.indexOf('Load failed') !== -1);

            if (!isChunkError && !isNetworkError) return false;
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
            document.querySelectorAll('.retry-link').forEach(function(link) {
              link.addEventListener('click', function(e) {
                e.preventDefault();
                var target = null;
                try {
                  target = sessionStorage.getItem('offline:last-url');
                } catch (e) {}
                if (target) {
                  window.location.href = target;
                } else {
                  // Если не знаем проблемный URL, просто перезагружаем текущую страницу.
                  window.location.reload();
                }
              });
            });
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
