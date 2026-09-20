import { Box, Micro, Pinwheel, Plate, Route, Tick } from "./DocsPlate";

export function OverviewArt() {
  const markets = [
    { y: 68, label: "NVDA" },
    { y: 124, label: "AAPL" },
    { y: 180, label: "TSLA" },
    { y: 236, label: "META" },
    { y: 292, label: "MSFT" },
  ];
  return (
    <Plate label="FIG. 01 · LIQUIDITY LAYER">
      <Box x={28} y={172} w={88} h={40} label="USDG" />
      <Route d="M116 192 C 170 192, 170 192, 214 192" marching />
      <g transform="translate(268 192)">
        <circle r="46" fill="var(--green)" opacity="0.12" />
        <circle r="46" fill="none" stroke="var(--green)" strokeWidth="1.1" strokeDasharray="4 4" className="g-marching" />
        <Pinwheel x={0} y={0} r={22} />
      </g>
      <Micro x={268} y={258} anchor="middle" fill="var(--green)">
        STOCKIFY
      </Micro>
      {markets.map((m) => (
        <g key={m.label}>
          <Route d={`M314 192 C 370 192, 370 ${m.y + 16}, 428 ${m.y + 16}`} />
          <Box x={428} y={m.y} w={92} h={32} fill="var(--ice)" color="var(--slate)" label={m.label} sub="USDG" />
          <Tick x={428} y={m.y + 16} fill="var(--green)" />
        </g>
      ))}
      <Micro x={28} y={232} fill="var(--slate)">
        QUOTE
      </Micro>
      <Micro x={428} y={340} fill="var(--slate)">
        TOKENIZED STOCK MARKETS
      </Micro>
      <Tick x={116} y={192} />
      <Tick x={314} y={192} />
    </Plate>
  );
}

export function MarketsArt() {
  const left: string[] = [];
  const right: [number, number][] = [];
  for (let y = 52; y <= 252; y += 3) {
    const w = 8 + 52 * Math.exp(-(((y - 152) / 44) ** 2));
    left.push(`${118 - w},${y}`);
    right.push([118 + w, y]);
  }
  const band = `M${left[0]} L${left.slice(1).join(" ")} L${right
    .slice()
    .reverse()
    .map(([x, y]) => `${x},${y}`)
    .join(" ")} Z`;
  return (
    <Plate label="FIG. 02 · MARKET ARCHITECTURE">
      <Box x={28} y={168} w={92} h={40} label="USDG" />
      <Route d="M120 188 H 196" marching />
      <Micro x={158} y={176} anchor="middle" fill="var(--green)" size={9}>
        PAIR
      </Micro>
      <Box x={196} y={168} w={124} h={40} fill="var(--ice)" color="var(--slate)" label="NVDA" sub="STOCK TOKEN" />
      <g transform="translate(348 48)">
        <Micro x={4} y={56} fill="var(--slate)">
          UPPER
        </Micro>
        <Micro x={4} y={156} fill="var(--green)">
          CURRENT
        </Micro>
        <Micro x={4} y={256} fill="var(--slate)">
          LOWER
        </Micro>
        <line x1="72" y1="28" x2="72" y2="276" stroke="var(--slate)" strokeWidth="1" opacity="0.35" />
        <line x1="72" y1="52" x2="220" y2="52" stroke="var(--slate)" strokeWidth="1" strokeDasharray="4 4" opacity="0.45" />
        <line x1="72" y1="152" x2="220" y2="152" stroke="var(--green)" strokeWidth="1.3" className="g-marching" strokeDasharray="5 5" />
        <line x1="72" y1="252" x2="220" y2="252" stroke="var(--slate)" strokeWidth="1" strokeDasharray="4 4" opacity="0.45" />
        <path d={band} fill="var(--seafoam)" opacity="0.55" />
        <path d={band} fill="none" stroke="var(--green)" strokeWidth="1.15" />
        <Micro x={118} y={288} anchor="middle" fill="var(--green)">
          RANGE
        </Micro>
        <Tick x={72} y={52} />
        <Tick x={72} y={152} fill="var(--lime)" />
        <Tick x={72} y={252} />
      </g>
      <Micro x={28} y={228} fill="var(--slate)">
        LIQUIDITY CONCENTRATION
      </Micro>
    </Plate>
  );
}

