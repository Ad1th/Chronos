// scripts/testAuthService.ts
// Simple test script for Auth Service

import { createUser, login } from "../services/auth/authService";
import { randomUUID } from "node:crypto";

async function test() {
  const requestId = randomUUID();
  const correlationId = randomUUID();

  console.log("Creating user...");
  const user = await createUser(
    "alice@example.com",
    "password123",
    requestId,
    correlationId,
  );
  console.log("User created:", user);

  console.log("Logging in (correct password)...");
  const loginResult1 = await login(
    "alice@example.com",
    "password123",
    randomUUID(),
    correlationId,
  );
  console.log("Login result:", loginResult1);

  console.log("Logging in (wrong password)...");
  const loginResult2 = await login(
    "alice@example.com",
    "wrongpass",
    randomUUID(),
    correlationId,
  );
  console.log("Login result:", loginResult2);
}

test().catch(console.error);
