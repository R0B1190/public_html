window.addEventListener("keydown", keyDown);
function keyDown(event) {
    const key = event.code;
    // console.log(`KEYDOWN: ${key}`);

    switch (key) {
        case "ArrowUp":
            model.paddleR.vely = -PADDLE_VELOCITY;
            break;
        case "ArrowDown":
            model.paddleR.vely = PADDLE_VELOCITY;
            break;
        case "End":
            model.resetGame();
            break;
    }
}

window.addEventListener("keyup", keyUp);
function keyUp(event) {
    const key = event.code;
    // console.log(`KEYUP: ${key}`);

    switch (key) {
        case "ArrowUp":
        case "ArrowDown":
            model.paddleR.vely = 0;
            break;
    }
}

function resetGame() {
    model.resetGame();
    onTick();
}

function set_cpu(event) {
    model.is_cpu = event.target.checked;
}