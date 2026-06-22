export default function ScoringLoader() {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-3 py-6 rounded-2xl" style={{ background: 'rgba(74,144,226,0.04)', border: '1.5px solid rgba(74,144,226,0.15)' }}>
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(74,144,226,0.15)', borderTopColor: '#4A90E2' }}
        aria-hidden="true"
      />
      <p className="text-sm font-semibold tracking-wide" style={{ color: '#4A90E2' }}>
        AI is scoring your prompt…
      </p>
    </div>
  )
}
