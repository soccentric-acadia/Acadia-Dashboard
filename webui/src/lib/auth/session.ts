// Client-side auth session for single-user local account.
// Credentials are stored hashed in localStorage; the server doesn't gate on them
// (the actual server uses API keys for headless clients, not user sessions).

const SESSION_KEY = "acadia_session";
const CREDS_KEY = "acadia_creds";

export interface Session {
    username: string;
    loginAt: string;
}

// Simple non-crypto hash for localStorage-stored password (UI-only gate).
async function hashPassword(password: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export function getSession(): Session | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
        return null;
    }
}

export function clearSession(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(SESSION_KEY);
    }
}

interface StoredCreds {
    username: string;
    passwordHash: string;
}

function getStoredCreds(): StoredCreds {
    if (typeof window === "undefined") return { username: "admin", passwordHash: "" };
    try {
        const raw = localStorage.getItem(CREDS_KEY);
        if (raw) return JSON.parse(raw) as StoredCreds;
    } catch {
        // fall through
    }
    // Default credentials on first boot — user should change these.
    return { username: "admin", passwordHash: "" };
}

export async function login(username: string, password: string): Promise<boolean> {
    const stored = getStoredCreds();

    // If no password has ever been set (first boot), accept any password for "admin".
    const isFirstBoot = stored.passwordHash === "";
    const passwordOk =
        isFirstBoot ||
        (await hashPassword(password)) === stored.passwordHash;

    if (username !== stored.username || !passwordOk) return false;

    // On first boot, save the supplied password as the new password.
    if (isFirstBoot) {
        await saveCredentials(username, password);
    }

    const session: Session = { username, loginAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
}

export async function saveCredentials(username: string, newPassword: string): Promise<void> {
    const creds: StoredCreds = {
        username,
        passwordHash: await hashPassword(newPassword),
    };
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    // Update the session username too.
    const session = getSession();
    if (session) {
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ ...session, username })
        );
    }
}
