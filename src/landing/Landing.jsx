import { useEffect, useState } from 'react'
import Hero from './Hero'
import DashboardShowcase from './DashboardShowcase'
import NotificationShowcase from './NotificationShowcase'
import FAQFooter from './FAQFooter'
import LegalPage from './LegalPage'
import loginBg from '../assets/login-bg.webp'

export default function Landing({ onGetStarted }) {
  // 'privacy' | 'terms' | null — swaps the whole landing page out for a
  // standalone legal page rather than a modal, so Privacy Policy/Terms
  // read as real destinations instead of a popup bolted onto the footer.
  const [legalPage, setLegalPage] = useState(null)

  // Auth's background image otherwise only starts fetching once someone
  // clicks through, so it visibly loads in a beat late. Warming the
  // browser's cache with it as soon as the landing page is up means it's
  // already there by the time Auth actually mounts.
  useEffect(() => {
    const img = new Image()
    img.src = loginBg
  }, [])

  if (legalPage) {
    return <LegalPage page={legalPage} onBack={() => setLegalPage(null)} />
  }

  return (
    <div className="bg-[#0a0608]">
      <Hero onGetStarted={onGetStarted} />
      <DashboardShowcase />
      <NotificationShowcase />
      <FAQFooter onOpenLegal={setLegalPage} />
    </div>
  )
}
