import { supabase } from "./supabase";

export type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  native_language: string | null;
  target_language: string | null;
  subjects: string[] | null;
  level: string | null;
  created_at: string | null;
  last_active: string | null;
  aim: string | null;               // matches your "Aim" column normalized to lower-case
  time_commit: string | null;       // store "5 min/day" OR switch to number if you altered schema
  how_did_you_hear: string | null;
  payment_tier: string | null;      // "free" | "annual" | "lifetime" | etc.
  reminders_opt_in: boolean | null; // added in SQL step
};

export type OnboardingData = Partial<
  Pick<
    UserRow,
    | "email"
    | "name"
    | "native_language"
    | "target_language"
    | "subjects"
    | "level"
    | "aim"
    | "time_commit"
    | "how_did_you_hear"
    | "payment_tier"
    | "reminders_opt_in"
  >
>;

export async function getMyUser(): Promise<UserRow | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data as UserRow;
}

export async function saveOnboarding(values: OnboardingData) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!user) throw new Error("Not signed in");

  const payload = { id: user.id, ...values };

  const { error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" }); // RLS requires id = auth.uid()

  if (error) throw error;
}

export function isOnboardingIncomplete(u: UserRow | null) {
  if (!u) return true;
  // define "complete" for gating; adjust to your needs
  return !(
    u.native_language &&
    u.target_language &&
    u.level &&
    u.time_commit
  );
}

export async function touchLastActive() {
  // Optional RPC if you created it; no-op if missing
  try {
    // await supabase.rpc("touch_last_active");
  } catch {}
}
