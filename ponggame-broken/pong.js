let model = new Model();

// Wait for the entire page to load, then load the initial theme.
// The game loop (onTick) will be passed as a callback to start the game
// only AFTER the theme's view.js file has been loaded.
window.addEventListener('load', () => {
    loadThemeAssets(model.theme.name, onTick);
});

function onTick() {
    switch (model.state) {
        case STATE.STARTUP:
            model.state = STATE.PLAYING;
            break;
        case STATE.PLAYING:
            model.state = play();
            if (model.state === STATE.PLAYING) draw_game(model); // Only draw if we are still playing
            break;
        case STATE.GAMEOVER:
            state = STATE.GAMEOVER;
            break;
    }
    if (model.state === STATE.PLAYING) {
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
        if (model.scoreL >= 10 || model.scoreR >= 10) return STATE.GAMEOVER;
    }
    // Add serving the ball?
    // If a player wins, stop the game...
    return STATE.PLAYING;
}
