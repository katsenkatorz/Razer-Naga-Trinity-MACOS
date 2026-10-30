interface SwitchProps {
  checked: boolean
  onChange(next: boolean): void
  label: string
  disabled?: boolean
}

/** macOS-style on/off switch. Accent only when on. */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      className="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-thumb" aria-hidden />
    </button>
  )
}
