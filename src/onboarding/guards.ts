import { getMyUser, isOnboardingIncomplete } from "../lib/users";

export async function requireOnboardingOrHome(navigate: (route: string) => void) {
  const me = await getMyUser();
  if (isOnboardingIncomplete(me)) {
    navigate("/onboarding"); // adjust to your navigator
  } else {
    navigate("/home");
  }
}
