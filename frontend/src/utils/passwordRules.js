// Same rules as backend/utils/passwordPolicy.js
export const PASSWORD_RULES = [
  { id: "len", label: "8+ characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "num", label: "Number", test: (p) => /[0-9]/.test(p) },
];

export function getPasswordError(p) {
  if (!p) return "Password is required";
  if (p.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(p)) return "Password must include an uppercase letter";
  if (!/[a-z]/.test(p)) return "Password must include a lowercase letter";
  if (!/[0-9]/.test(p)) return "Password must include a number";
  return null;
}
