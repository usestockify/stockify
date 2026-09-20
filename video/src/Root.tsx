import { Composition } from "remotion";
import { StockifyFilm } from "./StockifyFilm";
import { DURATION_FRAMES, FPS, HEIGHT, WIDTH } from "./motion";

export const Root = () => {
  return (
    <Composition
      id="StockifyFilm"
      component={StockifyFilm}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
