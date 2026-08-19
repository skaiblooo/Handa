import AnimatedPhone from './AnimatedPhone'
import StarfieldBackground from '../StarfieldBackground'

// Sits directly below the dashboard demo, phone on the left this time and
// text on the right, so the two sections alternate instead of reading as
// one long straight column as the page scrolls.
export default function NotificationShowcase() {
  return (
    <section className="relative w-full py-20 md:py-28 overflow-hidden bg-[#020308]">
      <StarfieldBackground />
      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] items-center gap-12 lg:gap-8">
        <AnimatedPhone />
        <div className="text-center lg:text-left">
          <h2 className="font-instrument text-white text-3xl md:text-4xl">Reminders that reach you</h2>
          <p className="text-white/50 text-sm mt-3 max-w-sm mx-auto lg:mx-0">
            Push and email alerts 30, 7, and 1 day before something expires.
          </p>
        </div>
      </div>
    </section>
  )
}
