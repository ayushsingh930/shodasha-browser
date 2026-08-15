/**
 * Builds safe, user-friendly error pages for failed navigations.
 *
 * Error pages are self-contained HTML loaded via a `data:` URL into a tab's
 * WebContentsView. Internal error codes and stack traces are NEVER included.
 */

import type { NavigationError } from '@shodasha/core';

/** Escapes HTML-sensitive characters to prevent markup injection. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds a self-contained error page document.
 *
 * @param error - The user-facing error description.
 * @param attemptedUrl - The URL that failed (displayed for context).
 * @returns A `data:` URL that can be loaded into a WebContentsView.
 */
export function buildErrorPage(
  error: NavigationError,
  attemptedUrl: string,
): string {
  const safeTitle = escapeHtml(error.title);
  const safeMessage = escapeHtml(error.message);
  const safeUrl = escapeHtml(attemptedUrl);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>
  :root { --bg:#f8fafc; --fg:#0f172a; --muted:#64748b; --accent:#0ea5e9; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
         background:var(--bg); color:var(--fg); }
  .card { max-width:520px; padding:2.5rem; text-align:center; }
  .badge { display:inline-block; padding:.25rem .6rem; border-radius:999px;
           background:#e0f2fe; color:#0369a1; font-size:.75rem; font-weight:600;
           letter-spacing:.05em; text-transform:uppercase; }
  h1 { margin:.9rem 0 .4rem; font-size:1.5rem; }
  p { color:var(--muted); line-height:1.5; margin:.4rem 0 0; }
  .url { margin-top:1.2rem; font-size:.8rem; color:#94a3b8;
         word-break:break-all; }
</style>
</head>
<body>
  <main class="card">
    <span class="badge">SHODASHA</span>
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
    <p class="url">${safeUrl}</p>
  </main>
</body>
</html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}
