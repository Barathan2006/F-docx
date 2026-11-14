/**
 * Security Rules Adversarial Verification Matrix ("Dirty Dozen")
 * Maps each attack vector to the enforcing rule guard in firestore.rules.
 */

export interface SecurityTestCase {
  id: string;
  name: string;
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED';
  enforcingGuard: string;
}

export const DIRTY_DOZEN_CASES: SecurityTestCase[] = [
  {
    id: 'DD-01',
    name: 'Self-role escalation in user private PII doc',
    path: '/users/user123/private/info',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: "incoming().role == 'USER' || isAdmin()",
  },
  {
    id: 'DD-02',
    name: 'Shadow ghost field injection on user public profile',
    path: '/users/user123',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: "data.keys().hasOnly(['userId', 'fullName', 'profilePictureUrl', 'accountStatus', 'createdAt', 'updatedAt'])",
  },
  {
    id: 'DD-03',
    name: 'Unverified email spoof attempt',
    path: '/forms/form_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: 'isVerifiedUser() -> request.auth.token.email_verified == true',
  },
  {
    id: 'DD-04',
    name: 'Cross-tenant PII read',
    path: '/users/victim_uid/private/info',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: 'isOwner(userId) || isAdmin()',
  },
  {
    id: 'DD-05',
    name: 'Blanket list scraping of private draft forms',
    path: '/forms',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: "resource.data.status == 'PUBLISHED' || (isSignedIn() && resource.data.ownerId == request.auth.uid) || isAdmin()",
  },
  {
    id: 'DD-06',
    name: 'Oversized or traversal document ID poisoning',
    path: '/forms/..%2Fadmins',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: "isValidId(formId) -> id.matches('^[a-zA-Z0-9_\\\\-]+$') && id.size() <= 128",
  },
  {
    id: 'DD-07',
    name: 'Ownership hijack via update',
    path: '/forms/form_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: 'incoming().ownerId == existing().ownerId',
  },
  {
    id: 'DD-08',
    name: 'Draft or suspended form snooping by public',
    path: '/forms/draft_form_1',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: "resource.data.status == 'PUBLISHED' || isOwner(resource.data.ownerId) || isAdmin()",
  },
  {
    id: 'DD-09',
    name: 'Public respondent tampering with form field schema',
    path: '/forms/form_1/fields/field_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: 'isFormOwner(formId) || isAdmin()',
  },
  {
    id: 'DD-10',
    name: 'Audit log deletion or mutation',
    path: '/audit_logs/log_1',
    operation: 'delete',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: 'allow update, delete: if false;',
  },
  {
    id: 'DD-11',
    name: 'Response formOwnerId mismatch',
    path: '/forms/form_1/responses/resp_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: "get(/databases/$(database)/documents/forms/$(formId)).data.ownerId == incoming().formOwnerId",
  },
  {
    id: 'DD-12',
    name: 'Backdated client timestamp injection',
    path: '/forms/form_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGuard: 'incoming().createdAt == request.time && incoming().updatedAt == request.time',
  },
];
