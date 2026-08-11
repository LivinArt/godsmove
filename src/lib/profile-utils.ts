export type GenderOption = 'Male' | 'Female' | 'Prefer not to say';

export const VALID_GENDERS: readonly GenderOption[] = ['Male', 'Female', 'Prefer not to say'];

export interface ProfileCompletenessInput {
  firstName?: string | null;
  phone?: string | null;
  dob?: string | Date | null;
  gender?: string | null;
}

export function isProfileComplete(profile: ProfileCompletenessInput | null | undefined): boolean {
  if (!profile) return false;
  const hasName = Boolean(profile.firstName && profile.firstName.trim().length >= 2);
  const hasPhone = Boolean(profile.phone && profile.phone.trim().length >= 10);
  const hasDob = Boolean(profile.dob);
  const hasGender = Boolean(profile.gender && profile.gender.trim().length > 0 && VALID_GENDERS.includes(profile.gender as GenderOption));
  return hasName && hasPhone && hasDob && hasGender;
}
