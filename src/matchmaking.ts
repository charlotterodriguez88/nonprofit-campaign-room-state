import { z } from "zod";

export const roomRequest = z.object({
  donorReceiptId: z.string().min(1),
  volunteerId: z.string().min(1),
  campaignId: z.string().min(1),
  region: z.string().min(1),
});

export type RoomRequest = z.infer<typeof roomRequest>;

export type RoomDecision = {
  roomName: string;
  channelName: string;
  state: "matched";
  reportKey: string;
};

export function matchRoom(input: RoomRequest): RoomDecision {
  const parsed = roomRequest.parse(input);
  const roomName = `campaign-${parsed.campaignId}-${parsed.volunteerId}`;
  return {
    roomName,
    channelName: `${roomName}-state`,
    state: "matched",
    reportKey: `${parsed.campaignId}:${parsed.donorReceiptId}`,
  };
}
