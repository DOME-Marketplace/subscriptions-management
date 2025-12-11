// ==========================
// CONFIG
// ==========================
const KEYCLOAK_BASE = "http://localhost:8080/realms/myrealm/protocol/openid-connect";
const CLIENT_ID = "spring-be";

// ==========================
// HELPERS PKCE
// ==========================
function base64urlEncode(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return String.fromCharCode(...new Uint8Array(hash));
}

async function generateCodeChallenge(codeVerifier) {
    const hashed = await sha256(codeVerifier);
    return base64urlEncode(hashed);
}

function generateRandomString(length = 43) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let str = '';
    for (let i = 0; i < length; i++) str += charset[Math.floor(Math.random() * charset.length)];
    return str;
}

// ==========================
// REDIRECT TO LOGIN
// ==========================
export async function redirectToLogin() {
    const codeVerifier = generateRandomString();
    sessionStorage.setItem('pkce_verifier', codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const redirectUri = encodeURIComponent(window.location.origin + "/index.html");

    const loginUrl = `${KEYCLOAK_BASE}/auth?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=openid&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    console.log("Redirecting to Keycloak login:", loginUrl);
    window.location.href = loginUrl;
}

// ==========================
// REDIRECT TO LOCAL LOGIN PAGE
// ==========================
export function redirectToLocalLogin() {
    window.location.href = window.location.origin + "/login.html";
}

// ==========================
// EXCHANGE CODE FOR TOKEN
// ==========================
export async function exchangeCodeForToken(code) {
    const redirectUri = window.location.origin + window.location.pathname;
    const codeVerifier = sessionStorage.getItem('pkce_verifier');
    if (!codeVerifier) throw new Error("PKCE verifier not found");

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
    });

    const res = await fetch(`${KEYCLOAK_BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
    });

    if (!res.ok) throw new Error("Token exchange failed: " + (await res.text()));

    const data = await res.json();
    sessionStorage.setItem("token", data.access_token);
    sessionStorage.setItem("refresh_token", data.refresh_token);
    console.log("Token obtained:", data.access_token);

    // remove ?code from URL
    window.history.replaceState({}, document.title, window.location.pathname);
    sessionStorage.removeItem('pkce_verifier');
}

// ==========================
// TOKEN UTILITYS
// ==========================
export function getTokenPayload() {
    const token = sessionStorage.getItem("token");
    if(!token) return null;
    return JSON.parse(atob(token.split('.')[1]));
}

export function getUserRoles() {
    const payload = getTokenPayload();
//    return payload?.realm_access?.roles || [];
    const realmRoles = payload.realm_access?.roles || [];
    const clientRoles = payload.resource_access?.["spring-be"]?.roles || [];
    return [...realmRoles, ...clientRoles];
}

// TODO: not used yet
export async function refreshToken() {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if(!refreshToken) return redirectToLocalLogin();

    const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: refreshToken
    });

    const res = await fetch(`${KEYCLOAK_BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
    });

    if(!res.ok) return redirectToLocalLogin();

    const data = await res.json();
    sessionStorage.setItem("token", data.access_token);
    sessionStorage.setItem("refresh_token", data.refresh_token);
}


// ==========================
// SAFE FETCH
// ==========================
export async function safeFetch(url, options = {}) {
    let token = sessionStorage.getItem("token");
    // if (!token) {
    //     await redirectToLogin();
    //     return;
    // }

    const res = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            "Authorization": "Bearer " + token
        }
    });

    if (res.status === 401) {
        console.warn("Token expired or invalid, redirecting to login...");
        await redirectToLogin();
        return;
    }

    if (!res.ok) throw new Error(await res.text() || "Error fetching data");

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) return res.json();
    return res.text();
}

// ==========================
// LOGOUT
// ==========================
//export function logout() {
//    sessionStorage.clear();
//    const redirectUri = encodeURIComponent(window.location.origin + "/login.html");
//    window.location.href = `${KEYCLOAK_BASE}/logout?redirect_uri=${redirectUri}`;
//}

export async function logout() {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if (refreshToken) {
        const body = new URLSearchParams({
            client_id: CLIENT_ID,
            refresh_token: refreshToken
        });

        try {
            await fetch(`${KEYCLOAK_BASE}/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: body.toString()
            });
        } catch(err) {
            console.warn("Keycloak logout failed, continuing locally", err);
        }
    }

    // clear local session
    sessionStorage.clear();

    // redirect to local login page
    window.location.href = window.location.origin + "/login.html";
}