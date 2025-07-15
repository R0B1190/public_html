let model = new Model();

// Wait for the entire page to load, then load the initial theme.
// The game loop (onTick) will be passed as a callback to start the game
// only AFTER the theme's view.js file has been loaded.
window.addEventListener('load', () => {
    loadThemeAssets(model.theme.name, onTick);
});

function onTick() {
    if (model.state === STATE.PLAYING) {
        model.state = play(); // This might change state to GAMEOVER
    } else if (model.state === STATE.STARTUP) {
        model.state = STATE.PLAYING;
    }

    // Always draw the game board
    draw_game(model);

    // If the game is over, draw the victory screen and stop the loop
    if (model.state === STATE.GAMEOVER) {
        draw_victory_screen(model);
        clearTimeout(model.intervalID); // Stop the game loop.
        return; // Don't set another timeout
    }

    model.intervalID = setTimeout(onTick, 10);
}

function play() {
    model.paddleL.move(model.cpu_left, model.ball, model.cpu_difficulty);
    model.paddleR.move(model.cpu_right, model.ball, model.cpu_difficulty);
    model.ball.move();

    let scoreSide = model.ball.bounce([model.paddleL, model.paddleR]);
    if (scoreSide != SIDE.NONE) {
        if (scoreSide == SIDE.LEFT) model.scoreR++;
        if (scoreSide == SIDE.RIGHT) model.scoreL++;
        updateScore(model);
        model.resetBall();
        if (model.scoreL >= model.winningScore || model.scoreR >= model.winningScore) return STATE.GAMEOVER;
    }
    // Add serving the ball?
    // If a player wins, stop the game...
    return STATE.PLAYING;
}
