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


function draw_victory_screen(model) {
    const winner = model.scoreL >= model.winningScore ? "Left Player" : "Right Player";
    const winnerColor = model.scoreL >= model.winningScore ? model.paddleL.color : model.paddleR.color;

    ctx.save();
    // Semi-transparent background overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Victory Text
    ctx.fillStyle = winnerColor;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.shadowColor = winnerColor;
    ctx.shadowBlur = 15;
    ctx.font = "60px 'Courier New', Courier, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const victoryMessage = `${winner} Wins!`;
    ctx.fillText(victoryMessage, canvas.width / 2, canvas.height / 2 - 40);
    ctx.strokeText(victoryMessage, canvas.width / 2, canvas.height / 2 - 40);

    // "Press End to Restart" Text
    ctx.fillStyle = "white";
    ctx.shadowColor = "white";
    ctx.shadowBlur = 10;
    ctx.font = "24px 'Courier New', Courier, monospace";
    ctx.fillText("Press 'End' to play again", canvas.width / 2, canvas.height / 2 + 40);

    ctx.restore();
}