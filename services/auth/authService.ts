// services/auth/authService.ts
// Auth Service for Chronos: emits USER_CREATED and LOGIN events

import { logEvent } from "../../core/event-logger/eventLogger";
import { v4 as uuidv4 } from "uuid";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// In-memory user store for demo (no persistence)
const users: User[] = [];

export async function createUser(
  email: string,
  password: string,
  requestId: string,
  correlationId: string,
) {
  const user: User = {
    id: uuidv4(),
    email,
    passwordHash: `hashed:${password}`,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await logEvent({
    type: "USER_CREATED",
    service: "auth",
    payload: { userId: user.id, email: user.email },
    metadata: { requestId, correlationId },
  });
  return user;
}

export async function login(
  email: string,
  password: string,
  requestId: string,
  correlationId: string,
) {
  const user = users.find((u) => u.email === email);
  const success = !!user && user.passwordHash === `hashed:${password}`;
  await logEvent({
    type: "LOGIN",
    service: "auth",
    payload: { email, success },
    metadata: { requestId, correlationId },
  });
  return { success };
}
