const canvas = document.getElementById("gameboard");
const ctx = canvas.getContext("2d");
const scoreboard = document.getElementById("scoreboard");

function updateScore(model) {
    scoreboard.innerHTML = `${model.scoreL} : ${model.scoreR}`;
}

function draw_game(model) {
    // Black background for a "sigma" look
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Dashed center line with a subtle glow
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(BOARD_WIDTH / 2, 0);
    ctx.lineTo(BOARD_WIDTH / 2, BOARD_HEIGHT);
    ctx.stroke();
    ctx.restore(); // Restore context to remove shadow, line dash etc. for next draws

    draw_ball(ctx, model.ball);
    draw_paddle(ctx, model.paddleL);
    draw_paddle(ctx, model.paddleR);
}

function draw_ball(ctx, ball) {
    const ball_color = "#FFFF00"; // Neon Yellow
    ctx.save();
    ctx.fillStyle = ball_color;
    ctx.shadowColor = ball_color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(ball.posx, ball.posy, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

function draw_paddle(ctx, paddle) {
    const x = paddle.posx;
    const y = paddle.posy;
    const w = paddle.width;
    const h = paddle.height;
    const r = 10; // Corner radius for the rounded rectangle

    ctx.save();
    ctx.fillStyle = paddle.color;
    ctx.shadowColor = paddle.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}