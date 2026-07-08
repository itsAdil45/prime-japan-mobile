export function DualRangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  format,
}) {
  const handleMinChange = (e) => {
    const next = Math.min(Number(e.target.value), valueMax - step);
    onChange([next, valueMax]);
  };
  const handleMaxChange = (e) => {
    const next = Math.max(Number(e.target.value), valueMin + step);
    onChange([valueMin, next]);
  };

  const pctMin = ((valueMin - min) / (max - min)) * 100;
  const pctMax = ((valueMax - min) / (max - min)) * 100;

  return (
    <div className="font-ui">
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-zinc-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-900"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />
        <input
          type="range"
          className="range-input"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={handleMinChange}
        />
        <input
          type="range"
          className="range-input"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={handleMaxChange}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>{format(valueMin)}</span>
        <span>{format(valueMax)}</span>
      </div>
    </div>
  );
}
