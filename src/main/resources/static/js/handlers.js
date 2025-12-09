import * as api from "./api.js";
import * as render from "./render.js";

let currentSelectedOrg = null;

export function setCurrentSelectedOrg(org) {
        currentSelectedOrg = org; 
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
    const config = await api.fetchConfiguration();
    try {
        // retrieve all subscriptions...
        let subs = await api.fetchCurrentSubscriptions(org.id);
        subs = subs.concat(await api.fetchOtherSubscriptions(org.id));

        console.log(subs);

        // ... then, cluster according to their status
        let currentSubs = [];
        let otherSubs = [];
        for(var sub of subs) {
            if(config.finalStatuses.includes(sub.status)) 
                otherSubs.push(sub);
            else
                currentSubs.push(sub);
        }
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

export async function confirmActivation(org, plan, share) {
    const btn = render.qs("#confirm-modal-ok");
    btn.disabled = true; btn.textContent = "Loading...";
    try {
        await api.subscribeToPlan(org, plan, share);
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
            checkAvailablePlans,
            await api.fetchConfiguration()
        );
    }
    catch(err){
        console.error("Error rendering organization");
        render.showModalAlert("Failed to load organization details","Please try again or contact your administator.")
    }
}
