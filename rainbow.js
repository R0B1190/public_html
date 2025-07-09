/**
 * Changes the background color of the page and updates the active
 * navigation button to a darker shade of the new color.
 * This function is called from the button in index.html.
 */
function onlmbclick() {
    const colorInput = document.getElementById('my-input');
    const newColor = colorInput.value.trim();

    if (!newColor) {
        // If the input is empty, do nothing.
        return;
    }

    // Set the body's background color. The browser will ignore invalid color values.
    document.body.style.backgroundColor = newColor;

    // Get the computed style of the body. This will return the color in a
    // consistent 'rgb(r, g, b)' format, even if a name like "blue" was entered.
    const computedColor = window.getComputedStyle(document.body).backgroundColor;

    // Use a regular expression to extract the numeric RGB values.
    const rgbValues = computedColor.match(/\d+/g);

    // Proceed only if we successfully parsed the RGB values.
    if (rgbValues && rgbValues.length >= 3) {
        const r = parseInt(rgbValues[0], 10);
        const g = parseInt(rgbValues[1], 10);
        const b = parseInt(rgbValues[2], 10);

        // Calculate a darker shade by reducing each component's value.
        // Multiplying by 0.7 makes it 30% darker. You can adjust this value.
        const darkerColor = `rgb(${Math.max(0, Math.floor(r * 0.7))}, ${Math.max(0, Math.floor(g * 0.7))}, ${Math.max(0, Math.floor(b * 0.7))})`;

        // Find the active navigation link for the current page.
        const activeLink = document.querySelector('#tswcssbuttons a[href="index.html"]');

        // If the active link is found, update its background color.
        if (activeLink) {
            activeLink.style.backgroundColor = darkerColor;
        }
    }
}
let element = document.getElementById("tswheader")
console.log(element)
let angle = 0;
let shouldrainbow = true
function onframe(){
    angle += 0.75;
    if(shouldrainbow){
        element.style.backgroundColor = "hsl(" + angle + "deg, 100%, 50%)"
    }
    requestAnimationFrame(onframe)
}
onframe()
function start_rainbow(){
    shouldrainbow = true
}