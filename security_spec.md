# Security Specification: Mecânico em Casa

## 1. Data Invariants
- A **User** identity represents either a Client (who creates requests) or a Professional (who accepts them).
- A **ServiceCall** (Chamado) MUST have a valid status flow: `pending` -> `accepted` -> `completed` or `cancelled`.
- A Professional MUST NOT modify the `credits` or `plan` fields manually via the client-side app (preventing infinite money attacks).
- The Client's `email` (PII) MUST be strictly isolated so that only the Client themselves can list/get it directly from the `/users/` collection.

## 2. The "Dirty Dozen" Payloads (Conceptual Defense)
1.  **Ghost Field Payload**: Injecting `{"isAdmin": true}` during profile creation. **Blocked by `isValidUser` schema exact checks.**
2.  **Credit Embezzlement**: Professional updating their `credits: 9999`. **Blocked by Update Rules asserting `incoming().credits == existing().credits`.**
3.  **Cross-Client Interference**: Client A creating a Service Call assigned to Client B. **Blocked by `incoming().clientId == request.auth.uid`.**
4.  **Shadow Acceptance**: Changing a `ServiceCall` status from `pending` straight to `completed`. **Blocked by state-machine transition guard ensuring status flows sequentially.**
5.  **PII Scraping**: Blanket `get()` on `/users` collection. **Blocked by `allow get: if request.auth.uid == userId`.**
6.  **ID Poisoning**: Payload where ID is 1500 chars of junk. **Blocked by `isValidId(userId)` regex.**
7.  **Unverified Pro**: Call accepted by someone not logged in. **Blocked by `isSignedIn()` check.**
8.  **Orphaned Updates**: Client updating `serviceRequested` after call is `accepted`. **Blocked by Immutable Fields rule inside updates.**
9.  **Stealth Deletion**: Hacker trying to delete a finalized ServiceCall to clear history. **Blocked: No `allow delete` exists.**

## 3. Deployment Log
- `firestore.rules` implemented strictly following Attribute-Based Access Control.
- Rule definitions guarantee mathematical impossibility of updating unapproved schemas (`affectedKeys().hasOnly()`).
