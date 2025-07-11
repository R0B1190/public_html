const widget_container = document.getElementById("widget-container");
const stores = document.getElementsByClassName("store");
const score_element = document.getElementById("score");
const lawn_div = document.getElementById("lawn-simulator");

const PRICE_INCREASE_PERCENTAGE = 1.05; // 5%

let score = 5;
let super_gompei_count = 0;

let lawn_count = 0;
let gompei_count = 0;
let sup_gompei_count = 0;
let lawnMowerActive = false;
let autoBuyEnabled = false;

function autoBuyCheapest() {
    // Loop as long as auto-buy is on and we can afford something
    while (autoBuyEnabled) {
        let cheapestStore = null;
        let minCost = Infinity;

        // The 'stores' HTMLCollection is live, so it updates when the lawn mower is removed.
        for (const store of stores) {
            const cost = parseInt(store.getAttribute("cost"));
            if (score >= cost && cost < minCost) {
                minCost = cost;
                cheapestStore = store;
            }
        }

        if (cheapestStore) {
            buy(cheapestStore);
        } else {
            // If we can't afford anything, break the loop.
            break;
        }
    }
}

function changeScore(amount) {
    console.log(score);
    score += amount;
    score_element.innerHTML = `Score: ${score}`;
    //set score element

    // Update the stores to show ones that are too expensive
    for (let store of stores) {
        let cost = parseInt(store.getAttribute("cost"));

        if (score < cost) {
            store.setAttribute("broke", "");
        } else {
            store.removeAttribute("broke");
        }
    }

    // If score was increased (i.e. not from a purchase), check for auto-buy
    if (amount > 0) {
        autoBuyCheapest();
    }
}
function buy(store) {
    const cost = parseInt(store.getAttribute("cost"));

    if ( score < cost ) {
        return
    }

    changeScore(-cost)

    const storeName = store.getAttribute("name");

    // Handle Upgrades first
    if (storeName.includes("Upgrade")) {
        const targetName = store.getAttribute("target-name");
        const upgradeAmount = parseInt(store.getAttribute("upgrade-amount"));

        // Find original store item to update its template for future buys
        const originalStore = Array.from(stores).find(s => s.getAttribute("name") === targetName);
        if (originalStore) {
            const templateWidget = originalStore.querySelector('.widget');
            const currentReap = parseInt(templateWidget.getAttribute("reap"));
            const newReap = currentReap + upgradeAmount;
            templateWidget.setAttribute("reap", newReap);

            // Update the reap text on the original store item's display
            // The user specified the format is "+(N) sqft".
            const scoreTextParagraph = Array.from(originalStore.getElementsByTagName("p")).find(p => p.textContent.includes('sqft'));
            if (scoreTextParagraph) {
                // This specifically finds text like "+(1) sqft" and updates it.
                scoreTextParagraph.textContent = `+${newReap} sqft`;
            }
        }

        // Update all existing widgets of that type that are already on the field
        for (const widget of widget_container.children) {
            if (widget.getAttribute("data-type") === targetName) {
                const currentReap = parseInt(widget.getAttribute("reap"));
                widget.setAttribute("reap", currentReap + upgradeAmount);
            }
        }

        // Increase cost of the upgrade itself (make them get expensive faster)
        const newCost = Math.ceil(cost * 1.5);
        store.setAttribute("cost", newCost);
        const pElements = store.getElementsByTagName("p");
        for (const p of pElements) {
            if (p.textContent.includes("points")) {
                p.textContent = `${newCost} points`;
                break;
            }
        }
        return; // We are done, no widget is created for an upgrade purchase
    }

    // check available to buy
    // change score

    // Increase the cost for the next purchase for all items except the lawn mower
    if (store.getAttribute("name") !== "Lawn Mower") {
        const newCost = Math.ceil(cost * PRICE_INCREASE_PERCENTAGE);
        store.setAttribute("cost", newCost);
        const pElements = store.getElementsByTagName("p");
        for (const p of pElements) {
            if (p.textContent.includes("points")) {
                p.textContent = `${newCost} points`;
                break;
            }
        }
    }

    if (store.getAttribute("name") === "Super-Gompei") {
        super_gompei_count += 1;
        document.body.style = "--gompei-count: " + super_gompei_count + ";";
        const super_gompei = document.querySelector("#widget-container #super-gompei")?.parentElement;
        // If Super-Gompei already exists
        if (super_gompei) {
            const reapToAdd = 100; // Each purchase adds 100 to the total.
            const newTotalReap = parseInt(super_gompei.getAttribute("reap")) + reapToAdd;
            super_gompei.setAttribute("reap", newTotalReap);

            // Also update the template in the store so the text reflects the new total
            const templateWidget = store.querySelector('.widget');
            templateWidget.setAttribute("reap", newTotalReap);

            // Now update the display text.
            const scoreTextParagraph = Array.from(store.getElementsByTagName("p")).find(p => p.textContent.includes('sqft'));
            if (scoreTextParagraph) {
                scoreTextParagraph.textContent = `+${newTotalReap} sqft`;
            }
            return; // Return to prevent creating a new widget
        } else {
            const pastureGompei = document.createElement('img');
            pastureGompei.src = store.getAttribute("src");
            pastureGompei.className = 'pasture-supergompei';
    
            lawn_div.appendChild(pastureGompei);
        }
    }

    if (store.getAttribute("name") === "Lawn Mower") {
        lawnMowerActive = true;
        // This is a one-time purchase, so remove the store item
        store.remove();

        // Trigger an initial harvest for any lawns that are ready
        for (const widget of widget_container.children) {
            if (widget.getAttribute("auto") !== 'true' && !widget.querySelector("#super-gompei")) {
                // harvest() has a check for "harvesting", so this is safe
                harvest(widget);
            }
        }
        return;
    }

    if (store.getAttribute("name") === "Gompei") {
        const pastureGompei = document.createElement('img');
        pastureGompei.src = store.getAttribute("src");
        pastureGompei.className = 'pasture-gompei';

        // Get pasture dimensions to place the gompei inside
        const pastureRect = lawn_div.getBoundingClientRect();
        const gompeiSize = 50; // Must match the width in CSS

        // Calculate random position, ensuring it's within bounds
        const randomTop = Math.random() * (pastureRect.height - gompeiSize);
        const randomLeft = Math.random() * (pastureRect.width - gompeiSize);
        const randomRotation = Math.random() * 90 - 45;

        pastureGompei.style.top = `${randomTop}px`;
        pastureGompei.style.left = `${randomLeft}px`;
        pastureGompei.style.transform = `rotate(${randomRotation}deg)`;

        lawn_div.appendChild(pastureGompei);
        console.log(randomTop,randomLeft);
    }


    // clone node for widget, and add to container
    const widget = store.firstElementChild.cloneNode(true);
    widget.setAttribute('data-type', store.getAttribute("name"));
    widget.onclick = () => {
        harvest(widget);
    }
    widget_container.appendChild(widget);

    if (widget.getAttribute("auto") == 'true') {
        widget.setAttribute("harvesting", "");
        setup_end_harvest(widget);
    } else if (lawnMowerActive && !widget.querySelector("#super-gompei")) {
        // This is a manual widget (lawn) and the mower is active.
        // Start the harvest cycle immediately.
        harvest(widget);
    }
}

