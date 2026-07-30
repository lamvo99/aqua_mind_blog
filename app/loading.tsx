import { Droplets } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 dark:bg-slate-900">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Droplets className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-48 bg-gray-200 dark:bg-slate-700 rounded mx-auto animate-pulse" />
          <div className="h-3 w-32 bg-gray-200 dark:bg-slate-700 rounded mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  )
}
