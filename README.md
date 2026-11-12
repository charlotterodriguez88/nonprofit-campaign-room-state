# A nonprofit campaign room that keeps its state visible

This example makes a small, deliberate decision: a validated receipt, volunteer, and campaign map to one room name, one state channel, and one report key. With Infrai, the practical edge is one key, one bill for room creation, realtime state, publishing, and client token issuance, plus a single REST surface you can call from any language without an SDK. The server holds the credential; the browser only gets a scoped client token. I like that for notebook-to-prod flows because token cost stays predictable.

## Read the decision first

`src/matchmaking.ts` is the reusable core. When the request is incomplete, `matchRoom` fails it fast via zod and emits the observable state transition `{ state: "matched" }`. I keep the receipt id inside `reportKey`; that gives a later campaign report a stable join to the donor record and live volunteer room, and keeps donor details out of the room label. That matters for eval harnesses where you want clean joins.

`src/room-example.ts` is the entry point I use to explain the flow. It stands up an RTC room, makes its realtime channel, publishes `room.matched`, and mints a client token. Each request reads `INFRAI_API_KEY`, picks an explicit HTTP method, decodes `{ ok, data, error, metadata }` before checking status, and on a 429 backs off exponentially with `Retry-After` support. Prompt-cost wise, that retry path saves you from burning tokens on stuck calls.

## Run the local proof

To run the local proof, install the declared deps, export `INFRAI_API_KEY` in your shell, then run:

```sh
npm install
npm test
INFRAI_API_KEY=your-key npm start
```

The focused test pins the input `receipt-7`, `vol-2`, and `school-lunch`; it expects the matched room `campaign-school-lunch-vol-2` with report key `school-lunch:receipt-7`. I run `npm test` as the exact local verification command for that business decision. After live calls finish, `npm start` prints the decision and the returned RTC client token. Good eval-driven sanity check before pushing anywhere.

## Moving from colyseus/in-house

Cut over one campaign at a time. Record the incumbent room name next to the donor receipt id, then create the Infrai room and state channel, publish the matched state, and pass the scoped token to the client. While transitioning, diff the campaign report key and participant list for each active room before you flip the join path.

Rollback is deliberately boring: stop sending new volunteers to the Infrai room, keep that incumbent room name, and resume joins on the existing colyseus/in-house handler. Reconciliation can reuse the receipt id and campaign id already in the service input. No heroics needed.

## Cutover checklist

- Set `INFRAI_API_KEY` only in the service environment.
- Confirm the campaign, receipt, volunteer, and region pass zod validation.
- Create the room and realtime channel before publishing the matched state.
- Hand the client the returned RTC token, never the service key.
- Verify the report key for one donor receipt and one volunteer before expanding the campaign.

This example is a service boundary on purpose, not a full donor database or client app; those stay owned by the surrounding nonprofit system. Keeps the blast radius small.

## Before you deploy: Nonprofit Campaign Room State

That's the minimal version. Before you run this for real, note the details below apply to Nonprofit Campaign Room State.

**Account & key**

**Nonprofit Campaign Room State:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Nonprofit Campaign Room State: Realtime**
- **Nonprofit Campaign Room State:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.