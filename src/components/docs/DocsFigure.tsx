import type { ReactNode } from "react";
import styles from "@/styles/docs.module.css";

/** Hatched picture frame used around every docs illustration. Same furniture as home. */
export function DocsFigure({
  n,
  caption,
  children,
}: {
  n: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className={styles.figure}>
      <div className="g-frame" style={{ color: "var(--slate)" }}>
        <div className="div-hatch" />
        <div className="g-frame-row">
          <div className="div-hatch-v" />
          <div className="g-frame-body">
            <div className="g-frame-img">{children}</div>
          </div>
          <div className="div-hatch-v" />
        </div>
        <div className="div-hatch" />
      </div>
      <figcaption className="g-frame-caption">
        <span className="g-label-xs">{`FIG. ${n}`}</span>
        <p className="g-body">{caption}</p>
      </figcaption>
    </figure>
  );
}
