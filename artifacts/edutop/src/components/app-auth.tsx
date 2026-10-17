import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useClerk, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAppSessionQueryKey, useGetAppSession, useLogoutAppSession } from "@workspace/api-client-react";
import { Send } from "lucide-react";
import { type Lang, tr, getLang } from "@/i18n";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
type AppAuth = {
  signedIn: boolean; loading: boolean; telegramConfigured: boolean;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AppAuth | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();
  const queryClient = useQueryClient();
  const session = useGetAppSession({ query: {
    queryKey: getGetAppSessionQueryKey(), refetchInterval: 60000, retry: 1, staleTime: 0,
  } });
  const logoutSession = useLogoutAppSession();
  const loading = !isLoaded || (!isSignedIn && session.isPending);
  const identity = isSignedIn ? user?.id ?? null : session.data?.userId ?? null;
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (loading) return;
    if (previous.current !== undefined && previous.current !== identity) {
      // Keep session discovery; remove user-scoped cached results on account changes.
      queryClient.removeQueries({ predicate: query => query.queryKey[0] !== getGetAppSessionQueryKey()[0] });
    }
    previous.current = identity;
  }, [identity, loading, queryClient]);

  async function logout() {
    await logoutSession.mutateAsync();
    if (isSignedIn) await clerk.signOut({ redirectUrl: `${basePath}/` });
    else window.location.assign(`${basePath}/`);
  }
  return <AuthContext.Provider value={{
    signedIn: Boolean(identity), loading,
    telegramConfigured: Boolean(session.data?.telegramConfigured), logout,
  }}>
    {session.isError && !isSignedIn && <div className="auth-service-warning" role="alert">
      {tr("Hisobni tekshirib bo‘lmadi.", "Не удалось проверить сеанс.", getLang())}
      <button onClick={() => session.refetch()}>{tr("Qayta urinish", "Повторить", getLang())}</button>
    </div>}
    {children}
  </AuthContext.Provider>;
}

export function useAppAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AppAuthProvider is missing");
  return auth;
}

export function AuthVisibility({ when, children }: { when: "signed-in" | "signed-out"; children: ReactNode }) {
  const { signedIn, loading } = useAppAuth();
  if (loading || (when === "signed-in") !== signedIn) return null;
  return <>{children}</>;
}

export function TelegramLoginButton({ lang }: { lang: Lang }) {
  const { telegramConfigured, loading } = useAppAuth();
  const error = new URLSearchParams(window.location.search).get("telegram_error");
  const messages: Record<string, [string, string, string]> = {
    invalid_state: ["Kirish havolasi eskirgan. Telegram orqali qayta kiring.", "Ссылка входа устарела. Повторите вход через Telegram.", "Sign-in link expired. Please sign in with Telegram again."],
    cancelled: ["Telegram orqali kirish bekor qilindi.", "Вход через Telegram отменён.", "Telegram sign-in was cancelled."],
    configuration: ["Telegram Login sozlamalari to‘liq emas.", "Telegram Login ещё не настроен.", "Telegram Login is not configured yet."],
    provider: ["Telegram kirishni tasdiqlamadi. Qayta urinib ko‘ring.", "Telegram не подтвердил вход. Попробуйте снова.", "Telegram did not confirm the sign-in. Please try again."],
    verification: ["Telegram javobini tekshirib bo‘lmadi. Qayta urinib ko‘ring.", "Не удалось проверить ответ Telegram. Попробуйте снова.", "Could not verify the Telegram response. Please try again."],
  };
  return <div className="telegram-login-block">
    {telegramConfigured ? <a className="button telegram-login-button" href={`${basePath}/api/auth/telegram/start`} data-testid="button-telegram-login">
      <Send size={19}/>{tr("Telegram orqali kirish", "Войти через Telegram", lang)}
    </a> : <button className="button telegram-login-button" disabled>
      <Send size={19}/>{loading ? tr("Tekshirilmoqda…", "Проверка…", lang) : (tr("Telegram Login hali sozlanmagan", "Telegram Login ещё не настроен", lang))}
    </button>}
    {error && <p className="form-error" role="alert">{(messages[error] ?? messages.verification)[lang === "uz" ? 0 : lang === "ru" ? 1 : 2]}</p>}
  </div>;
}

export function AppLogoutButton({ lang }: { lang: Lang }) {
  const { logout } = useAppAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function leave() {
    setBusy(true); setError("");
    try { await logout(); } catch {
      setError(tr("Chiqib bo‘lmadi. Qayta urinib ko‘ring.", "Не удалось выйти. Попробуйте снова.", lang));
      setBusy(false);
    }
  }
  return <div><button className="button button-outline" disabled={busy} onClick={() => void leave()} data-testid="button-sign-out">
    {busy ? "…" : tr("Chiqish", "Выйти", lang)}
  </button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
