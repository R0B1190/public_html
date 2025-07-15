const player1_keys = { up: false, down: false };
const player2_keys = { up: false, down: false };

window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);

// New event listeners for the updated controls
document.querySelectorAll('.difficulty-slider').forEach(slider => {
    slider.addEventListener('input', set_difficulty);
});

document.querySelectorAll('.player-type-selector').forEach(selector => {
    selector.addEventListener('change', set_player_type);
});

document.querySelectorAll('.theme-btn').forEach(button => {
    button.addEventListener('click', handleThemeButtonClick);
});

const winning_score_selector = document.getElementById("winning_score_selector");
if (winning_score_selector) winning_score_selector.addEventListener("change", set_winning_score);

const reset_button = document.getElementById("reset-btn");
if (reset_button) reset_button.addEventListener("click", resetGame);

function keyDown(event) {
    const key = event.code;
    switch (key) {
        case "KeyW":
            player1_keys.up = true;
            break;
        case "KeyS":
            player1_keys.down = true;
            break;
        case "ArrowUp":
            player2_keys.up = true;
            break;
        case "ArrowDown":
            player2_keys.down = true;
            break;
        case "End":
            if (model.state === STATE.GAMEOVER) {
                resetGame();
            }
            break;
    }
}

function keyUp(event) {
    const key = event.code;
    switch (key) {
        case "KeyW":
            player1_keys.up = false;
            break;
        case "KeyS":
            player1_keys.down = false;
            break;
        case "ArrowUp":
            player2_keys.up = false;
            break;
        case "ArrowDown":
            player2_keys.down = false;
            break;
    }
}

function updatePlayerPaddlesVelocity() {
    // Player 1 (Left Paddle)
    if (!model.cpu_left) {
        let move_dir = (player1_keys.down ? 1 : 0) - (player1_keys.up ? 1 : 0);
        model.paddleL.vely = move_dir * PADDLE_VELOCITY;
    }

    // Player 2 (Right Paddle)
    if (!model.cpu_right) {
        let move_dir = (player2_keys.down ? 1 : 0) - (player2_keys.up ? 1 : 0);
        model.paddleR.vely = move_dir * PADDLE_VELOCITY;
    }
}

function resetGame() {
    player1_keys.up = false;
    player1_keys.down = false;
    player2_keys.up = false;
    player2_keys.down = false;
    model.resetGame();
    onTick();
}

function set_player_type(event) {
    const side = event.target.dataset.side;
    const is_cpu = event.target.value === 'cpu';
    if (side === 'left') {
        model.cpu_left = is_cpu;
    } else if (side === 'right') {
        model.cpu_right = is_cpu;
    }
}

function set_difficulty(event) {
    const side = event.target.dataset.side;
    const difficulty = parseInt(event.target.value);

    if (side === 'left') {
        model.cpu_difficulty_left = difficulty;
    } else if (side === 'right') {
        model.cpu_difficulty_right = difficulty;
    }
}

function handleThemeButtonClick(event) {
    const themeName = event.target.dataset.theme;
    document.querySelector('.theme-btn.active').classList.remove('active');
    event.target.classList.add('active');
    // Update model colors first
    model.setTheme(themeName);
    // Load new assets and redraw once the new view script is loaded
    loadThemeAssets(themeName, () => {
        draw_game(model)
    });
}

function loadThemeAssets(themeName, onReadyCallback) {
    const theme = THEMES[themeName];
    if (!theme) {
        console.error(`Theme "${themeName}" not found.`);
        return;
    }

    // 1. Update CSS
    document.getElementById('theme-style').href = theme.cssPath;

    // 2. Remove old view script tag if it exists
    const oldScript = document.getElementById('theme-view-script');
    if (oldScript) {
        oldScript.remove();
    }

    // 3. Create and load new view script
    const newScript = document.createElement('script');
    newScript.id = 'theme-view-script';
    newScript.src = theme.jsPath;
    newScript.onload = () => {
        console.log(`Theme "${theme.name}" loaded.`);
        // The new view functions are now available globally.
        // Call the callback function to signal that we are ready.
        if (onReadyCallback) onReadyCallback();
    };
    document.body.appendChild(newScript);
}
function set_winning_score(event) {
    let score = parseInt(event.target.value);

    // A score of 0, a negative number, or an invalid number means "Endless Mode".
    // We will use a score of 0 to represent endless mode.
    if (isNaN(score) || score <= 0) {
        score = 0;
    }
    model.winningScore = score;
    resetGame();
}