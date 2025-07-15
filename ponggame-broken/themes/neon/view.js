const canvas = document.getElementById("gameboard");
const ctx = canvas.getContext("2d");
const scoreLeftEl = document.getElementById("score-left");
const scoreRightEl = document.getElementById("score-right");

// --- Animated Background ---
const stars = [];
const numStars = 300; // More stars for a denser field with more depth

function initStarfield() {
    stars.length = 0; // Clear existing stars if we ever re-initialize
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            // z-depth determines speed, size, and opacity, creating a parallax effect.
            // z is from 1 (far) to 3 (near).
            z: Math.random() * 2 + 1,
            vx: (Math.random() - 0.5) * 0.2, // Base velocity
            vy: (Math.random() - 0.5) * 0.2
        });
    }
}
initStarfield(); // Initialize the starfield

function drawStarfield(ctx) {
    // This function draws and updates the positions of the stars to create a parallax effect.
    ctx.save();
    for (const star of stars) {
        // Update position based on velocity and depth (z). Closer stars (higher z) move faster.
        star.x += star.vx * star.z;
        star.y += star.vy * star.z;

        // Wrap stars around the screen
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Calculate radius and alpha based on depth. Closer stars are bigger and brighter.
        const radius = (star.z / 3) * 1.5;
        const alpha = (star.z / 3) * 0.7;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function updateScore(model) {
    scoreLeftEl.textContent = model.scoreL;
    scoreRightEl.textContent = model.scoreR;
}

function draw_game(model) {
    // FIX: Draw the semi-transparent overlay FIRST. This creates the motion-blur trail
    // for all elements (particles, ball, paddles) that are drawn after it.
    ctx.fillStyle = model.theme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dashed center line with a subtle glow
    ctx.save();
    ctx.strokeStyle = model.theme.foreground;
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.shadowColor = model.theme.foreground;
    ctx.shadowBlur = 3; // Subtle glow for the center line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.restore(); // Restore context to remove shadow, line dash etc. for next draws

    if (model.theme.hasStarfield) {
        drawStarfield(ctx);
    }

    draw_ball(ctx, model);
    draw_paddle(ctx, model.paddleL);
    draw_paddle(ctx, model.paddleR);
}

function draw_ball(ctx, model) {
    const ball_color = model.theme.ballColor;
    const ball = model.ball;
    ctx.save();
    ctx.fillStyle = ball_color;
    ctx.shadowColor = ball_color;
    ctx.shadowBlur = 8; // Subtle glow for the ball
    ctx.beginPath();
    ctx.arc(ball.posx, ball.posy, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

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
    ctx.font = "45px 'Orbitron', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const victoryMessage = `${winner} Wins!`;
    ctx.fillText(victoryMessage, canvas.width / 2, canvas.height / 2 - 40);
    ctx.strokeText(victoryMessage, canvas.width / 2, canvas.height / 2 - 40);

    // "Press End to Restart" Text
    ctx.fillStyle = "white";
    ctx.font = "24px 'Orbitron', sans-serif";
    ctx.fillText("Press 'End' to play again", canvas.width / 2, canvas.height / 2 + 40);

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
    ctx.shadowBlur = 6; // Subtle glow for the paddles
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