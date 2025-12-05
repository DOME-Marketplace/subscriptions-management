import { safeFetch } from "./auth.js";

const API_BASE = "http://localhost:8680";

export async function fetchOrganizations() {
    return await safeFetch(`${API_BASE}/management/organizations`);
}

export async function fetchSubscription(orgId) {
    return await safeFetch(`${API_BASE}/management/organizations/${orgId}/purchasedProducts`);
}

export async function fetchOtherSubscriptions(orgId) {
    return await safeFetch(`${API_BASE}/management/organizations/${orgId}/otherProducts`);
}

export async function fetchPlans() {
    return await safeFetch(`${API_BASE}/management/productOffering/validPlans`);
}

export async function subscribeOrganization(orgId, plan, sharePercentage) {
    const params = new URLSearchParams({ orgId, offeringId: plan.id });
    if (sharePercentage != null) params.append("share", sharePercentage);
    return await safeFetch(`${API_BASE}/management/product/save?${params.toString()}`, { method: "POST" });
}

export async function updateProduct(orgId, updatedProduct) {
    return await safeFetch(`${API_BASE}/management/subscription/update?orgId=${orgId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct)
    });
}

export async function fetchAllowedStatuses() {
    return await safeFetch(`${API_BASE}/management/subscription/statuses`);
}