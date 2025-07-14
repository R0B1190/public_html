const canvas = document.getElementById("gameboard");
const ctx = canvas.getContext("2d");
const scoreboard = document.getElementById("scoreboard");

// --- Animated Background ---
const backgroundParticles = [];
const numParticles = 150;

function initBackground() {
    for (let i = 0; i < numParticles; i++) {
        backgroundParticles.push({
            x: Math.random() * BOARD_WIDTH,
            y: Math.random() * BOARD_HEIGHT,
            vx: (Math.random() - 0.5) * 0.3, // Slow horizontal movement
            vy: (Math.random() - 0.5) * 0.3, // Slow vertical movement
            radius: Math.random() * 1.5,
            alpha: Math.random() * 0.5 + 0.2 // Random opacity for depth
        });
    }
}
initBackground(); // Initialize the background particles once

function drawAnimatedBackground(ctx) {
    // This function draws and updates the positions of the background starfield particles. The motion blur
    // effect is handled separately in draw_game to ensure correct layering.
    ctx.save();
    for (const p of backgroundParticles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap particles around the screen
        if (p.x < 0) p.x = BOARD_WIDTH;
        if (p.x > BOARD_WIDTH) p.x = 0;
        if (p.y < 0) p.y = BOARD_HEIGHT;
        if (p.y > BOARD_HEIGHT) p.y = 0;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    // The overlay that was previously here has been moved to draw_game.
}

function updateScore(model) {
    scoreboard.innerHTML = `${model.scoreL} : ${model.scoreR}`;
}

function draw_game(model) {
    // FIX: Draw the semi-transparent overlay FIRST. This creates the motion-blur trail
    // for all elements (particles, ball, paddles) that are drawn after it.
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
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

    drawAnimatedBackground(ctx); // Now draw the particles

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