let model = new Model();

window.addEventListener('load', () => {
    // Sync the initial winning score from the HTML input to the model.
    const scoreInput = document.getElementById("winning-score-selector");
    if (scoreInput) {
        model.winningScore = parseInt(scoreInput.value) || 10;
    }

    // Load initial theme and start the game loop as a callback
    loadThemeAssets(model.theme.name, onTick);
});

function onTick() {
    clearTimeout(model.intervalID); // Prevent multiple loops

    if (model.state === STATE.STARTUP) {
        model.state = STATE.PLAYING;
    } else if (model.state === STATE.PLAYING) {
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
    model.paddleL.move(model.cpu_left, model.ball, model.cpu_difficulty);
    model.paddleR.move(model.cpu_right, model.ball, model.cpu_difficulty);
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
