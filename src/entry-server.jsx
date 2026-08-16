import { renderToString } from 'react-dom/server'
import { LanguageProvider } from './i18n'
import Landing from './landing/Landing'

// Renders the exact first-paint markup a logged-out visitor sees, before
// App.jsx's async getSession()/check-visit calls ever resolve — this is
// synchronous, so it's safe to render outside a browser at build time. The
// build step (scripts/prerender.js) injects the result into dist/index.html
// so a crawler that never runs JavaScript still sees real content instead of
// an empty <div id="root">. Real visitors are unaffected: their browser still
// loads main.jsx and createRoot() replaces this markup with the live app on
// the very first paint.
export function render() {
  return renderToString(
    <LanguageProvider>
      <Landing onGetStarted={() => {}} />
    </LanguageProvider>
  )
}
