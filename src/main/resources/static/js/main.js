import { redirectToLogin, exchangeCodeForToken, logout, redirectToLocalLogin } from "./auth.js";
import * as api from "./api.js";
import * as render from "./render.js";
import * as handlers from "./handlers.js";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // ==========================
        // GESTIONE CODE DA KEYCLOAK
        // ==========================
        // const params = new URLSearchParams(window.location.search);
        // const code = params.get("code");
        // if(code) await exchangeCodeForToken(code);

        // ==========================
        // TOKEN CONTROL
        // ==========================
        const token = sessionStorage.getItem("token");
        if(!token){
            // redirectToLocalLogin();
            // return;
        }

        // ==========================
        // SALUTO UTENTE + LOGOUT
        // ==========================
        // const payload = JSON.parse(atob(token.split('.')[1]));
        // const username = payload.preferred_username || payload.name || "Guest";
        const username = "devMode";
        const userNameElem = document.querySelector("#user-name");
        if(userNameElem) userNameElem.textContent = username;

        const logoutBtn = document.querySelector("#logoutBtn");
        if(logoutBtn) logoutBtn.onclick = logout;

        // ==========================
        // FETCH ALLOWED STATUSES
        // ==========================
        const statuses = await api.fetchAllowedStatuses();
        render.setAllowedStatuses(statuses);

        // ==========================
        // FETCH ORGANIZATIONS
        // ==========================
        const orgs = await api.fetchOrganizations();
        render.renderOrganizationsList(orgs, org => {
            try{
                handlers.setCurrentSelectedOrg(org);
                render.renderOrganizationMenu(
                    org, 
                    handlers.onCheckSubscription, 
                    handlers.onCheckOtherSub, 
                    handlers.onAssignPlan
                );
            }
            catch(err){
                console.error("Error rendering organization");
                render.showModalAlert("Failed to load organization details","Please try again or contact your administator.")
            }
            
        });

    } catch(err){
        render.showModalAlert("Unexpected error", "Please try again or contact your administator (" + err.message + ").");
        console.error(err);
    }
});