import {
    redirectToLogin,
    exchangeCodeForToken,
    logout,
    redirectToLocalLogin,
    getTokenPayload,
    getUserRoles,
    refreshToken
} from "./auth.js";
import * as api from "./api.js";
import * as render from "./render.js";
import * as handlers from "./handlers.js";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // ==========================
        // GESTIONE CODE DA KEYCLOAK
        // ==========================
         const params = new URLSearchParams(window.location.search);
         const code = params.get("code");
         if(code) await exchangeCodeForToken(code);

        // ==========================
        // TOKEN CONTROL
        // ==========================
        const token = sessionStorage.getItem("token");
        if(!token){
             redirectToLocalLogin();
             return;
        }

        // ==========================
        // SALUTO UTENTE + LOGOUT
        // ==========================
        const payload = getTokenPayload();
        if (!payload) {
            redirectToLocalLogin();
            return;
        }

        // ==========================
        // ROLE CHECK
        // ==========================
        const roles = getUserRoles();
        if (!roles.includes("admin")) {
            render.showModalAlert(
                "Access Denied",
                "You do not have permission to access this application."
            );
            setTimeout(() => logout(), 2000);
            return;
        }

        const username = payload.preferred_username || payload.name || "Guest";
//        const username = "devMode";
        const userNameElem = document.querySelector("#user-name");
        //if(userNameElem) userNameElem.textContent = username;
        if (userNameElem) {
                // const roles = getUserRoles();
                userNameElem.textContent = `${username} (${roles.join(", ")})`;
        }

//        const userNameElem = document.querySelector("#user-name");
//        if(userNameElem) userNameElem.textContent = username;

        const logoutBtn = document.querySelector("#logoutBtn");
        if(logoutBtn) logoutBtn.onclick = logout;

        // ==========================
        // FETCH ALLOWED STATUSES
        // ==========================
//        const statuses = await api.fetchAllowedStatuses();
//        render.setAllowedStatuses(statuses);
        render.setConfig(await api.fetchConfiguration());
        handlers.setConfig(await api.fetchConfiguration());

        // ==========================
        // FETCH ORGANIZATIONS
        // ==========================
        handlers.init();

    } catch(err){
        render.showModalAlert("Unexpected error", "Please try again or contact your administator (" + err.message + ").");
        console.error(err);
    }
});