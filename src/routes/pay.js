import { Router } from "express";
import { pool } from "../db.js";
import { v4 as uuidv4 } from "uuid";

const r = Router();

/**
 * POST /api/pay
 * body: { chain: 'sol'|'evm', address: '...', amount: number }
 * MVP: buat intent, segera mark processing → (simulasi) paid → set users.unlocked=true
 * NOTE: gampang diganti ke pembayaran nyata (Solana transfer) di kemudian hari.
 */
r.post("/api/pay", async (req, res) => {
  try{
    const { chain = "sol", address, amount } = req.body || {};
    if(!address) return res.status(400).json({ error: "address required" });
    if(!["sol","evm"].includes(chain)) return res.status(400).json({ error: "invalid chain" });

    const id = uuidv4();
    await pool.query(
      "insert into payment_intents(id,address,chain,amount,status) values($1,$2,$3,$4,'processing')",
      [id, address, chain, amount || 0.001]
    );

    // Balas cepat; frontend akan polling /status.
    return res.json({ intent_id: id });
  }catch(e){
    console.error("pay:", e);
    return res.status(500).json({ error: "internal" });
  }
});

/**
 * GET /api/pay/status?id=...
 * MVP: jika masih 'processing', ubah jadi 'paid' setelah tunda singkat (simulasi sukses).
 * Lalu tandai users.unlocked=true untuk wallet tsb.
 */
r.get("/api/pay/status", async (req, res) => {
  try{
    const { id } = req.query;
    if(!id) return res.status(400).json({ error: "id required" });

    const q = await pool.query("select * from payment_intents where id=$1 limit 1", [id]);
    const row = q.rows[0];
    if(!row) return res.status(404).json({ error: "not found" });

    if(row.status === "processing"){
      // Simulasi: *anggap* tx sudah settled → mark paid
      await pool.query("update payment_intents set status='paid', updated_at=now() where id=$1", [id]);

      // Upsert user + unlock
      await pool.query(`
        insert into users(address, chain, unlocked) values($1,$2,true)
        on conflict(address,chain) do update set unlocked=true
      `, [row.address, row.chain]);
    }

    const q2 = await pool.query("select status from payment_intents where id=$1", [id]);
    const status = q2.rows[0]?.status || "failed";
    const paid = status === "paid";
    return res.json({ paid, status });
  }catch(e){
    console.error("status:", e);
    return res.status(500).json({ error: "internal" });
  }
});

export default r;
