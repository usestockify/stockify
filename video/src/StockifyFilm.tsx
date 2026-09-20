import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Scene01 } from "./scenes/S01";
import { Scene02 } from "./scenes/S02";
import { Scene03 } from "./scenes/S03";
import { Scene04 } from "./scenes/S04";
import { Scene05 } from "./scenes/S05";
import { Scene06 } from "./scenes/S06";
import { Scene07 } from "./scenes/S07";
import { Scene08 } from "./scenes/S08";
import { Scene09 } from "./scenes/S09";
import { Scene10 } from "./scenes/S10";
import { Fonts } from "./components/Fonts";
import { Canvas } from "./components/Canvas";

/**
 * 40.0s editorial product film.
 * UI is isolated into fragments. Type leads. Blur is focus.
 */
export const StockifyFilm = () => {
  return (
    <AbsoluteFill>
      <Fonts />
      <Canvas />
      <Audio src={staticFile("audio/score.wav")} />
      <Sequence from={0} durationInFrames={128} name="01 headline">
        <Scene01 duration={128} />
      </Sequence>
      <Sequence from={118} durationInFrames={128} name="02 markets">
        <Scene02 duration={128} />
      </Sequence>
      <Sequence from={236} durationInFrames={128} name="03 nvda">
        <Scene03 duration={128} />
      </Sequence>
      <Sequence from={354} durationInFrames={156} name="04 supply">
        <Scene04 duration={156} />
      </Sequence>
      <Sequence from={500} durationInFrames={156} name="05 range">
        <Scene05 duration={156} />
      </Sequence>
      <Sequence from={646} durationInFrames={128} name="06 trade">
        <Scene06 duration={128} />
      </Sequence>
      <Sequence from={764} durationInFrames={128} name="07 portfolio">
        <Scene07 duration={128} />
      </Sequence>
      <Sequence from={882} durationInFrames={128} name="08 infrastructure">
        <Scene08 duration={128} />
      </Sequence>
      <Sequence from={1000} durationInFrames={100} name="09 home">
        <Scene09 duration={100} />
      </Sequence>
      <Sequence from={1090} durationInFrames={110} name="10 mark">
        <Scene10 duration={110} />
      </Sequence>
    </AbsoluteFill>
  );
};
