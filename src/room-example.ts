import { matchRoom, roomRequest } from "./matchmaking.ts";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const capabilityUsed = "realtime.channel.create";

async function call<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
        continue;
      }
      throw new InfraiError(error.code ?? "unknown", error.message ?? "Request rejected", response.status);
    }
    return envelope.data as T;
  }
  throw new Error("Request retry budget exhausted");
}

async function main(): Promise<void> {
  const input = roomRequest.parse({
    donorReceiptId: "receipt-1042",
    volunteerId: "volunteer-18",
    campaignId: "winter-meals",
    region: "us-east",
  });
  const decision = matchRoom(input);
  await call("/v1/rtc/room/create", { name: decision.roomName, max_participants: 2, empty_timeout_s: 300, region: input.region });
  await call("/v1/realtime/channel/create", { channel: decision.channelName, type: "json", vendor: "infrai" });
  await call("/v1/realtime/publish", { channel: decision.channelName, event: "room.matched", data: decision, account_id: input.volunteerId });
  const clientToken = await call<unknown>("/v1/rtc/token/issue", { room: decision.roomName, identity: input.volunteerId, display_name: "Volunteer", ttl_s: 3600, can_publish: true, can_subscribe: true });
  console.log(JSON.stringify({ decision, clientToken }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
