import Hero from './Hero'
import DashboardShowcase from './DashboardShowcase'
import FAQFooter from './FAQFooter'

export default function Landing({ onGetStarted }) {
  return (
    <div className="bg-[#0a0608]">
      <Hero onGetStarted={onGetStarted} />
      <DashboardShowcase />
      <FAQFooter />
    </div>
  )
}
