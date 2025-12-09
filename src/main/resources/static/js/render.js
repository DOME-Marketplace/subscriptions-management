let allowedStatuses = [];
export function setAllowedStatuses(statuses) { allowedStatuses = statuses; }

let config = null;

export function setConfig(cfg) {
    config = cfg;
}

let currentEditor = null;

export function acquireEditLock(who) {
    if(currentEditor!=null && currentEditor!=who) {
        currentEditor.style.animation = "pulse 2s infinite";
        function stop() {
            currentEditor.style.animation = "";
        }
        showModalAlert("Warning", "An editing session is ongoing.<br/>Please finalize or cancel it.", stop)
        return false;
    }
    else {
        currentEditor = who;
        return true;
    }
}

export function releaseEditLock(who) {
    if(currentEditor == who) {
        currentEditor = null;
        return true;
    }
    else {
        return false;
    }
}

// ==========================
// UTILITY
// ==========================
export function qs(selector) { return document.querySelector(selector); }
export function ce(tag, cls) { const e = document.createElement(tag); if(cls) e.className = cls; return e; }
export function clear(el) { el.innerHTML = ""; }
export function cn(id, cls) { const n = qs(id).cloneNode(true); n.removeAttribute("id"); if(cls) n.className = cls; return n; }

// ==========================
// MODALS
// ==========================

// OK
export function showModalAlert(title, message, onOk) {
    const overlay = qs("#modal-overlay");
    overlay.style.display = "flex";
    qs("#modal-title").textContent = title;
    qs("#modal-message").innerHTML = message;
    const confirmBtn = qs("#modal-confirm");
    const cancelBtn = qs("#modal-cancel");
    cancelBtn.style.display = "none";
    confirmBtn.onclick = () => {
        overlay.style.display = "none";
        confirmBtn.onclick = null;
        onOk && onOk();
    };
}

// OK
export function renderConfirmActivation(org, plan, characteristics, onConfirmFn) {

    const modal = qs("#confirm-modal");
    const body = qs("#confirm-modal-body");

    body.innerHTML = `
        <p><strong>Organization:</strong> ${org.tradingName}</p>
        <p><strong>Organization ID:</strong> ${org.id}</p>
        <p><strong>Plan:</strong> ${plan.name}</p>
        <p><strong>Plan ID:</strong> ${plan.offeringId}</p>
        <br/>`;
        
    for(var key in characteristics) {
        body.innerHTML += `<p><strong>${key}:</strong> ${characteristics[key]}</p>`
    }

    modal.style.display = "flex";

    const cancelBtn = modal.querySelector("#confirm-modal-cancel");
    cancelBtn.onclick = () => {
            modal.style.display = "none";
            okBtn.onclick = null;
            cancelBtn.onclick = null;
        };

    const okBtn = modal.querySelector("#confirm-modal-ok");
    okBtn.onclick = () => {
            close(); 
            onConfirmFn && onConfirmFn(org, plan, characteristics); 
        };
}

// ==========================
// ORGANIZATIONS
// ==========================

// OK
export function renderOrganizationsList(orgs, onOrganizationSelectedFn) {
    const list = qs("#org-list");
    clear(list);
    orgs.forEach(org => {
        const card = cn("#org-card-template");
        card.querySelector("#tradingName").innerHTML = org.tradingName;
        card.querySelector("#id").innerHTML = org.id;
        card.addEventListener("click", () => onOrganizationSelectedFn(org));
        list.appendChild(card);
    });
}

// OK
export function updateSelectedOrgHeader(org) {
    const header = qs("#org-header");   // FIXMe rename to org-header-container
    const msg = qs("#message-panel");
    if(org) {
        msg.style.display="none";
        header.style.display="block";
        clear(header);
        const orgHeader = cn("#org-header-template");
        orgHeader.querySelector("#tradingName").innerHTML = org.tradingName;
        orgHeader.querySelector("#id").innerHTML = org.id;
        header.appendChild(orgHeader);

        // link to the BAE
        header.querySelector("#link_to_dome").addEventListener("click", () => {
            let url = config.baeEndpoint + "/org-details/" + org.id;
            window.open(url, org.id);
        });

    }
    else {
        header.style.display="none";
        msg.style.display="block";
        msg.innerHTML = "<p>Select an Organization to view its Subscriptions</p>";
    }
}

