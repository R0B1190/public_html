const widget_container = document.getElementById("widget-container");
const stores = document.getElementsByClassName("store");
const score_element = document.getElementById("score");
const lawn_div = document.getElementById("lawn-simulator");

let score = 5;
let super_gompei_count = 0;

let lawn_count = 0;
let gompei_count = 0;
let sup_gompei_count = 0;

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
}
function buy(store) {
    const cost = parseInt(store.getAttribute("cost"));


    if ( score < cost ) {
        return
    }

    changeScore(-cost)
    // check available to buy
    // change score

    // For lawn plots, increase the cost for the next purchase
    if (store.getAttribute("name") === "Lawn Plot") {
        // Increase cost by 8% for a more balanced progression
        const newCost = Math.ceil(cost * 1.08);
        store.setAttribute("cost", newCost);
        const display = store.firstElementChild;
        // Find the text node that contains the cost and update it.
        // This is more robust than replacing the whole innerHTML.
        for (const node of display.childNodes) {
            // Node.TEXT_NODE is type 3. We look for the text containing "Cost:".
            if (node.nodeType === 3 && node.textContent.includes('Cost:')) {
                node.textContent = `Cost: ${newCost}`;
                break; // Exit loop once the cost is updated
            }
        }
    }

    if (store.getAttribute("name") === "Super-Gompei") {
        super_gompei_count += 1;
        document.body.style = "--gompei-count: " + super_gompei_count + ";";
        const super_gompei = document.querySelector("#widget-container #super-gompei")?.parentElement;
        // If Super-Gompei already exists
        if (super_gompei) {
            super_gompei.setAttribute("reap", (parseInt(super_gompei.getAttribute("reap")) + 100));
            return;
        } else {
            const pastureGompei = document.createElement('img');
            pastureGompei.src = store.getAttribute("src");
            pastureGompei.className = 'pasture-supergompei';
    
            // Get pasture dimensions to place the gompei inside
            const pastureRect = lawn_div.getBoundingClientRect();
            const gompeiSize = 100; // Must match the width in CSS
    
            // Calculate random position, ensuring it's within bounds
            const randomTop = pastureRect.height/2
            const randomLeft = pastureRect.width/2
            const randomRotation = 0;
    
            pastureGompei.style.top = `${randomTop}px`;
            pastureGompei.style.left = `${randomLeft}px`;
            pastureGompei.style.transform = `rotate(${randomRotation}deg)`;
    
            lawn_div.appendChild(pastureGompei);
        }
    }

    if (store.getAttribute("name") === "Lawn Mower") {
        setInterval(() => {
            // Find all the manual-click widgets ("lawn plots")
            for (const widget of widget_container.children) {
                // It must be a manual widget, so no 'auto' attribute
                // and we'll assume "lawn plots" are not Super-Gompeis
                if (widget.getAttribute("auto") !== 'true' && !widget.querySelector("#super-gompei")) {
                    harvest(widget);
                }
            }
        }, 1000); // Clicks every second
        // This is a one-time purchase, so remove the store item
        store.remove();
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
    }


    // clone node for widget, and add to container
    const widget = store.firstElementChild.cloneNode(true);
    widget.onclick = () => {
        harvest(widget);
    }
    widget_container.appendChild(widget);

    if (widget.getAttribute("auto") == 'true') {
        widget.setAttribute("harvesting", "");
        setup_end_harvest(widget);
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


// Create and add the Lawn Mower store item since it's missing from the HTML
const lawnMowerStoreItem = document.createElement('div');
lawnMowerStoreItem.className = 'store';
lawnMowerStoreItem.setAttribute('name', 'Lawn Mower');
lawnMowerStoreItem.setAttribute('cost', '300');

const lawnMowerDisplay = document.createElement('div');
lawnMowerDisplay.className = 'widget'; // For display consistency in the store
lawnMowerDisplay.innerHTML = '🚜<br>Lawn Mower<br>(auto-clicks plots)<br>Cost: 300';
lawnMowerStoreItem.appendChild(lawnMowerDisplay);

// Add it to the same container as the other stores
if (stores.length > 0) {
    stores[0].parentElement.appendChild(lawnMowerStoreItem);
}

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
changeScore(0);