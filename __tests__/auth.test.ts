import { authErrorMessage, isAlreadyRegistered, needsEmailConfirmation } from '../src/lib/auth';

jest.mock('../src/lib/supabase', () => ({
  __esModule: true,
  supabase: { auth: { signUp: jest.fn(), signInWithPassword: jest.fn() } },
  SUPABASE_MISCONFIGURED: false,
  SUPABASE_CONFIG_HINT: 'set up .env',
}));

describe('authErrorMessage', () => {
  it('never leaks the raw "Network request failed" string', () => {
    const cases = [
      new Error('Network request failed'),
      new TypeError('Failed to fetch'),
      { message: 'Network request failed' },
      { message: 'networkerror' },
    ];
    for (const e of cases) {
      const msg = authErrorMessage(e);
      expect(msg).not.toMatch(/network request failed/i);
      expect(msg).toMatch(/internet connection/i);
    }
  });

  it('explains the disabled-email-provider case with the dashboard path', () => {
    const msg = authErrorMessage({
      error_code: 'email_provider_disabled',
      msg: 'Email signups are disabled',
      message: 'Email signups are disabled',
    });
    expect(msg).toMatch(/Authentication/);
    expect(msg).toMatch(/Email/);
    expect(msg).toMatch(/Enable/);
    // it must NOT dump the raw API message at the user
    expect(msg).not.toBe('Email signups are disabled');
  });

  it('passes through a genuine credential error unchanged', () => {
    expect(authErrorMessage(new Error('Invalid login credentials'))).toBe('Invalid login credentials');
  });

  it('handles strings, Error objects and API-shaped objects', () => {
    expect(authErrorMessage('boom')).toBe('boom');
    expect(authErrorMessage(new Error('boom'))).toBe('boom');
    expect(authErrorMessage({ error_description: 'from_description' })).toBe('from_description');
    expect(authErrorMessage({ msg: 'from_msg' })).toBe('from_msg');
  });

  it('always returns something non-empty', () => {
    for (const e of [null, undefined, {}, new Error('')]) {
      expect(authErrorMessage(e).length).toBeGreaterThan(0);
    }
  });

  it('calls out rate limiting separately from network failure', () => {
    const msg = authErrorMessage({ error_code: 'over_email_send_rate_limit', message: 'Email rate limit exceeded' });
    expect(msg).toMatch(/too many attempts/i);
  });
});

describe('isAlreadyRegistered', () => {
  it('detects the duplicate-signup family', () => {
    expect(isAlreadyRegistered(new Error('User already registered'))).toBe(true);
    expect(isAlreadyRegistered({ message: 'A user with this email address has already been registered' })).toBe(true);
  });

  it('does not fire on unrelated errors', () => {
    expect(isAlreadyRegistered(new Error('Invalid login credentials'))).toBe(false);
    expect(isAlreadyRegistered(new Error('Network request failed'))).toBe(false);
  });
});

describe('needsEmailConfirmation', () => {
  it('is true only when Supabase returned no session', () => {
    expect(needsEmailConfirmation(null)).toBe(true);
    expect(needsEmailConfirmation(undefined)).toBe(true);
    expect(needsEmailConfirmation({ access_token: 'a' })).toBe(false);
  });
});