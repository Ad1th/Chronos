// scripts/replay.ts
// CLI helper to print full reconstructed state.

import { replayFull } from "../core/replay-engine/replayEngine";

async function main() {
  const state = await replayFull();
  console.log(JSON.stringify(state, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
