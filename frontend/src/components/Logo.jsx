// Logo images live in frontend/public (names must match EXACTLY, incl. capital letters).
const LOGO_DARK_MODE = "/logo.png"; // shown in dark mode (white text)
const LOGO_LIGHT_MODE = "/logo_mode.png"; // shown in light mode (dark text)

// true  = the image already contains the words "HEALTHSENSE AI", so no extra text is written next to it.
// false = the image is only an icon, and the text is written next to it.
const LOGO_INCLUDES_TEXT = true;

// LOGO SIZE: change this one number to make the logo bigger or smaller everywhere
// (navbar, landing page, login, register). Bigger number = bigger logo.
const LOGO_SCALE = 1.75;

export function LogoMark({ size = 32, className = "" }) {
  const h = size * LOGO_SCALE;
  const style = { height: h, width: LOGO_INCLUDES_TEXT ? "auto" : h };
  const cls = `shrink-0 object-contain max-w-none ${className}`;
  return (
    <>
      <img src={LOGO_LIGHT_MODE} alt="HealthSense AI" className={`${cls} dark:hidden`} style={style} />
      <img src={LOGO_DARK_MODE} alt="" aria-hidden="true" className={`${cls} hidden dark:block`} style={style} />
    </>
  );
}

export default function Logo({ size = 32, showText = true, textClassName = "", className = "" }) {
  if (LOGO_INCLUDES_TEXT) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <LogoMark size={size} />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className={`${textClassName || "inline-flex"} items-baseline gap-1.5 font-display font-extrabold text-[18px] leading-none tracking-tight`}>
          <span className="text-ink">HealthSense</span>
          <span className="text-brand-600">AI</span>
        </span>
      )}
    </span>
  );
}
