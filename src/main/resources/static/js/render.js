let allowedStatuses = [];
export function setAllowedStatuses(statuses) { allowedStatuses = statuses; }

let config = null;

export function setConfig(cfg) {
    config = cfg;
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

// OK
export function renderConfirmActivation(org, plan, characteristics, onConfirmFn) {

    const modal = qs("#confirm-modal");
    const body = qs("#confirm-modal-body");

    body.innerHTML = `
        <p><strong>Organization:</strong> ${org.tradingName}</p>
        <p><strong>Organization ID:</strong> ${org.id}</p>
        <p><strong>Plan:</strong> ${plan.name}</p>
        <p><strong>Plan ID:</strong> ${plan.id}</p>
        <br/>`;
        
    for(var key in characteristics) {
        body.innerHTML += `<p><strong>${key}:</strong> ${characteristics[key]}</p>`
    }

    modal.style.display = "flex";

    const cancelBtn = qs("#confirm-modal-cancel");
    cancelBtn.onclick = () => {
            modal.style.display = "none";
            okBtn.onclick = null;
            cancelBtn.onclick = null;
        };

    const okBtn = qs("#confirm-modal-ok");
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
    const a = qs("#org-header");   // FIXMe rename to org-header-container
    const msg = qs("#message-panel");
    if(org) {
        msg.style.display="none";
        a.style.display="block";
        clear(a);
        const orgHeader = cn("#org-header-template");
        orgHeader.querySelector("#tradingName").innerHTML = org.tradingName;
        orgHeader.querySelector("#id").innerHTML = org.id;
        a.appendChild(orgHeader);
    }
    else {
        msg.style.display="block";
        a.style.display="none";
        msg.innerHTML = "<p>Select an Organization to view its Subscriptions</p>";
    }
}

// OK
export function buildSubscriptionCard(org, subscription, onSuccessfulUpdateFn, updateSubscriptionFn) {

    // prepare the card
    const subscriptionCard = cn("#subscription-template");
    subscriptionCard.querySelector("#name").innerHTML = subscription.name;
    subscriptionCard.querySelector("#id").innerHTML = subscription.id;
    subscriptionCard.querySelector("#startDate").innerHTML = new Date(subscription.startDate).toLocaleDateString();

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
                select.disabled=false; 
                select.style.removeProperty("display");
                statusLabel.style.display="none";
                confirmBtn.style.display=""; 
                cancelBtn.style.display=""; 
                editBtn.style.display="none"; 
            }
        );

        cancelBtn.addEventListener("click", () => {
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
                    onSuccessfulUpdateFn(org);
                } catch(err) {
                    showModalAlert("Error" ,"Subscription update failed: "+err.message);
                    select.value=subscription.status; 
                    select.disabled=true; 
                    cancelBtn.style.display="none"; 
                    confirmBtn.style.display="none"; 
                    editBtn.style.display="";
                } finally { 
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
    card.querySelector("#id").innerHTML = plan.id;
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
        let url = config.baeEndpoint + "/search/" + plan.id;
        window.open(url, plan.id);
    });

    // enable the 'select' button
    card.querySelector("#select").style.display="block";

    // react to click on 'select'
    card.querySelector("#select").addEventListener("click", () => {
        // show configuration params
        card.querySelector("#characteristics").style.display="block";
        // reconfigure buttons visibility
        card.querySelector("#select").style.display="none";
        card.querySelector("#proceed").style.display="block";
        card.querySelector("#cancel").style.display="block";
    });

    // react to click on 'cancel'
    card.querySelector("#cancel").addEventListener("click", () => {
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
                if(isNaN(value) || value<0 || value>100){ 
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

    // some cleanup
    clear(qs("#message-panel"));
    clear(qs("#current-subscriptions-list"));
    clear(qs("#other-subscriptions-info"));

    qs("#current-subscriptions-list").innerHTML = "loading...";
    qs("#other-subscriptions-info").innerHTML = "loading...";

    // update the header
    updateSelectedOrgHeader(org);

    if(!org)
        return;

    // activate the panel
    qs("#subscriptions-container").style.display="block";

    // RIGHT PANEL: Assign Plan
    const plansContainerButtons = qs("#plans-container-buttons");
    const planList = qs("#plan-list");
    const btnAssign = qs("#btn-assign-plan");

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
                console.log(0);
                console.log(org);
                console.log(checkAvailablePlansFn);
                await checkAvailablePlansFn(org);
                planList.style.removeProperty("display");
                btn.textContent = "Close";
            } catch(err) {
                console.log(err);
                showModalAlert("Failed to Load Plans", "Please try again or contact your administator (" + err +").");
                btn.textContent = "Add";
            } finally {
                btn.disabled = false;
            }
        } else {
            planList.style.display = "none";
            btn.textContent = "Add";
        }
    });
}