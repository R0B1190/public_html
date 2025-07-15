window.addEventListener("keydown", keyDown);
const difficulty_selector = document.getElementById("difficulty");
if (difficulty_selector) difficulty_selector.addEventListener("change", set_difficulty);
const cpu_paddle_selector = document.getElementById("cpu_paddle_selector");
if (cpu_paddle_selector) cpu_paddle_selector.addEventListener("change", set_cpu_paddle);
const winning_score_selector = document.getElementById("winning_score_selector");
if (winning_score_selector) winning_score_selector.addEventListener("change", set_winning_score);

function keyDown(event) {
    const key = event.code;
    // console.log(`KEYDOWN: ${key}`);

    switch (key) {
        case "KeyW":
            model.paddleL.vely = -PADDLE_VELOCITY;
            break;
        case "KeyS":
            model.paddleL.vely = PADDLE_VELOCITY;
            break;
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
        case "KeyW":
        case "KeyS":
            model.paddleL.vely = 0;
            break;
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

function set_cpu_paddle(event) {
    const side = event.target.value;
    model.cpu_left = (side === 'left' || side === 'both');
    model.cpu_right = (side === 'right' || side === 'both');
}

function set_difficulty(event) {
    model.cpu_difficulty = parseInt(event.target.value);
}

function set_winning_score(event) {
    model.winningScore = parseInt(event.target.value);
    resetGame();
}