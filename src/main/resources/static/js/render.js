let allowedStatuses = [];
export function setAllowedStatuses(statuses) { allowedStatuses = statuses; }

// ==========================
// UTILITY
// ==========================
export function qs(selector) { return document.querySelector(selector); }
export function ce(tag, cls) { const e = document.createElement(tag); if(cls) e.className = cls; return e; }
export function clear(el) { el.innerHTML = ""; }

// ==========================
// MODALS
// ==========================
export function showModalAlert(title, message, onOk) {
    const overlay = qs("#modal-overlay");
    overlay.style.display = "flex";
    qs("#modal-title").textContent = title;
    qs("#modal-message").textContent = message;
    const confirmBtn = qs("#modal-confirm");
    const cancelBtn = qs("#modal-cancel");
    cancelBtn.style.display = "none";
    confirmBtn.onclick = () => {
        overlay.style.display = "none";
        confirmBtn.onclick = null;
        onOk && onOk();
    };
}

export function renderConfirmSubscription(org, plan, share, onConfirm) {
    const modal = qs("#confirm-modal");
    const body = qs("#confirm-modal-body");

    body.innerHTML = `
        <p><strong>Organization:</strong> ${org.tradingName}</p>
        <p><strong>Organization ID:</strong> ${org.id}</p>
        <p><strong>Plan:</strong> ${plan.name}</p>
        <p><strong>Plan ID:</strong> ${plan.id}</p>
        ${share != null ? `<p><strong>Revenue Sharing:</strong> ${share}%</p>` : ""}
    `;
    modal.style.display = "flex";

    const okBtn = qs("#confirm-modal-ok");
    const cancelBtn = qs("#confirm-modal-cancel");

    const close = () => {
        modal.style.display = "none";
        okBtn.onclick = null;
        cancelBtn.onclick = null;
    };

    cancelBtn.onclick = close;
    okBtn.onclick = () => { close(); onConfirm && onConfirm(org.id, plan, share); };
}

// ==========================
// ORGANIZATIONS
// ==========================
export function renderOrganizationsList(orgs, onSelectOrg) {
    const list = qs("#org-list");
    clear(list);
    orgs.forEach(org => {
        const card = ce("div","org-card");
        card.innerHTML = `<h3>${org.tradingName}</h3><p>ID: ${org.id}</p>`;
        card.addEventListener("click", () => onSelectOrg(org));
        list.appendChild(card);
    });
}

export function updateSelectedOrgHeader(org) {
    const headerDiv = qs("#org-header");
    headerDiv.style.display = "block";
    headerDiv.innerHTML = `
        <h3 class="org-header-title">Selected Organization</h3>
        <p><strong>${org.tradingName}</strong></p>
        <small><strong>ID:</strong> ${org.id}</small>
    `;
}

// Render subscriptions
export function renderSubscription(orgId, products, infoDiv, updateCallback, updateProductFunc) {
    clear(infoDiv);
    if (!products || products.length === 0) {
        const div = ce("div","sub-card");
        div.innerHTML = "<p>No subscriptions.</p>";
        infoDiv.appendChild(div);
        return;
    }

    products.forEach(p => {
        const div = ce("div","sub-card");
        const statusOptions = allowedStatuses.map(s => `<option value="${s}" ${s===p.status?"selected":""}>${s}</option>`).join("");

        div.innerHTML = `
            <h3>${p.name}</h3>
            <p><strong>ID:</strong> ${p.id}</p>
            <p><strong>Activation Date:</strong> ${new Date(p.startDate).toLocaleDateString()}</p>
            <p>
                <strong>Status:</strong>
                <select class="status-select" data-sub-id="${p.id}" disabled>
                    ${statusOptions}
                </select>
                <button class="edit-btn btn small">Edit</button>
            </p>
            <div class="action-buttons" style="margin-top:6px; display:none;">
                <button class="confirm-btn btn small">Confirm</button>
                <button class="cancel-btn btn small secondary">Cancel</button>
            </div>
        `;
        infoDiv.appendChild(div);

        const select = div.querySelector(".status-select");
        const editBtn = div.querySelector(".edit-btn");
        const actionBtns = div.querySelector(".action-buttons");
        const confirmBtn = div.querySelector(".confirm-btn");
        const cancelBtn = div.querySelector(".cancel-btn");

        editBtn.addEventListener("click", () => { select.disabled=false; actionBtns.style.display="block"; editBtn.style.display="none"; });
        cancelBtn.addEventListener("click", () => { select.value=p.status; select.disabled=true; actionBtns.style.display="none"; editBtn.style.display="inline-block"; });

        confirmBtn.addEventListener("click", async () => {
            const newStatus = select.value;
            confirmBtn.disabled = true;
            cancelBtn.disabled = true;
            try {
                const updatedProduct = { ...p, status:newStatus };
                await updateProductFunc(orgId, updatedProduct);
                p.status = newStatus;
                select.disabled=true; actionBtns.style.display="none"; editBtn.style.display="inline-block";
                updateCallback(orgId); // aggiorna il menu se serve
                showModalAlert("Success","Subscription updated successfully!");
            } catch(err) {
                showModalAlert("Error","Subscription update failed: "+err.message);
                select.value=p.status; select.disabled=true; actionBtns.style.display="none"; editBtn.style.display="inline-block";
            } finally { confirmBtn.disabled=false; cancelBtn.disabled=false; }
        });
    });
}

