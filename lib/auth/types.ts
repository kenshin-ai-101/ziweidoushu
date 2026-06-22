export type MembershipTier = 'free' | 'monthly' | 'yearly' | 'lifetime';

export interface UserRecord {
  userId: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  membershipTier: MembershipTier;
  membershipExpiresAt?: string;
  createdAt: string;
}

/** Client-safe user shape stored in localStorage `metis_me_v1`. */
export interface PublicUser {
  userId: string;
  email?: string;
  phone?: string;
  membershipTier: MembershipTier;
  membershipExpiresAt?: string;
}

export interface SessionPayload {
  userId: string;
  membershipTier: MembershipTier;
  membershipExpiresAt?: string;
  exp: number;
}

export type CodePurpose = 'login' | 'bind';

export interface VerificationCode {
  code: string;
  purpose: CodePurpose;
  expiresAt: number;
}
