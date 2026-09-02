interface LayoutIconProps {
  className?: string;
}

export function FitWidthIcon({ className }: LayoutIconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="4" y="5" width="12" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 10h3M15 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FitScreenIcon({ className }: LayoutIconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4 7V5a1 1 0 0 1 1-1h2M14 4h2a1 1 0 0 1 1 1v2M16 13v2a1 1 0 0 1-1 1h-2M6 16H4a1 1 0 0 1-1-1v-2M7 7h6v6H7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SinglePageIcon({ className }: LayoutIconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="6" y="4" width="8" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function DoublePageIcon({ className }: LayoutIconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3" y="4" width="6" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="4" width="6" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ContinuousScrollIcon({ className }: LayoutIconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="6" y="3" width="8" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="9" width="8" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 15v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
