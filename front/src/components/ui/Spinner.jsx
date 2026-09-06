export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-8 w-8' }
  return (
    <div
      className={`animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 ${sizes[size]} ${className}`}
    />
  )
}
