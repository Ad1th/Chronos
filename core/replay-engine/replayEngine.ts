// core/replay-engine/replayEngine.ts
// Deterministic replay engine for Chronos.

import { getEvents, StoredEvent } from "../event-logger/eventLogger";

export interface ReplayUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface ReplayOrder {
  id: string;
  userId: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED";
  createdAt: string;
  paymentUpdatedAt?: string;
}

export interface ReplayState {
  users: ReplayUser[];
  orders: ReplayOrder[];
}

export function applyEventToState(
  state: ReplayState,
  event: StoredEvent,
): ReplayState {
  switch (event.type) {
    case "USER_CREATED": {
      const payload = event.payload as { userId?: string; email?: string };
      if (!payload.userId || !payload.email) {
        return state;
      }
      return {
        ...state,
        users: [
          ...state.users,
          {
            id: payload.userId,
            email: payload.email,
            createdAt: event.timestamp.toISOString(),
          },
        ],
      };
    }

    case "ORDER_PLACED": {
      const payload = event.payload as {
        orderId?: string;
        userId?: string;
        amount?: number;
        status?: "PENDING";
      };
      if (
        !payload.orderId ||
        !payload.userId ||
        typeof payload.amount !== "number"
      ) {
        return state;
      }
      return {
        ...state,
        orders: [
          ...state.orders,
          {
            id: payload.orderId,
            userId: payload.userId,
            amount: payload.amount,
            status: payload.status ?? "PENDING",
            createdAt: event.timestamp.toISOString(),
          },
        ],
      };
    }

    case "PAYMENT_FAILED":
    case "PAYMENT_SUCCEEDED": {
      const payload = event.payload as { orderId?: string };
      const status: "PAID" | "FAILED" =
        event.type === "PAYMENT_SUCCEEDED" ? "PAID" : "FAILED";
      if (!payload.orderId) {
        return state;
      }
      return {
        ...state,
        orders: state.orders.map((order) => {
          if (order.id !== payload.orderId) {
            return order;
          }
          return {
            ...order,
            status,
            paymentUpdatedAt: event.timestamp.toISOString(),
          };
        }),
      };
    }

    default:
      return state;
  }
}

export async function replayFull(): Promise<ReplayState> {
  const events = await getEvents();
  return events.reduce(applyEventToState, {
    users: [],
    orders: [],
  } as ReplayState);
}

export async function replayUntil(timestamp: Date): Promise<ReplayState> {
  const events = await getEvents({ until: timestamp });
  return events.reduce(applyEventToState, {
    users: [],
    orders: [],
  } as ReplayState);
}
