import DashboardDemo from './DashboardDemo'

const STARFIELD =
  'radial-gradient(1px 1px at 15% 25%, white, transparent), radial-gradient(1px 1px at 75% 15%, white, transparent), radial-gradient(1px 1px at 45% 60%, white, transparent), radial-gradient(1.5px 1.5px at 90% 70%, white, transparent), radial-gradient(1px 1px at 25% 85%, white, transparent), radial-gradient(1px 1px at 60% 40%, white, transparent), radial-gradient(1px 1px at 10% 55%, white, transparent), radial-gradient(1.5px 1.5px at 85% 30%, white, transparent)'

// Carries the background gradient from Hero's video down to FAQFooter's
// dark tone (so the page doesn't jump straight from video to FAQ), and
// hosts a looping, scripted replica of the real dashboard demonstrating the
// core add-a-document flow end to end.
export default function DashboardShowcase() {
  return (
    <section
      className="relative w-full py-20 md:py-28"
      style={{ background: 'linear-gradient(180deg, #010A17 0%, #0a1628 55%, #060c16 100%)' }}
    >
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: STARFIELD }} />
      <div className="relative">
        <DashboardDemo />
      </div>
    </section>
  )
}