export function VaultsArt() {
  return (
    <Plate label="FIG. 03 · STOCK VAULT">
      <Box x={20} y={156} w={88} h={44} label="USER" fill="var(--bg)" color="var(--slate)" stroke="var(--slate)" />
      <Route d="M108 178 H 140" marching />
      <Box x={140} y={156} w={100} h={44} label="USDG" sub="DEPOSIT" />
      <Route d="M240 178 H 272" />
      <Box x={272} y={148} w={116} h={60} fill="var(--ice)" color="var(--slate)" label="NVDA VAULT" sub="POSITION" />
      <Route d="M388 178 H 420" />
      <Box x={420} y={156} w={160} h={44} fill="var(--green)" color="var(--fog)" label="NVDA / USDG" sub="MARKET" />
      <Route d="M330 208 V 252" />
      <Box x={246} y={252} w={168} h={40} fill="var(--seafoam)" color="var(--slate)" label="VAULT SHARES" sub="USER POSITION" />
      <Route d="M500 200 V 252" />
      <Box x={430} y={252} w={140} h={40} fill="var(--lime)" color="var(--slate)" label="FEES ACCRUE" sub="IF IN RANGE" />
      <Micro x={20} y={220} fill="var(--slate)">
        01 DEPOSIT
      </Micro>
      <Micro x={272} y={132} fill="var(--green)">
        02 LIQUIDITY
      </Micro>
      <Micro x={420} y={140} fill="var(--slate)">
        03 MARKET
      </Micro>
      <Tick x={108} y={178} />
      <Tick x={240} y={178} />
      <Tick x={388} y={178} />
      <Tick x={330} y={252} />
    </Plate>
  );
}

export function UsdgHubArt() {
  const spokes = [
    { label: "NVDA", x: 300, y: 52 },
    { label: "AAPL", x: 478, y: 118 },
    { label: "TSLA", x: 478, y: 246 },
    { label: "META", x: 300, y: 312 },
    { label: "SPY", x: 122, y: 246 },
    { label: "QQQ", x: 122, y: 118 },
  ];
  return (
    <Plate label="FIG. 04 · USDG HUB">
      {spokes.map((s) => (
        <g key={s.label}>
          <Route d={`M300 182 L ${s.x} ${s.y + 16}`} marching={s.label === "NVDA"} />
          <Box x={s.x - 40} y={s.y} w={80} h={32} fill="var(--ice)" color="var(--slate)" label={s.label} />
        </g>
      ))}
      <circle cx="300" cy="182" r="52" fill="var(--green)" opacity="0.14" />
      <circle cx="300" cy="182" r="52" fill="none" stroke="var(--green)" strokeWidth="1.15" strokeDasharray="4 4" className="g-marching" />
      <Box x={258} y={162} w={84} h={40} label="USDG" />
      <Micro x={300} y={236} anchor="middle" fill="var(--green)">
        COMMON QUOTE
      </Micro>
      <Tick x={300} y={182} fill="var(--lime)" />
    </Plate>
  );
}

