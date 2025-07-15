const canvas = document.getElementById("gameboard");
const ctx = canvas.getContext("2d");
const scoreLeftEl = document.getElementById("score-left");
const scoreRightEl = document.getElementById("score-right");

function updateScore(model) {
    scoreLeftEl.textContent = model.scoreL;
    scoreRightEl.textContent = model.scoreR;
}

function draw_game(model) {
    // Solid black background
    ctx.fillStyle = model.theme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Solid center line
    ctx.strokeStyle = model.theme.foreground;
    ctx.lineWidth = 4;
    ctx.setLineDash([]); // No dashes
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    draw_ball(ctx, model);
    draw_paddle(ctx, model.paddleL);
    draw_paddle(ctx, model.paddleR);
}

function draw_ball(ctx, model) {
    const ball = model.ball;
    ctx.fillStyle = model.theme.ballColor;
    ctx.beginPath();
    // Draw a square for a retro feel
    ctx.fillRect(ball.posx - BALL_RADIUS, ball.posy - BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
    ctx.fill();
}

function draw_paddle(ctx, paddle) {
    ctx.fillStyle = paddle.color;
    // Simple rectangle, no rounded corners
    ctx.fillRect(paddle.posx, paddle.posy, paddle.width, paddle.height);
}

// Since this theme has no starfield, provide an empty function
// so it doesn't cause an error if called.
function drawStarfield(ctx) { }

// Empty init function
function initStarfield() { }

function draw_victory_screen(model) {
    const winner = model.scoreL >= model.winningScore ? "Left Player" : "Right Player";

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "40px 'Courier New', Courier, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${winner} Wins!`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px 'Courier New', Courier, monospace";
    ctx.fillText("Press 'End' to play again", canvas.width / 2, canvas.height / 2 + 20);
}