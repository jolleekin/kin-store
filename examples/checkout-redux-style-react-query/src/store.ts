import { withPlugins } from "@kin-store/core/index.ts";
import { devtools, persist } from "@kin-store/plugins/index.ts";

// Client-owned state only: what's in the cart, what step of checkout the user
// is on, and the draft promo code / zip. Product data, stock, pricing, and
// order history are server state and live in React Query instead — see
// src/queries/ and src/mutations/.

export type CartItem = { productId: string; quantity: number };

export type Step = "cart" | "checkout" | "confirmation";

export type CheckoutState = {
  step: Step;
  items: CartItem[];
  promoCode: string | null;
  zip: string;
  lastOrderId: string | null;
};

const initialState: CheckoutState = {
  step: "cart",
  items: [],
  promoCode: null,
  zip: "",
  lastOrderId: null,
};

export const checkoutStore = withPlugins(initialState)
  .use("persist", persist({ key: "checkout-react-query" }))
  .use(import.meta.env.DEV ? devtools() : {})
  .use({
    reducers: {
      setQuantity(state, productId: string, quantity: number) {
        const items = quantity <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.some((i) => i.productId === productId)
          ? state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          )
          : [...state.items, { productId, quantity }];

        return { ...state, items };
      },
      applyPromoCode(state, code: string) {
        return { ...state, promoCode: code.trim() || null };
      },
      setZip(state, zip: string) {
        return { ...state, zip };
      },
      setStep(state, step: Step) {
        return { ...state, step };
      },
      completeOrder(_state, orderId: string) {
        return {
          ...initialState,
          step: "confirmation",
          lastOrderId: orderId,
        };
      },
      startNewOrder() {
        return initialState;
      },
    },
  });
