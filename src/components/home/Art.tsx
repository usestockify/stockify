import { getT } from "@/i18n/server";
import { BRAND } from "@/lib/brand";

/* Technical vector art used inside the hatched frames on the home page. Labels come from the `home` namespace (`art.*`). */

function Grid({ color = "var(--seafoam)", size = 24, opacity = 0.35 }: { color?: string; size?: number; opacity?: number }) {
  const lines = [];
  for (let x = 0; x <= 600; x += size) lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={400} />);
  for (let y = 0; y <= 400; y += size) lines.push(<line key={`h${y}`} x1={0} y1={y} x2={600} y2={y} />);
  return (
    <g stroke={color} strokeWidth="0.6" opacity={opacity}>
      {lines}
    </g>
  );
}

/** STEP 01: USDG routed into a single stock-token market. */
export async function DepositArt() {
  const t = await getT("home");
  return (
    <svg viewBox="0 0 600 400" className="home-art" aria-hidden="true">
      <rect width="600" height="400" fill="var(--slate)" />
      <Grid color="var(--seafoam)" size={30} opacity={0.14} />
      <g fill="none" stroke="var(--seafoam)" strokeWidth="1.2">
        <path d="M60 200 C 160 200, 160 120, 260 120 L 340 120" className="g-marching" />
        <path d="M60 200 C 160 200, 160 280, 260 280 L 340 280" className="g-marching" />
        <path d="M400 120 C 460 120, 460 200, 520 200" />
        <path d="M400 280 C 460 280, 460 200, 520 200" />
      </g>
      <g fontFamily="var(--font-mono), monospace" fontSize="11" fill="var(--seafoam)" letterSpacing="1">
        <rect x="20" y="182" width="80" height="36" fill="var(--green)" />
        <text x="60" y="205" textAnchor="middle" fill="var(--fog)" fontWeight="700">
          USDG
        </text>
        <rect x="340" y="102" width="60" height="36" fill="var(--ice)" />
        <text x="370" y="125" textAnchor="middle" fill="var(--slate)" fontWeight="700">
          {t("art.deposit.stock")}
        </text>
        <rect x="340" y="262" width="60" height="36" fill="var(--seafoam)" />
        <text x="370" y="285" textAnchor="middle" fill="var(--slate)" fontWeight="700">
          USDG
        </text>
        <text x="200" y="108" textAnchor="middle" fill="var(--lime)">
          {t("art.deposit.swap")}
        </text>
        <text x="200" y="312" textAnchor="middle" fill="var(--lime)">
          {t("art.deposit.keep")}
        </text>
      </g>
      <g transform="translate(520 200)">
        <circle r="46" fill="var(--green)" opacity="0.22" />
        <circle r="46" fill="none" stroke="var(--seafoam)" strokeWidth="1.2" strokeDasharray="4 4" className="g-marching" />
        <g stroke="var(--ice)" strokeWidth="0.8" fill="none" opacity="0.8">
          <ellipse rx="46" ry="16" />
          <ellipse rx="46" ry="30" />
          <ellipse rx="16" ry="46" />
          <ellipse rx="30" ry="46" />
        </g>
        <text y="70" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="11" fill="var(--seafoam)" letterSpacing="1">
          {t("art.deposit.pool")}
        </text>
      </g>
      <g fill="var(--lime)">
        <rect x="336" y="98" width="6" height="6" />
        <rect x="396" y="132" width="6" height="6" />
        <rect x="336" y="292" width="6" height="6" />
        <rect x="396" y="258" width="6" height="6" />
      </g>
    </svg>
  );
}

