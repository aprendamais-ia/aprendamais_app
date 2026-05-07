import { cn } from "@/lib/utils";

export type MascotVariant = "idle" | "happy" | "sad" | "thinking" | "sleeping";

type MascotProps = {
  size?: number;
  className?: string;
  ariaLabel?: string;
  variant?: MascotVariant;
  /** Liga animações em loop (bob, twinkle, lágrima, Z's). Default: true. */
  animated?: boolean;
};

const ARIA_BY_VARIANT: Record<MascotVariant, string> = {
  idle: "Zé, o coalinha aprendiz do Aprendez",
  happy: "Zé, o coalinha, comemorando feliz",
  sad: "Zé, o coalinha, triste",
  thinking: "Zé, o coalinha, pensando",
  sleeping: "Zé, o coalinha, dormindo",
};

const BOB_BY_VARIANT: Record<MascotVariant, string> = {
  idle: "animate-mascot-bob",
  happy: "animate-mascot-bob-strong",
  sad: "animate-mascot-droop",
  thinking: "animate-mascot-bob",
  sleeping: "animate-mascot-snore",
};

export function Mascot({
  size = 160,
  className,
  ariaLabel,
  variant = "idle",
  animated = true,
}: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel ?? ARIA_BY_VARIANT[variant]}
      className={className}
    >
      <ellipse cx="120" cy="226" rx="58" ry="6" fill="#000" opacity="0.1" />

      <g
        className={cn(
          "[transform-origin:120px_220px]",
          animated && BOB_BY_VARIANT[variant],
        )}
      >
        <Body />
        <Ears />
        <Head />
        <Cheeks variant={variant} />
        <Eyes variant={variant} />
        <Nose />
        <Mouth variant={variant} />
        <Flag variant={variant} animated={animated} />
        <Accent variant={variant} animated={animated} />
      </g>
    </svg>
  );
}

function Body() {
  return (
    <>
      <path
        d="M 70 215 Q 70 168 120 168 Q 170 168 170 215 L 170 232 L 70 232 Z"
        fill="#BCC9D6"
      />
      <ellipse cx="120" cy="200" rx="30" ry="22" fill="#E8EEF5" />
    </>
  );
}

function Ears() {
  return (
    <>
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
    </>
  );
}

function Head() {
  return (
    <>
      <ellipse cx="120" cy="128" rx="68" ry="62" fill="#BCC9D6" />
      <ellipse cx="100" cy="150" rx="40" ry="32" fill="#A5B3C2" opacity="0.2" />
    </>
  );
}

function Cheeks({ variant }: { variant: MascotVariant }) {
  const opacity = variant === "happy" ? 0.85 : variant === "sad" ? 0.35 : 0.55;
  return (
    <>
      <ellipse cx="74" cy="158" rx="11" ry="8" fill="#F4B5B5" opacity={opacity} />
      <ellipse cx="166" cy="158" rx="11" ry="8" fill="#F4B5B5" opacity={opacity} />
    </>
  );
}

function Eyes({ variant }: { variant: MascotVariant }) {
  if (variant === "sleeping") {
    return (
      <>
        <path
          d="M 83 125 Q 92 122 101 125"
          stroke="#1F2937"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 139 125 Q 148 122 157 125"
          stroke="#1F2937"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </>
    );
  }

  if (variant === "happy") {
    return (
      <>
        <path
          d="M 83 128 Q 92 118 101 128"
          stroke="#1F2937"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 139 128 Q 148 118 157 128"
          stroke="#1F2937"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </>
    );
  }

  if (variant === "sad") {
    return (
      <>
        <path
          d="M 80 116 Q 90 122 100 121"
          stroke="#1F2937"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 140 121 Q 150 122 160 116"
          stroke="#1F2937"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="92" cy="125" r="7" fill="#1F2937" />
        <circle cx="148" cy="125" r="7" fill="#1F2937" />
        <circle cx="94" cy="123" r="2.2" fill="#FFFFFF" />
        <circle cx="150" cy="123" r="2.2" fill="#FFFFFF" />
      </>
    );
  }

  if (variant === "thinking") {
    return (
      <>
        <circle cx="92" cy="125" r="9" fill="#1F2937" />
        <circle cx="148" cy="125" r="9" fill="#1F2937" />
        <circle cx="96" cy="121" r="3" fill="#FFFFFF" />
        <circle cx="152" cy="121" r="3" fill="#FFFFFF" />
        <path
          d="M 80 116 Q 92 113 104 117"
          stroke="#1F2937"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 136 117 Q 148 113 160 116"
          stroke="#1F2937"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </>
    );
  }

  return (
    <>
      <circle cx="92" cy="125" r="9" fill="#1F2937" />
      <circle cx="148" cy="125" r="9" fill="#1F2937" />
      <circle cx="95" cy="122" r="3" fill="#FFFFFF" />
      <circle cx="151" cy="122" r="3" fill="#FFFFFF" />
      <circle cx="89" cy="129" r="1.6" fill="#FFFFFF" />
      <circle cx="145" cy="129" r="1.6" fill="#FFFFFF" />
    </>
  );
}

