import { useState } from 'react'
import Hero from './Hero'
import DashboardShowcase from './DashboardShowcase'
import FAQFooter from './FAQFooter'
import LegalPage from './LegalPage'

export default function Landing({ onGetStarted }) {
  // 'privacy' | 'terms' | null — swaps the whole landing page out for a
  // standalone legal page rather than a modal, so Privacy Policy/Terms
  // read as real destinations instead of a popup bolted onto the footer.
  const [legalPage, setLegalPage] = useState(null)

  if (legalPage) {
    return <LegalPage page={legalPage} onBack={() => setLegalPage(null)} />
  }

  return (
    <div className="bg-[#0a0608]">
      <Hero onGetStarted={onGetStarted} />
      <DashboardShowcase />
      <FAQFooter onOpenLegal={setLegalPage} />
    </div>
  )
}
