// services/orders/orderService.ts
// Order Service for Chronos: emits order and payment events.

import { randomUUID } from "node:crypto";
import { logEvent } from "../../core/event-logger/eventLogger";

export async function createOrder(
  userId: string,
  amount: number,
  requestId: string,
  correlationId: string,
): Promise<{ orderId: string; status: "PENDING" }> {
  const orderId = randomUUID();

  await logEvent({
    type: "ORDER_PLACED",
    service: "orders",
    payload: {
      orderId,
      userId,
      amount,
      status: "PENDING",
    },
    metadata: { requestId, correlationId },
  });

  return { orderId, status: "PENDING" };
}

export async function settlePayment(
  orderId: string,
  success: boolean,
  requestId: string,
  correlationId: string,
): Promise<{ orderId: string; status: "PAID" | "FAILED" }> {
  const type = success ? "PAYMENT_SUCCEEDED" : "PAYMENT_FAILED";
  const status = success ? "PAID" : "FAILED";

  await logEvent({
    type,
    service: "orders",
    payload: {
      orderId,
      status,
      reason: success ? undefined : "Simulated payment failure",
    },
    metadata: { requestId, correlationId },
  });

  return { orderId, status };
}