/** STEP 02: liquidity held between authored price bounds. */
export async function RangeArt() {
  const t = await getT("home");
  return (
    <svg viewBox="0 0 600 400" className="home-art" aria-hidden="true">
      <rect width="600" height="400" fill="var(--slate)" />
      <Grid color="var(--seafoam)" size={24} opacity={0.16} />
      <g transform="translate(70 50)" fill="none">
        <ellipse cx="230" cy="160" rx="210" ry="78" stroke="var(--seafoam)" strokeWidth="1" opacity="0.45" />
        <ellipse cx="230" cy="160" rx="148" ry="52" stroke="var(--lime)" strokeWidth="1.4" strokeDasharray="5 5" className="g-marching" />
        <ellipse cx="230" cy="160" rx="86" ry="28" stroke="var(--seafoam)" strokeWidth="1" />
        <line x1="230" y1="20" x2="230" y2="300" stroke="var(--ice)" strokeWidth="1.2" />
        <path d="M20 160 H 440" stroke="var(--seafoam)" strokeWidth="1" opacity="0.7" />
        <g fontFamily="var(--font-mono), monospace" fontSize="11" letterSpacing="1">
          <text x="82" y="160" textAnchor="middle" fill="var(--seafoam)" dy="28">
            {t("art.range.lower")}
          </text>
          <text x="378" y="160" textAnchor="middle" fill="var(--seafoam)" dy="28">
            {t("art.range.upper")}
          </text>
          <text x="230" y="12" textAnchor="middle" fill="var(--ice)">
            {t("art.range.oracle")}
          </text>
          <text x="440" y="154" textAnchor="end" fill="var(--lime)" opacity="0.85">
            {t("art.range.liquidity")}
          </text>
        </g>
        <g fill="var(--lime)">
          <rect x="78" y="128" width="8" height="8" />
          <rect x="374" y="128" width="8" height="8" />
          <rect x="226" y="16" width="8" height="8" />
        </g>
      </g>
    </svg>
  );
}

/** STEP 03: fees observed while capital sits in range. */
export async function FeeSplitArt() {
  const t = await getT("home");
  return (
    <svg viewBox="0 0 600 400" className="home-art" aria-hidden="true">
      <rect width="600" height="400" fill="var(--slate)" />
      <Grid color="var(--seafoam)" size={30} opacity={0.12} />
      <g fill="none" stroke="var(--ice)" strokeWidth="0.9" opacity="0.8" transform="translate(300 200)">
        {[0, 20, 40, 60, 80, 100, 120, 140, 160].map((deg) => (
          <ellipse key={deg} rx="150" ry="52" transform={`rotate(${deg})`} />
        ))}
        <circle r="150" strokeDasharray="4 6" />
      </g>
      <g fontFamily="var(--font-mono), monospace" fontSize="11" letterSpacing="1">
        <rect x="80" y="70" width="140" height="44" fill="var(--green)" />
        <text x="150" y="97" textAnchor="middle" fill="var(--fog)" fontWeight="700">
          {t("art.split.compounds")}
        </text>
        <rect x="380" y="70" width="140" height="44" fill="var(--ice)" />
        <text x="450" y="97" textAnchor="middle" fill="var(--slate)" fontWeight="700">
          {t("art.split.observe")}
        </text>
        <rect x="230" y="300" width="140" height="44" fill="var(--seafoam)" />
        <text x="300" y="327" textAnchor="middle" fill="var(--slate)" fontWeight="700">
          {t("art.split.range")}
        </text>
        <text x="300" y="206" textAnchor="middle" fill="var(--seafoam)" fontSize="13">
          {t("art.split.claimed")}
        </text>
      </g>
      <g fill="none" stroke="var(--seafoam)" strokeWidth="1.2" strokeDasharray="5 5" className="g-marching">
        <path d="M300 170 L 150 114" />
        <path d="M300 170 L 450 114" />
        <path d="M300 230 L 300 300" />
      </g>
      <g fill="var(--lime)">
        <rect x="296" y="166" width="8" height="8" />
      </g>
    </svg>
  );
}

