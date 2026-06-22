// src/components/Bean.jsx
export default function Bean({ filled }) {
  return (
    <svg width="16" height="24" viewBox="0 0 24 36" aria-hidden="true">
      <path
        d="M12 1C5 1 1 9 1 18s4 17 11 17 11-9 11-17S19 1 12 1Z"
        fill={filled ? "var(--accent-gold)" : "none"}
        stroke={filled ? "var(--accent-gold)" : "var(--line)"}
        strokeWidth="2"
      />
      <path
        d="M12 5C8.5 11 8.5 25 12 32"
        fill="none"
        stroke={filled ? "var(--surface)" : "var(--line)"}
        strokeWidth="1.6"
      />
    </svg>
  );
}
