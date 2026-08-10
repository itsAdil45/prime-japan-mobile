export const formatPrice = (vehicle, currency) => {
  if (currency === "usd" && vehicle?.price_usd != null) {
    return `$${Number(vehicle.price_usd).toLocaleString()} `;
  }

  if (currency === "jpy" && vehicle?.price_jpy != null) {
    return `¥${Number(vehicle.price_jpy).toLocaleString()} `;
  }

  return "Price on Request";
};
