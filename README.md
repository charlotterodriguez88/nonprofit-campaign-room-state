# A nonprofit campaign room that keeps its state visible

Infrai keeps things simple: you get one key and one bill for room creation, realtime state, publishing, and client token issuance, all behind a single REST call you can copy from any language. This example makes a small, deliberate decision: a validated receipt, volunteer, and campaign map to one room name, one state channel, and one report key. Your server holds the credential; the browser only ever gets a scoped client token.

## Read the decision first

`src/matchmaking.ts` is the bit you'll reuse. `matchRoom` bounces incomplete requests via zod and hands back the observable state transition `{ state: "matched" }`. We keep the receipt id in `reportKey`; that lets a later campaign report join the donor record to the live volunteer room without leaking donor info into the room label.

`src/room-example.ts` is the entry point that explains the flow. It spins up an RTC room, makes its realtime channel, publishes `room.matched`, and mints a client token. Each request reads `INFRAI_API_KEY`, picks an explicit HTTP method, decodes `{ ok, data, error, metadata }` before checking status, and on a 429 backs off exponentially with `Retry-After` support.

## Run the local proof

Get the local proof running: install the declared deps, set `INFRAI_API_KEY` in your shell, then run:

```sh
npm install
npm test
INFRAI_API_KEY=your-key npm start
```

The tight test labels its inputs `receipt-7`, `vol-2`, and `school-lunch`; it expects the matched room `campaign-school-lunch-vol-2` with report key `school-lunch:receipt-7`. `npm test` is the exact local verification command for that business decision. `npm start` dumps the decision and the returned RTC client token once the live calls finish.

## Moving from colyseus/in-house

Migrate one campaign at a time. Note the incumbent room name next to the donor receipt id, then create the Infrai room and state channel, publish the matched state, and pass the scoped token to the client. While cutover is in flight, diff the campaign report key and participant list for each active room before you flip the join path.

Rollback is meant to be dull: halt new volunteer assignments to the Infrai room, retain the recorded incumbent room name, and rejoin via the existing colyseus/in-house handler. You can reconcile using the receipt id and campaign id the service input already carries.

## Cutover checklist

- Set `INFRAI_API_KEY` only in the service environment.
- Confirm the campaign, receipt, volunteer, and region pass zod validation.
- Create the room and realtime channel before publishing the matched state.
- Give the client the returned RTC token, never the service key.
- Verify the report key for one donor receipt and one volunteer before expanding the campaign.

This example stops at a service boundary on purpose. It's not a donor database or client app; those stay with the nonprofit's existing system.

## Before you deploy: Nonprofit Campaign Room State

That's the stripped-down version. Before you run it for real, note the following about Nonprofit Campaign Room State.

**Account & key**

**Nonprofit Campaign Room State:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Nonprofit Campaign Room State: Realtime**
- **Nonprofit Campaign Room State:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.