/** Coming-soon art: one USDG amount across stock vaults. */
export async function LendingArt() {
  const t = await getT("home");
  return (
    <svg viewBox="0 0 600 400" className="home-art" aria-hidden="true">
      <rect width="600" height="400" fill="var(--fog)" />
      <Grid color="var(--green)" size={24} opacity={0.14} />
      <g fill="none" stroke="var(--green)" strokeWidth="0.9" opacity="0.7">
        <g transform="translate(200 200)">
          {[0, 30, 60, 90, 120, 150].map((d) => (
            <ellipse key={d} rx="120" ry="40" transform={`rotate(${d})`} />
          ))}
        </g>
        <g transform="translate(400 200)">
          {[0, 30, 60, 90, 120, 150].map((d) => (
            <ellipse key={d} rx="120" ry="40" transform={`rotate(${d})`} />
          ))}
        </g>
      </g>
      <g fontFamily="var(--font-mono), monospace" fontSize="11" letterSpacing="1" fill="var(--slate)">
        <rect x="150" y="60" width="100" height="30" fill="var(--ice)" />
        <text x="200" y="80" textAnchor="middle" fontWeight="700">
          {t("art.lending.collateral")}
        </text>
        <rect x="350" y="310" width="100" height="30" fill="var(--green)" />
        <text x="400" y="330" textAnchor="middle" fontWeight="700" fill="var(--fog)">
          {t("art.lending.borrow")}
        </text>
        <text x="300" y="205" textAnchor="middle" fill="var(--green)" fontSize="12">
          {t("art.lending.params")}
        </text>
      </g>
      <g fill="var(--green)">
        <rect x="286" y="150" width="10" height="10" />
        <rect x="330" y="236" width="10" height="10" />
        <rect x="250" y="250" width="10" height="10" />
      </g>
    </svg>
  );
}

/** Closing plate: market field with a range reading, no invented figures. */
export async function CtaArt() {
  const t = await getT("home");
  const nodes = [
    [300, 30],
    [80, 100],
    [520, 100],
    [80, 330],
    [520, 330],
    [300, 400],
  ];
  return (
    <svg viewBox="0 0 600 440" className="home-cta-art" aria-hidden="true">
      <g fill="none" stroke="var(--seafoam)" strokeWidth="1" strokeDasharray="4 5" opacity="0.7">
        {nodes.map(([x, y], i) => (
          <line key={i} x1="300" y1="215" x2={x} y2={y} />
        ))}
        <polygon points="300,30 520,100 520,330 300,400 80,330 80,100" />
      </g>
      {nodes.map(([x, y], i) => (
        <g key={i} transform={`translate(${x - 30} ${y - 22})`}>
          <rect width="60" height="8" fill="var(--ice)" />
          <rect y="11" width="60" height="8" fill="var(--green)" />
          <rect y="22" width="60" height="8" fill="var(--seafoam)" />
          <text x="30" y="44" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="10" letterSpacing="1.5" fill="var(--fog)">
            {t("art.cta.fees")}
          </text>
        </g>
      ))}
      <g transform="translate(150 130)">
        <rect width="300" height="170" fill="var(--fog)" />
        <text x="12" y="22" fontFamily="var(--font-mono), monospace" fontSize="10" fill="var(--slate)" opacity="0.6">
          NVDA / USDG
        </text>
        <rect x="0" y="32" width="300" height="20" fill="var(--ice)" />
        <text x="24" y="46" fontFamily="var(--font-mono), monospace" fontSize="10" fill="var(--slate)">
          {t("art.cta.lower")}
        </text>
        <rect x="0" y="54" width="300" height="20" fill="var(--seafoam)" />
        <text x="24" y="68" fontFamily="var(--font-mono), monospace" fontSize="10" fill="var(--slate)">
          {t("art.cta.current")}
        </text>
        <rect x="0" y="76" width="300" height="20" fill="var(--seafoam)" />
        <text x="24" y="90" fontFamily="var(--font-mono), monospace" fontSize="10" fill="var(--slate)">
          {t("art.cta.upper")}
        </text>
        <g transform="translate(12 118)">
          <rect x="0" y="0" width="12" height="12" fill="none" stroke="var(--green)" strokeDasharray="2 2" />
          <text x="22" y="10" fontFamily="var(--font-sans), sans-serif" fontSize="10" fontWeight="700" fill="var(--slate)">
            {BRAND.name}
          </text>
        </g>
        <text x="12" y="150" fontFamily="var(--font-sans), sans-serif" fontSize="10" fill="var(--slate)">
          {t("art.cta.comment")}
        </text>
      </g>
    </svg>
  );
}
