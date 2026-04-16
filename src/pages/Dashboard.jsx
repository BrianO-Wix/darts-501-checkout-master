import React, { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Target, List } from "lucide-react";
import { motion } from "framer-motion";
import { getCheckout } from "@/lib/checkouts";
import VoiceControl, { speakCheckout } from "@/components/darts/VoiceControl";
import CheckoutDisplay from "@/components/darts/CheckoutDisplay";
import CheckoutTable from "@/components/darts/CheckoutTable";

export default function Dashboard() {
  const [score, setScore] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [manualInput, setManualInput] = useState("");

  const handleScore = useCallback((value) => {
    setScore(value);
    const result = getCheckout(value);
    setCheckout(result);

    // Auto-speak the result
    if (result) {
      speakCheckout(result);
    }
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(manualInput, 10);
    if (!isNaN(num) && num > 0) {
      handleScore(num);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-wide text-foreground leading-none">
              Checkout Pro
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">501 Darts Calculator</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary mb-8">
            <TabsTrigger value="voice" className="font-body gap-2">
              <Target className="w-4 h-4" />
              Voice Checkout
            </TabsTrigger>
            <TabsTrigger value="table" className="font-body gap-2">
              <List className="w-4 h-4" />
              All Checkouts
            </TabsTrigger>
          </TabsList>

          {/* Voice Tab */}
          <TabsContent value="voice">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Voice Input */}
              <div className="bg-card rounded-2xl border border-border p-8">
                <VoiceControl onScoreDetected={handleScore} />
              </div>

              {/* Manual Input */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <form onSubmit={handleManualSubmit} className="flex gap-3">
                  <Input
                    type="number"
                    min="1"
                    max="170"
                    placeholder="Or type your score…"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="font-body text-lg bg-secondary border-border"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-body font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    Go
                  </motion.button>
                </form>
              </div>

              {/* Checkout Result */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <CheckoutDisplay checkout={checkout} score={score} />
              </div>
            </motion.div>
          </TabsContent>

          {/* Table Tab */}
          <TabsContent value="table">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckoutTable />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}