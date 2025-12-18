import { redirectToLogin } from "./auth.js";

document.getElementById("loginBtn").addEventListener("click", () => {
    redirectToLogin();
});