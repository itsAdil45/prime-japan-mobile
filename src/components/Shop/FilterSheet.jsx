"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { SlidersHorizontal, Search, X, ArrowUpDown, Car } from "lucide-react";
import { DualRangeSlider } from "./DualRangeSlider";
const formatMileage = (km) => `${(km / 1000).toFixed(0)}k km`;
const formatEngine = (cc) =>
  cc >= 1000 ? `${(cc / 1000).toFixed(1)}L` : `${cc}cc`;
const SOURCES = ["auction", "stock"];
const MAKES = ["Toyota", "Honda", "Nissan", "Mazda", "Subaru", "Suzuki"];
const MODELS = {
  Toyota: ["Land Cruiser", "Corolla", "Prius", "Hilux"],
  Honda: ["Civic", "CR-V", "Fit", "Vezel"],
  Nissan: ["Skyline", "X-Trail", "Note", "Navara"],
  Mazda: ["CX-5", "Demio", "Axela"],
  Subaru: ["Forester", "Impreza", "Outback"],
  Suzuki: ["Jimny", "Swift", "Escudo"],
};
const BODY_TYPES = ["SUV", "Sedan", "Hatchback", "Truck", "Van"];
const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid"];
const TRANSMISSIONS = ["Automatic", "Manual"];

function MaxSlider({ min, max, step, value, onChange, format }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="font-ui">
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-zinc-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-900"
          style={{ left: 0, right: `${100 - pct}%` }}
        />
        <input
          type="range"
          className="range-input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>{format(min)}</span>
        <span className="font-medium text-zinc-900">{format(value)}</span>
      </div>
    </div>
  );
}
function FilterLabel({ children }) {
  return (
    <p className="font-ui mb-2 text-xs font-medium text-zinc-500">{children}</p>
  );
}
function ChipSelect({ options, value, onChange, allLabel = "All" }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("")}
        className={`font-ui rounded-full px-3.5 py-1.5 text-xs font-medium capitalize ${
          value === "" ? "bg-[#02ab86] text-white" : "bg-zinc-100 text-zinc-500"
        }`}
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`font-ui rounded-full px-3.5 py-1.5 text-xs font-medium capitalize ${
            value === opt
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
export function FilterSheetContent({ draft, setDraft }) {
  const patch = (updates) => setDraft((prev) => ({ ...prev, ...updates }));
  const models = draft.make ? (MODELS[draft.make] ?? []) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <FilterLabel>Source</FilterLabel>
        <ChipSelect
          options={SOURCES}
          value={draft.source}
          onChange={(v) => patch({ source: v })}
        />
      </div>

      <div>
        <FilterLabel>Make</FilterLabel>
        <ChipSelect
          options={MAKES}
          value={draft.make}
          allLabel="Any make"
          onChange={(v) => patch({ make: v, model: "" })}
        />
      </div>

      {draft.make && (
        <div>
          <FilterLabel>Model</FilterLabel>
          <ChipSelect
            options={models}
            value={draft.model}
            allLabel="Any model"
            onChange={(v) => patch({ model: v })}
          />
        </div>
      )}

      <div>
        <FilterLabel>Year range</FilterLabel>
        <div className="flex items-center gap-3">
          <select
            value={draft.yearMin}
            onChange={(e) => patch({ yearMin: Number(e.target.value) })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          >
            {Array.from({ length: 22 }, (_, i) => 2005 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-400">to</span>
          <select
            value={draft.yearMax}
            onChange={(e) => patch({ yearMax: Number(e.target.value) })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900"
          >
            {Array.from({ length: 22 }, (_, i) => 2005 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FilterLabel>Price range (¥)</FilterLabel>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Min"
            value={draft.priceMin}
            onChange={(e) => patch({ priceMin: e.target.value })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <span className="text-xs text-zinc-400">to</span>
          <input
            type="number"
            placeholder="Max"
            value={draft.priceMax}
            onChange={(e) => patch({ priceMax: e.target.value })}
            className="font-ui w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
      </div>

      <div>
        <FilterLabel>Max mileage</FilterLabel>
        <MaxSlider
          min={0}
          max={1000000}
          step={5000}
          value={draft.mileageMax}
          onChange={(v) => patch({ mileageMax: v })}
          format={formatMileage}
        />
      </div>

      <div>
        <FilterLabel>Engine capacity</FilterLabel>
        <DualRangeSlider
          min={660}
          max={10000}
          step={50}
          valueMin={draft.engineMin}
          valueMax={draft.engineMax}
          onChange={([lo, hi]) => patch({ engineMin: lo, engineMax: hi })}
          format={formatEngine}
        />
      </div>
    </div>
  );
}