export function StocksArt() {
  const rows = [
    { co: "NVIDIA", t: "NVDA", pair: "NVDA / USDG" },
    { co: "APPLE", t: "AAPL", pair: "AAPL / USDG" },
    { co: "TESLA", t: "TSLA", pair: "TSLA / USDG" },
  ];
  return (
    <Plate label="FIG. 05 · STOCK TOKEN REGISTRY">
      <g>
        <line x1="36" y1="86" x2="564" y2="86" stroke="var(--slate)" strokeWidth="1" opacity="0.35" />
        <Micro x={48} y={76} fill="var(--green)">
          COMPANY
        </Micro>
        <Micro x={220} y={76} fill="var(--green)">
          TICKER
        </Micro>
        <Micro x={330} y={76} fill="var(--green)">
          TOKEN
        </Micro>
        <Micro x={460} y={76} fill="var(--green)">
          USDG PAIR
        </Micro>
        {rows.map((r, i) => {
          const y = 118 + i * 72;
          return (
            <g key={r.t}>
              <line x1="36" y1={y + 28} x2="564" y2={y + 28} stroke="var(--slate)" strokeWidth="0.8" opacity="0.18" />
              <Micro x={48} y={y} fill="var(--slate)" size={12}>
                {r.co}
              </Micro>
              <Box x={208} y={y - 18} w={72} h={28} fill="var(--ice)" color="var(--slate)" label={r.t} />
              <Micro x={330} y={y} fill="var(--slate)">
                STOCK TOKEN
              </Micro>
              <Micro x={460} y={y} fill="var(--green)">
                {r.pair}
              </Micro>
              <Tick x={36} y={y - 4} />
            </g>
          );
        })}
      </g>
      <Micro x={36} y={348} fill="var(--slate)">
        LISTING IS NOT A LIVE MARKET
      </Micro>
    </Plate>
  );
}

export function DepositArt() {
  const steps = [
    { n: "01", label: "CONNECT", sub: "WALLET", x: 28, y: 96 },
    { n: "02", label: "SELECT", sub: "STOCK VAULT", x: 220, y: 96 },
    { n: "03", label: "ENTER", sub: "USDG", x: 412, y: 96 },
    { n: "04", label: "APPROVE", sub: "USDG", x: 412, y: 232 },
    { n: "05", label: "DEPOSIT", sub: "TO VAULT", x: 220, y: 232 },
    { n: "06", label: "RECEIVE", sub: "VAULT SHARES", x: 28, y: 232 },
  ];
  return (
    <Plate label="FIG. 06 · DEPOSIT SEQUENCE">
      <Route d="M116 124 H 220" marching />
      <Route d="M308 124 H 412" />
      <Route d="M456 148 V 232" />
      <Route d="M412 260 H 308" />
      <Route d="M220 260 H 116" marching />
      {steps.map((s) => (
        <g key={s.n}>
          <circle cx={s.x + 20} cy={s.y - 18} r="12" fill="none" stroke="var(--green)" strokeWidth="1" />
          <Micro x={s.x + 20} y={s.y - 14} anchor="middle" fill="var(--green)" size={9}>
            {s.n}
          </Micro>
          <Box
            x={s.x}
            y={s.y}
            w={160}
            h={44}
            label={s.label}
            sub={s.sub}
            fill={s.n === "06" ? "var(--green)" : "var(--ice)"}
            color={s.n === "06" ? "var(--fog)" : "var(--slate)"}
          />
        </g>
      ))}
    </Plate>
  );
}

export function SharesArt() {
  return (
    <Plate label="FIG. 07 · VAULT SHARES">
      <Box x={236} y={48} w={128} h={40} label="USDG" sub="DEPOSIT" />
      <Route d="M300 88 V 128" marching />
      <Box x={214} y={128} w={172} h={52} fill="var(--ice)" color="var(--slate)" label="NVDA VAULT" sub="HOLDINGS MIX" />
      <Route d="M300 180 V 220" />
      <Box x={214} y={220} w={172} h={52} label="VAULT SHARES" sub="PROPORTIONAL CLAIM" />
      <g fill="none" stroke="var(--slate)" strokeWidth="0.9" opacity="0.45">
        <rect x="52" y="128" width="120" height="144" />
        <line x1="52" y1="176" x2="172" y2="176" />
        <line x1="52" y1="224" x2="172" y2="224" />
      </g>
      <Micro x={112} y={158} anchor="middle" fill="var(--slate)">
        USDG LEG
      </Micro>
      <Micro x={112} y={206} anchor="middle" fill="var(--green)">
        STOCK LEG
      </Micro>
      <Micro x={112} y={254} anchor="middle" fill="var(--slate)">
        FEES OBSERVED
      </Micro>
      <Micro x={428} y={148} fill="var(--slate)">
        NOT USDG
      </Micro>
      <Micro x={428} y={172} fill="var(--slate)">
        NOT FIXED PRICE
      </Micro>
      <Micro x={428} y={196} fill="var(--green)">
        NO PRINCIPAL PROTECTION
      </Micro>
      <Tick x={300} y={88} />
      <Tick x={300} y={180} />
      <Tick x={300} y={220} />
    </Plate>
  );
}

