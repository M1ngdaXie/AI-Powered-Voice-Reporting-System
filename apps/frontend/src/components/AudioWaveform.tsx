import { useEffect, useRef } from "react";

interface Props {
  analyser: AnalyserNode;
}

const BAR_COUNT = 24;

export default function AudioWaveform({ analyser }: Props) {
  const barsRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      analyser.getByteFrequencyData(dataArray);
      const container = barsRef.current;
      if (!container) return;

      const step = Math.floor(dataArray.length / BAR_COUNT);
      const bars = container.children;
      for (let i = 0; i < BAR_COUNT; i++) {
        const value = dataArray[i * step] / 255;
        const height = Math.max(4, value * 48);
        (bars[i] as HTMLElement).style.height = `${height}px`;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser]);

  return (
    <div ref={barsRef} className="flex items-end justify-center gap-1 h-12">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-indigo-500 transition-[height] duration-75"
          style={{ height: "4px" }}
        />
      ))}
    </div>
  );
}
