import { safeFetch } from "./auth.js";

const API_BASE = "";

export async function fetchOrganizations() {
    return await safeFetch(`${API_BASE}/organizations`);
}

export async function fetchSubscriptions(orgId) {
    return await safeFetch(`${API_BASE}/organizations/${orgId}/subscriptions`);
}

/*
export async function fetchCurrentSubscriptions(orgId) {
    alert("deprecated 1");
    return await safeFetch(`${API_BASE}/organizations/${orgId}/subscriptions/current`);
}

export async function fetchOtherSubscriptions(orgId) {
    alert("deprecated 2");
    return await safeFetch(`${API_BASE}/organizations/${orgId}/subscriptions/older`);
}
*/

export async function fetchPlans() {
    let plans = await safeFetch(`${API_BASE}/plans/active`);
    // workaround: add configurable characteristics. These should come from the server
    /*
    for(var plan of plans) {
        plan.configurableCharacteristics = [];
        const isFederated = plan.name.toLowerCase().includes("federated") || plan.name.toLowerCase().includes("fms");
        if(isFederated) {
            plan.configurableCharacteristics.push({key: "revenuePercentage", type:"percentage", label: "Revenue share %"});
            plan.configurableCharacteristics.push({key: "marketplaceSubscription", label:"This is for a Federated Marketplace", type:"boolean", value: true, hide:true});
        }
        plan.configurableCharacteristics.push({key: "activationDate", type:"date", label: "Activation date"});
    }
    */
    return plans;
}

// subscribe the given org to the given plan (with the given params)
export async function subscribeToPlan(org, plan, characteristics) {
    let subscription = { 
        organizationId: org.id,
        productOfferingId: plan.offeringId,
        productOfferingPrice: plan.offeringPriceId,
        characteristics: characteristics
    };
    return await safeFetch(`${API_BASE}/organizations/${org.id}/subscriptions`, 
            { 
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subscription)
            }
    );
}

// update the the given subscription
export async function updateSubscription(org, updatedSubscription) {
    return await safeFetch(`${API_BASE}/organizations/${org.id}/subscriptions/${updatedSubscription.id}`, 
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedSubscription)
        }
    );
}

/*
export async function fetchAllowedStatuses() {
    return await safeFetch(`${API_BASE}/management/subscription/statuses`);
}
*/

export async function fetchConfiguration() {
    let localConfig = {
        statuses: {
            created: {
                label: "Created",
                value: "created",
                description: "The subscription has been created but not yet activated",
                allowedTransitions: ["pendingActive", "active"]
            },
            pendingActive: {
                label: "Pending Active",
                value: "pendingActive",
                description: "The subscription is in activation phase. Not yes active but it is in progress",
                allowedTransitions: ["active", "aborted", "cancelled"]
            },
            active: {
                label: "Active",
                value: "active",
                description: "The subscription is live and running",
                allowedTransitions: ["suspended", "pendingTerminate", "terminated"]
            },
            suspended: {
                label: "Suspended",
                value: "suspended",
                description: "The product is suspended - it could be an outcome from a customer request or provider decision",
                allowedTransitions: ["active"]
            },
            pendingTerminate: {
                label: "Pending Terminate",
                value: "pendingTerminate",
                description: "The subscription is still active, but a termination process is in progress. It will soon be terminated.",
                allowedTransitions: ["terminated"]
            },
            /*
            FIXME: temporarily disabled, waiting for the brokerage-utils to fix the enum, removing space from "aborted "
            aborted: {
                label: "Aborted",
                value: "aborted",
                description: "The subscription activation has been stopped by abnormal condition. There is probably an unexpected delivery issue",
                allowedTransitions: []
            },
            */
            cancelled: {
                label: "Cancelled",
                value: "cancelled",
                description: "The subscription activation has been cancelled - it could come from Customer or from the DOME Operator",
                allowedTransitions: []
            },
            terminated: {
                label: "Terminated",
                value: "terminated",
                description: "The subscription is no longer active.",
                allowedTransitions: []
            }
        },
        finalStatuses : ["aborted", "cancelled", "terminated"]
    }
    let remoteConfig = await safeFetch(`${API_BASE}/configuration`);

    let config = {...localConfig, ...remoteConfig};

    return config;
}