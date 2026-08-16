const variants = {
  error: {
    wrapper: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-500',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  success: {
    wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: 'text-emerald-500',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  info: {
    wrapper: 'bg-sky-50 border-sky-200 text-sky-800',
    icon: 'text-sky-500',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
}

export default function Alert({ variant = 'info', children }) {
  const v = variants[variant]

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${v.wrapper}`}>
      <svg className={`w-5 h-5 shrink-0 mt-0.5 ${v.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={v.iconPath} />
      </svg>
      <p className="font-medium leading-relaxed">{children}</p>
    </div>
  )
}
