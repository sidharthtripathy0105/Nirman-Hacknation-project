# OmniTrade Firestore Security Specification

## 1. Data Invariants
1. **Identity & Split PII Isolation**:
   - Public storefront attributes (`/users/{userId}`) contain zero PII (`email`, `phone`, `address`, `taxId`).
   - Private PII (`/users/{userId}/private/{docId}`) can only be read or written by the authenticated user where `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
   - Subcollection writes enforce parent existence (`exists` / `existsAfter` on `/users/{userId}`).
   - User `role` (`customer`, `retailer`, `wholesaler`) is strictly validated on create and immutable on update (`incoming().role == existing().role`).
2. **Order Ownership & Terminal State Locking**:
   - Orders can only be read (`get`/`list`) by their `buyerId` or `sellerId`.
   - Orders cannot be created on behalf of another buyer (`incoming().buyerId == request.auth.uid`).
   - Once an order reaches `delivered` or `cancelled`, it is terminally locked against further updates.
3. **Catalog & Audit Integrity**:
   - Every string enforces bounded `.size()` checks; all IDs match `^[a-zA-Z0-9_\-]+$`.
   - `createdAt` and `updatedAt` are strictly validated against `request.time` (server timestamps).
   - `inventoryLogs` can only be created when `actorId == request.auth.uid` and queried only by `actorId`.

## 2. The "Dirty Dozen" Adversarial Test Payloads
1. **Privilege Escalation (Role Mutation)**: Update `/users/{uid}` changing `role` from `"customer"` to `"wholesaler"` -> `PERMISSION_DENIED`.
2. **Ghost / Shadow Field Injection**: Create `/users/{uid}` with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
3. **Cross-User PII Read**: Read `/users/{victimUid}/private/info` as `{attackerUid}` -> `PERMISSION_DENIED`.
4. **Unverified Email Spoofing**: Write `/orders/{orderId}` with `email_verified: false` -> `PERMISSION_DENIED`.
5. **Buyer Impersonation**: Create `/orders/{orderId}` with `buyerId: victimUid` while signed in as `attackerUid` -> `PERMISSION_DENIED`.
6. **Terminal Order Reopening**: Update `/orders/{orderId}` where existing `status == "delivered"` back to `"processing"` -> `PERMISSION_DENIED`.
7. **Order Total Tampering**: Update `/orders/{orderId}` with `affectedKeys` containing `totalAmount` -> `PERMISSION_DENIED`.
8. **Blanket Order List Scraping**: List `/orders` without buyerId/sellerId match -> `PERMISSION_DENIED`.
9. **Resource Exhaustion (1.5KB ID Poisoning)**: Create `/orders/{1500_char_id}` -> `PERMISSION_DENIED`.
10. **Client Timestamp Forgery**: Create `/orders/{orderId}` with client-supplied `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
11. **Unbounded Line-Item Array**: Create `/orders/{orderId}` with 30 items (`> 25` cap) -> `PERMISSION_DENIED`.
12. **Orphaned Private Profile**: Create `/users/{uid}/private/info` without `/users/{uid}` parent document -> `PERMISSION_DENIED`.
