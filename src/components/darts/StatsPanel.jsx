import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Target, Trophy, TrendingUp, Crosshair } from "lucide-react";

export default function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        const records = await base44.entities.GameStats.filter({ created_by: me.email });
        setStats(records[0] || null);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="text-center py-16 space-y-3">
        <Trophy className="w-12 h-12 mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground font-body">Sign in to track your checkout stats</p>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-body font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  const checkoutPct = stats && stats.checkout_attempts > 0
    ? ((stats.checkout_successes / stats.checkout_attempts) * 100).toFixed(1)
    : null;

  const avgDarts = stats && stats.games_won > 0
    ? (stats.total_darts / stats.games_won).toFixed(1)
    : null;

  const statCards = [
    {
      icon: <Target className="w-5 h-5 text-primary" />,
      label: "Checkout %",
      value: checkoutPct ? `${checkoutPct}%` : "—",
      sub: stats ? `${stats.checkout_successes} / ${stats.checkout_attempts} attempts` : "No data yet",
    },
    {
      icon: <Trophy className="w-5 h-5 text-accent" />,
      label: "Games Won",
      value: stats ? stats.games_won : "—",
      sub: stats ? `of ${stats.games_played} played` : "No data yet",
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
      label: "Highest Checkout",
      value: stats?.highest_checkout || "—",
      sub: "Best score finished from",
    },
    {
      icon: <Crosshair className="w-5 h-5 text-accent" />,
      label: "Avg Darts / Win",
      value: avgDarts || "—",
      sub: "Darts per completed game",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-display text-primary">
          {user.full_name?.[0] ?? "?"}
        </div>
        <div>
          <p className="font-body font-semibold text-foreground leading-tight">{user.full_name}</p>
          <p className="text-xs text-muted-foreground font-body">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card rounded-2xl border border-border p-4 space-y-1"
          >
            <div className="flex items-center gap-2 mb-2">{card.icon}<span className="text-xs font-body uppercase tracking-widest text-muted-foreground">{card.label}</span></div>
            <p className="font-display text-4xl text-foreground leading-none">{card.value}</p>
            <p className="text-xs font-body text-muted-foreground">{card.sub}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}