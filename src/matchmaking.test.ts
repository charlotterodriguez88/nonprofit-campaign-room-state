import test from "node:test";
import assert from "node:assert/strict";
import { matchRoom } from "./matchmaking.ts";

test("a receipt and volunteer join one campaign room with a report key", () => {
  const result = matchRoom({ donorReceiptId: "receipt-7", volunteerId: "vol-2", campaignId: "school-lunch", region: "eu" });
  assert.deepEqual(result, {
    roomName: "campaign-school-lunch-vol-2",
    channelName: "campaign-school-lunch-vol-2-state",
    state: "matched",
    reportKey: "school-lunch:receipt-7",
  });
});
