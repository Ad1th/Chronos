// scripts/testReplay.ts
// Fast deterministic replay tests for Chronos MVP.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createUser } from "../services/auth/authService";
import { createOrder, settlePayment } from "../services/orders/orderService";
import {
  getEvents,
  resetInMemoryEventStore,
} from "../core/event-logger/eventLogger";
import { replayFull, replayUntil } from "../core/replay-engine/replayEngine";

async function run() {
  resetInMemoryEventStore();

  const correlationId = randomUUID();
  const requestId1 = randomUUID();

  const user = await createUser(
    "bob@example.com",
    "secret",
    requestId1,
    correlationId,
  );
  const order = await createOrder(user.id, 99.5, randomUUID(), correlationId);
  await settlePayment(order.orderId, false, randomUUID(), correlationId);

  const events = await getEvents({ correlationId });
  assert.equal(events.length, 3, "expected 3 events in flow");

  const partialTimestamp = events[1].timestamp;
  const partial = await replayUntil(partialTimestamp);
  assert.equal(
    partial.users.length >= 1,
    true,
    "partial replay must include user",
  );
  assert.equal(
    partial.orders.length >= 1,
    true,
    "partial replay must include placed order",
  );
  assert.equal(partial.orders[partial.orders.length - 1].status, "PENDING");

  const full = await replayFull();
  const reconstructed = full.orders.find((o) => o.id === order.orderId);
  assert.ok(reconstructed, "order should exist after full replay");
  assert.equal(
    reconstructed?.status,
    "FAILED",
    "payment failure should be applied",
  );

  for (let i = 1; i < events.length; i += 1) {
    const prev = events[i - 1].timestamp.getTime();
    const current = events[i].timestamp.getTime();
    assert.equal(
      prev <= current,
      true,
      "events must be ordered by timestamp asc",
    );
  }

  console.log("testReplay passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
