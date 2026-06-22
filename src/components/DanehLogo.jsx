// src/components/DanehLogo.jsx
export default function DanehLogo({ size = 32, withSteam = true, color = "var(--ink)", steamColor = "var(--ink-soft)" }) {
  const h = Math.round((size * 88) / 64);
  return (
    <svg width={size} height={h} viewBox="0 0 64 88" aria-hidden="true">
      {withSteam && (
        <>
          <path d="M16 16c4-6 10-2 8 4-2 5-6 3-5-1" stroke={steamColor} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.55" />
          <path d="M32 11c4-7 11-3 8 4-2 5-7 2-5-2" stroke={steamColor} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.55" />
        </>
      )}
      <path d="M32 30C18 30 9 45 9 60s7 25 23 25 23-12 23-25-9-30-23-30Z" fill={color} />
      <path d="M32 35C26 44 26 70 32 80" stroke="var(--bg)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
