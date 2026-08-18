// The dashboard's own deep-space backdrop (base color + two drifting
// starfield layers + a vignette), pulled out so the landing page's demo
// and FAQ/footer sections can share the exact same background instead of
// a merely similar-looking one. `isDark` only matters for Dashboard's own
// light-mode toggle — every other caller is always-dark and can omit it.
export default function StarfieldBackground({ isDark = true }) {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: isDark ? '#020308' : 'transparent' }} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? `radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.9), transparent),
                radial-gradient(1px 1px at 90px 80px, rgba(255,255,255,0.7), transparent),
                radial-gradient(1.2px 1.2px at 150px 40px, rgba(255,255,255,0.85), transparent),
                radial-gradient(1px 1px at 60px 130px, rgba(255,255,255,0.6), transparent),
                radial-gradient(1.4px 1.4px at 170px 150px, rgba(255,255,255,0.9), transparent),
                radial-gradient(1px 1px at 190px 10px, rgba(255,255,255,0.6), transparent)`
            : `radial-gradient(1px 1px at 20px 30px, rgba(71,85,105,0.35), transparent),
                radial-gradient(1px 1px at 90px 80px, rgba(71,85,105,0.28), transparent),
                radial-gradient(1.2px 1.2px at 150px 40px, rgba(71,85,105,0.32), transparent),
                radial-gradient(1px 1px at 60px 130px, rgba(71,85,105,0.24), transparent),
                radial-gradient(1.4px 1.4px at 170px 150px, rgba(71,85,105,0.35), transparent),
                radial-gradient(1px 1px at 190px 10px, rgba(71,85,105,0.24), transparent)`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
          animation: 'starfield-drift 150s linear infinite alternate',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? `radial-gradient(0.8px 0.8px at 40px 60px, rgba(255,255,255,0.5), transparent),
                radial-gradient(0.8px 0.8px at 110px 20px, rgba(255,255,255,0.4), transparent),
                radial-gradient(1px 1px at 160px 110px, rgba(255,255,255,0.55), transparent),
                radial-gradient(0.8px 0.8px at 20px 160px, rgba(255,255,255,0.4), transparent),
                radial-gradient(0.8px 0.8px at 230px 90px, rgba(255,255,255,0.45), transparent)`
            : `radial-gradient(0.8px 0.8px at 40px 60px, rgba(71,85,105,0.2), transparent),
                radial-gradient(0.8px 0.8px at 110px 20px, rgba(71,85,105,0.16), transparent),
                radial-gradient(1px 1px at 160px 110px, rgba(71,85,105,0.22), transparent),
                radial-gradient(0.8px 0.8px at 20px 160px, rgba(71,85,105,0.16), transparent),
                radial-gradient(0.8px 0.8px at 230px 90px, rgba(71,85,105,0.18), transparent)`,
          backgroundRepeat: 'repeat',
          backgroundSize: '260px 260px',
          animation: 'starfield-drift 220s linear infinite alternate-reverse',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: isDark ? 'linear-gradient(180deg, rgba(2,3,10,0.15) 0%, rgba(2,3,10,0.4) 100%)' : 'transparent' }}
      />
    </>
  )
}
