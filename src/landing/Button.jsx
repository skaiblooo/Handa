export default function Button({ type = 'button', className = '', children, ...props }) {
  return (
    <button
      type={type}
      style={{ outline: 'none', WebkitAppearance: 'none', appearance: 'none' }}
      className={`appearance-none glass-btn glass-interactive text-black px-8 py-3.5 rounded-full font-medium text-sm tracking-wide focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
