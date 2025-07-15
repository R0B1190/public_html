let model = new Model();

window.addEventListener('load', () => {
    // Initialize the game state and sync the UI for the first time.
    model.resetGame();

    // Load initial theme and start the game loop as a callback
    loadThemeAssets(model.theme.name, onTick);
});

function onTick() {
    clearTimeout(model.intervalID); // Prevent multiple loops

    if (model.state === STATE.PLAYING) {
        model.state = play();
    }

    draw_game(model);

    if (model.state === STATE.GAMEOVER) {
        draw_victory_screen(model);
    } else {
        model.intervalID = setTimeout(onTick, 10);
    }
}

function play() {
    updatePlayerPaddlesVelocity();
    model.paddleL.move(model.cpu_left, model.ball, model.cpu_difficulty_left);
    model.paddleR.move(model.cpu_right, model.ball, model.cpu_difficulty_right);
    model.ball.move();

    let scoreSide = model.ball.bounce([model.paddleL, model.paddleR]);
    if (scoreSide != SIDE.NONE) {
        if (scoreSide == SIDE.LEFT) model.scoreR++;
        if (scoreSide == SIDE.RIGHT) model.scoreL++;
        updateScore(model);
        model.resetBall();
        // Check for a win, but only if a winning score is set (i.e., not 0 for endless mode)
        if (model.winningScore > 0 && (model.scoreL >= model.winningScore || model.scoreR >= model.winningScore)) {
            return STATE.GAMEOVER;
        }
    }
    // Add serving the ball?
    // If a player wins, stop the game...
    return STATE.PLAYING;
}
