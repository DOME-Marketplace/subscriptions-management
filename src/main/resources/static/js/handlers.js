import * as api from "./api.js";
import * as render from "./render.js";

let currentSelectedOrg = null;

export function setCurrentSelectedOrg(org) { currentSelectedOrg = org; }
export function getCurrentSelectedOrg() { return currentSelectedOrg; }

export async function onCheckSubscription(orgId, infoDiv) {
    try {
        const products = await api.fetchSubscription(orgId);
        render.renderSubscription(orgId, products, infoDiv, null, api.updateProduct);
        return products;
    } catch(err) {
        render.showModalAlert("Failed to load active subscriptions","Please try again or contact your administator (" + err.message +").");
        console.error(err);
        return [];
    }
}

export async function onCheckOtherSub(orgId, infoDiv) {
    try {
        const products = await api.fetchOtherSubscriptions(orgId);
        render.renderSubscription(orgId, products, infoDiv, null, api.updateProduct);
        return products;
    } catch(err) {
        render.showModalAlert("Failed to load other subscriptions","Please try again or contact your administator (" + err.message +").");
        console.error(err);
        return [];
    }
}

export async function onAssignPlan(org) {
    const plans = await api.fetchPlans();
    render.renderPlanSelection(org, plans, onSelectPlan, render.qs("#plan-list"));
}

export function onSelectPlan(org, plan, share) {
    render.renderConfirmSubscription(org, plan, share, onConfirmSubscription);
}

export async function onConfirmSubscription(orgId, plan, share) {
    const btn = render.qs("#confirm-modal-ok");
    btn.disabled = true; btn.textContent = "Loading...";
    try {
        await api.subscribeOrganization(orgId, plan, share);
        render.renderOrganizationMenu(currentSelectedOrg, onCheckSubscription, onCheckOtherSub, onAssignPlan);
        render.showModalAlert("Success","Plan assigned successfully!");
    } catch(err) {
        render.showModalAlert("Error","Cannot add new subscription: "+err.message);
    } finally {
        btn.disabled=false; btn.textContent="Confirm";
    }
}