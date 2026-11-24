import { Logo } from "./Logo";

/**
 * Logo launch animation, shown when the app first opens in a browser session.
 *
 * Pure CSS, no JavaScript timers: the whole timeline lives in
 * app/globals.css under "5. Splash". The overlay fades itself out at 1.6s
 * and becomes `visibility: hidden`, so it never blocks taps afterwards.
 *
 * "Once per session" is handled by SPLASH_SCRIPT (below), which runs in
 * <head> before the first paint. Users with reduced motion never see it.
 *
 * `replay` is used by the Motion Lab: it ignores the once-per-session rule.
 */
export function SplashScreen({ replay = false }: { replay?: boolean }) {
  return (
    <div className={`splash ${replay ? "splash--replay" : ""}`} aria-hidden="true">
      <Logo size={148} />
    </div>
  );
}

/**
 * Inline script for <head>. Marks the splash as already played for the
 * rest of the session. Wrapped in try/catch because sessionStorage can
 * throw in private modes; the splash then simply plays.
 */
export const SPLASH_SCRIPT = `try{var k="ikh-splash";if(sessionStorage.getItem(k)){document.documentElement.dataset.splash="done"}else{sessionStorage.setItem(k,"1")}}catch(e){}`;
