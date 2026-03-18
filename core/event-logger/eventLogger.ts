// core/event-logger/eventLogger.ts
// Centralized event logger for Chronos

import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

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

export async function logEvent(event: ChronosEvent) {
  const now = new Date();
  const eventId = uuidv4();
  await prisma.event.create({
    data: {
      id: eventId,
      type: event.type,
      service: event.service,
      timestamp: now,
      payload: event.payload,
      requestId: event.metadata.requestId,
      correlationId: event.metadata.correlationId,
    },
  });
  return eventId;
}
