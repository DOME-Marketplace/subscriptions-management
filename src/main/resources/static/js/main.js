import {logout} from "./auth.js";
import * as api from "./api.js";
import * as render from "./render.js";
import * as handlers from "./handlers.js";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // ==========================
        // ROLE CHECK
        // ==========================
        const me = await api.fetchMe();

        const roles = me.roles;

        if (!roles.includes("AdminSM")) {
            render.showModalAlert(
                "Access Denied",
                "You do not have permission to access this application."
            );
            setTimeout(() => logout(), 3000);
            return;
        }

        // ==========================
        // USER NAV INFO AND LOGOUT BTN
        // ==========================
        const username = me.username || "Guest";
        const userNameElem = document.querySelector("#user-name");
        if (userNameElem) {
                userNameElem.textContent = `${username} (${roles.join(", ")})`;
        }

        //logout button
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