import * as api from "./api.js";
import * as render from "./render.js";

let currentSelectedOrg = null;
let config = null;

export function setCurrentSelectedOrg(org) {
        currentSelectedOrg = org; 
}

export function setConfig(cfg) {
    config = cfg;
}

export function getCurrentSelectedOrg() {
    return currentSelectedOrg; 
}

export async function init() {
    const orgs = await api.fetchOrganizations();
    render.renderOrganizationsList(orgs, selectOrganization);
    render.showOrganizationSubscriptions(getCurrentSelectedOrg(), checkAllSubscriptions, checkAvailablePlans);
}

export async function checkAllSubscriptions(org, currentContainer, othersContainer) {
//    const config = await api.fetchConfiguration();
    try {
        // retrieve all subscriptions...
        let subs = await api.fetchSubscriptions(org.id);

        // ... then, cluster according to their status
        let currentSubs = [];
        let otherSubs = [];
        for(var sub of subs) {
            if(config.finalStatuses.includes(sub.status)) 
                otherSubs.push(sub);
            else
                currentSubs.push(sub);
        }

        // renden them in their own panels
        render.renderSubscriptions(org, currentSubs, currentContainer, selectOrganization, api.updateSubscription);
        render.renderSubscriptions(org, otherSubs, othersContainer, selectOrganization, api.updateSubscription);
        return [currentSubs, otherSubs];
    } catch(err) {
        render.showModalAlert("Failed to load subscriptions", "Please try again or contact your administator (" + err.message +").");
        console.error(err);
        return [[], []];
    }
}

export async function checkAvailablePlans(org) {
    console.log("fetching plans...")
    const plans = await api.fetchPlans();
    console.log(plans);
    render.renderPlans(org, plans, activatePlanFn, render.qs("#plan-list"));
}

export function activatePlanFn(org, plan, characteristics) {
    render.renderConfirmActivation(org, plan, characteristics, confirmActivation);
}

export async function confirmActivation(org, plan, characteristics) {
    const btn = render.qs("#confirm-modal-ok");
    btn.disabled = true; btn.textContent = "Loading...";
    try {
        await api.subscribeToPlan(org, plan, characteristics);
        render.showOrganizationSubscriptions(getCurrentSelectedOrg(), checkAllSubscriptions, checkAvailablePlans);
        render.showModalAlert("Success","Plan assigned successfully!");
    } catch(err) {
        render.showModalAlert("Error","Cannot add new subscription: "+err.message);
    } finally {
        btn.disabled=false; btn.textContent="Confirm";
    }
}

export async function selectOrganization(org) {
    try{
        setCurrentSelectedOrg(org);
        render.showOrganizationSubscriptions(
            org, 
            checkAllSubscriptions,
            checkAvailablePlans
        );
    }
    catch(err){
        console.error("Error rendering organization");
        render.showModalAlert("Failed to load organization details","Please try again or contact your administator.")
    }
}
