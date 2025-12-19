import {redirectToLocalLogin} from "./auth.js";
export async function fetchMe() {
    const res = await fetch("me", { credentials: "include" });

    if (await handle401(res)) return;

    if (!res.ok) {
        throw new Error(await readError(res, "Error fetch User Info"));
    }

    return res.json();
}

export async function fetchOrganizations() {
    const res = await fetch(`organizations`, { 
        credentials: "include" 
    });

    if (await handle401(res)) return;

    if (!res.ok) {
        throw new Error(await readError(res, "Error fetch Organizations"));
    }

    return res.json();
}

export async function fetchSubscriptions(orgId) {
    const res = await fetch(`organizations/${orgId}/subscriptions`, {
        credentials: "include" 
    });
    
    if (await handle401(res)) return;

    if (!res.ok) {
        throw new Error(await readError(res, "Error fetch Subscriptions"));
    }

    return res.json();
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
    const res = await fetch(`plans/active`, {
        credentials: "include"
    });

    if (await handle401(res)) return;

    if (!res.ok) {
        throw new Error(await readError(res, "Error fetch Plans"));
    }
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
    return res.json();
}

// subscribe the given org to the given plan (with the given params)
export async function subscribeToPlan(org, plan, characteristics) {
    const subscription = { 
        organizationId: org.id,
        productOfferingId: plan.offeringId,
        productOfferingPrice: plan.offeringPriceId,
        characteristics: characteristics
    };

    const res = await fetch(`organizations/${org.id}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // cookie
        body: JSON.stringify(subscription)
    });

    if (await handle401(res)) return;

    if (!res.ok) {
        throw new Error(await readError(res, "Error subscribe to plan"));
    }

    return res.json();
}

// update the the given subscription
export async function updateSubscription(org, updatedSubscription) {
    const res = await fetch(`organizations/${org.id}/subscriptions/${updatedSubscription.id}`, 
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // cookie
                body: JSON.stringify(updatedSubscription)
    });

    if (await handle401(res)) return;

    if (!res.ok) {
        throw new Error(await readError(res, "Error updating subscription"));
    }

    return res.json();
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
    
    const res = await fetch("configuration", { credentials: "include" });
    if (!res.ok) {
        console.warn("Failed to fetch remote configuration, using local defaults");
        return localConfig;
    }

    const remoteConfig = await res.json()

    let config = {...localConfig, ...remoteConfig};

    return config;
}

async function readError(res, fallback = "Unexpected error") {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const json = await res.json();
        return json.message || JSON.stringify(json);
    }

    return await res.text() || fallback;
}

async function handle401(res) {
    if (res.status === 401) {
        redirectToLocalLogin();
        return true;
    }
    return false;
}