export function RangeArt() {
  const left: string[] = [];
  const right: [number, number][] = [];
  for (let y = 72; y <= 328; y += 4) {
    const w = 4 + 108 * Math.exp(-(((y - 200) / 58) ** 2));
    left.push(`${300 - w},${y}`);
    right.push([300 + w, y]);
  }
  const band = `M${left[0]} L${left.slice(1).join(" ")} L${right
    .slice()
    .reverse()
    .map(([x, y]) => `${x},${y}`)
    .join(" ")} Z`;
  return (
    <Plate label="FIG. 09 · LIQUIDITY RANGE">
      <line x1="160" y1="72" x2="520" y2="72" stroke="var(--slate)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      <line x1="160" y1="200" x2="520" y2="200" stroke="var(--green)" strokeWidth="1.35" strokeDasharray="6 5" className="g-marching" />
      <line x1="160" y1="328" x2="520" y2="328" stroke="var(--slate)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      <path d={band} fill="var(--seafoam)" opacity="0.55" />
      <path d={band} fill="none" stroke="var(--green)" strokeWidth="1.15" />
      <ellipse cx="300" cy="200" rx="86" ry="18" fill="none" stroke="var(--green)" strokeWidth="0.9" opacity="0.5" />
      <ellipse cx="300" cy="200" rx="48" ry="10" fill="var(--lime)" opacity="0.6" />
      <Micro x={48} y={76} fill="var(--slate)">
        UPPER
      </Micro>
      <Micro x={48} y={204} fill="var(--green)">
        CURRENT
      </Micro>
      <Micro x={48} y={332} fill="var(--slate)">
        LOWER
      </Micro>
      <Micro x={430} y={196} fill="var(--green)">
        CONCENTRATION
      </Micro>
      <Micro x={160} y={56} fill="var(--slate)">
        IN RANGE WHEN CURRENT SITS BETWEEN BOUNDS
      </Micro>
      <Tick x={160} y={72} />
      <Tick x={160} y={200} fill="var(--lime)" />
      <Tick x={160} y={328} />
    </Plate>
  );
}

export function FeesArt() {
  return (
    <Plate label="FIG. 10 · FEE FLOW">
      <Box x={24} y={160} w={128} h={48} fill="var(--ice)" color="var(--slate)" label="TRADING" sub="ACTIVITY" />
      <Route d="M152 184 H 196" marching />
      <Box x={196} y={160} w={128} h={48} label="MARKET FEES" sub="OBSERVED" />
      <Route d="M324 184 H 368" />
      <Box x={368} y={160} w={88} h={48} fill="var(--ice)" color="var(--slate)" label="VAULT" />
      <Route d="M456 184 H 500" />
      <Box x={500} y={148} w={76} h={72} fill="var(--seafoam)" color="var(--slate)" label="ACCT" sub="BOOK" />
      <Micro x={24} y={232} fill="var(--slate)">
        NOT A FORECAST
      </Micro>
      <Micro x={196} y={232} fill="var(--green)">
        NO GUARANTEED YIELD
      </Micro>
      <Micro x={368} y={232} fill="var(--slate)">
        REFLECTED WHEN LIVE
      </Micro>
      <Tick x={152} y={184} />
      <Tick x={324} y={184} />
      <Tick x={456} y={184} />
    </Plate>
  );
}

