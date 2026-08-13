import DashboardDemo from './DashboardDemo'
import showcaseBg from '../assets/landing-showcase-bg.webp'

// Carries the background from Hero's video down to FAQFooter's dark tone
// (so the page doesn't jump straight from video to FAQ), and hosts a
// looping, scripted replica of the real dashboard demonstrating the core
// add-a-document flow end to end. The astronaut/asteroid-field/Earth photo
// is this section's own backdrop — the mockup inside no longer carries its
// own separate Earth image, so the two don't compete.
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
