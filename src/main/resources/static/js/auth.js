// ==========================
// AUTHENTICATION
// ==========================
export function redirectToLogin() {
    // Spring manages OAuth2 login at this endpoint
    window.location.href = "oauth2/authorization/dome";
}

// ==========================
// LOGOUT
// ==========================
export function logout() {
    window.location.href = "logout";
}

// ==========================
// REDIRECT TO LOCAL LOGIN PAGE
// ==========================
export function redirectToLocalLogin() {
    window.location.href = "login.html";
}