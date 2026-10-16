/** The original brown baby bear mascot with a bow tie. */
export function Bear({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="31" cy="35" r="16" fill="var(--bear)" />
      <circle cx="89" cy="35" r="16" fill="var(--bear)" />
      <circle cx="31" cy="35" r="8.5" fill="var(--bear-lt)" />
      <circle cx="89" cy="35" r="8.5" fill="var(--bear-lt)" />
      <ellipse cx="60" cy="64" rx="41" ry="37" fill="var(--bear)" />
      <path
        d="M55 29 q5 -9 10 -2 q-4 -1 -5 4"
        fill="none"
        stroke="var(--bear-dk)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <ellipse cx="33" cy="76" rx="7" ry="4.5" fill="var(--cheek)" opacity=".65" />
      <ellipse cx="87" cy="76" rx="7" ry="4.5" fill="var(--cheek)" opacity=".65" />
      <ellipse cx="60" cy="79" rx="18" ry="13.5" fill="var(--bear-lt)" />
      <circle cx="44" cy="61" r="4.8" fill="var(--bear-dk)" />
      <circle cx="76" cy="61" r="4.8" fill="var(--bear-dk)" />
      <circle cx="45.6" cy="59.4" r="1.6" fill="#fff" />
      <circle cx="77.6" cy="59.4" r="1.6" fill="#fff" />
      <ellipse cx="60" cy="73" rx="6.5" ry="4.6" fill="var(--bear-dk)" />
      <path
        d="M60 77.5 v4 M60 81.5 q-4.5 3.5 -8 0 M60 81.5 q4.5 3.5 8 0"
        fill="none"
        stroke="var(--bear-dk)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M60 104 L45 96 L45 112 Z M60 104 L75 96 L75 112 Z"
        fill="var(--bow)"
        stroke="var(--bow)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="104" r="4.5" fill="var(--bow)" />
      <circle cx="60" cy="104" r="2" fill="#ffffff" opacity=".5" />
    </svg>
  );
}