// OK
export function buildSubscriptionCard(org, subscription, onSuccessfulUpdateFn, updateSubscriptionFn) {

    // prepare the card
    const subscriptionCard = cn("#subscription-template");
    subscriptionCard.querySelector("#name").innerHTML = subscription.name;
    subscriptionCard.querySelector("#id").innerHTML = subscription.id;
    subscriptionCard.querySelector("#activationDate").innerHTML = new Date(subscription.startDate).toLocaleDateString();
    if(subscription.terminationDate) {
        subscriptionCard.querySelector("#terminationDateContainer").style.display="";
        subscriptionCard.querySelector("#terminationDate").innerHTML = new Date(subscription.terminationDate).toLocaleDateString();
    }
    else {
        subscriptionCard.querySelector("#terminationDateContainer").style.display="none";

    }

    let options = "";
    for(let key in config.statuses) {
        let status = config.statuses[key];
        let value = status.value;
        let selected = (value==subscription.status);
        let disabled = !config.statuses[subscription.status].allowedTransitions.includes(value);
        options += `<option value="${value}" ${selected?"selected":""} ${disabled?"disabled":""}>${status.label}</option>`;
    }
    subscriptionCard.querySelector("#statusOptions").innerHTML = options;
    subscriptionCard.querySelector("#statusLabel").innerHTML = config.statuses[subscription.status].label + " - " + config.statuses[subscription.status].description;

    subscriptionCard.classList.add(subscription.status);

    // retrieve controls
    const select = subscriptionCard.querySelector("#statusOptions");
    const statusLabel = subscriptionCard.querySelector("#statusLabel");
    const editBtn = subscriptionCard.querySelector("#edit");
    //const actionBtns = div.querySelector(".action-buttons");
    const confirmBtn = subscriptionCard.querySelector("#confirm");
    const cancelBtn = subscriptionCard.querySelector("#cancel");

    if(config.finalStatuses.includes(subscription.status)) {
        // just disable all actions
        statusLabel.style.display="";
        editBtn.style.display="none"; 
        confirmBtn.style.display="none"; 
        cancelBtn.style.display="none"; 
    }
    else {
        // enable actions
        statusLabel.style.display="";
        editBtn.style.display=""; 
        confirmBtn.style.display="none"; 
        cancelBtn.style.display="none"; 

        editBtn.addEventListener("click", () => { 
                if(!acquireEditLock(subscriptionCard))
                    return;
                select.disabled=false; 
                select.style.removeProperty("display");
                statusLabel.style.display="none";
                confirmBtn.style.display=""; 
                cancelBtn.style.display=""; 
                editBtn.style.display="none"; 
            }
        );

        cancelBtn.addEventListener("click", () => {
                releaseEditLock(subscriptionCard);
                select.value=subscription.status; 
                select.disabled=true; 
                statusLabel.style.removeProperty("display");
                select.style.display="none";
                confirmBtn.style.display="none"; 
                cancelBtn.style.display="none"; 
                editBtn.style.display=""; 
            }
        );

        confirmBtn.addEventListener("click", async () => {
                const newStatus = select.value;
                confirmBtn.disabled = true;
                cancelBtn.disabled = true;
                try {
                    const updatedProduct = { ...subscription, status:newStatus };
                    await updateSubscriptionFn(org, updatedProduct);
                    subscription.status = newStatus;
                    select.disabled=true;
                    cancelBtn.style.display="none"; 
                    confirmBtn.style.display="none"; 
                    editBtn.style.display="";
                    showModalAlert("Success", "Subscription updated successfully!");
                    releaseEditLock(subscriptionCard);
                    onSuccessfulUpdateFn(org);
                } catch(err) {
                    showModalAlert("Error" ,"Subscription update failed: "+err.message);
                    releaseEditLock(subscriptionCard);
                    select.value=subscription.status; 
                    select.disabled=true; 
                    cancelBtn.style.display="none"; 
                    confirmBtn.style.display="none"; 
                    editBtn.style.display="";
                } finally { 
                    releaseEditLock(subscriptionCard);
                    confirmBtn.disabled=true; 
                    cancelBtn.disabled=true; 
                }
            }
        );    
    }
    return subscriptionCard;
}

