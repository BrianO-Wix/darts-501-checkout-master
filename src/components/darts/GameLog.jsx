import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GameLog({ log, onReset }) {
  if (log.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Turn History
        </p>
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5 text-muted-foreground hover:text-foreground h-7 text-xs">
          <RotateCcw className="w-3 h-3" />
          New Game
        </Button>
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {[...log].reverse().map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-xl px-4 py-3 border ${
                i === 0
                  ? "bg-primary/5 border-primary/20"
                  : "bg-secondary/40 border-border/50"
              }`}
            >
              {entry.type === "bust" ? (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-body text-sm text-destructive font-medium">Bust — reverted</span>
                  <span className="font-display text-2xl text-accent">{entry.remaining}</span>
                </div>
              ) : entry.type === "miss" ? (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-body text-sm text-muted-foreground">
                    Miss <span className="text-muted-foreground">· dart {entry.dartsUsed}/3</span>
                  </span>
                  <span className="font-display text-2xl text-accent">{entry.remaining}</span>
                </div>
              ) : entry.type === "set" ? (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-body text-sm text-muted-foreground">Game started at</span>
                  <span className="font-display text-2xl text-accent">{entry.score}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-body text-sm text-muted-foreground">
                      Threw <span className="text-foreground font-medium">{entry.dartLabel}</span>
                      <span className="text-muted-foreground"> (−{entry.dartValue})</span>
                      {entry.dartsUsed != null && (
                        <span className="text-muted-foreground ml-1">· dart {entry.dartsUsed}/3</span>
                      )}
                    </span>
                    <span className="font-display text-2xl text-accent">{entry.remaining}</span>
                  </div>
                  {entry.checkout ? (
                    <p className="font-body text-xs text-primary">
                      ✓ {entry.checkout.darts.length === 1 ? "1 dart" : `${entry.checkout.darts.length} darts`}: {entry.checkout.display}
                    </p>
                  ) : entry.remaining > 1 ? (
                    <p className="font-body text-xs text-muted-foreground">No direct checkout — keep going</p>
                  ) : null}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}