function setup_end_harvest(widget) {
    setTimeout(() => {
        // Remove the harvesting flag
        widget.removeAttribute("harvesting");
        // If automatic, start again
        if (widget.getAttribute("auto") == 'true') {
            harvest(widget);
        }
        // If lawn mower is active and this is a lawn plot, harvest it
        else if (lawnMowerActive && !widget.querySelector("#super-gompei")) {
            harvest(widget);
        }
    }, parseFloat(widget.getAttribute("cooldown")) * 1000);
}

function harvest(widget) {
    // Only run if currently not harvesting
    if (widget.hasAttribute("harvesting")) return;
    // Set harvesting flag
    widget.setAttribute("harvesting", "");

    // If manual, collect points now
    changeScore(parseInt(widget.getAttribute("reap")));
    showPoint(widget);

    setup_end_harvest(widget);
}


function showPoint(widget) {
    let number = document.createElement("span");
    number.className = "point";
    number.innerHTML = "+" + widget.getAttribute("reap");
    widget.appendChild(number);
    number.onanimationend = () => {
        number.remove();
    }
}


// Update the Lawn store item's display to show the grass image.
const lawnStore = Array.from(stores).find(s => s.getAttribute("name") === "Lawn");
if (lawnStore) {
    const widgetDisplay = lawnStore.querySelector('.widget');
    if (widgetDisplay) {
        // Replace the text content with an image, matching the style of other store items.
        widgetDisplay.innerHTML = `<img src="./grass.jpeg" alt="A patch of grass" style="max-width: 100%; max-height: 60%;">`;
    }
}

// Create and add the Lawn Mower store item since it's missing from the HTML
const lawnMowerStoreItem = document.createElement('div');
lawnMowerStoreItem.className = 'store';
lawnMowerStoreItem.setAttribute('name', 'Lawn Mower');
lawnMowerStoreItem.setAttribute('cost', '300');
lawnMowerStoreItem.setAttribute('src', './lawn-mower.png');

