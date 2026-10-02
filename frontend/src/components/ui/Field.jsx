// export function Field({ label, htmlFor, hint, error, required, children }) {
//   return (
//     <div className="mb-4">
//       {label && (
//         <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">
//           {label} {required && <span className="text-coral-500">*</span>}
//         </label>
//       )}
//       {children}
//       {error ? (
//         <p className="mt-1.5 text-xs text-coral-500 font-medium">{error}</p>
//       ) : hint ? (
//         <p className="mt-1.5 text-xs text-muted">{hint}</p>
//       ) : null}
//     </div>
//   );
// }

// const base =
//   "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 " +
//   "focus-ring transition-colors outline-none disabled:bg-canvas disabled:text-muted";

// export function TextInput({ error, className = "", ...props }) {
//   return (
//     <input
//       className={`${base} ${error ? "border-coral-400 focus:border-coral-400" : "border-line/10 focus:border-brand-400"} ${className}`}
//       {...props}
//     />
//   );
// }

// export function TextArea({ error, className = "", ...props }) {
//   return (
//     <textarea
//       className={`${base} min-h-[90px] resize-y ${error ? "border-coral-400" : "border-line/10 focus:border-brand-400"} ${className}`}
//       {...props}
//     />
//   );
// }

// export function Select({ error, className = "", children, ...props }) {
//   return (
//     <select
//       className={`${base} appearance-none bg-no-repeat pr-9 ${error ? "border-coral-400" : "border-line/10 focus:border-brand-400"} ${className}`}
//       style={{
//         backgroundImage:
//           "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A9BB3' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
//         backgroundPosition: "right 0.75rem center",
//       }}
//       {...props}
//     >
//       {children}
//     </select>
//   );
// }

// export function ChipToggle({ selected, onClick, children, type = "button" }) {
//   return (
//     <button
//       type={type}
//       onClick={onClick}
//       className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all focus-ring ${
//         selected
//           ? "bg-brand-500 border-brand-500 text-white shadow-sm"
//           : "bg-surface border-line/10 text-muted hover:border-brand-300 hover:text-brand-500"
//       }`}
//     >
//       {children}
//     </button>
//   );
// }

// export function TagInput({ tags, onChange, placeholder }) {
//   function addTag(e) {
//     if ((e.key === "Enter" || e.key === ",") && e.target.value.trim()) {
//       e.preventDefault();
//       const value = e.target.value.trim().replace(/,$/, "");
//       if (value && !tags.includes(value)) onChange([...tags, value]);
//       e.target.value = "";
//     } else if (e.key === "Backspace" && !e.target.value && tags.length > 0) {
//       onChange(tags.slice(0, -1));
//     }
//   }
//   return (
//     <div className="flex flex-wrap items-center gap-1.5 w-full rounded-lg border border-line/10 bg-surface px-2.5 py-2 focus-within:border-brand-400 transition-colors">
//       {tags.map((tag) => (
//         <span key={tag} className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs font-medium pl-2 pr-1 py-1 rounded-full">
//           {tag}
//           <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:bg-brand-100 rounded-full p-0.5 leading-none">
//             ×
//           </button>
//         </span>
//       ))}
//       <input
//         type="text"
//         onKeyDown={addTag}
//         placeholder={tags.length === 0 ? placeholder : ""}
//         className="flex-1 min-w-[100px] text-sm text-ink bg-transparent outline-none placeholder:text-muted/60 py-0.5"
//       />
//     </div>
//   );
// }

// export function Toggle({ checked, onChange, label }) {
//   return (
//     <button
//       type="button"
//       onClick={() => onChange(!checked)}
//       className="flex items-center gap-2.5 focus-ring rounded-full"
//     >
//       <span
//         className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-line/15"}`}
//       >
//         <span
//           className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
//             checked ? "translate-x-4" : "translate-x-0"
//           }`}
//         />
//       </span>
//       {label && <span className="text-sm text-ink">{label}</span>}
//     </button>
//   );
// }

// export function Button({ children, variant = "primary", className = "", loading, ...props }) {
//   const variants = {
//     primary: "bg-brand-500 text-white hover:bg-brand-600 dark:hover:bg-brand-500 dark:hover:brightness-110 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed",
//     secondary: "bg-brand-50 text-brand-600 hover:bg-brand-100",
//     ghost: "bg-transparent text-muted hover:bg-line/[0.03]",
//     outline: "bg-surface text-ink border border-line/10 hover:border-brand-300",
//   };
//   return (
//     <button
//       className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-ring ${variants[variant]} ${className}`}
//       disabled={loading || props.disabled}
//       {...props}
//     >
//       {loading && <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />}
//       {children}
//     </button>
//   );
// }









export function Field({ label, htmlFor, hint, error, required, children }) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">
          {label} {required && <span className="text-coral-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-coral-500 font-medium">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const base =
  "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 " +
  "focus-ring transition-colors outline-none disabled:bg-canvas disabled:text-muted";

export function TextInput({ error, className = "", ...props }) {
  return (
    <input
      className={`${base} ${error ? "border-coral-400 focus:border-coral-400" : "border-line/10 focus:border-brand-400"} ${className}`}
      {...props}
    />
  );
}

export function TextArea({ error, className = "", ...props }) {
  return (
    <textarea
      className={`${base} min-h-[90px] resize-y ${error ? "border-coral-400" : "border-line/10 focus:border-brand-400"} ${className}`}
      {...props}
    />
  );
}

export function Select({ error, className = "", children, ...props }) {
  return (
    <select
      className={`${base} appearance-none bg-no-repeat pr-9 ${error ? "border-coral-400" : "border-line/10 focus:border-brand-400"} ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A9BB3' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.75rem center",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function ChipToggle({ selected, onClick, children, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all focus-ring ${
        selected
          ? "bg-brand-500 border-brand-500 text-white shadow-sm"
          : "bg-surface border-line/10 text-muted hover:border-brand-300 hover:text-brand-500"
      }`}
    >
      {children}
    </button>
  );
}

export function TagInput({ tags, onChange, placeholder }) {
  function addTag(e) {
    if ((e.key === "Enter" || e.key === ",") && e.target.value.trim()) {
      e.preventDefault();
      const value = e.target.value.trim().replace(/,$/, "");
      if (value && !tags.includes(value)) onChange([...tags, value]);
      e.target.value = "";
    } else if (e.key === "Backspace" && !e.target.value && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 w-full rounded-lg border border-line/10 bg-surface px-2.5 py-2 focus-within:border-brand-400 transition-colors">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs font-medium pl-2 pr-1 py-1 rounded-full">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:bg-brand-100 rounded-full p-0.5 leading-none">
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        onKeyDown={addTag}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[100px] text-sm text-ink bg-transparent outline-none placeholder:text-muted/60 py-0.5"
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 focus-ring rounded-full"
    >
      <span
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-line/15"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </button>
  );
}

export function Button({ children, variant = "primary", className = "", loading, ...props }) {
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 dark:hover:bg-brand-500 dark:hover:brightness-110 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed",
    secondary: "bg-brand-50 text-brand-600 hover:bg-brand-100",
    ghost: "bg-transparent text-muted hover:bg-line/[0.03]",
    outline: "bg-surface text-ink border border-line/10 hover:border-brand-300",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-ring ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
    >
      {loading && <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />}
      {children}
    </button>
  );
}