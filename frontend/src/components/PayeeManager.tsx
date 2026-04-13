"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";

type Payee = {
  id: string;
  name: string;
  address: string;
  category: string;
  typicalAmount?: number;
  currency: string;
  notes?: string;
};

const payeeSchema = z.object({
  name:          z.string().min(1),
  address:       z.string().min(5),
  category:      z.enum(["utilities", "rent", "food", "other"]),
  typicalAmount: z.number().optional(),
  notes:         z.string().optional(),
});

type PayeeForm = z.infer<typeof payeeSchema>;

export function PayeeManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: payees = [], isLoading } = useQuery<Payee[]>({
    queryKey: ["payees"],
    queryFn: () => api.get("/payees"),
  });

  const addMutation = useMutation({
    mutationFn: (data: PayeeForm) => api.post<Payee>("/payees", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payees"] }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/payees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payees"] }),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PayeeForm>({
    resolver: zodResolver(payeeSchema),
    defaultValues: { category: "other" },
  });

  const categoryColors: Record<string, string> = {
    utilities: "#3b82f6",
    rent:      "#a855f7",
    food:      "#22c55e",
    other:     "#6b7280",
  };

  return (
    <div>
      {/* Payee list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payees.length === 0 && !showForm ? (
        <div className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
          <div className="text-3xl mb-3">💸</div>
          <p>No payees yet. Add your first recurring bill.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {payees.map((payee) => (
            <div key={payee.id} className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{ background: `${categoryColors[payee.category]}20`, color: categoryColors[payee.category] }}>
                  {payee.category}
                </span>
                <div>
                  <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{payee.name}</div>
                  <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {payee.address.slice(0, 10)}…{payee.address.slice(-6)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {payee.typicalAmount && (
                  <span className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                    ${payee.typicalAmount}
                  </span>
                )}
                <button
                  onClick={() => deleteMutation.mutate(payee.id)}
                  className="text-xs hover:opacity-70 transition-opacity"
                  style={{ color: "var(--error)" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add payee form */}
      {showForm ? (
        <form onSubmit={handleSubmit((data) => addMutation.mutate(data))}
          className="p-5 rounded-xl space-y-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Add Payee</h3>

          {[
            { key: "name"    as const, label: "Name",             placeholder: "Light Bill"        },
            { key: "address" as const, label: "Address or ENS",   placeholder: "0x... or alice.eth" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
              <input {...register(key)} placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Category</label>
              <select {...register("category")} className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                <option value="utilities">Utilities</option>
                <option value="rent">Rent</option>
                <option value="food">Food</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Typical Amount ($)</label>
              <input type="number" {...register("typicalAmount", { valueAsNumber: true })}
                placeholder="120"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); reset(); }}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}>
              {isSubmitting ? "Adding..." : "Add Payee"}
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px dashed rgba(124,58,237,0.4)", color: "#8b5cf6" }}>
          + Add Payee
        </button>
      )}
    </div>
  );
}
