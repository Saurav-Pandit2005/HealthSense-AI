// Single source of truth for password rules (used by register + reset-password)
function validatePassword(pw) {
  if (typeof pw !== "string" || !pw) return "Password is required";
  if (pw.length < 8) return "Password must be at least 8 characters";
  if (pw.length > 72) return "Password must be 72 characters or fewer";
  if (!/[A-Z]/.test(pw)) return "Password must include an uppercase letter";
  if (!/[a-z]/.test(pw)) return "Password must include a lowercase letter";
  if (!/[0-9]/.test(pw)) return "Password must include a number";
  return null;
}

module.exports = { validatePassword };
