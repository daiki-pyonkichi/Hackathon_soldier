import express from "express";
import cors from "cors";
import { authRouter, meHandler } from "./routes/auth.js";
import { presenceRouter } from "./routes/presence.js";

const app = express();
app.set("trust proxy", true);
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.get("/api/me", meHandler);
app.use("/api/presence", presenceRouter);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
  console.log(`[backend] LAB_ALLOWED_IPS=${process.env.LAB_ALLOWED_IPS ?? "(unset)"}`);
});
