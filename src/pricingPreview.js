// src/pricingPreview.js
// IMPORTANT: this is a PREVIEW ONLY, used purely so the cart screen can show a live
// estimate while the user is still shopping. It deliberately mirrors the backend's
// src/domain/pricingRules.js — but the actual charged amount always comes from the
// server's response to POST /api/orders, never from this file. If these two ever
// drift apart, the worst that happens is a slightly-off preview number for a second,
// not an incorrect charge — because the server recomputes everything independently.

export function getGroupDiscountRate(itemCount) {
  if (itemCount >= 10) return 0.10;
  if (itemCount >= 5) return 0.05;
  return 0;
}

export function isBirthdayToday(birthdayMMDD) {
  if (!birthdayMMDD) return false;
  const now = new Date();
  const todayMMDD = String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  return birthdayMMDD === todayMMDD;
}

export function previewPricing(lines, birthdayMMDD) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const groupRate = getGroupDiscountRate(itemCount);
  const birthdayRate = isBirthdayToday(birthdayMMDD) ? 0.15 : 0;
  const discountRate = Math.max(groupRate, birthdayRate);
  const discount = Math.round(subtotal * discountRate);
  return { subtotal, discountRate, discount, total: subtotal - discount, itemCount };
}

export function estimatePrepMinutes(itemCount) {
  return Math.min(8 + itemCount * 2, 25);
}
