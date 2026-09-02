interface IconProps {
  className?: string;
}

export function ZoomOutIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12l4.5 4.5M6 8.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ZoomInIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12l4.5 4.5M6 8.5h5M8.5 6v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TextSmallerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M11 5H15M11 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 14l3-6 3 6H5z" fill="currentColor" />
    </svg>
  );
}

export function TextLargerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4H15M10 7H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 15l3.5-7 3.5 7H4z" fill="currentColor" />
    </svg>
  );
}
