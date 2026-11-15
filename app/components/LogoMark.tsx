interface LogoMarkProps {
  className?: string
}

/**
 * Flat AquaMind wave mark. Solid teal badge with white and light-cyan waves.
 * Decorative when used next to the AquaMind wordmark.
 */
export default function LogoMark({ className = "w-9 h-9" }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="256" cy="256" r="248" fill="#0891B2" />
      <path
        d="M64 288c48-64 112-88 176-56 56 28 96 28 144 8 24-10 48-10 64-4"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="48"
        strokeLinecap="round"
      />
      <path
        d="M64 376c56-56 120-72 184-40 56 28 96 28 144 8 24-10 48-10 64-4"
        fill="none"
        stroke="#A5F3FC"
        strokeWidth="40"
        strokeLinecap="round"
      />
      <path
        d="M320 248c40 0 72-24 72-64 0-32-24-56-56-56"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="40"
        strokeLinecap="round"
      />
    </svg>
  )
}