// OK
export function renderSubscriptions(org, subscriptions, container, onSuccessfulUpdateFn, updateSubscriptionFn) {

    clear(container);

    // no subscriptions => display message and return
    if (!subscriptions || subscriptions.length === 0) {
        const messageBox = cn("#nested-message-template", "nested-message");
        messageBox.querySelector("#message").innerHTML = "No subscriptions found";
        container.appendChild(messageBox);
        return;
    }
    // otherwise, show the subscription
    else {
        container.display="";
        subscriptions.forEach(subscription => {
            let subscriptionCard = buildSubscriptionCard(org, subscription, onSuccessfulUpdateFn, updateSubscriptionFn);
            container.appendChild(subscriptionCard);
        });
    }

}

// OK
export function buildSubscriptionPlanCard(org, plan, activatePlanFn) {

    // create the card
    const card = cn("#subscription-plan-template");

    // filling values
    card.querySelector("#id").innerHTML = plan.offeringId;
    card.querySelector("#name").innerHTML = plan.name;
    card.querySelector("#description").innerHTML = plan.description ? plan.description : "[No description available]";

    // add configurable properties
    for(let char of plan.configurableCharacteristics) {
        if(char.type=="percentage") {
            let editor = cn("#percentage-editor-template");
            editor.style.display=char.hide ? "none": "block";
            editor.querySelector("#label").innerHTML = char.label;
            editor.querySelector("#value").id = char.key;
            card.querySelector("#characteristics").appendChild(editor);
        }
        else if(char.type=="boolean") {
            let editor = cn("#boolean-editor-template");
            editor.style.display=char.hide ? "none": "block";
            editor.querySelector("#label").innerHTML = char.label;
            editor.querySelector("#value").checked = char.value;
            editor.querySelector("#value").value = true;
            editor.querySelector("#value").id = char.key;
            card.querySelector("#characteristics").appendChild(editor);
        }
        else if(char.type=="date") {
            let editor = cn("#date-editor-template");
            editor.style.display=char.hide ? "none": "block";
            editor.querySelector("#label").innerHTML = char.label;
            editor.querySelector("#value").valueAsDate = new Date();
            editor.querySelector("#value").id = char.key;
            card.querySelector("#characteristics").appendChild(editor);
        }
    }

    // link to the BAE
    card.querySelector("#link_to_dome").addEventListener("click", () => {
        let url = config.baeEndpoint + "/search/" + plan.offeringId;
        window.open(url, plan.offeringId);
    });

    // enable the 'select' button
    card.querySelector("#select").style.display="block";

    // react to click on 'select'
    card.querySelector("#select").addEventListener("click", () => {
        if(!acquireEditLock(card))
            return;
        // show configuration params
        card.querySelector("#characteristics").style.display="block";
        // reconfigure buttons visibility
        card.querySelector("#select").style.display="none";
        card.querySelector("#proceed").style.display="block";
        card.querySelector("#cancel").style.display="block";
    });

    // react to click on 'cancel'
    card.querySelector("#cancel").addEventListener("click", () => {
        releaseEditLock(card);
        // hide configuration params
        card.querySelector("#characteristics").style.display="none";
        // reconfigure buttons visibility
        card.querySelector("#select").style.display="block";
        card.querySelector("#proceed").style.display="none";
        card.querySelector("#cancel").style.display="none";
    });

    // hooking an action to the button
    card.querySelector("#proceed").addEventListener("click", () => {

        let subscriptionConfiguration = {};

        // validate characteristics
        for(let char of plan.configurableCharacteristics) {
            let key = char.key;
            let value = card.querySelector("#characteristics").querySelector("#"+key).value;
            if(char.type=="percentage") {
                if(value==null || value=="" || isNaN(value) || value<0 || value>100){ 
                    showModalAlert("Invalid percentage: " + value + "%", "Please enter a percentage between 0 and 100");
                    return; 
                }
            }
            else if(char.type=="date") {
                let date = Date.parse(value);
                if(isNaN(date)) {
                    showModalAlert("Invalid " + char.label, "Please enter an " + char.label);
                    return; 
                }
            }
            else if(char.type=="boolean") {
                if(value!="true" && value!="false") {
                    showModalAlert("Invalid value for " + char.label);
                    return; 
                }
            }
            subscriptionConfiguration[key] = value;   
        }

        // then activate the plan
        activatePlanFn(org, plan, subscriptionConfiguration);
    });

    return card;
}

