"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const policySchema = z.object({
  perTxMaxUSD:           z.number().min(1).max(10000),
  monthlyUtilitiesMax:   z.number().min(0),
  monthlyRentMax:        z.number().min(0),
  monthlyFoodMax:        z.number().min(0),
  monthlyOtherMax:       z.number().min(0),
});

type PolicyForm = z.infer<typeof policySchema>;

type Props = {
  onSave: (data: unknown) => Promise<void>;
  defaults?: Partial<PolicyForm>;
};

export function PolicyEditor({ onSave, defaults }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PolicyForm>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      perTxMaxUSD:         defaults?.perTxMaxUSD         ?? 500,
      monthlyUtilitiesMax: defaults?.monthlyUtilitiesMax ?? 500,
      monthlyRentMax:      defaults?.monthlyRentMax       ?? 2000,
      monthlyFoodMax:      defaults?.monthlyFoodMax       ?? 800,
      monthlyOtherMax:     defaults?.monthlyOtherMax      ?? 300,
    },
  });

  async function onSubmit(data: PolicyForm) {
    await onSave({
      perTxMaxUSD: data.perTxMaxUSD,
      categoryLimits: [
        { category: "utilities", maxUSD: data.monthlyUtilitiesMax },
        { category: "rent",      maxUSD: data.monthlyRentMax      },
        { category: "food",      maxUSD: data.monthlyFoodMax      },
        { category: "other",     maxUSD: data.monthlyOtherMax     },
      ],
      approvedAddresses: [],
    });
  }

  return (
    <div className="p-6 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <h2 className="font-semibold text-lg mb-1" style={{ color: "var(--text-primary)" }}>Spending Limits</h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        These limits are enforced at the wallet layer — your AI agent cannot exceed them.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>
            Max per transaction (USD)
          </label>
          <input
            type="number"
            {...register("perTxMaxUSD", { valueAsNumber: true })}
            className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          {errors.perTxMaxUSD && (
            <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{errors.perTxMaxUSD.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "monthlyUtilitiesMax" as const, label: "Monthly: Utilities" },
            { key: "monthlyRentMax"      as const, label: "Monthly: Rent"      },
            { key: "monthlyFoodMax"      as const, label: "Monthly: Food"      },
            { key: "monthlyOtherMax"     as const, label: "Monthly: Other"     },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>
                {label}
              </label>
              <input
                type="number"
                {...register(key, { valueAsNumber: true })}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {isSubmitting ? "Saving to vault..." : "Save Spending Limits"}
        </button>
      </form>
    </div>
  );
}
