const canvas = document.getElementById("gameboard");
const ctx = canvas.getContext("2d");
const scoreboard = document.getElementById("scoreboard");

function updateScore(model) {
    scoreboard.innerHTML = `${model.scoreL} : ${model.scoreR}`;
}

function draw_game(model) {
    // Solid black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Solid center line
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.setLineDash([]); // No dashes
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    draw_ball(ctx, model.ball);
    draw_paddle(ctx, model.paddleL);
    draw_paddle(ctx, model.paddleR);
}

function draw_ball(ctx, ball) {
    ctx.fillStyle = '#FFFFFF';
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