// core/event-logger/eventLogger.ts
// Centralized event logger for Chronos

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();
const inMemoryEventStore: StoredEvent[] = [];

export interface EventPayload {
  [key: string]: any;
}

export interface EventMetadata {
  requestId: string;
  correlationId: string;
}

export interface ChronosEvent {
  type: string;
  service: string;
  payload: EventPayload;
  metadata: EventMetadata;
}

export interface StoredEvent {
  id: string;
  type: string;
  service: string;
  timestamp: Date;
  payload: EventPayload;
  requestId: string;
  correlationId: string;
}

function sortEventsDeterministically(events: StoredEvent[]): StoredEvent[] {
  return [...events].sort((a, b) => {
    const timeDelta = a.timestamp.getTime() - b.timestamp.getTime();
    if (timeDelta !== 0) {
      return timeDelta;
    }
    return a.id.localeCompare(b.id);
  });
}

export async function logEvent(event: ChronosEvent): Promise<string> {
  const timestamp = new Date();
  const id = randomUUID();
  const storedEvent: StoredEvent = {
    id,
    type: event.type,
    service: event.service,
    timestamp,
    payload: event.payload,
    requestId: event.metadata.requestId,
    correlationId: event.metadata.correlationId,
  };

  try {
    await prisma.event.create({
      data: {
        id: storedEvent.id,
        type: storedEvent.type,
        service: storedEvent.service,
        timestamp: storedEvent.timestamp,
        payload: storedEvent.payload,
        requestId: storedEvent.requestId,
        correlationId: storedEvent.correlationId,
      },
    });
  } catch {
    // Fallback for local test runs when DB is unavailable.
    inMemoryEventStore.push(storedEvent);
  }

  return id;
}

export async function getEvents(options?: {
  until?: Date;
  service?: string;
  correlationId?: string;
}): Promise<StoredEvent[]> {
  try {
    const rows = await prisma.event.findMany({
      where: {
        ...(options?.until ? { timestamp: { lte: options.until } } : {}),
        ...(options?.service ? { service: options.service } : {}),
        ...(options?.correlationId
          ? { correlationId: options.correlationId }
          : {}),
      },
      orderBy: [{ timestamp: "asc" }, { id: "asc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      service: row.service,
      timestamp: row.timestamp,
      payload: row.payload as EventPayload,
      requestId: row.requestId,
      correlationId: row.correlationId,
    }));
  } catch {
    const filtered = inMemoryEventStore.filter((event) => {
      if (options?.until && event.timestamp > options.until) {
        return false;
      }
      if (options?.service && event.service !== options.service) {
        return false;
      }
      if (
        options?.correlationId &&
        event.correlationId !== options.correlationId
      ) {
        return false;
      }
      return true;
    });
    return sortEventsDeterministically(filtered);
  }
}

export function resetInMemoryEventStore(): void {
  inMemoryEventStore.length = 0;
}
