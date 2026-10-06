import { SUPABASE_CONFIG_HINT, SUPABASE_MISCONFIGURED, supabase } from './supabase';

/**
 * Auth error handling.
 *
 * Two things this fixes:
 * - "Network request failed" is a raw fetch/DNS failure and tells the user
 *   nothing. It is rewritten into an actionable sentence.
 * - "confirm your email" is only true when the project actually has email
 *   confirmation switched on. Saying it unconditionally locks people out of
 *   an app whose SMTP/autoconfirm settings mean they are already signed in.
 */

const CONFIG_ERR = 'Supabase is not configured';
export { CONFIG_ERR };

/**
 * Turn any thrown/rejected value into a message a user can act on.
 * `error_code` is preferred over `msg` when Supabase sends it, because the
 * codes are stable and unambiguous where the prose is not.
 */
export function authErrorMessage(e: unknown): string {
  if (SUPABASE_MISCONFIGURED) return SUPABASE_CONFIG_HINT;

  const code = String((e as any)?.error_code ?? (e as any)?.code ?? '');
  const raw =
    typeof e === 'string'
      ? e
      : ((e as any)?.message as string | undefined) ??
        ((e as any)?.error_description as string | undefined) ??
        ((e as any)?.msg as string | undefined) ??
        '';
  const all = `${code} ${raw}`;

  if (/email_provider_disabled/i.test(all)) {
    return (
      'Sign-up is switched off on the Supabase project. Turn it on in the dashboard: ' +
      'Authentication → Sign In / Providers → Email → Enable, then try again.'
    );
  }
  if (/network request failed|failed to fetch|networkerror|load failed/i.test(all)) {
    return 'Cannot reach the server. Check your internet connection, then try again.';
  }
  if (/email rate limit|too many|rate_limit/i.test(all)) {
    return 'Too many attempts just now. Wait a minute and try again.';
  }
  if (!raw && !code) return 'Something went wrong. Please try again.';
  return raw || 'Sign-in failed. Please try again.';
}

/** True when the signup response means "go confirm your inbox". */
export function needsEmailConfirmation(session: unknown): boolean {
  return !session;
}

/** True for the "user already exists" family of signup errors. */
export function isAlreadyRegistered(e: unknown): boolean {
  const msg = authErrorMessage(e);
  return /already registered|already been registered|already exists|user_already_exists/i.test(msg);
}

export type SignUpResult =
  | { status: 'session'; session: unknown }
  | { status: 'confirm-email' }
  | { status: 'error'; message: string };

export type SignInResult =
  | { status: 'ok' }
  | { status: 'error'; message: string; needsConfirmation: boolean };

/**
 * Sign up, then report what actually happened.
 * - 'session'      → autoconfirm is on, user is signed in right away
 * - 'confirm-email'→ the project really does require inbox confirmation
 * - 'error'        → actionable message from authErrorMessage
 */
export async function signUpAndReport(opts: {
  email: string;
  password: string;
}): Promise<SignUpResult> {
  if (SUPABASE_MISCONFIGURED) return { status: 'error', message: SUPABASE_CONFIG_HINT };
  try {
    const { data, error } = await supabase.auth.signUp(opts);
    if (error) return { status: 'error', message: authErrorMessage(error) };
    if (needsEmailConfirmation(data?.session)) return { status: 'confirm-email' };
    return { status: 'session', session: data.session };
  } catch (e) {
    return { status: 'error', message: authErrorMessage(e) };
  }
}

export async function signInAndReport(opts: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  if (SUPABASE_MISCONFIGURED) return { status: 'error', message: SUPABASE_CONFIG_HINT, needsConfirmation: false };
  try {
    const { data, error } = await supabase.auth.signInWithPassword(opts);
    if (error) {
      const message = authErrorMessage(error);
      return {
        status: 'error',
        message,
        // "Email not confirmed" is the one login error that is really about the inbox.
        needsConfirmation: /not confirmed/i.test(message),
      };
    }
    if (needsEmailConfirmation(data?.session)) {
      return {
        status: 'error',
        message: 'Confirm your email address first, then log in.',
        needsConfirmation: true,
      };
    }
    return { status: 'ok' };
  } catch (e) {
    return { status: 'error', message: authErrorMessage(e), needsConfirmation: false };
  }
}