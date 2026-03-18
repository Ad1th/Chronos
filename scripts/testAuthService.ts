// scripts/testAuthService.ts
// Simple test script for Auth Service

import { createUser, login } from "../services/auth/authService";
import { v4 as uuidv4 } from "uuid";

async function test() {
  const requestId = uuidv4();
  const correlationId = uuidv4();

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
    uuidv4(),
    correlationId,
  );
  console.log("Login result:", loginResult1);

  console.log("Logging in (wrong password)...");
  const loginResult2 = await login(
    "alice@example.com",
    "wrongpass",
    uuidv4(),
    correlationId,
  );
  console.log("Login result:", loginResult2);
}

test().catch(console.error);
