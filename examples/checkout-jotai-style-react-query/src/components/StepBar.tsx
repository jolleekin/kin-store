import { useStore } from "@kin-store/react/index.ts";
import { stepStore, type Step } from "../stores.ts";

const STEPS: { label: string; value: Step }[] = [
  { label: "Cart", value: "cart" },
  { label: "Checkout", value: "checkout" },
  { label: "Confirmation", value: "confirmation" },
];

export function StepBar() {
  const step = useStore(stepStore);

  return (
    <div className="flex items-center gap-2 text-sm">
      {STEPS.map(({ label, value }, i) => (
        <span key={value} className="flex items-center gap-2">
          <span
            className={
              step === value ? "text-pink-400 font-semibold" : "text-slate-400"
            }
          >
            {i + 1}. {label}
          </span>
          {i < STEPS.length - 1 && <span className="text-slate-700">→</span>}
        </span>
      ))}
    </div>
  );
}
