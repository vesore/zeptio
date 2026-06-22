interface Props {
  prompt: string
}

export default function IdealPromptCard({ prompt }: Props) {
  return (
    <div className="rounded-3xl p-6 flex flex-col gap-2" style={{ background: 'rgba(74,144,226,0.04)', border: '1px solid rgba(74,144,226,0.15)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4A90E2' }}>
        Here&apos;s an ideal prompt
      </p>
      <p className="text-sm leading-relaxed font-medium" style={{ color: '#1A1A1A', fontStyle: 'italic' }}>
        &ldquo;{prompt}&rdquo;
      </p>
    </div>
  )
}
