import React, { useState, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Target, List, Undo2, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { getCheckout } from "@/lib/checkouts";
import { parseDartThrow, parseScore } from "@/lib/dartParser";
import VoiceControl, { speakCheckout, speakText } from "@/components/darts/VoiceControl";
import CheckoutDisplay from "@/components/darts/CheckoutDisplay";
import CheckoutTable from "@/components/darts/CheckoutTable";
import GameLog from "@/components/darts/GameLog";
import StatsPanel from "@/components/darts/StatsPanel";
import { base44 } from "@/api/base44Client";

export default function Dashboard() {
  // Game state
  const [remaining, setRemaining] = useState(null);     // current remaining score
  const [checkout, setCheckout] = useState(null);        // checkout for current remaining
  const [dartsThisVisit, setDartsThisVisit] = useState(0); // how many darts thrown this visit (0–3)
  const [visitStartScore, setVisitStartScore] = useState(null); // score at start of current visit
  const [log, setLog] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const logIdRef = useRef(0);
  const lastTranscriptRef = useRef("");
  const voiceRef = useRef(null);

  // Space key = toggle mic (hands-free fallback for keyboard users)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        voiceRef.current?.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nextId = () => ++logIdRef.current;

  // Track checkout attempt whenever player is on a finishing score (≤170) and throws
  async function recordStat({ attempt, success, dartsUsed, fromScore }) {
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) return;
      const me = await base44.auth.me();
      const records = await base44.entities.GameStats.filter({ created_by: me.email });
      const existing = records[0];
      if (existing) {
        await base44.entities.GameStats.update(existing.id, {
          checkout_attempts: (existing.checkout_attempts || 0) + (attempt ? 1 : 0),
          checkout_successes: (existing.checkout_successes || 0) + (success ? 1 : 0),
          games_played: success ? (existing.games_played || 0) + 1 : existing.games_played || 0,
          games_won: success ? (existing.games_won || 0) + 1 : existing.games_won || 0,
          highest_checkout: success ? Math.max(existing.highest_checkout || 0, fromScore) : existing.highest_checkout || 0,
          total_darts: (existing.total_darts || 0) + (dartsUsed || 0),
        });
      } else {
        await base44.entities.GameStats.create({
          checkout_attempts: attempt ? 1 : 0,
          checkout_successes: success ? 1 : 0,
          games_played: success ? 1 : 0,
          games_won: success ? 1 : 0,
          highest_checkout: success ? fromScore : 0,
          total_darts: dartsUsed || 0,
        });
      }
    } catch (_) {}
  }

  // Mode: if no game started yet, voice sets the score. Otherwise, voice interprets dart throws.
  const gameActive = remaining !== null;

  function startGame(score) {
    const co = getCheckout(score);
    setRemaining(score);
    setCheckout(co);
    setDartsThisVisit(0);
    setVisitStartScore(score);
    setLog([{ id: nextId(), type: "set", score }]);
    if (co) speakCheckout(co);
    else speakText(`${score}. No direct checkout available.`);
  }

  function throwDart(dartLabel, dartValue) {
    const newDartsUsed = dartsThisVisit + 1;
    const newRemaining = remaining - dartValue;

    // Bust or invalid
    if (newRemaining < 0 || newRemaining === 1) {
      speakText("Bust!");
      if (remaining <= 170) recordStat({ attempt: true, success: false, dartsUsed: newDartsUsed, fromScore: remaining });
      setLog(prev => [...prev, { id: nextId(), type: "dart", dartLabel, dartValue, dartsUsed: newDartsUsed, remaining, bust: true }]);
      setDartsThisVisit(newDartsUsed);
      return;
    }

    // Checkout! Must finish on a double or bullseye
    if (newRemaining === 0) {
      const isValidFinish = dartLabel.startsWith("Double") || dartLabel === "Bullseye";
      if (!isValidFinish) {
        speakText("Bust! Must finish on a double.");
        setLog(prev => [...prev, { id: nextId(), type: "dart", dartLabel, dartValue, dartsUsed: newDartsUsed, remaining, bust: true }]);
        setDartsThisVisit(newDartsUsed);
        return;
      }
      speakText("Checkout! Game of Darts! Well done!");
      setLog(prev => [...prev, { id: nextId(), type: "dart", dartLabel, dartValue, dartsUsed: newDartsUsed, remaining: 0, checkout: null, finished: true }]);
      recordStat({ attempt: true, success: true, dartsUsed: newDartsUsed, fromScore: remaining });
      setRemaining(0);
      setCheckout(null);
      return;
    }

    const co = getCheckout(newRemaining);

    let spokenResponse = `${newRemaining}`;
    if (co) spokenResponse += `. ${co.spoken.join(", ")}`;

    speakText(spokenResponse);

    setRemaining(newRemaining);
    setCheckout(co);
    const resetVisit = newDartsUsed >= 3;
    setDartsThisVisit(resetVisit ? 0 : newDartsUsed);
    if (resetVisit) setVisitStartScore(newRemaining); // new visit starts
    setLog(prev => [...prev, {
      id: nextId(), type: "dart", dartLabel, dartValue,
      dartsUsed: newDartsUsed, remaining: newRemaining, checkout: co
    }]);
  }

  // Called by VoiceControl with raw transcript
  const handleVoiceInput = useCallback((text) => {
    // Ignore input while TTS is speaking (prevents recognising own voice output)
    if (window.speechSynthesis?.speaking) return;

    const trimmed = text.trim();
    if (trimmed === lastTranscriptRef.current) return; // ignore duplicate recognition events
    lastTranscriptRef.current = trimmed;
    setTimeout(() => { lastTranscriptRef.current = ""; }, 2000);

    const t = trimmed.toLowerCase();
    if (!gameActive) {
      const score = parseScore(text);
      if (score && score >= 2 && score <= 501) startGame(score);
    } else {
      if (/\bbust(ed)?\b/.test(t)) { handleBust(); return; }
      if (/\bmiss(ed)?\b/.test(t)) { handleMiss(); return; }
      const dart = parseDartThrow(text);
      if (dart) {
        throwDart(dart.label, dart.value);
      } else {
        // Only restart/reset score if input looks like a plain number — no dart keywords
        const hasDartKeyword = /\b(double|triple|single|bull|miss|bust|t\d|d\d|s\d)\b/i.test(text);
        if (!hasDartKeyword) {
          const score = parseScore(text);
          if (score && score >= 2 && score <= 501) startGame(score);
        }
      }
    }
  }, [gameActive, remaining, dartsThisVisit, visitStartScore]); // eslint-disable-line

  function handleBust() {
    const revertTo = visitStartScore ?? remaining;
    const co = getCheckout(revertTo);
    speakText(`Bust! Back to ${revertTo}.`);
    setRemaining(revertTo);
    setCheckout(co);
    setDartsThisVisit(0);
    setVisitStartScore(revertTo);
    setLog(prev => [...prev, { id: nextId(), type: "bust", remaining: revertTo }]);
  }

  function handleMiss() {
    const newDartsUsed = dartsThisVisit + 1;
    const dartsLeft = 3 - newDartsUsed;
    const co = getCheckout(remaining);
    speakText(`Miss. ${remaining}.`);
    if (newDartsUsed >= 3) {
      setDartsThisVisit(0);
      setVisitStartScore(remaining);
    } else {
      setDartsThisVisit(newDartsUsed);
    }
    setCheckout(co);
    setLog(prev => [...prev, { id: nextId(), type: "miss", dartLabel: "Miss", dartValue: 0, dartsUsed: newDartsUsed, remaining }]);
  }

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const val = manualInput.trim();
    if (!val) return;

    if (!gameActive) {
      const n = parseInt(val, 10);
      if (!isNaN(n) && n >= 2 && n <= 501) { startGame(n); setManualInput(""); }
    } else {
      const t = val.toLowerCase();
      if (/\bbust(ed)?\b/.test(t)) { handleBust(); setManualInput(""); return; }
      if (/\bmiss(ed)?\b/.test(t)) { handleMiss(); setManualInput(""); return; }
      // Try dart parse first
      const dart = parseDartThrow(val);
      if (dart) { throwDart(dart.label, dart.value); setManualInput(""); return; }
      // Only reset score if it looks like a plain number
      const hasDartKeyword = /\b(double|triple|single|bull|miss|bust|t\d|d\d|s\d)\b/i.test(val);
      if (!hasDartKeyword) {
        const n = parseInt(val, 10);
        if (!isNaN(n) && n >= 2 && n <= 501) { startGame(n); setManualInput(""); }
      }
    }
  };

  function undoLast() {
    if (log.length <= 1) return; // can't undo the initial "set" entry
    const newLog = log.slice(0, -1);
    const prev = newLog[newLog.length - 1];
    // Restore remaining from the previous log entry
    const prevRemaining = prev.type === "set" ? prev.score : prev.remaining;
    const prevBust = prev.bust;
    // Recalculate darts this visit: count dart entries after the last "set"
    const sinceSet = newLog.filter(e => e.type === "dart" && !e.bust);
    const dartsCount = sinceSet.length % 3;
    const newRemaining = prevBust ? remaining : prevRemaining;
    const co = getCheckout(newRemaining);
    setLog(newLog);
    setRemaining(newRemaining);
    setCheckout(co);
    setDartsThisVisit(dartsCount);
  }

  function resetGame() {
    setRemaining(null);
    setCheckout(null);
    setDartsThisVisit(0);
    setVisitStartScore(null);
    setLog([]);
    setManualInput("");
  }

  const dartsLeft = 3 - dartsThisVisit;
  const achievableNow = checkout && checkout.darts.length <= dartsLeft;

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
          <TabsList className="grid w-full grid-cols-3 bg-secondary mb-8">
            <TabsTrigger value="voice" className="font-body gap-2">
              <Target className="w-4 h-4" />
              Live Game
            </TabsTrigger>
            <TabsTrigger value="table" className="font-body gap-2">
              <List className="w-4 h-4" />
              All Checkouts
            </TabsTrigger>
            <TabsTrigger value="stats" className="font-body gap-2">
              <BarChart2 className="w-4 h-4" />
              My Stats
            </TabsTrigger>
          </TabsList>

          {/* Voice Tab */}
          <TabsContent value="voice">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Voice mic */}
              <div className="bg-card rounded-2xl border border-border p-8">
                <VoiceControl
                  ref={voiceRef}
                  onTranscript={handleVoiceInput}
                  prompt={gameActive ? `Say a dart (e.g. "triple 20") or new score` : `Say your remaining score`}
                />
              </div>

              {/* Manual input */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <form onSubmit={handleManualSubmit} className="flex gap-3">
                  <Input
                    type="text"
                    placeholder={gameActive ? `Type a dart or score (e.g. "triple 20" or "116")…` : "Type your remaining score…"}
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="font-body bg-secondary border-border"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-body font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0"
                  >
                    {gameActive ? "Throw" : "Start"}
                  </motion.button>
                </form>
              </div>

              {/* Game action buttons */}
              {gameActive && (
                <div className="flex justify-between items-center">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={undoLast}
                    disabled={log.length <= 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Undo2 className="w-4 h-4" />
                    Undo Last
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={resetGame}
                    className="px-4 py-2 rounded-lg font-body text-sm font-semibold border border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    End Match
                  </motion.button>
                </div>
              )}

              {/* Current checkout */}
              <div className="bg-card rounded-2xl border border-border p-6">
                {gameActive && remaining > 0 && (
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-body uppercase tracking-widest text-muted-foreground">
                      Darts left this visit:
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(d => (
                        <span key={d} className={`w-3 h-3 rounded-full ${d <= dartsLeft ? "bg-primary" : "bg-muted"}`} />
                      ))}
                    </div>
                    {!achievableNow && checkout && (
                      <span className="text-xs text-accent font-body">(needs next visit)</span>
                    )}
                  </div>
                )}
                <CheckoutDisplay checkout={checkout} score={remaining} finished={remaining === 0} />
              </div>

              {/* Log history */}
              <GameLog log={log} onReset={resetGame} />

            </motion.div>
          </TabsContent>

          {/* Table Tab */}
          <TabsContent value="table">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <CheckoutTable />
            </motion.div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <StatsPanel />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}