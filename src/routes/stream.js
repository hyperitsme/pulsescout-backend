import { Router } from "express";
import { sseHeaders, sseSend } from "../utils.js";
import { pool } from "../db.js";
import { config } from "../config.js";

const r = Router();

/**
 * GET /api/pulse/stream?address=...&chain=...
 * SSE hanya aktif kalau user unlocked.
 * MVP: kirim alert dummy periodik.
 */
r.get("/api/pulse/stream", async (req, res) => {
  try{
    const { address, chain } = req.query;
    if(!address || !chain){
      res.status(401).json({ error: "address and chain required for stream" });
      return;
    }
    const q = await pool.query("select unlocked from users where address=$1 and chain=$2 limit 1", [address, chain]);
    const unlocked = q.rows[0]?.unlocked || false;
    if(!unlocked){
      res.status(403).json({ error: "locked" });
      return;
    }

    sseHeaders(res);
    let tick = 0;

    const timer = setInterval(() => {
      // Kirim alert demo
      const validity = (0.85 + Math.random()*0.15).toFixed(2);
      const side = Math.random() > 0.5 ? "LONG" : "SHORT";
      const payload = {
        time: new Date().toLocaleTimeString(),
        source: "demo",
        symbol: tick % 2 ? "SOL/USDC" : "ETH/USDT",
        signal: "zvol>3 · adx " + (15 + Math.floor(Math.random()*20)),
        validity,
        side,
        notes: "Demo stream " + (++tick)
      };
      sseSend(res, payload);
    }, config.demoAlertInterval);

    req.on("close", () => {
      clearInterval(timer);
      try{ res.end(); }catch(_){}
    });
  }catch(e){
    console.error("sse:", e);
    if(!res.headersSent) res.status(500).json({ error: "internal" });
  }
});

export default r;
