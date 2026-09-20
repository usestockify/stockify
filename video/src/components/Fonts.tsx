import { continueRender, delayRender, staticFile } from "remotion";
import { useEffect, useState } from "react";

const FACES: Array<[string, string, string]> = [
  ["Instrument Sans", "fonts/instrument-sans.woff2", "400 700"],
  ["DM Sans", "fonts/dm-sans.woff2", "100 1000"],
  ["IBM Plex Mono", "fonts/ibm-plex-mono.woff2", "400"],
];

export function Fonts() {
  const [handle] = useState(() => delayRender("stockify-fonts"));
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await Promise.all(
          FACES.map(async ([family, file, weight]) => {
            const face = new FontFace(family, `url(${staticFile(file)})`, { weight, display: "swap" });
            const loaded = await face.load();
            document.fonts.add(loaded);
          }),
        );
        await document.fonts.ready;
      } catch {
        // Fall back to system fonts if a file is missing.
      } finally {
        if (!cancelled) continueRender(handle);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [handle]);
  return null;
}
