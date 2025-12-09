import { safeFetch } from "./auth.js";

// FIXME: we shouldnt wire host:port here... let'use relative paths
//const API_BASE = "http://localhost:8680";
const API_BASE = "";

export async function fetchOrganizations() {
    return await safeFetch(`${API_BASE}/management/organizations`);
}

export async function fetchCurrentSubscriptions(orgId) {
    // FIXME: it should simply be a GET to/management/<orgId>/subscriptions/current
    return await safeFetch(`${API_BASE}/management/organizations/${orgId}/purchasedProducts`);
}

export async function fetchOtherSubscriptions(orgId) {
    // FIXME: it should simply be a GET to/management/<orgId>/subscriptions/older
    return await safeFetch(`${API_BASE}/management/organizations/${orgId}/otherProducts`);
}

export async function fetchPlans() {
    // FIXME: it should simply be a GET to/management/plans/active
    let plans = await safeFetch(`${API_BASE}/management/productOffering/validPlans`);
    // workaround: add configurable characteristics. These should come from the server
    for(var plan of plans) {
        plan.configurableCharacteristics = [];
        const isFederated = plan.name.toLowerCase().includes("federated") || plan.name.toLowerCase().includes("fms");
        if(isFederated) {
            plan.configurableCharacteristics.push({key: "revenuePercentage", type:"percentage", label: "Revenue share %"});
            plan.configurableCharacteristics.push({key: "marketplaceSubscription", label:"This is for a Federated Marketplace", type:"boolean", value: true, hide:true});
        }
        plan.configurableCharacteristics.push({key: "activationDate", type:"date", label: "Activation date"});
    }
    return plans;
}

// subscribe the given org to the given plan (with the given params)
export async function subscribeToPlan(org, plan, sharePercentage) {
    // FIXME: it should simply be a POST to /management/subscriptions/
    const params = new URLSearchParams({ orgId: org.id, offeringId: plan.id });
    if (sharePercentage != null)
        params.append("share", sharePercentage);
    return await safeFetch(`${API_BASE}/management/product/save?${params.toString()}`, { method: "POST" });
}

// update the the given subscription
export async function updateSubscription(org, updatedSubscription) {
    // FIXME: should be a PATCH or a PUT
    // FIXME: the path should be /management/subscriptions/<subId>.. why we need the org as param?
    return await safeFetch(`${API_BASE}/management/subscription/update?orgId=${org.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSubscription)
    });
}

export async function fetchAllowedStatuses() {
    // FIXME: the path should be /management/subscriptions/statuses (pllura subscriptions)
    return await safeFetch(`${API_BASE}/management/subscription/statuses`);
}

export async function fetchConfiguration() {
    //  TODO: implement the following in REST
    //    return await safeFetch(`${API_BASE}/management/configuration`);
    return {
        statuses: {
            created: {
                label: "Created",
                value: "created",
                description: "The subscription has been created but not yet activated",
                allowedTransitions: ["pendingActive", "active"]
            },
            active: {
                label: "Active",
                value: "active",
                description: "The subscription is live and running",
                allowedTransitions: ["suspended", "pendingTerminate", "terminated"]
            },
            pendingActive: {
                label: "Pending Active",
                value: "pendingActive",
                description: "The subscription is in activation phase. Not yes active but it is in progress",
                allowedTransitions: ["active", "aborted", "canceled"]
            },
            pendingTerminate: {
                label: "Pending Terminate",
                value: "pendingTerminate",
                description: "The subscription is still active, but a termination process is in progress. It will soon be terminated.",
                allowedTransitions: ["terminated"]
            },
            suspended: {
                label: "Suspended",
                value: "suspended",
                description: "The product is suspended - it could be an outcome from a customer request or provider decision",
                allowedTransitions: ["active"]
            },
            aborted: {
                label: "Aborted",
                value: "aborted",
                description: "The subscription activation has been stopped by abnormal condition. There is probably an unexpected delivery issue",
                allowedTransitions: []
            },
            canceled: {
                label: "Canceled",
                value: "canceled",
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

        finalStatuses: ["aborted", "canceled", "terminated"],

        maxAllowedSubscriptions: 1,

        baeEndpoint: "https://dome-marketplace-dev2.org"

    }
}