import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { TextInput } from "./ui/Field";

export default function PasswordInput({ id, value, onChange, error, placeholder = "••••••••", autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <TextInput
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        error={error}
        autoComplete={autoComplete}
        className="pl-9 pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-md text-muted hover:text-ink focus-ring"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
