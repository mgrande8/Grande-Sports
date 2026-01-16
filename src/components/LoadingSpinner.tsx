export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`${sizeClasses[size]} border-gs-gray-300 border-t-gs-green rounded-full animate-spin`}
      />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gs-white">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gs-gray-600">Loading...</p>
      </div>
    </div>
  )
}
