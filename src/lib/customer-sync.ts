import { prisma } from '@/lib/prisma';
import { Prisma, UserRole } from '@prisma/client';

export interface CustomerDetailsInput {
  name?: string | null;
  phone?: string | null;
  dob?: string | Date | null;
  gender?: string | null;
}

export interface GoogleAuthMetadata {
  full_name?: string | null;
  name?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  phone?: string | null;
}

/**
 * Race-condition safe GM ID Generator.
 * Allocates GM IDs in format GM-XXXXXX (e.g., GM-000001, GM-000026).
 * Must be executed inside a Prisma transaction or with db-level unique collision handling.
 */
export async function generateUniqueGodsmoveId(
  tx: Prisma.TransactionClient
): Promise<string> {
  const existingProfiles = await tx.profile.findMany({
    where: {
      godsmoveId: {
        startsWith: 'GM-',
      },
    },
    select: {
      godsmoveId: true,
    },
  });

  let maxNum = 0;
  for (const p of existingProfiles) {
    if (p.godsmoveId && !p.godsmoveId.startsWith('GM-QA-')) {
      const parts = p.godsmoveId.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  return `GM-${String(nextNum).padStart(6, '0')}`;
}

/**
 * Checks if a stored firstName appears to be an email username fallback (e.g. malviyarohit2007).
 */
export function isEmailUsernameFallback(name: string | null | undefined, email: string): boolean {
  if (!name || !email) return false;
  const cleanName = name.trim().toLowerCase();
  const emailPrefix = email.split('@')[0].trim().toLowerCase();
  return cleanName === emailPrefix || cleanName === 'user';
}

/**
 * Synchronizes or creates the canonical customer profile for a given auth user ID.
 * Guarantees:
 * - Permanent GM ID assignment (GM-XXXXXX).
 * - Deterministic name/mobile/dob/gender field precedence.
 * - NEVER persists email username strings as real names.
 * - Idempotent 1-year VIP Early Access membership creation if requested.
 */
export async function syncCanonicalCustomer(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    email: string;
    role?: UserRole;
    details?: CustomerDetailsInput;
    googleMetadata?: GoogleAuthMetadata;
    isEarlyAccessRegistration?: boolean;
    registrationTimestamp?: Date;
  }
) {
  const {
    userId,
    email,
    role = 'CUSTOMER',
    details,
    googleMetadata,
    isEarlyAccessRegistration = false,
    registrationTimestamp = new Date(),
  } = params;

  const cleanEmail = email.toLowerCase().trim();

  // Look up existing profile
  const existingProfile = await tx.profile.findUnique({
    where: { id: userId },
    include: { membership: true },
  });

  // 1. Resolve Canonical Name
  // Precedence: Existing valid name (not email prefix string) -> Submitted details name -> Google profile name -> null
  let resolvedFirstName: string | null = null;
  let resolvedLastName: string | null = null;

  // Google name resolution
  const googleFullName = googleMetadata?.full_name || googleMetadata?.name;
  let googleFirstName: string | null = null;
  let googleLastName: string | null = null;

  if (googleFullName && googleFullName.trim()) {
    const parts = googleFullName.trim().split(' ');
    googleFirstName = parts[0];
    googleLastName = parts.slice(1).join(' ') || null;
  } else {
    googleFirstName = googleMetadata?.given_name || null;
    googleLastName = googleMetadata?.family_name || null;
  }

  // Submitted details name resolution
  let submittedFirstName: string | null = null;
  let submittedLastName: string | null = null;
  if (details?.name && details.name.trim()) {
    const parts = details.name.trim().split(' ');
    submittedFirstName = parts[0];
    submittedLastName = parts.slice(1).join(' ') || null;
  }

  // Evaluate existing name
  if (existingProfile?.firstName && !isEmailUsernameFallback(existingProfile.firstName, cleanEmail)) {
    resolvedFirstName = existingProfile.firstName;
    resolvedLastName = existingProfile.lastName || submittedLastName || googleLastName || null;
  } else if (submittedFirstName) {
    resolvedFirstName = submittedFirstName;
    resolvedLastName = submittedLastName || googleLastName || null;
  } else if (googleFirstName) {
    resolvedFirstName = googleFirstName;
    resolvedLastName = googleLastName || null;
  } else {
    resolvedFirstName = null;
    resolvedLastName = null;
  }

  // 2. Resolve Phone
  const cleanPhone = (phoneStr?: string | null): string | null => {
    if (!phoneStr) return null;
    const digits = phoneStr.replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 10) return digits;
    return digits;
  };

  const submittedPhone = cleanPhone(details?.phone);
  const googlePhone = cleanPhone(googleMetadata?.phone);

  const resolvedPhone =
    existingProfile?.phone ||
    submittedPhone ||
    googlePhone ||
    null;

  // 3. Resolve DOB
  let resolvedDob: Date | null = existingProfile?.dob || null;
  if (!resolvedDob && details?.dob) {
    const d = new Date(details.dob);
    if (!isNaN(d.getTime())) {
      resolvedDob = d;
    }
  }

  // 4. Resolve Gender
  const resolvedGender =
    existingProfile?.gender ||
    details?.gender ||
    null;

  // 5. Resolve GM ID (Permanent Business ID)
  let resolvedGodsmoveId = existingProfile?.godsmoveId || null;
  if (!resolvedGodsmoveId) {
    resolvedGodsmoveId = await generateUniqueGodsmoveId(tx);
  }

  // 6. Early Access Flags
  const earlyAccessRegistered =
    isEarlyAccessRegistration || (existingProfile?.earlyAccessRegistered ?? false);

  const earlyAccessRegisteredAt =
    existingProfile?.earlyAccessRegisteredAt ||
    (earlyAccessRegistered ? registrationTimestamp : null);

  const earlyAccessBenefitsEligible =
    earlyAccessRegistered || (existingProfile?.earlyAccessBenefitsEligible ?? false);

  // 7. Upsert / Update Profile
  let profile: typeof existingProfile;
  if (!existingProfile) {
    profile = await tx.profile.create({
      data: {
        id: userId,
        email: cleanEmail,
        godsmoveId: resolvedGodsmoveId,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        phone: resolvedPhone,
        dob: resolvedDob,
        gender: resolvedGender,
        role: cleanEmail === 'livinarttech@gmail.com' ? 'ADMIN' : role,
        tier: 'STANDARD',
        earlyAccessRegistered,
        earlyAccessRegisteredAt,
        earlyAccessBenefitsEligible,
      },
      include: { membership: true },
    });
  } else {
    profile = await tx.profile.update({
      where: { id: userId },
      data: {
        email: cleanEmail,
        godsmoveId: resolvedGodsmoveId,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        phone: resolvedPhone,
        dob: resolvedDob,
        gender: resolvedGender,
        earlyAccessRegistered,
        earlyAccessRegisteredAt,
        earlyAccessBenefitsEligible,
      },
      include: { membership: true },
    });
  }

  // 8. Provision Wallet if missing
  const wallet = await tx.wallet.findUnique({ where: { profileId: userId } });
  if (!wallet) {
    await tx.wallet.create({
      data: {
        profileId: userId,
        balance: 0,
      },
    });
  }

  // 9. Membership Entitlement Provisioning (1-Year VIP Early Access Membership)
  let membershipActivated = false;
  const oneYearFromReg = new Date(registrationTimestamp.getTime() + 365 * 24 * 60 * 60 * 1000);

  if (earlyAccessRegistered) {
    if (!profile.membership) {
      await tx.membership.create({
        data: {
          profileId: userId,
          status: 'ACTIVE',
          source: 'EARLY_ACCESS',
          activatedAt: registrationTimestamp,
          expiresAt: oneYearFromReg,
          tier: 'VIP',
        },
      });
      membershipActivated = true;
    } else if (profile.membership.status !== 'ACTIVE') {
      await tx.membership.update({
        where: { profileId: userId },
        data: {
          status: 'ACTIVE',
          source: 'EARLY_ACCESS',
          activatedAt: profile.membership.activatedAt || registrationTimestamp,
          expiresAt: oneYearFromReg,
          tier: 'VIP',
        },
      });
      membershipActivated = true;
    }
  }

  return {
    profile,
    godsmoveId: resolvedGodsmoveId,
    membershipActivated,
  };
}

