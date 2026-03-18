// api/index.ts
// Chronos API service and debug interface.

import express from "express";
import { randomUUID } from "node:crypto";
import { createUser, login } from "../services/auth/authService";
import { createOrder, settlePayment } from "../services/orders/orderService";
import { getEvents } from "../core/event-logger/eventLogger";
import { replayFull, replayUntil } from "../core/replay-engine/replayEngine";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const requestId = req.header("x-request-id") ?? randomUUID();
  const correlationId = req.header("x-correlation-id") ?? randomUUID();

  const user = await createUser(
    String(email),
    String(password),
    requestId,
    correlationId,
  );
  res.status(201).json({ user, requestId, correlationId });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const requestId = req.header("x-request-id") ?? randomUUID();
  const correlationId = req.header("x-correlation-id") ?? randomUUID();

  const result = await login(
    String(email),
    String(password),
    requestId,
    correlationId,
  );
  res.json({ ...result, requestId, correlationId });
});

app.post("/orders", async (req, res) => {
  const { userId, amount } = req.body ?? {};
  if (!userId || typeof amount !== "number") {
    res.status(400).json({ error: "userId and numeric amount are required" });
    return;
  }

  const requestId = req.header("x-request-id") ?? randomUUID();
  const correlationId = req.header("x-correlation-id") ?? randomUUID();

  const order = await createOrder(
    String(userId),
    amount,
    requestId,
    correlationId,
  );
  res.status(201).json({ ...order, requestId, correlationId });
});

app.post("/orders/:orderId/payment", async (req, res) => {
  const { orderId } = req.params;
  const { success } = req.body ?? {};
  if (typeof success !== "boolean") {
    res.status(400).json({ error: "success must be boolean" });
    return;
  }

  const requestId = req.header("x-request-id") ?? randomUUID();
  const correlationId = req.header("x-correlation-id") ?? randomUUID();

  const result = await settlePayment(
    orderId,
    success,
    requestId,
    correlationId,
  );
  res.json({ ...result, requestId, correlationId });
});

app.get("/events", async (req, res) => {
  const service = req.query.service ? String(req.query.service) : undefined;
  const correlationId = req.query.correlationId
    ? String(req.query.correlationId)
    : undefined;

  const events = await getEvents({ service, correlationId });
  res.json({ count: events.length, events });
});

app.get("/replay/full", async (_req, res) => {
  const state = await replayFull();
  res.json(state);
});

app.get("/replay", async (req, res) => {
  const timestamp = req.query.timestamp;
  if (!timestamp || typeof timestamp !== "string") {
    res.status(400).json({ error: "timestamp query parameter is required" });
    return;
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    res.status(400).json({ error: "timestamp must be a valid ISO date" });
    return;
  }

  const state = await replayUntil(parsed);
  res.json(state);
});

app.listen(port, () => {
  console.log(`Chronos API running on port ${port}`);
});
