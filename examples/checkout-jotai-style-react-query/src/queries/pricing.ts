import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSelector } from "@kin-store/react/index.ts";
import { itemsStore, promoCodeStore, zipStore } from "../stores.ts";
import { calculatePricing } from "../api.ts";

// A dependent query: its inputs (cart items, promo code, zip) are read
// straight from Kin Store, and its query key changes whenever they do. The
// server, not the client, owns tax/shipping/discount math.
export function useCartPricing() {
  const items = useSelector(itemsStore);
  const promoCode = useSelector(promoCodeStore);
  const zip = useSelector(zipStore);

  return useQuery({
    queryKey: ["pricing", items, promoCode, zip],
    queryFn: () => calculatePricing({ items, promoCode, zip }),
    enabled: items.length > 0,
    // Every edit changes the query key — keep the last total on screen
    // instead of it vanishing while the new one loads.
    placeholderData: keepPreviousData,
  });
}
