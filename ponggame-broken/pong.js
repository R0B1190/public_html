let model = new Model();

window.addEventListener('load', () => {
    // Sync all controls with the initial model state.
    const winningScoreInput = document.getElementById("winning_score_selector");
    if (winningScoreInput) {
        model.winningScore = parseInt(winningScoreInput.value) || 10;
    }

    document.querySelectorAll('.player-type-selector').forEach(selector => {
        const side = selector.dataset.side;
        const is_cpu = (side === 'left') ? model.cpu_left : model.cpu_right;
        selector.value = is_cpu ? 'cpu' : 'human';

        const sliderContainer = document.getElementById(`difficulty-${side}-container`);
        if (sliderContainer) {
            sliderContainer.style.display = is_cpu ? 'block' : 'none';
        }
    });

    document.querySelectorAll('.difficulty-slider').forEach(slider => {
        const side = slider.dataset.side;
        if (side === 'left') {
            slider.value = model.cpu_difficulty_left;
        } else if (side === 'right') {
            slider.value = model.cpu_difficulty_right;
        }
    });

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
