"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ProbabilitySliderProps {
  value: number; // 1–99
  onChange: (value: number) => void;
}

export function ProbabilitySlider({ value, onChange }: ProbabilitySliderProps) {
  const yesColor = "#22c55e";
  const noColor = "#ef4444";

  // Interpolate the track fill color based on probability
  const trackStyle = {
    background: `linear-gradient(to right, ${noColor} 0%, #6b7280 48%, ${yesColor} 100%)`,
  };

  const thumbPosition = `${value}%`;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Big probability display */}
      <div className="flex flex-col items-center gap-1">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.12 }}
            className="text-6xl font-black tabular-nums"
            style={{ color: value >= 50 ? yesColor : noColor }}
          >
            {value}%
          </motion.span>
        </AnimatePresence>
        <p className="text-sm text-[var(--color-card-muted)]">
          chance of <span style={{ color: yesColor }} className="font-semibold">YES</span>
          {" · "}
          <span style={{ color: noColor }} className="font-semibold">{100 - value}%</span>
          {" "}chance of <span style={{ color: noColor }} className="font-semibold">NO</span>
        </p>
      </div>

      {/* Slider track */}
      <div className="relative w-full">
        <div
          className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={trackStyle}
        />
        <input
          type="range"
          min={1}
          max={99}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full appearance-none bg-transparent cursor-pointer"
          style={{
            // Custom thumb via CSS — works without a config file
            WebkitAppearance: "none",
          }}
        />
        <style>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: white;
            border: 3px solid ${value >= 50 ? yesColor : noColor};
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            transition: border-color 0.15s ease;
          }
          input[type='range']::-moz-range-thumb {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: white;
            border: 3px solid ${value >= 50 ? yesColor : noColor};
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          }
          input[type='range']::-webkit-slider-runnable-track {
            height: 8px;
            border-radius: 4px;
          }
          input[type='range']:focus {
            outline: none;
          }
        `}</style>
      </div>

      {/* NO / YES labels */}
      <div className="flex justify-between text-xs font-semibold">
        <span style={{ color: noColor }}>NO · {100 - value}¢</span>
        <span style={{ color: yesColor }}>YES · {value}¢</span>
      </div>
    </div>
  );
}
