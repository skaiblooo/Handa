import DashboardDemo from './DashboardDemo'
import showcaseBg from '../assets/orbit-background.webp'

// Carries the background from Hero's video down to FAQFooter's dark tone
// (so the page doesn't jump straight from video to FAQ), and hosts a
// looping, scripted replica of the real dashboard demonstrating the core
// add-a-document flow end to end. The orbit/satellite photo is this
// section's own backdrop — the mockup inside no longer carries its own
// separate background image, so the two don't compete.
export default function DashboardShowcase() {
  return (
    <section id="demo" className="relative w-full py-20 md:py-28 overflow-hidden bg-[#010A17]">
      {/* A plain background-image div rather than an <img> so it can drift
          via the same earth-drift keyframe (background-position pan) the
          real dashboard's Earth backdrop uses — reads as a slow "orbit"
          rather than a static photo, and stays consistent with how the app
          already animates this kind of background elsewhere. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${showcaseBg})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          animation: 'earth-drift 90s ease-in-out infinite alternate',
        }}
      />
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