// OK
export function renderPlans(org, plans, onPlanSelectedFn, container) {

    // clean the container
    clear(container);
    
    // no plans available
    if (!plans || plans.length === 0) {
        const div = ce("div", "no-plans-card");
        div.innerHTML = `<p>No plans available.</p>`;
        container.appendChild(div);
        container.style.display = "block";
        return;
    }

    plans.forEach(plan => {
        const card = buildSubscriptionPlanCard(org, plan, onPlanSelectedFn);
        container.appendChild(card);
    });

}


// OK
export async function showOrganizationSubscriptions(org, checkCurrentSubscriptionFn, checkAvailablePlansFn) {

    if(!acquireEditLock())
        return;

    // some cleanup
    clear(qs("#message-panel"));
    clear(qs("#current-subscriptions-list"));
    clear(qs("#other-subscriptions-info"));

    qs("#current-subscriptions-list").innerHTML = '<p class="nested-message">Loading...</p>';
    qs("#other-subscriptions-info").innerHTML = '<p class="nested-message">Loading...</p>';

    // update the header
    updateSelectedOrgHeader(org);

    if(!org)
        return;

    // activate the panel
    qs("#subscriptions-container").style.display="block";

    // RIGHT PANEL: Assign Plan
    const plansContainer = qs("#plans-container");
    const plansContainerButtons = qs("#plans-container-buttons");
    const planList = qs("#plan-list");
    const btnAssign = qs("#btn-assign-plan");

    plansContainer.style.display = "none";
    plansContainerButtons.style.display = "none";
    planList.innerHTML = "";
    planList.style.display = "none";

    // Remove previous listeners
    const newBtn = btnAssign.cloneNode(true);
    btnAssign.replaceWith(newBtn);

    newBtn.textContent = "Add";
    newBtn.disabled = false;

    try {

        const [subs] = await Promise.all([
            checkCurrentSubscriptionFn(org, qs("#current-subscriptions-list"), qs("#other-subscriptions-info"))
        ]);

        let currentSubs = subs[0];
        if ((currentSubs.length) < config.maxAllowedSubscriptions) {
            plansContainer.style.display = "block";
            plansContainerButtons.style.display = "block";
            wireAssignButton(newBtn, planList, org, checkAvailablePlansFn);
        }
    } catch(err) {
        console.error("Error rendering subscriptions:", err);
    }
}

// Attach button logic
export function wireAssignButton(btn, planList, org, checkAvailablePlansFn) {
    btn.addEventListener("click", async () => {
        const opening = planList.style.display === "none";
        if (opening) {
            btn.disabled = true;
            btn.textContent = "Loading...";
            try {
                await checkAvailablePlansFn(org);
                planList.style.removeProperty("display");
                btn.textContent = "Close";
            } catch(err) {
                showModalAlert("Failed to Load Plans", "Please try again or contact your administator (" + err +").");
                btn.textContent = "Add";
            } finally {
                btn.disabled = false;
            }
        } else {
            if(!acquireEditLock())
                return;
            planList.style.display = "none";
            btn.textContent = "Add";
        }
    });
}