const lawnMowerDisplay = document.createElement('div');
lawnMowerDisplay.className = 'widget'; // For display consistency in the store
lawnMowerDisplay.innerHTML = `<img src="./lawn-mower.png" style="max-width: 100%; max-height: 60%;">`;
lawnMowerStoreItem.appendChild(lawnMowerDisplay);

const lawnMowerText = document.createElement('p');
lawnMowerText.textContent = 'Lawn Mower';
lawnMowerStoreItem.appendChild(lawnMowerText);

const lawnMowerCost = document.createElement('p');
lawnMowerCost.textContent = '300 points';
lawnMowerStoreItem.appendChild(lawnMowerCost);


// Add it to the same container as the other stores
if (stores.length > 0) {
    stores[0].parentElement.appendChild(lawnMowerStoreItem);
}

// Create and add upgrade store items
function createUpgradeStore(name, cost, targetName, upgradeAmount, imageSrc, imageAlt) {
    const upgradeStoreItem = document.createElement('div');
    upgradeStoreItem.className = 'store';
    upgradeStoreItem.setAttribute('name', name);
    upgradeStoreItem.setAttribute('cost', cost);
    upgradeStoreItem.setAttribute('target-name', targetName); // Which item it upgrades
    upgradeStoreItem.setAttribute('upgrade-amount', upgradeAmount); // How much to upgrade by

    const display = document.createElement('div');
    display.className = 'widget';
    display.innerHTML = `<img src="${imageSrc}" alt="${imageAlt}" style="max-width: 100%; max-height: 60%;">`;
    upgradeStoreItem.appendChild(display);

    const text = document.createElement('p');
    text.textContent = name;
    upgradeStoreItem.appendChild(text);

    const costText = document.createElement('p');
    costText.textContent = `${cost} points`;
    upgradeStoreItem.appendChild(costText);

    // Add it to the same container as the other stores
    if (stores.length > 0) {
        stores[0].parentElement.appendChild(upgradeStoreItem);
    }
}

createUpgradeStore('Lawn Upgrade', '500', 'Lawn', '1', './grass.jpeg', 'An upgrade for lawns');
createUpgradeStore('Gompei Upgrade', '1000', 'Gompei', '5', './gompei.png', 'An upgrade for Gompeis');

// Speed buy functionality
let speedBuyTimeout = null;
let speedBuyInterval = null;

function startSpeedBuy(store) {
    // Prevent multiple triggers
    if (speedBuyTimeout || speedBuyInterval) return;

    // Buy once immediately
    buy(store);

    // Set a timeout to start the interval buying
    speedBuyTimeout = setTimeout(() => {
        speedBuyInterval = setInterval(() => {
            buy(store);
        }, 0); // Buy as fast as possible
    }, 150); // Wait 150ms before starting to speed buy
}

function stopSpeedBuy() {
    clearTimeout(speedBuyTimeout);
    clearInterval(speedBuyInterval);
    speedBuyTimeout = null;
    speedBuyInterval = null;
}

// Apply speed buy to all store items
for (const store of stores) {
    store.onclick = null; // Remove inline onclick handler
    store.onmousedown = function() { startSpeedBuy(this); };
    store.onmouseup = stopSpeedBuy;
    store.onmouseleave = stopSpeedBuy;
}

// Create and add the auto-buy button
const autoBuyButton = document.createElement('button');
autoBuyButton.id = 'auto-buy-toggle';
autoBuyButton.textContent = 'Auto-Buy: OFF';
autoBuyButton.title = 'When ON, automatically buys the cheapest available item.';
autoBuyButton.style.padding = '5px 10px';
autoBuyButton.style.cursor = 'pointer';
autoBuyButton.style.border = '1px solid #ccc';
autoBuyButton.style.borderRadius = '4px';
autoBuyButton.style.display = 'block';
autoBuyButton.style.margin = "10px auto";
const firstStoreItem = document.querySelector(".store");
firstStoreItem?.parentElement?.before(autoBuyButton);

autoBuyButton.addEventListener('click', () => {
    autoBuyEnabled = !autoBuyEnabled;
    autoBuyButton.textContent = `Auto-Buy: ${autoBuyEnabled ? 'ON' : 'OFF'}`;
    if (autoBuyEnabled) {
        autoBuyButton.style.backgroundColor = '#4CAF50';
        autoBuyButton.style.color = 'white';
        // Immediately check if we can buy something
        autoBuyCheapest();
    } else {
        autoBuyButton.style.backgroundColor = '';
        autoBuyButton.style.color = '';
    }
});
changeScore(0);