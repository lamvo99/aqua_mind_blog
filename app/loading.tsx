import { Droplets } from "lucide-react"
import strings from "@/lib/i18n/strings"

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 dark:bg-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Droplets className="w-8 h-8 text-white" />
        </div>
        <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse mx-auto mb-3" />
        <div className="h-3 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse mx-auto" />
        <p className="sr-only">{strings.loading.text}</p>
      </div>
    </div>
  )
}
