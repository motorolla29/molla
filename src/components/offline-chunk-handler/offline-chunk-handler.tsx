import Script from 'next/script';

export default function OfflineChunkHandler() {
  return (
    <Script id="offline-chunk-handler" strategy="beforeInteractive">
      {`
        (function() {
          if (typeof window === 'undefined') return;

          function shouldHandle(err) {
            if (!err) return false;
            var name = err.name || '';
            var msg = String(err.message || err) || '';
            var isChunk = name === 'ChunkLoadError' || msg.indexOf('Failed to load chunk') !== -1;
            var isNet =
              (name === 'TypeError' ||
                msg.indexOf('Failed to fetch') !== -1 ||
                msg.indexOf('NetworkError') !== -1 ||
                msg.indexOf('ERR_INTERNET_DISCONNECTED') !== -1 ||
                msg.indexOf('Load failed') !== -1);
            return isChunk || isNet;
          }

          function goToOffline() {
            if (window.location.pathname === '/offline') return;
            if (window.__mollaOfflineNavigating) return;
            window.__mollaOfflineNavigating = true;
            window.location.replace('/offline');
          }

          window.addEventListener('error', function(e) {
            var err = e.error || e;
            if (!shouldHandle(err)) return;
            if (e && e.preventDefault) e.preventDefault();
            goToOffline();
          });

          window.addEventListener('unhandledrejection', function(e) {
            var reason = (e && e.reason) || null;
            if (!shouldHandle(reason)) return;
            if (e && e.preventDefault) e.preventDefault();
            goToOffline();
          });
        })();
      `}
    </Script>
  );
}
