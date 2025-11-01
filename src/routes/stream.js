import { Router } from "express";
import { sseHeaders, sseSend } from "../utils.js";
import { pool } from "../db.js";
import { config } from "../config.js";

const r = Router();

// ===== SSE client registry (in-memory) =====
const clients = new Map(); // key: clientId -> { res, address, chain, minValidity }
let clientSeq = 0;

function pushToClients(payload){
  for (const [id, c] of clients.entries()){
    try{
      // Filter per-user min validity (default from env)
      const minV = Number(c.minValidity ?? process.env.MIN_VALIDITY_DEFAULT ?? 0.85);
      const v = Number(payload?.validity ?? 0);
      if (isFinite(v) && v < minV) continue;

      sseSend(c.res, payload);
    }catch(e){
      try{ c.res.end(); }catch(_){}
      clients.delete(id);
    }
  }
}

/**
 * GET /api/pulse/stream?address=...&chain=...
 * Klien SSE hanya aktif kalau user unlocked.
 * Query opsional: minValidity=0.9
 */
r.get("/api/pulse/stream", async (req, res) => {
  try{
    const { address, chain, minValidity } = req.query;
    if(!address || !chain){
      return res.status(401).json({ error: "address and chain required" });
    }
    const q = await pool.query(
      "select unlocked from users where address=$1 and chain=$2 limit 1",
      [address, chain]
    );
    const unlocked = q.rows[0]?.unlocked || false;
    if(!unlocked) return res.status(403).json({ error: "locked" });

    sseHeaders(res);
    const id = (++clientSeq).toString();
    clients.set(id, { res, address, chain, minValidity });

    // Heartbeat agar koneksi tetap hidup
    const hb = setInterval(()=> { try{ res.write(":hb\n\n"); }catch(_){ } }, 25000);

    req.on("close", () => {
      clearInterval(hb);
      clients.delete(id);
      try{ res.end(); }catch(_){}
    });
  }catch(e){
    console.error("sse:", e);
    if(!res.headersSent) res.status(500).json({ error: "internal" });
  }
});

export { pushToClients };  // dipakai oleh integrations.js
export default r;