export function WithdrawArt() {
  return (
    <Plate label="FIG. 08 · WITHDRAWAL">
      <Box x={20} y={156} w={120} h={48} label="SHARES" sub="REDEEM" />
      <Route d="M140 180 H 176" marching />
      <Box x={176} y={156} w={120} h={48} fill="var(--ice)" color="var(--slate)" label="REQUEST" sub="VAULT PAGE" />
      <Route d="M296 180 H 332" />
      <Box x={332} y={156} w={120} h={48} fill="var(--seafoam)" color="var(--slate)" label="ACCOUNTING" sub="VAULT MIX" />
      <Route d="M452 180 H 488" />
      <Box x={488} y={148} w={92} h={64} label="WALLET" sub="PROCEEDS" />
      <Route d="M392 204 V 268" />
      <Box x={248} y={268} w={108} h={36} fill="var(--ice)" color="var(--slate)" label="USDG" />
      <Box x={368} y={268} w={140} h={36} fill="var(--lime)" color="var(--slate)" label="STOCK TOKEN" />
      <Micro x={248} y={324} fill="var(--slate)">
        MIX FOLLOWS HOLDINGS · FULL USDG NOT GUARANTEED
      </Micro>
      <Tick x={140} y={180} />
      <Tick x={296} y={180} />
      <Tick x={452} y={180} />
      <Tick x={392} y={268} />
    </Plate>
  );
}

export function OracleArt() {
  return (
    <Plate label="FIG. 11 · PRICE REFERENCE">
      <Box x={28} y={160} w={140} h={48} fill="var(--bg)" color="var(--slate)" stroke="var(--slate)" label="PRICE ORACLE" sub="ADAPTER" />
      <Route d="M168 184 H 214" marching />
      <Box x={214} y={160} w={140} h={48} label="STOCKIFY" sub="MARKET" />
      <Route d="M354 184 H 400" />
      <Box x={400} y={148} w={172} h={40} fill="var(--ice)" color="var(--slate)" label="CURRENT PRICE" sub="REFERENCE" />
      <Route d="M486 188 V 236" />
      <Box x={400} y={236} w={172} h={48} fill="var(--seafoam)" color="var(--slate)" label="RANGE POSITION" sub="LOWER · CURRENT · UPPER" />
      <Micro x={28} y={232} fill="var(--slate)">
        PROVIDER UNPUBLISHED
      </Micro>
      <Micro x={214} y={232} fill="var(--green)">
        PRICE-DEPENDENT ACTIONS WAIT IF STALE
      </Micro>
      <Tick x={168} y={184} />
      <Tick x={354} y={184} />
      <Tick x={486} y={236} />
    </Plate>
  );
}

export function TradeArt() {
  const notes = [
    { n: "01", label: "QUOTE", x: 168 },
    { n: "02", label: "ROUTE", x: 268 },
    { n: "03", label: "SLIPPAGE", x: 368 },
    { n: "04", label: "CONFIRM", x: 468 },
  ];
  return (
    <Plate label="FIG. 13 · TRADE ROUTE">
      <Box x={28} y={168} w={92} h={40} label="USDG" />
      <Route d="M120 188 H 480" marching />
      <Box x={480} y={160} w={92} h={56} fill="var(--ice)" color="var(--slate)" label="NVDA" sub="TOKEN" />
      {notes.map((n) => (
        <g key={n.n}>
          <Tick x={n.x} y={188} fill="var(--lime)" />
          <circle cx={n.x} cy={188} r="5" fill="none" stroke="var(--green)" strokeWidth="1" />
          <Micro x={n.x} y={148} anchor="middle" fill="var(--green)" size={9}>
            {n.n}
          </Micro>
          <Micro x={n.x} y={228} anchor="middle" fill="var(--slate)">
            {n.label}
          </Micro>
        </g>
      ))}
      <Micro x={28} y={236} fill="var(--slate)">
        CONCEPTUAL LABELS · QUOTES REQUIRE A LIVE ROUTE
      </Micro>
    </Plate>
  );
}

