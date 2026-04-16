import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Volume2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakCheckout } from "./VoiceControl";

export default function CheckoutDisplay({ checkout, score }) {
  if (score === null) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground font-body text-lg">
          Say your remaining score or type it below
        </p>
      </div>
    );
  }

  if (!checkout) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <AlertCircle className="w-16 h-16 mx-auto text-destructive/60 mb-4" />
        <p className="text-destructive font-display text-3xl tracking-wide">
          No Checkout
        </p>
        <p className="text-muted-foreground font-body text-sm mt-2">
          {score} has no checkout combination
        </p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={checkout.score}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-center py-8"
      >
        {/* Score */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <p className="text-muted-foreground font-body text-sm uppercase tracking-widest mb-1">
            Remaining
          </p>
          <p className="text-accent font-display text-8xl leading-none tracking-tight">
            {checkout.score}
          </p>
        </motion.div>

        {/* Darts */}
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          {checkout.spoken.map((dart, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              {i > 0 && (
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-body">
                  →
                </span>
              )}
              <div className={`px-5 py-3 rounded-xl font-body font-semibold text-lg ${
                dart.startsWith("Triple")
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : dart.startsWith("Double") || dart === "Bullseye"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "bg-secondary text-secondary-foreground border border-border"
              }`}>
                {dart}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Speak button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => speakCheckout(checkout)}
            className="gap-2 font-body"
          >
            <Volume2 className="w-4 h-4" />
            Hear it again
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}