/**
 * Atomic Early Access Registration execution.
 * Wraps canonical customer sync, Early Access flags, GM ID generation, and 1-year membership in a single transaction.
 */
export async function executeEarlyAccessRegistration(
  userId: string,
  onboardingDetails?: CustomerDetailsInput,
  googleMetadata?: GoogleAuthMetadata
) {
  let attempt = 0;
  let result: any = null;

  while (attempt < 5) {
    try {
      result = await prisma.$transaction(async (tx) => {
        const userProfile = await tx.profile.findUnique({ where: { id: userId } });
        if (!userProfile) {
          throw new Error(`Profile not found for userId ${userId}`);
        }

        return await syncCanonicalCustomer(tx, {
          userId,
          email: userProfile.email,
          role: userProfile.role,
          details: onboardingDetails,
          googleMetadata,
          isEarlyAccessRegistration: true,
          registrationTimestamp: new Date(),
        });
      });

      break;
    } catch (err: any) {
      attempt++;
      const isCollision =
        err.code === 'P2002' ||
        String(err.message || '').includes('godsmoveId') ||
        String(err.message || '').includes('UniqueConstraintViolation');

      if (isCollision) {
        console.warn(`[GM ID Collision] Retrying GM ID generation (attempt ${attempt}/5)...`);
        if (attempt >= 5) throw err;
        // Brief exponential backoff before retry to allow concurrent tx to commit
        await new Promise((resolve) => setTimeout(resolve, attempt * 50));
      } else {
        throw err;
      }
    }
  }

  if (result?.profile) {
    const profile = result.profile;
    const idempotencyKey = `EARLY_ACCESS_${userId}`;

    prisma.notificationHistory.findUnique({
      where: { idempotencyKey },
    }).then(async (existingNotification) => {
      if (!existingNotification) {
        try {
          const { NotificationService } = await import('@/notifications/notification.service');
          const recipientName = profile.firstName
            ? `${profile.firstName} ${profile.lastName || ''}`.trim()
            : 'Valued Collector';

          await NotificationService.notifyEarlyAccessConfirmation(
            {
              email: profile.email,
              name: recipientName,
              userId: profile.id,
            },
            {
              customerName: recipientName,
              email: profile.email,
            }
          );

          await prisma.notificationHistory.create({
            data: {
              idempotencyKey,
              profileId: profile.id,
              email: profile.email,
              channel: 'EMAIL',
              eventType: 'EARLY_ACCESS_CONFIRMED',
              status: 'SENT',
              subject: 'GODSMOVƎ Early Access Confirmed — Launch Benefits Active',
            },
          });
        } catch (err: any) {
          console.error('Non-critical background email dispatch error:', err);
        }
      }
    }).catch((err) => {
      console.error('Notification check warning:', err);
    });
  }

  return result;
}