export function PortfolioArt() {
  const arms = [
    { label: "USDG", sub: "BALANCE", x: 56, y: 72 },
    { label: "STOCK TOKENS", sub: "WALLET", x: 380, y: 72 },
    { label: "VAULT SHARES", sub: "POSITIONS", x: 56, y: 268 },
    { label: "FEES / ACTIVITY", sub: "ONCHAIN", x: 380, y: 268 },
  ];
  return (
    <Plate label="FIG. 12 · WALLET MAP">
      {arms.map((a) => (
        <g key={a.label}>
          <Route d={`M300 188 L ${a.x + 82} ${a.y + 24}`} />
          <Box x={a.x} y={a.y} w={164} h={48} fill="var(--ice)" color="var(--slate)" label={a.label} sub={a.sub} />
        </g>
      ))}
      <circle cx="300" cy="188" r="44" fill="var(--green)" opacity="0.12" />
      <circle cx="300" cy="188" r="44" fill="none" stroke="var(--green)" strokeWidth="1.15" strokeDasharray="4 4" className="g-marching" />
      <Box x={254} y={168} w={92} h={40} label="WALLET" />
      <Tick x={300} y={188} fill="var(--lime)" />
    </Plate>
  );
}

export function ContractsArt() {
  return (
    <Plate label="FIG. 14 · CONTRACT SURFACE">
      <Box x={214} y={36} w={172} h={32} fill="var(--bg)" color="var(--slate)" stroke="var(--slate)" label="FRONTEND" />
      <Route d="M300 68 V 92" marching />
      <Box x={214} y={92} w={172} h={32} label="ROUTER" />
      <Route d="M300 124 V 148" />
      <Box x={214} y={148} w={172} h={32} fill="var(--ice)" color="var(--slate)" label="VAULT FACTORY" />
      <Route d="M300 180 V 204" />
      <Box x={92} y={204} w={120} h={36} fill="var(--seafoam)" color="var(--slate)" label="NVDA VAULT" />
      <Box x={240} y={204} w={120} h={36} fill="var(--seafoam)" color="var(--slate)" label="AAPL VAULT" />
      <Box x={388} y={204} w={120} h={36} fill="var(--seafoam)" color="var(--slate)" label="TSLA VAULT" />
      <Route d="M152 240 V 268" />
      <Route d="M300 240 V 268" />
      <Route d="M448 240 V 268" />
      <Box x={92} y={268} w={416} h={32} label="STOCK MARKETS" />
      <Box x={28} y={92} w={132} h={32} fill="var(--lime)" color="var(--slate)" label="USDG" />
      <Route d="M160 108 H 214" />
      <Box x={440} y={92} w={132} h={32} fill="var(--lime)" color="var(--slate)" label="REGISTRY" />
      <Route d="M440 108 H 386" />
      <Box x={440} y={140} w={132} h={32} fill="var(--lime)" color="var(--slate)" label="ORACLE ADAPTER" />
      <Route d="M440 156 H 386" />
      <Micro x={28} y={340} fill="var(--slate)">
        ADDRESSES APPEAR ONLY WHEN CONFIGURED
      </Micro>
      <Tick x={300} y={68} />
      <Tick x={300} y={124} />
      <Tick x={300} y={180} />
    </Plate>
  );
}

export function RisksArt() {
  const nodes = [
    { label: "PRICE MOVE", x: 240, y: 48 },
    { label: "RANGE", x: 428, y: 120 },
    { label: "CONTRACTS", x: 388, y: 268 },
    { label: "ORACLE DATA", x: 92, y: 268 },
    { label: "LIQUIDITY", x: 52, y: 120 },
  ];
  return (
    <Plate label="FIG. 15 · RISK RELATIONS">
      {nodes.map((n) => (
        <g key={n.label}>
          <Route d={`M300 188 L ${n.x + 60} ${n.y + 18}`} />
          <Box x={n.x} y={n.y} w={120} h={36} fill="var(--ice)" color="var(--slate)" label={n.label} />
        </g>
      ))}
      <circle cx="300" cy="188" r="48" fill="var(--green)" opacity="0.1" />
      <circle cx="300" cy="188" r="48" fill="none" stroke="var(--green)" strokeWidth="1.1" />
      <Micro x={300} y={192} anchor="middle" fill="var(--green)">
        POSITION
      </Micro>
      <Micro x={36} y={348} fill="var(--slate)">
        FACTUAL RELATIONS · NO GUARANTEED OUTCOME
      </Micro>
    </Plate>
  );
}
