// src/components/ui/toast.tsx
import * as React from "react"

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'loading'
  onClose?: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  React.useEffect(() => {
    if (type !== 'loading' && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [type, onClose])

  const icons = {
    success: '✅',
    error: '❌',
    loading: '⏳'
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    loading: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`${colors[type]} border-2 rounded-lg p-6 shadow-2xl min-w-[300px] max-w-md animate-in fade-in zoom-in duration-200`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icons[type]}</span>
          <div className="flex-1">
            <p className="font-semibold text-lg">{message}</p>
            {type === 'loading' && (
              <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }}></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para usar o toast
export function useToast() {
  const [toast, setToast] = React.useState<ToastProps | null>(null)

  const showToast = React.useCallback((message: string, type: ToastProps['type']) => {
    setToast({ message, type })
  }, [])

  const hideToast = React.useCallback(() => {
    setToast(null)
  }, [])

  const ToastComponent = toast ? (
    <Toast {...toast} onClose={hideToast} />
  ) : null

  return {
    showToast,
    hideToast,
    ToastComponent
  }
}