// Render plan selection
export function renderPlanSelection(org, plans, onSelectPlan, container) {
    clear(container);
    
    if (!plans || plans.length === 0) {
        const div = ce("div", "no-plans-card");
        div.innerHTML = `<p>No plans available.</p>`;
        container.appendChild(div);
        container.style.display = "block";
        return;
    }

    plans.forEach(plan => {
        const isFederated = plan.name.toLowerCase().includes("federated") || plan.name.toLowerCase().includes("fms");
        const div = ce("div","plan-card");
        div.innerHTML = `
            <h4>${plan.name}</h4>
            <p><strong>ID:</strong> ${plan.id}</p>
            <p><strong>Description:</strong> ${plan.description || "No description available"}</p>
            ${isFederated?`<div class="input-group"><label>Revenue Sharing (%)</label><input type="number" class="rev-input" min="0" max="100" placeholder="0-100" style="width:120px;"></div>`:""}
            <button class="btn small select-plan" data-plan="${plan.id}">Select</button>
        `;
        container.appendChild(div);
        div.querySelector(".select-plan").addEventListener("click", () => {
            let share = null;
            if(isFederated){
                const input = div.querySelector(".rev-input");
                share = Number(input.value);
                if(isNaN(share)||share<0||share>100){ 
                    // alert("Enter a valid percentage (0-100)"); 
                    showModalAlert("Enter a valid percentage", "You must enter a percentage between 0 and 100.");
                    input.value="";
                    return; 
                }
            }
            onSelectPlan(org, plan, share);
        });
    });
}

// render.js
export async function renderOrganizationMenu(org, onCheckSubscription, onCheckOtherSub, onAssignPlan) {
    const panel = qs("#details-panel");
    clear(panel);

    updateSelectedOrgHeader(org);

    // LEFT PANEL: Active Subscriptions
    const activeSubDiv = ce("div");
    activeSubDiv.innerHTML = `
        <h3 class="section-title">Active Subscriptions</h3>
        <div id="subscription-info"></div>
    `;
    panel.appendChild(activeSubDiv);

    const otherSubDiv = ce("div");
    otherSubDiv.innerHTML = `
        <h3 class="section-title">Other Subscriptions</h3>
        <div id="other-subscriptions-info"></div>
    `;
    panel.appendChild(otherSubDiv);

    // RIGHT PANEL: Assign Plan
    const rightPanel = qs("#assign-plan-panel");
    const planList = qs("#plan-list");
    const btnAssign = qs("#btn-assign-plan");

    rightPanel.style.display = "none";
    planList.innerHTML = "";
    planList.style.display = "none";

    // Remove previous listeners
    const newBtn = btnAssign.cloneNode(true);
    btnAssign.replaceWith(newBtn);

    newBtn.textContent = "➕ Add new subscription";
    newBtn.disabled = false;

    try {
        const [activeProducts, otherProducts] = await Promise.all([
            onCheckSubscription(org.id, activeSubDiv.querySelector("#subscription-info")),
            onCheckOtherSub(org.id, otherSubDiv.querySelector("#other-subscriptions-info"))
        ]);

        if ((activeProducts?.length || 0) < 1) { // MAX_ACTIVE_SUBSCRIPTIONS
            rightPanel.style.display = "block";
            wireAssignButton(newBtn, planList, org, onAssignPlan);
        }
    } catch(err) {
        console.error("Error rendering subscriptions:", err);
    }
}

// Attach button logic
export function wireAssignButton(btn, planList, org, onAssignPlan) {
    btn.addEventListener("click", async () => {
        const opening = planList.style.display === "none";
        if (opening) {
            btn.disabled = true;
            btn.textContent = "Loading...";
            try {
                await onAssignPlan(org);
                planList.style.display = "block";
                btn.textContent = "✖ Close";
            } catch(err) {
                showModalAlert("Failed to Load Plans", "Please try again or contact your administator (" + err.message +").");
                btn.textContent = "➕ Add new subscription";
            } finally {
                btn.disabled = false;
            }
        } else {
            planList.style.display = "none";
            btn.textContent = "➕ Add new subscripion";
        }
    });
}