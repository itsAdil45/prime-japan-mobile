import { useState } from "react";
import { Heart, Clock, Gauge, Fuel, Car } from "lucide-react";
const formatPrice = (jpy) => `¥${jpy.toLocaleString()}`;
const formatMileage = (km) => `${(km / 1000).toFixed(0)}k km`;
function VehicleThumb({ className = "" }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 ${className}`}
    >
      <Car className="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
    </div>
  );
}
export function VehicleCard({ vehicle }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="relative">
        <VehicleThumb className="h-40 w-full" />
        <div className="absolute left-2.5 top-2.5">
          {vehicle.status === "live" ? (
            <span className="font-ui tabular-nums inline-flex items-center gap-1 rounded-full bg-zinc-900/90 px-2 py-1 text-[10px] font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <Clock className="h-3 w-3" /> {vehicle.countdownLabel}
            </span>
          ) : (
            <span className="font-ui rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-zinc-600">
              {vehicle.lotNo}
            </span>
          )}
        </div>
        <button
          onClick={() => setSaved((s) => !s)}
          className="absolute right-2.5 top-2.5 rounded-full bg-white/90 p-1.5"
          aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Heart
            className={`h-4 w-4 ${saved ? "fill-orange-600 text-orange-600" : "text-zinc-500"}`}
          />
        </button>
      </div>

      <div className="px-3.5 py-3">
        <p className="font-display text-sm font-semibold text-zinc-900">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="font-ui flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500">
            <Gauge className="h-3 w-3" /> {formatMileage(vehicle.mileage)}
          </span>
          <span className="font-ui flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500">
            <Fuel className="h-3 w-3" /> {vehicle.fuelType}
          </span>
          <span className="font-ui rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500">
            {vehicle.transmission}
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="font-ui text-[11px] text-zinc-400">FOB price</p>
            <p className="font-display tabular-nums text-base font-semibold text-zinc-900">
              {formatPrice(vehicle.price)}
            </p>
          </div>
          <button className="font-ui rounded-lg bg-black px-3.5 py-2 text-xs font-semibold text-white">
            {vehicle.status === "live" ? "Place bid" : "View"}
          </button>
        </div>
      </div>
    </div>
  );
}
