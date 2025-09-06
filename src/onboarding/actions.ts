import { saveOnboarding } from "../lib/users";
import { signUp } from "../lib/auth";
import { OnboardingStore } from "./useOnboardingStore";

export async function setLanguages(native_language: string, target_language: string) {
  OnboardingStore.set({ native_language, target_language });
  await saveOnboarding({ native_language, target_language });
}

export async function setLevel(level: string) {
  OnboardingStore.set({ level });
  await saveOnboarding({ level });
}

export async function setTimeCommit(time_commit: string) {
  OnboardingStore.set({ time_commit });
  await saveOnboarding({ time_commit });
}

export async function setReminders(optIn: boolean) {
  OnboardingStore.set({ reminders_opt_in: optIn });
  await saveOnboarding({ reminders_opt_in: optIn });
}

export async function setHowDidYouHear(source: string) {
  OnboardingStore.set({ how_did_you_hear: source });
  await saveOnboarding({ how_did_you_hear: source });
}

export async function setSubjects(subjects: string[]) {
  OnboardingStore.set({ subjects });
  await saveOnboarding({ subjects });
}

export async function setPlan(tier: string) {
  OnboardingStore.set({ payment_tier: tier });
  await saveOnboarding({ payment_tier: tier });
}

export async function createAccount(name: string, email: string, password: string) {
  OnboardingStore.set({ name, email, password });
  // 1) Create auth user (also fires DB trigger to insert row if you added it)
  await signUp(email, password, name);
  // 2) Mirror into public.users (harmless if trigger already added an empty row)
  await saveOnboarding({ name, email });
}
