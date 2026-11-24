// Logo et icônes de marque (non fournis par lucide-react).

export function Lotus({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 44" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bdo-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c35c" />
          <stop offset="1" stopColor="#d4861f" />
        </linearGradient>
      </defs>
      <g fill="url(#bdo-gold)">
        <path d="M32 2c5 7 6 16 0 28-6-12-5-21 0-28z" />
        <path d="M13 12c9 1 16 7 18 18-10-1-17-8-18-18z" />
        <path d="M51 12c-9 1-16 7-18 18 10-1 17-8 18-18z" />
        <path d="M3 24c9-2 18 1 26 8-10 4-20 2-26-8z" />
        <path d="M61 24c-9-2-18 1-26 8 10 4 20 2 26-8z" />
      </g>
      <path d="M14 38c12 4 24 4 36 0" stroke="url(#bdo-gold)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ light = false, compact = false }) {
  return (
    <span className="inline-flex flex-col items-center leading-none">
      <Lotus className={compact ? 'h-6 w-9' : 'h-7 w-11'} />
      <span className={`font-serif text-[26px] font-bold tracking-tight sm:text-[30px] ${light ? 'text-white' : 'text-choco-800'} -mt-0.5`}>
        Beauté d’Or
      </span>
      {!compact && (
        <span className={`mt-0.5 text-[8.5px] font-bold tracking-[0.08em] ${light ? 'text-gold-300' : 'text-choco-800'}`}>
          COSMÉTIQUES &amp; SOINS DE BEAUTÉ
        </span>
      )}
    </span>
  );
}

export function WhatsAppIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.04 3C9 3 3.3 8.7 3.3 15.73c0 2.25.6 4.45 1.72 6.38L3.2 29l7.08-1.79a12.7 12.7 0 0 0 5.76 1.4h.01c7.03 0 12.74-5.7 12.74-12.73 0-3.4-1.33-6.6-3.73-9A12.66 12.66 0 0 0 16.04 3zm0 23.3h-.01c-1.9 0-3.77-.51-5.4-1.48l-.39-.23-4.2 1.06 1.12-4.09-.25-.42a10.53 10.53 0 0 1-1.62-5.62c0-5.84 4.75-10.58 10.6-10.58 2.83 0 5.48 1.1 7.48 3.1a10.5 10.5 0 0 1 3.1 7.49c0 5.84-4.76 10.58-10.6 10.58zm5.81-7.92c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.56-1.58-.95-.85-1.59-1.89-1.77-2.21-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.35-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.08 1.3 3.29c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z" />
    </svg>
  );
}

export const FacebookIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z" />
  </svg>
);
export const InstagramIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);
export const TiktokIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M16.6 3c.3 2.3 1.7 3.9 4 4.1v3.1c-1.5.1-2.8-.4-4-1.2v6.3c0 4.4-4.4 7-8 5-2.3-1.3-3.3-4.2-2.2-6.8 1-2.3 3.4-3.6 5.9-3.2v3.3c-.4-.1-.8-.2-1.2-.1-1.3.2-2.2 1.4-2 2.7.2 1.6 2 2.6 3.5 1.8.8-.4 1.3-1.3 1.3-2.2V3h2.7z" />
  </svg>
);
