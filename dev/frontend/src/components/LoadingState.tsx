export function LoadingState({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#1E3A8A] rounded-full animate-spin" />
        <p className="text-sm text-[#6B7280]">{message}</p>
      </div>
    </div>
  )
}
