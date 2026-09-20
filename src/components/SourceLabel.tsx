export type DataSourceKind = "ROBINHOOD API" | "ONCHAIN" | "PONS CURVE" | "UNISWAP V4" | "KYBER" | "PONS V2" | "BLOCKSCOUT" | "KYBERSWAP";

export function SourceLabel({ source }: { source: DataSourceKind }) {
  return <span className="source-label">{source}</span>;
}
