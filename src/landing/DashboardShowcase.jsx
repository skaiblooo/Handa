import DashboardDemo from './DashboardDemo'
import StarfieldBackground from '../StarfieldBackground'

// Same deep-space backdrop as the real dashboard's night mode (see
// StarfieldBackground), not a separate photo, so the demo reads as a
// preview of the actual product rather than generic space decoration.
export default function DashboardShowcase() {
  return (
    <section id="demo" className="relative w-full py-20 md:py-28 overflow-hidden bg-[#020308]">
      <StarfieldBackground />
      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] items-center gap-12 lg:gap-8">
        <div className="text-center lg:text-left">
          <h2 className="font-instrument text-white text-3xl md:text-4xl">See Orbit in action</h2>
          <p className="text-white/50 text-sm mt-3 max-w-sm mx-auto lg:mx-0">A quick look at tracking a document from start to finish.</p>
        </div>
        <DashboardDemo />
      </div>
    </section>
  )
}
