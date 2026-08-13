import Navbar from './Navbar'
import Button from './Button'
import SeamlessVideo from '../SeamlessVideo'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4'

export default function Hero({ onGetStarted }) {
  return (
    <section id="about" className="relative h-screen w-full overflow-hidden">
      <SeamlessVideo src={VIDEO_URL} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/20" />
      {/* Fades the video down to the exact color the next section opens with,
          so the seam between the two sections disappears instead of reading
          as a hard-edged cut between "video" and "gradient". */}
      <div
        className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent 0%, #010A17 100%)' }}
      />

      <Navbar onGetStarted={onGetStarted} />

      <div className="absolute inset-0 flex flex-col items-center justify-center -mt-[120px] px-6">
        <h1 className="font-instrument text-white text-[36px] md:text-7xl lg:text-[110px] leading-[0.9] tracking-tight text-center text-glow">
          Your space. Your orbits.
        </h1>
        <p className="text-white/70 text-sm md:text-base text-center mt-5 md:mt-7 max-w-xl">
          A simplified tracker for all of your documents.
        </p>
        <div className="mt-6 md:mt-9">
          <Button onClick={onGetStarted}>Start tracking for free</Button>
        </div>
      </div>
    </section>
  )
}
