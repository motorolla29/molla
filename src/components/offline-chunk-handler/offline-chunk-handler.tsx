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
            // Используем replace, чтобы в истории не оставалась "битая" страница,
            // и кнопка "Назад" возвращала на страницу до неё.
            if (typeof window !== 'undefined') window.location.replace('/offline');
          }
          if (typeof window === 'undefined') return;
          window.addEventListener('error', function(e) {
            var err = e.error || e;
            if (shouldHandle(err)) {
              if (e.preventDefault) e.preventDefault();
              try {
                alert('[window.error] ' + (err && err.message ? err.message : String(err)));
              } catch (alertErr) {}
              rememberUrlAndGoOffline();
            }
          });
          window.addEventListener('unhandledrejection', function(e) {
            if (shouldHandle(e.reason)) {
              if (e.preventDefault) e.preventDefault();
              try {
                var reason = e.reason || {};
                var msg = reason && reason.message ? reason.message : String(reason);
                alert('[unhandledrejection] ' + msg);
              } catch (alertErr) {}
              rememberUrlAndGoOffline();
            }
          });
          function initBackLinks() {
            document.querySelectorAll('[data-offline-back]').forEach(function(link) {
              link.addEventListener('click', function(e) {
                e.preventDefault();
                // Стрелка "назад" на offline-странице должна возвращать именно на предыдущую страницу,
                // а не повторно открывать проблемный URL.
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/';
                }
              });
            });
          }
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
                // Если сети всё ещё нет, остаёмся на offline-странице,
                // чтобы не дёргать лишний раз роутер и не мигал индикатор.
                if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
                  return;
                }
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
            initBackLinks();
            initRetryLinks();
          }
          if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runOfflineInit);
          else setTimeout(runOfflineInit, 0);
        })();
      `}
    </Script>
  );
}