function Nose() {
  return (
    <>
      <ellipse cx="120" cy="155" rx="22" ry="17" fill="#1F2937" />
      <ellipse cx="113" cy="148" rx="5" ry="3" fill="#3D4855" />
    </>
  );
}

function Mouth({ variant }: { variant: MascotVariant }) {
  if (variant === "happy") {
    return (
      <path
        d="M 100 178 Q 120 196 140 178"
        stroke="#1F2937"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="#1F2937"
        fillOpacity="0.15"
      />
    );
  }

  if (variant === "sad") {
    return (
      <path
        d="M 102 184 Q 120 174 138 184"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  if (variant === "thinking") {
    return (
      <path
        d="M 108 180 L 132 180"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  if (variant === "sleeping") {
    return (
      <ellipse
        cx="120"
        cy="182"
        rx="6"
        ry="4"
        fill="#1F2937"
        opacity="0.85"
      />
    );
  }

  return (
    <>
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
    </>
  );
}

function Flag({ variant, animated }: { variant: MascotVariant; animated: boolean }) {
  const dim = variant === "sad" || variant === "sleeping";
  return (
    <g className={cn(animated && !dim && "animate-flag-wave")}>
      <path d="M 80 64 L 160 64 L 156 78 L 84 78 Z" fill="#1F2937" />
      <rect x="68" y="56" width="104" height="10" rx="2" fill="#009C3B" />
      <rect
        x="68"
        y="56"
        width="104"
        height="2"
        rx="1"
        fill="#00C44A"
        opacity={dim ? 0.5 : 1}
      />
      <circle cx="120" cy="61" r="2.5" fill="#FFDF00" />
    </g>
  );
}

function Accent({ variant, animated }: { variant: MascotVariant; animated: boolean }) {
  if (variant === "idle") {
    return (
      <>
        <path
          d="M 120 61 Q 145 72 165 84"
          stroke="#FFDF00"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="166" cy="86" r="5" fill="#FFDF00" />
        <line x1="165" y1="90" x2="163" y2="98" stroke="#E5C700" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="167" y1="90" x2="167" y2="99" stroke="#E5C700" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="168" y1="90" x2="170" y2="98" stroke="#E5C700" strokeWidth="2.2" strokeLinecap="round" />
      </>
    );
  }

  if (variant === "happy") {
    return (
      <>
        <Star cx={36} cy={50} size={6}  delayMs={0}    animated={animated} />
        <Star cx={210} cy={48} size={7} delayMs={200}  animated={animated} />
        <Star cx={28} cy={130} size={5} delayMs={500}  animated={animated} />
        <Star cx={216} cy={138} size={6} delayMs={800} animated={animated} />
        <Star cx={200} cy={90} size={4}  delayMs={1100} animated={animated} />
      </>
    );
  }

  if (variant === "sad") {
    return (
      <g className={cn(animated && "animate-tear-drop")} style={{ transformOrigin: "92px 138px" }}>
        <path
          d="M 92 138 Q 90 150 92 156 Q 94 150 92 138 Z"
          fill="#5BA8E0"
          opacity="0.85"
        />
        <ellipse cx="92" cy="156" rx="3" ry="3.5" fill="#5BA8E0" opacity="0.85" />
      </g>
    );
  }

  if (variant === "thinking") {
    return (
      <>
        <circle cx="195" cy="60" r="3" fill="#1F2937" opacity="0.55" />
        <circle cx="208" cy="48" r="4.5" fill="#1F2937" opacity="0.7" />
        <g
          transform="translate(218 28)"
          className={cn(animated && "animate-question-bounce")}
          style={{ transformOrigin: "0 0" }}
        >
          <circle r="14" fill="#FFF" stroke="#1F2937" strokeWidth="2.5" />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui"
            fontSize="16"
            fontWeight="700"
            fill="#1F2937"
          >
            ?
          </text>
        </g>
      </>
    );
  }

  if (variant === "sleeping") {
    return (
      <>
        <ZLetter x={186} y={78} size={12} opacity={0.85} delayMs={0}    animated={animated} />
        <ZLetter x={205} y={56} size={16} opacity={0.95} delayMs={1100} animated={animated} />
        <ZLetter x={228} y={32} size={20} opacity={1}    delayMs={2200} animated={animated} />
      </>
    );
  }

  return null;
}

function Star({
  cx,
  cy,
  size,
  delayMs,
  animated,
}: {
  cx: number;
  cy: number;
  size: number;
  delayMs: number;
  animated: boolean;
}) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size / 2.4;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return (
    <polygon
      points={points.join(" ")}
      fill="#FFDF00"
      className={cn(animated && "animate-twinkle")}
      style={{
        transformOrigin: `${cx}px ${cy}px`,
        animationDelay: `${delayMs}ms`,
      }}
    />
  );
}

function ZLetter({
  x,
  y,
  size,
  opacity,
  delayMs,
  animated,
}: {
  x: number;
  y: number;
  size: number;
  opacity: number;
  delayMs: number;
  animated: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily="ui-sans-serif, system-ui"
      fontSize={size}
      fontWeight="800"
      fill="#1F2937"
      opacity={opacity}
      className={cn(animated && "animate-zzz-float")}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      Z
    </text>
  );
}
