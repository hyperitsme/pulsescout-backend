import { Router } from "express";
import { pool } from "../db.js";
import { config } from "../config.js";

const r = Router();

/** GET /api/receiver -> {receiver} */
r.get("/api/receiver", (req, res) => {
  return res.json({ receiver: config.solReceiver });
});

/**
 * GET /api/access?address=...&chain=sol|evm
 * Jika address tak ada → unlocked:false (frontend kamu sudah ada fallback localStorage).
 */
r.get("/api/access", async (req, res) => {
  try{
    const { address, chain } = req.query;
    if(!address || !chain) return res.json({ unlocked: false });
    const q = await pool.query("select unlocked from users where address=$1 and chain=$2 limit 1", [address, chain]);
    const unlocked = q.rows[0]?.unlocked || false;
    return res.json({ unlocked });
  }catch(e){
    return res.json({ unlocked: false });
  }
});

export default r;
