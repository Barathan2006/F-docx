# Security Specification & Hardened Rules Audit

## 1. Data Invariants
1. **Strict Role Integrity**: Users can NEVER assign or escalate their own role (`ADMIN` vs `USER`). Only existing admins or server-side verification can modify `/admins/{userId}` or private `role` fields.
2. **PII Isolation**: Email addresses, Google IDs, and login timestamps live strictly in `/users/{userId}/private/{docId}` and are readable only by the verified owner (`request.auth.uid == userId`) or a verified `ADMIN`.
3. **Form Ownership**: Only the form owner (`ownerId == request.auth.uid`) or an `ADMIN` may create, update, publish, or delete `/forms/{formId}` and `/forms/{formId}/fields/{fieldId}`.
4. **Public Read-Only Isolation**: Respondents may read a published form ONLY when `status == 'PUBLISHED'`; they can never modify form configuration, labels, validation rules, or styles.
5. **Immutable Submissions & Audit Logs**: Form responses and audit logs are strictly write-once / immutable from client SDKs; audit logs can never be updated or deleted.
6. **Verified Identity**: All authenticated writes require `request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Role Escalation**: Non-admin user writes `{ userId, googleId, email, role: "ADMIN", lastLogin, updatedAt }` to `/users/{uid}/private/info` -> **DENIED**.
2. **Shadow Ghost Field**: User writes extra `isVerifiedAdmin: true` to `/users/{uid}` -> **DENIED** by `hasOnly(...)`.
3. **Unverified Email Spoof**: Token has `email == adminEmail` with `email_verified: false` -> **DENIED**.
4. **Cross-Tenant PII Read**: User A attempts `get` on `/users/userB/private/info` -> **DENIED**.
5. **Blanket List Scraping**: User A attempts unconstrained `list` on `/forms` without owner or `PUBLISHED` status predicate -> **DENIED**.
6. **ID Poisoning**: Attacker creates `/forms/` with a 1500-char ID or invalid characters `../admin` -> **DENIED** by `isValidId()`.
7. **Owner Hijack Update**: Non-owner attempts to update `ownerId` on `/forms/{formId}` -> **DENIED** by immutability & ownership check.
8. **Draft Form Snooping**: Unauthenticated user attempts `get` on a `DRAFT` or `SUSPENDED` form -> **DENIED**.
9. **Public Form Tampering**: Anonymous respondent sends an update to `/forms/{formId}/fields/{fieldId}` -> **DENIED**.
10. **Audit Log Deletion / Tampering**: Even an admin or user attempts `update` or `delete` on `/audit_logs/{logId}` -> **DENIED** (immutable logs).
11. **Response Spoofing for Wrong Form**: Respondent submits response where `formOwnerId` doesn't match parent `/forms/{formId}` owner -> **DENIED** by `get()` Master Gate.
12. **Client Timestamp Manipulation**: Client submits backdated `createdAt` not matching `request.time` -> **DENIED** by `request.time` check.
