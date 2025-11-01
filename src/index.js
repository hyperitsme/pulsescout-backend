import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { initDb } from "./db.js";

// routes
import health from "./routes/health.js";
import access from "./routes/access.js";
import pay from "./routes/pay.js";
import stream from "./routes/stream.js";

const app = express();

// --- security & basics ---
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"));
app.use(rateLimit({ windowMs: 60_000, max: 300 }));

// --- cors ---
const corsOpts = {
  origin: (origin, cb) => {
    if(!origin) return cb(null, true);
    if(config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true
};
app.use(cors(corsOpts));

// --- routes ---
app.use(health);
app.use(access);
app.use(pay);
app.use(stream);

// --- not found / error ---
app.use((req,res)=> res.status(404).json({ error:"not_found" }));

// --- bootstrap ---
const start = async () => {
  try{
    await initDb();
    app.listen(config.port, () => {
      console.log(`PulseScout backend listening on :${config.port}`);
    });
  }catch(e){
    console.error("Boot error:", e);
    process.exit(1);
  }
};

start();
