import React, { useState } from "react";
import { getAllCheckouts } from "@/lib/checkouts";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckoutTable() {
  const [search, setSearch] = useState("");
  const checkouts = getAllCheckouts();

  const filtered = search
    ? checkouts.filter((c) => c.score.toString().includes(search))
    : checkouts;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search score…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 font-body bg-secondary border-border"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[80px_1fr] bg-muted/50 px-4 py-3 border-b border-border">
          <span className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold">Score</span>
          <span className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold">Checkout</span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.map((checkout, idx) => (
            <motion.div
              key={checkout.score}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.005 }}
              className="grid grid-cols-[80px_1fr] px-4 py-3 border-b border-border/50 hover:bg-secondary/50 transition-colors"
            >
              <span className="font-display text-2xl text-accent">{checkout.score}</span>
              <div className="flex items-center gap-2 flex-wrap">
                {checkout.spoken.map((dart, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className={`font-body text-xs ${
                      dart.startsWith("Triple")
                        ? "bg-primary/10 text-primary border-primary/20"
                        : dart.startsWith("Double") || dart === "Bullseye"
                        ? "bg-accent/10 text-accent border-accent/20"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {dart}
                  </Badge>
                ))}
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground font-body">
              No checkout found for "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}