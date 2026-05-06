type MascotProps = {
  size?: number;
  className?: string;
  ariaLabel?: string;
};

export function Mascot({
  size = 160,
  className,
  ariaLabel = "Zé, o coalinha aprendiz do Aprendez",
}: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <ellipse cx="120" cy="226" rx="58" ry="6" fill="#000" opacity="0.1" />

      <path
        d="M 70 215 Q 70 168 120 168 Q 170 168 170 215 L 170 232 L 70 232 Z"
        fill="#BCC9D6"
      />
      <ellipse cx="120" cy="200" rx="30" ry="22" fill="#E8EEF5" />

      <circle cx="60" cy="80" r="32" fill="#A5B3C2" />
      <circle cx="180" cy="80" r="32" fill="#A5B3C2" />
      <ellipse
        cx="50"
        cy="60"
        rx="13"
        ry="8"
        fill="#D2DCE6"
        transform="rotate(-30 50 60)"
      />
      <ellipse
        cx="190"
        cy="60"
        rx="13"
        ry="8"
        fill="#D2DCE6"
        transform="rotate(30 190 60)"
      />
      <ellipse cx="60" cy="86" rx="18" ry="22" fill="#F5C5C8" />
      <ellipse cx="180" cy="86" rx="18" ry="22" fill="#F5C5C8" />
      <ellipse cx="62" cy="92" rx="9" ry="13" fill="#E8A7AB" />
      <ellipse cx="178" cy="92" rx="9" ry="13" fill="#E8A7AB" />

      <ellipse cx="120" cy="128" rx="68" ry="62" fill="#BCC9D6" />
      <ellipse cx="100" cy="150" rx="40" ry="32" fill="#A5B3C2" opacity="0.2" />

      <ellipse cx="74" cy="158" rx="11" ry="8" fill="#F4B5B5" opacity="0.55" />
      <ellipse cx="166" cy="158" rx="11" ry="8" fill="#F4B5B5" opacity="0.55" />

      <circle cx="92" cy="125" r="9" fill="#1F2937" />
      <circle cx="148" cy="125" r="9" fill="#1F2937" />
      <circle cx="95" cy="122" r="3" fill="#FFFFFF" />
      <circle cx="151" cy="122" r="3" fill="#FFFFFF" />
      <circle cx="89" cy="129" r="1.6" fill="#FFFFFF" />
      <circle cx="145" cy="129" r="1.6" fill="#FFFFFF" />

      <ellipse cx="120" cy="155" rx="22" ry="17" fill="#1F2937" />
      <ellipse cx="113" cy="148" rx="5" ry="3" fill="#3D4855" />

      <path
        d="M 120 176 Q 110 184 102 180"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 120 176 Q 130 184 138 180"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      <path d="M 80 64 L 160 64 L 156 78 L 84 78 Z" fill="#1F2937" />
      <rect x="68" y="56" width="104" height="10" rx="2" fill="#009C3B" />
      <rect x="68" y="56" width="104" height="2" rx="1" fill="#00C44A" />
      <circle cx="120" cy="61" r="2.5" fill="#FFDF00" />
      <path
        d="M 120 61 Q 145 72 165 84"
        stroke="#FFDF00"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="166" cy="86" r="5" fill="#FFDF00" />
      <line
        x1="165"
        y1="90"
        x2="163"
        y2="98"
        stroke="#E5C700"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line
        x1="167"
        y1="90"
        x2="167"
        y2="99"
        stroke="#E5C700"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line
        x1="168"
        y1="90"
        x2="170"
        y2="98"
        stroke="#E5C700"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
