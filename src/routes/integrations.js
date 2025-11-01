import { Router } from "express";
import { pushToClients } from "./stream.js";

const r = Router();

function requireSecret(req, res){
  const secret = req.get("x-integ-secret") || req.query.secret;
  if(!secret || secret !== process.env.INTEGRATION_SECRET){
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}

/**
 * POST /api/integrations/dex
 * Body contoh (bebas asal kamu konsisten):
 * {
 *   "symbol":"SOL/USDC","source":"dexscreener",
 *   "signal":"liq+200k · zvol>3","validity":0.93,"side":"LONG","notes":"pool XYZ"
 * }
 */
r.post("/api/integrations/dex", (req, res) => {
  if(!requireSecret(req,res)) return;
  const p = req.body || {};
  const payload = {
    time: new Date().toLocaleTimeString(),
    source: "dex",
    symbol: p.symbol || "-",
    signal: p.signal || "dex-signal",
    validity: Number(p.validity ?? 0),
    side: p.side || "-",
    notes: p.notes || ""
  };
  pushToClients(payload);
  res.json({ ok: true });
});

/**
 * POST /api/integrations/tv  (TradingView Webhook)
 * Contoh template di TradingView (Message):
 * {
 *  "symbol":"{{ticker}}",
 *  "side":"{{strategy.order.action}}",
 *  "validity": {{plot("validity", 0.95)}},
 *  "signal": "tv: {{strategy.order.comment}}"
 * }
 */
r.post("/api/integrations/tv", (req, res) => {
  if(!requireSecret(req,res)) return;
  const p = req.body || {};
  const payload = {
    time: new Date().toLocaleTimeString(),
    source: "tv",
    symbol: p.symbol || "-",
    signal: p.signal || "tv-webhook",
    validity: Number(p.validity ?? 0),
    side: (p.side || "").toUpperCase(),
    notes: p.notes || ""
  };
  pushToClients(payload);
  res.json({ ok: true });
});

/**
 * POST /api/integrations/pump
 * Body contoh:
 * { "symbol":"SOL/USDC", "signal":"pump.new + liq 25k", "validity":0.9, "side":"LONG" }
 */
r.post("/api/integrations/pump", (req, res) => {
  if(!requireSecret(req,res)) return;
  const p = req.body || {};
  const payload = {
    time: new Date().toLocaleTimeString(),
    source: "pump",
    symbol: p.symbol || "-",
    signal: p.signal || "pump-feed",
    validity: Number(p.validity ?? 0),
    side: p.side || "-",
    notes: p.notes || ""
  };
  pushToClients(payload);
  res.json({ ok: true });
});

export default r;
