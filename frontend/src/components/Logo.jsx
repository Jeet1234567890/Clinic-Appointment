export default function Logo({ size = 'md', light = false }) {
  const sizes = {
    sm: { icon: 'w-8 h-8', iconInner: 'w-4 h-4', text: 'text-base' },
    md: { icon: 'w-10 h-10', iconInner: 'w-5 h-5', text: 'text-xl' },
    lg: { icon: 'w-12 h-12', iconInner: 'w-6 h-6', text: 'text-2xl' },
  }

  const s = sizes[size]

  return (
    <div className="flex items-center gap-3">
      <div className={`${s.icon} rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/25`}>
        <svg className={`${s.iconInner} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <div>
        <span className={`${s.text} font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
          ClinicCare
        </span>
        {size !== 'sm' && (
          <p className={`text-xs font-medium ${light ? 'text-teal-100' : 'text-slate-500'}`}>
            Healthcare Portal
          </p>
        )}
      </div>
    </div>
  )
}
