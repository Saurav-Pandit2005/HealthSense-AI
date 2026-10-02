import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "../utils/passwordRules";

export default function PasswordChecklist({ password }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 -mt-2 mb-4" aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.id} className={`flex items-center gap-1.5 text-xs ${ok ? "text-mint-600 font-medium" : "text-muted"}`}>
            {ok ? <Check size={13} strokeWidth={3} /> : <Circle size={13} />}
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}
