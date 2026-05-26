type ErrorMapping = {
  pattern: RegExp;
  message: string;
};

const ERROR_MAPPINGS: ErrorMapping[] = [
  {
    pattern: /email.?rate.?limit|rate.?limit.*email|over_email_send_rate_limit/i,
    message:
      "We\u2019ve sent too many emails recently. Please wait a few minutes before trying again.",
  },
  {
    pattern: /email.*not.*authorized|not.*authorized.*email/i,
    message:
      "This email address cannot receive messages from our system right now. Please try a different email or try again later.",
  },
  {
    pattern: /rate.?limit|too.?many.?requests|429/i,
    message:
      "We\u2019re receiving too many requests. Please wait a moment and try again.",
  },
  {
    pattern: /invalid.?login.?credentials|invalid.*password/i,
    message:
      "The email or password you entered doesn\u2019t match our records. Please try again.",
  },
  {
    pattern: /email.?not.?confirmed/i,
    message:
      "Please check your email and confirm your account before signing in.",
  },
  {
    pattern: /user.?already.?registered|already.*exists/i,
    message:
      "An account with this email already exists. Try signing in instead.",
  },
  {
    pattern: /signup.*disabled|signups.*not.*allowed/i,
    message:
      "New registrations are temporarily paused. Please try again later.",
  },
  {
    pattern: /invalid.*otp|otp.*expired|token.*expired|magic.*link.*expired/i,
    message:
      "This link has expired. Please request a new one and try again.",
  },
  {
    pattern: /network|fetch|ECONNREFUSED|timeout|ETIMEDOUT/i,
    message:
      "We\u2019re having trouble connecting right now. Please check your connection and try again.",
  },
  {
    pattern: /provider.*not.*enabled|provider.*not.*configured/i,
    message:
      "This sign-in method isn\u2019t available right now. Please use another option.",
  },
  {
    pattern: /weak.*password|password.*too.*short/i,
    message:
      "Please choose a stronger password \u2014 at least 8 characters with some variety.",
  },
  {
    pattern: /invalid.*email|email.*invalid/i,
    message: "Please enter a valid email address.",
  },
  {
    pattern: /session.*expired|refresh.*token/i,
    message:
      "Your session has expired. Please sign in again.",
  },
];

const GENERIC_MESSAGE =
  "Something went wrong. Please try again shortly.";

export function humanizeAuthError(raw: string | null | undefined): string {
  if (!raw) return GENERIC_MESSAGE;

  for (const { pattern, message } of ERROR_MAPPINGS) {
    if (pattern.test(raw)) return message;
  }

  return GENERIC_MESSAGE;
}

export function isRateLimitError(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return /rate.?limit|too.?many|429|over_email_send_rate_limit/i.test(raw);
}
