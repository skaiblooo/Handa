import DashboardDemo from './DashboardDemo'
import showcaseBg from '../assets/showcase-bg.webp'

// Carries the background from Hero's video down to FAQFooter's dark tone
// (so the page doesn't jump straight from video to FAQ), and hosts a
// looping, scripted replica of the real dashboard demonstrating the core
// add-a-document flow end to end. The astronaut/Earth photo is this
// section's own backdrop — the mockup inside DashboardDemo has its own
// separate Earth background matching the real dashboard's, so the two
// intentionally layer rather than duplicate each other.
export default function DashboardShowcase() {
  return (
    <section className="relative w-full py-20 md:py-28 overflow-hidden bg-[#010A17]">
      <img src={showcaseBg} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #010A17 0%, transparent 18%, transparent 75%, #060c16 100%)' }}
      />
      <div className="relative">
        <DashboardDemo />
      </div>
    </section>
  )
}
