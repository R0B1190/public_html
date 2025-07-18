const canvas = document.getElementById('pool-table');
const ctx = canvas.getContext('2d');
const turnIndicatorEl = document.getElementById('turn-indicator');
const player1StatusEl = document.getElementById('player1-status');
const player2StatusEl = document.getElementById('player2-status');

// --- Constants ---
const FRICTION = 0.985;
const BALL_RADIUS = 15; // Slightly smaller to fit them all
const MIN_VELOCITY = 0.05;
const POCKET_RADIUS = 24;
const MAX_SHOT_DISTANCE = 350; // Max drag distance for 100% power

// --- Game State ---
let balls = [];
let pockets = [];
let pocketedThisTurn = [];
let cueBall;
let mouse = { x: 0, y: 0 };
let shotStart = null;
let currentPlayer = 1;
let shotTakenThisTurn = false;
let playerAssignments = { 1: null, 2: null }; // null, 'solid', or 'stripe'
let gameOver = false;
let eightBallMode = false; // Is the player shooting for the 8-ball?
let declaredPocket = null; // index of the pocket declared for the 8-ball
let isBallInHand = false; // For ball-in-hand placement after a foul

// --- Ball Class ---
class Ball {
    constructor(x, y, color, number, type = 'object') {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = BALL_RADIUS;
        this.color = color;
        this.number = number;
        this.type = type; // 'solid', 'stripe', '8ball', 'cue', 'pocket'
        // For pseudo-3D rotation
        this.rotation = 0; // The total rotation angle
        // The axis of rotation (a 2D vector perpendicular to velocity)
        this.axisX = 0;
        this.axisY = 1;
    }

    draw() {
        ctx.save(); // Save the initial state

        // 1. Draw the base sphere color (solids, stripes, 8-ball, cue)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Solids are their color, stripes and cue are white, 8ball is black.
        if (this.type === 'solid') {
            ctx.fillStyle = this.color;
        } else if (this.type === '8ball') {
            ctx.fillStyle = 'black';
        } else { // 'stripe' or 'cue'
            ctx.fillStyle = 'white';
        }
        ctx.fill();

        // 2. Draw rotating features (only for non-cue balls)
        // This part uses matrix transforms to simulate 3D rotation.
        const cosRot = Math.cos(this.rotation);
        const sinRot = Math.sin(this.rotation);

        if (this.type === 'stripe') {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Align with the stripe's equator, which is perpendicular to the rotation axis.
            // The original code aligned with the axis, drawing the stripe around the poles.
            ctx.rotate(Math.atan2(-this.axisX, this.axisY));
            
            const stripeHalfWidth = this.radius * 0.8;

            // The old drawing logic was complex and had visual bugs. This simpler method
            // clips the drawing area to a rectangle (the stripe) and then fills a circle
            // (the ball) inside it. This correctly draws the colored stripe over the
            // base white color of the ball.
            ctx.beginPath();
            ctx.rect(-this.radius, -stripeHalfWidth, this.radius * 2, stripeHalfWidth * 2);
            ctx.clip();
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        // Draw the number only if it's on the visible side of the ball.
        if (this.number) {
            const z = -sinRot; // -1 (back) to 1 (front)
            if (z > -0.1) { // Only draw if not on the back side
                ctx.save();
                ctx.translate(this.x + this.axisY * this.radius * cosRot, this.y - this.axisX * this.radius * cosRot);

                const scale = (z + 1) / 2 * 0.8 + 0.2; // Scale based on how close to front
                ctx.scale(scale, scale);

                ctx.fillStyle = this.color;
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'black';
                ctx.font = 'bold 14px Arial'; // Slightly larger for clarity
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.number.toString(), 0, 1);
                ctx.restore();
            }
        }

        // 3. Add non-rotating highlight and shadow for 3D effect
        // The highlight is a white glare on the top-left.
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Redefine path for gradient
        const highlight = ctx.createRadialGradient(
            this.x - this.radius / 2.5, this.y - this.radius / 2.5, 1,
            this.x, this.y, this.radius
        );
        highlight.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlight;
        ctx.fill();

        // The shadow is a subtle dark area on the bottom-right. This makes the
        // white cue ball appear 3D and enhances the other balls as well.
        const shadow = ctx.createRadialGradient(
            this.x + this.radius / 2.5, this.y + this.radius / 2.5, 1,
            this.x, this.y, this.radius
        );
        shadow.addColorStop(0, 'rgba(0,0,0,0.25)');
        shadow.addColorStop(0.7, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadow;
        ctx.fill();

        ctx.restore(); // Restore to initial state
    }

    update() {
        // Calculate speed for rotation
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > MIN_VELOCITY) {
            // Rotation is proportional to how far the ball traveled
            this.rotation += speed / this.radius;

            // The axis of rotation is perpendicular to the velocity vector.
            // We normalize the velocity vector to get the axis.
            if (speed > 0) {
                this.axisX = -this.vy / speed;
                this.axisY = this.vx / speed;
            }
        }

        // Apply friction
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Stop tiny movements
        if (Math.abs(this.vx) < MIN_VELOCITY) this.vx = 0;
        if (Math.abs(this.vy) < MIN_VELOCITY) this.vy = 0;

        // Move the ball
        this.x += this.vx;
        this.y += this.vy;

        // Wall collisions (cushions)
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.vx *= -1;
        } else if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -1;
        }
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.vy *= -1;
        } else if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -1;
        }
    }
}

// --- Drawing Functions ---
function drawPockets() {
    pockets.forEach((p, i) => {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Highlight the declared pocket in yellow when in 8-ball mode
        if (eightBallMode && i === declaredPocket) {
            ctx.strokeStyle = '#f9c74f'; // Yellow/gold
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    });
}

function drawCue() {
    if (!shotStart) return;

    // --- Cue Constants & Style ---
    const CUE_LENGTH = 550;
    const PULLBACK_FACTOR = 0.25;
    const MAX_PULLBACK = 60;
    
    // Proportions
    const TIP_LENGTH = 8;
    const FERRULE_LENGTH = 15;
    const GRIP_LENGTH = CUE_LENGTH * 0.4;
    const SHAFT_LENGTH = CUE_LENGTH - TIP_LENGTH - FERRULE_LENGTH - GRIP_LENGTH;

    // Widths
    const TIP_WIDTH = 7;
    const BUTT_WIDTH = 15;

    // Colors
    const TIP_COLOR = '#603913'; // Dark Leather
    const FERRULE_COLOR = '#f0f0f0'; // Off-white
    const SHAFT_WOOD_LIGHT = '#f2e2c6'; // Light Maple
    const SHAFT_WOOD_DARK = '#dcc098'; // Mid Maple
    const GRIP_DARK_COLOR = '#3d261e'; // Dark Brown/Black
    const GRIP_LIGHT_COLOR = '#593d2b';
    const BUMPER_COLOR = '#1c1c1c'; // Black Rubber

    // --- Calculations ---
    // Point the cue from the mouse towards the ball
    const dx = cueBall.x - mouse.x;
    const dy = cueBall.y - mouse.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);

    const pullback = Math.min(distance * PULLBACK_FACTOR, MAX_PULLBACK);

    // --- Drawing ---
    ctx.save();
    ctx.translate(cueBall.x, cueBall.y);
    ctx.rotate(angle);

    // The cue is drawn "behind" the ball. If the ball is against a cushion,
    // "behind" can be outside the canvas, making the cue invisible. This logic
    // calculates the space available behind the ball and clamps the cue's
    // position to ensure it's always drawn within the visible table area.
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    // Vector pointing away from the shot direction (where the cue stick is)
    const rearVecX = -cosAngle;
    const rearVecY = -sinAngle;

    let distToBoundary = Infinity;

    // Calculate distance to walls along the cue's direction
    if (rearVecX > 1e-6) { // Aiming left, rear is right wall
        distToBoundary = Math.min(distToBoundary, (canvas.width - cueBall.x) / rearVecX);
    } else if (rearVecX < -1e-6) { // Aiming right, rear is left wall
        distToBoundary = Math.min(distToBoundary, (0 - cueBall.x) / rearVecX);
    }
    if (rearVecY > 1e-6) { // Aiming up, rear is bottom wall
        distToBoundary = Math.min(distToBoundary, (canvas.height - cueBall.y) / rearVecY);
    } else if (rearVecY < -1e-6) { // Aiming down, rear is top wall
        distToBoundary = Math.min(distToBoundary, (0 - cueBall.y) / rearVecY);
    }

    const desiredOffset = BALL_RADIUS + 5 + pullback;
    const clampedOffset = Math.min(desiredOffset, Math.max(0, distToBoundary - 1)); // -1 for margin
    let currentX = -clampedOffset;

    // Helper to get the width of the cue at a specific distance from the tip.
    const getWidthAt = (distFromTip) => {
        return TIP_WIDTH + (BUTT_WIDTH - TIP_WIDTH) * (distFromTip / CUE_LENGTH);
    };

    // Helper to draw a tapered section of the cue.
    const drawSection = (length, startX, startWidth, endWidth, style) => {
        const endX = startX - length;
        ctx.beginPath();
        ctx.moveTo(startX, -startWidth / 2);
        ctx.lineTo(endX, -endWidth / 2);
        ctx.lineTo(endX, endWidth / 2);
        ctx.lineTo(startX, startWidth / 2);
        ctx.closePath();
        ctx.fillStyle = style;
        ctx.fill();
        return endX; // Return the new end position for the next section
    };

    // 1. Tip
    const tipEndWidth = getWidthAt(TIP_LENGTH);
    let nextX = drawSection(TIP_LENGTH, currentX, TIP_WIDTH, tipEndWidth, TIP_COLOR);

    // 2. Ferrule
    const ferruleEndWidth = getWidthAt(TIP_LENGTH + FERRULE_LENGTH);
    nextX = drawSection(FERRULE_LENGTH, nextX, tipEndWidth, ferruleEndWidth, FERRULE_COLOR);

    // 3. Shaft
    const shaftGradient = ctx.createLinearGradient(0, -BUTT_WIDTH, 0, BUTT_WIDTH);
    shaftGradient.addColorStop(0, SHAFT_WOOD_LIGHT);
    shaftGradient.addColorStop(0.5, SHAFT_WOOD_DARK);
    shaftGradient.addColorStop(1, SHAFT_WOOD_LIGHT);
    const shaftEndWidth = getWidthAt(TIP_LENGTH + FERRULE_LENGTH + SHAFT_LENGTH);
    nextX = drawSection(SHAFT_LENGTH, nextX, ferruleEndWidth, shaftEndWidth, shaftGradient);

    // 4. Grip
    const gripGradient = ctx.createLinearGradient(0, -BUTT_WIDTH, 0, BUTT_WIDTH);
    gripGradient.addColorStop(0, GRIP_LIGHT_COLOR);
    gripGradient.addColorStop(0.5, GRIP_DARK_COLOR);
    gripGradient.addColorStop(1, GRIP_LIGHT_COLOR);
    const gripEndWidth = getWidthAt(CUE_LENGTH); // This is just BUTT_WIDTH
    nextX = drawSection(GRIP_LENGTH, nextX, shaftEndWidth, gripEndWidth, gripGradient);

    // 5. Bumper
    ctx.beginPath();
    ctx.arc(nextX, 0, gripEndWidth / 2, Math.PI * 1.5, Math.PI * 0.5, false);
    ctx.fillStyle = BUMPER_COLOR;
    ctx.fill();

    ctx.restore();
}

function drawPowerBar() {
    if (!shotStart) return;

    const dx = cueBall.x - mouse.x;
    const dy = cueBall.y - mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const powerPercent = Math.min(distance / MAX_SHOT_DISTANCE, 1);

    const barX = 30;
    const barY = canvas.height / 2 - 125;
    const barWidth = 25;
    const barHeight = 250;

    // Draw text label and percentage
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Power', barX + barWidth / 2, barY - 15);
    ctx.font = '14px Arial';
    ctx.fillText(`${Math.round(powerPercent * 100)}%`, barX + barWidth / 2, barY + barHeight + 20);

    // Draw bar background/border
    ctx.strokeStyle = '#CCC';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Draw power fill
    const fillHeight = barHeight * powerPercent;
    // Color from green (low power) to yellow to red (high power)
    const hue = (1 - powerPercent) * 120; // HSL: 120 is green, 60 is yellow, 0 is red.
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight);
}

// --- Game Logic ---
function initGame() {
    balls = [];
    gameOver = false;
    currentPlayer = 1;
    shotTakenThisTurn = false;
    playerAssignments = { 1: null, 2: null };
    pocketedThisTurn = [];
    eightBallMode = false;
    declaredPocket = null;

    updateStatusDisplay();

    // Cue Ball
    cueBall = new Ball(canvas.width / 4, canvas.height / 2, 'white', null, 'cue');
    balls.push(cueBall);

    const ballData = [
        { number: 1, color: '#f9c74f', type: 'solid' },  // Yellow
        { number: 2, color: '#2196f3', type: 'solid' },  // Blue
        { number: 3, color: '#f44336', type: 'solid' },  // Red
        { number: 4, color: '#673ab7', type: 'solid' },  // Purple
        { number: 5, color: '#ff9800', type: 'solid' },  // Orange
        { number: 6, color: '#4caf50', type: 'solid' },  // Green
        { number: 7, color: '#795548', type: 'solid' },  // Maroon
        { number: 9, color: '#f9c74f', type: 'stripe' }, // Yellow Stripe
        { number: 10, color: '#2196f3', type: 'stripe' },// Blue Stripe
        { number: 11, color: '#f44336', type: 'stripe' },// Red Stripe
        { number: 12, color: '#673ab7', type: 'stripe' },// Purple Stripe
        { number: 13, color: '#ff9800', type: 'stripe' },// Orange Stripe
        { number: 14, color: '#4caf50', type: 'stripe' },// Green Stripe
        { number: 15, color: '#795548', type: 'stripe' },// Maroon Stripe
    ];

    // Shuffle the balls for random racking, except the 8-ball
    for (let i = ballData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ballData[i], ballData[j]] = [ballData[j], ballData[i]];
    }

    const eightBall = { number: 8, color: 'black', type: '8ball' };
    // Insert 8-ball into the middle of the third row (5th position in rack)
    ballData.splice(4, 0, eightBall);

    // Racking the balls in a triangle
    const rackStartX = canvas.width * 0.7;
    const rackStartY = canvas.height / 2;
    const rowLengths = [1, 2, 3, 4, 5];
    let ballIndex = 0;

    for (let i = 0; i < rowLengths.length; i++) {
        const row = i;
        const numBallsInRow = rowLengths[i];
        const rowX = rackStartX + row * (BALL_RADIUS * 2 * 0.866); // 0.866 is sqrt(3)/2
        for (let j = 0; j < numBallsInRow; j++) {
            const col = j;
            const rowY = rackStartY - (numBallsInRow - 1) * BALL_RADIUS + col * (BALL_RADIUS * 2);
            const data = ballData[ballIndex++];
            if (data) {
                balls.push(new Ball(rowX, rowY, data.color, data.number, data.type));
            }
        }
    }

    // Define pockets
    const pad = 25; // padding from edge
    const midYPad = 10;
    pockets = [
        { x: pad, y: pad }, { x: canvas.width / 2, y: pad - midYPad }, { x: canvas.width - pad, y: pad },
        { x: pad, y: canvas.height - pad }, { x: canvas.width / 2, y: canvas.height - (pad - midYPad) }, { x: canvas.width - pad, y: canvas.height - pad }
    ];

    gameLoop();
}

function handleCollisions() {
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < b1.radius + b2.radius) {
                // --- Collision Response ---
                // Normal vector
                const nx = dx / distance;
                const ny = dy / distance;

                // Tangent vector
                const tx = -ny;
                const ty = nx;

                // Project velocities onto normal and tangent vectors
                const dpTan1 = b1.vx * tx + b1.vy * ty;
                const dpTan2 = b2.vx * tx + b2.vy * ty;

                const dpNorm1 = b1.vx * nx + b1.vy * ny;
                const dpNorm2 = b2.vx * nx + b2.vy * ny;

                // Conservation of momentum in 1D (on the normal vector)
                // Since mass is equal, they just swap normal velocities
                const m1 = dpNorm2;
                const m2 = dpNorm1;

                // Update velocities
                b1.vx = tx * dpTan1 + nx * m1;
                b1.vy = ty * dpTan1 + ny * m1;
                b2.vx = tx * dpTan2 + nx * m2;
                b2.vy = ty * dpTan2 + ny * m2;
                
                // Prevent balls from sticking
                const overlap = b1.radius + b2.radius - distance;
                b1.x -= overlap / 2 * nx;
                b1.y -= overlap / 2 * ny;
                b2.x += overlap / 2 * nx;
                b2.y += overlap / 2 * ny;
            }
        }
    }
}

function handlePocketing() {
    // Check for balls falling into pockets in real-time
    for (let i = balls.length - 1; i >= 0; i--) {
        for (const pocket of pockets) {
            const dist = Math.sqrt((balls[i].x - pocket.x) ** 2 + (balls[i].y - pocket.y) ** 2);
            if (dist < POCKET_RADIUS) {
                const pocketedBall = balls.splice(i, 1)[0];
                pocketedThisTurn.push(pocketedBall);
                // Ball is pocketed, stop checking against other pockets and move to next ball
                break; 
            }
        }
    }
}

function ballsAreMoving() {
    return balls.some(ball => ball.vx !== 0 || ball.vy !== 0);
}

function updateStatusDisplay() {
    const getStatusText = (playerNum) => {
        let text = `Player ${playerNum}`;
        const assignment = playerAssignments[playerNum];
        if (assignment) {
            // Capitalize 'solid' -> 'Solids', 'stripe' -> 'Stripes'
            const typeText = assignment.charAt(0).toUpperCase() + assignment.slice(1) + 's';
            
            // Count remaining balls of that type on the table
            const remaining = balls.filter(b => b.type === assignment).length;
            text += ` (${typeText} - ${remaining} left)`;
        }
        return text;
    };

    player1StatusEl.textContent = getStatusText(1);
    player2StatusEl.textContent = getStatusText(2);
    
    if (isBallInHand) {
        turnIndicatorEl.textContent = `Player ${currentPlayer}: Ball in Hand`;
    } else if (eightBallMode && declaredPocket === null) {
        turnIndicatorEl.textContent = `Player ${currentPlayer}: Declare a pocket for the 8-ball!`;
    } else if (eightBallMode && declaredPocket !== null) {
        turnIndicatorEl.textContent = `Player ${currentPlayer}'s Turn (Pocket ${declaredPocket + 1} called)`;
    } else {
        turnIndicatorEl.textContent = `Player ${currentPlayer}'s Turn`;
    }

    if (currentPlayer === 1) {
        player1StatusEl.style.fontWeight = 'bold';
        player2StatusEl.style.fontWeight = 'normal';
    } else {
        player1StatusEl.style.fontWeight = 'normal';
        player2StatusEl.style.fontWeight = 'bold';
    }
}

function endTurnLogic() {
    if (gameOver || !shotTakenThisTurn || ballsAreMoving()) {
        return;
    }

    // 1. Process pocketed balls and identify fouls/8-ball pocketing
    let foul = false;
    const objectBallsPocketed = [];
    let eightBallPocketedInfo = null; // Will store { ball, index }

    // Separate the cue ball from object balls, and handle fouls/8-ball pocketing.
    pocketedThisTurn.forEach(pocketedBall => {
        if (pocketedBall.type === 'cue') {
            foul = true;
            // Cue ball is removed by handlePocketing. The next player gets ball-in-hand.
            // The cueBall object still exists, but is not in the `balls` array.
        } else if (pocketedBall.type === '8ball') {
            // Find which pocket the 8-ball went into
            let pocketIndex = -1;
            let min_dist = Infinity;
            pockets.forEach((p, i) => {
                const dist = Math.sqrt((pocketedBall.x - p.x)**2 + (pocketedBall.y - p.y)**2);
                if (dist < min_dist) { min_dist = dist; pocketIndex = i; }
            });
            eightBallPocketedInfo = { ball: pocketedBall, index: pocketIndex };
        } else {
            objectBallsPocketed.push(pocketedBall);
        }
    });
    
    // 2. Handle immediate game-over condition from 8-ball pocketing
    if (eightBallPocketedInfo) {
        gameOver = true;
        const playerWasOn8Ball = eightBallMode;
        if (!foul && playerWasOn8Ball && eightBallPocketedInfo.index === declaredPocket) {
            turnIndicatorEl.textContent = `Player ${currentPlayer} WINS!`;
        } else {
            let reason = "Illegal 8-ball pot.";
            if (foul) reason = "Foul on the 8-ball.";
            else if (!playerWasOn8Ball) reason = "Sunk 8-ball too early.";
            else if (eightBallPocketedInfo.index !== declaredPocket) reason = "Sunk 8-ball in wrong pocket.";
            turnIndicatorEl.textContent = `Player ${currentPlayer} loses! ${reason}`;
        }
        setTimeout(initGame, 3000);
        return;
    }

    // 3. Determine if a legal shot was made with object balls
    let legalPocket = false;
    for (const pocketed of objectBallsPocketed) {
        if (playerAssignments[1] === null) { // Assigning groups
            playerAssignments[currentPlayer] = pocketed.type;
            playerAssignments[currentPlayer === 1 ? 2 : 1] = (pocketed.type === 'solid' ? 'stripe' : 'solid');
            legalPocket = true;
        } else if (pocketed.type === playerAssignments[currentPlayer]) { // Pocketed their own ball type
            legalPocket = true;
        }
    }

    // 4. Determine whose turn it is next and update 8-ball mode
    let switchPlayer = foul || !legalPocket;
    
    if (switchPlayer) {
        if (foul) {
            isBallInHand = true;
        }
        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }

    // Check if the player for the *next* turn is on the 8-ball.
    const remainingPlayerBalls = balls.filter(b => b.type === playerAssignments[currentPlayer]).length;
    if (playerAssignments[currentPlayer] !== null && remainingPlayerBalls === 0) {
        eightBallMode = true;
        declaredPocket = null; // Must declare pocket for their turn
    } else {
        eightBallMode = false;
    }

    // 5. Cleanup for next turn
    pocketedThisTurn = [];
    updateStatusDisplay();
    shotTakenThisTurn = false;
}

function drawAimingLine() {
    // Only show aiming line if it's the current player's turn and they haven't shot
    if (shotStart && !shotTakenThisTurn) {
        // The line should represent the shot path, which is from the cue ball
        // in the direction opposite of where the mouse is.
        const dx = cueBall.x - mouse.x;
        const dy = cueBall.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return; // Don't draw if mouse is on the ball

        // Scale the line's length to match the shot power.
        // The length grows with distance but is capped at 100% power (MAX_SHOT_DISTANCE).
        const scale = Math.min(1.0, MAX_SHOT_DISTANCE / distance);

        ctx.beginPath();
        ctx.moveTo(cueBall.x, cueBall.y);
        ctx.lineTo(cueBall.x + dx * scale, cueBall.y + dy * scale);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

// --- Game Loop ---
function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If ball in hand, cue ball follows mouse for placement.
    // It is not in the `balls` array yet, so it won't be updated/collided.
    if (isBallInHand) {
        cueBall.x = mouse.x;
        cueBall.y = mouse.y;
    }
    drawPockets();
    drawPowerBar();
    
    balls.forEach(ball => ball.update());
    handleCollisions();
    handlePocketing();
    endTurnLogic();

    // Drawing order is important for layering
    drawAimingLine();

    // We draw object balls first, then the cue, then the cue ball on top.
    // This makes the cue appear to go over other balls but still be correctly
    // positioned behind the cue ball.
    balls.forEach(ball => {
        if (ball !== cueBall) { // Draw all balls except the cue ball
            ball.draw();
        }
    });

    drawCue(); // Now draw the cue on top of the object balls

    if (balls.includes(cueBall)) { // Finally, draw the cue ball on top of the cue
        cueBall.draw();
    }

    if (isBallInHand) {
        // Draw cue ball at mouse position with visual feedback for valid placement.
        ctx.save();
        let invalidPlacement = false;
        // Check collision with other balls
        for (const ball of balls) {
            const dist = Math.sqrt((cueBall.x - ball.x)**2 + (cueBall.y - ball.y)**2);
            if (dist < cueBall.radius + ball.radius) {
                invalidPlacement = true;
                break;
            }
        }
        // Check collision with table edges
        if (!invalidPlacement) {
            if (cueBall.x < cueBall.radius || cueBall.x > canvas.width - cueBall.radius ||
                cueBall.y < cueBall.radius || cueBall.y > canvas.height - cueBall.radius) {
                invalidPlacement = true;
            }
        }
        
        // Check collision with pockets
        if (!invalidPlacement) {
            for (const pocket of pockets) {
                const dist = Math.sqrt((cueBall.x - pocket.x)**2 + (cueBall.y - pocket.y)**2);
                // Prevent placement if the edge of the ball would be inside the pocket's radius
                if (dist < POCKET_RADIUS + cueBall.radius) {
                    invalidPlacement = true;
                    break;
                }
            }
        }
        
        if (invalidPlacement) {
            ctx.globalAlpha = 0.5; // Make it look like a ghost
        }
        cueBall.draw();
        ctx.restore();
    }
    requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
// A function to handle mouse movement, updating coordinates relative to the canvas.
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
}

// A function to handle releasing the mouse, which takes the shot.
function handleMouseUp(e) {
    if (shotStart && !shotTakenThisTurn) {
        // The shot direction is from the mouse *towards* the ball
        const dx = shotStart.x - mouse.x;
        const dy = shotStart.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Cap the shot power by capping the effective distance
        const effectiveDistance = Math.min(distance, MAX_SHOT_DISTANCE);
        const angle = Math.atan2(dy, dx);
        
        cueBall.vx = Math.cos(angle) * (effectiveDistance * 0.1);
        cueBall.vy = Math.sin(angle) * (effectiveDistance * 0.1);

        shotStart = null;
        shotTakenThisTurn = true;
    }
    // Clean up the window-wide listeners and restore the canvas-specific one
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
}

// Initially, just track mouse movement over the canvas.
canvas.addEventListener('mousemove', handleMouseMove);

canvas.addEventListener('mousedown', e => {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Handle ball-in-hand placement
    if (isBallInHand && !ballsAreMoving()) {
        let isPlacementValid = true;
        // Check for overlap with other balls
        for (const ball of balls) {
            const dist = Math.sqrt((clickX - ball.x)**2 + (clickY - ball.y)**2);
            if (dist < cueBall.radius + ball.radius) {
                isPlacementValid = false;
                break;
            }
        }
        // Check for overlap with table edges
        if (clickX - cueBall.radius < 0 || clickX + cueBall.radius > canvas.width ||
            clickY - cueBall.radius < 0 || clickY + cueBall.radius > canvas.height) {
            isPlacementValid = false;
        }

        // Check for overlap with pockets
        if (isPlacementValid) {
            for (const pocket of pockets) {
                const dist = Math.sqrt((clickX - pocket.x)**2 + (clickY - pocket.y)**2);
                if (dist < POCKET_RADIUS + cueBall.radius) {
                    isPlacementValid = false;
                    break;
                }
            }
        }

        if (isPlacementValid) {
            cueBall.x = clickX;
            cueBall.y = clickY;
            cueBall.vx = 0;
            cueBall.vy = 0;
            balls.push(cueBall); // Add cue ball back to the simulation
            isBallInHand = false;
            updateStatusDisplay();
        }
        return; // Prevent starting a shot immediately after placing the ball
    }

    // If it's the player's turn for the 8-ball, their click declares a pocket.
    if (eightBallMode && !ballsAreMoving() && !shotTakenThisTurn) {
        for (let i = 0; i < pockets.length; i++) {
            const dist = Math.sqrt((clickX - pockets[i].x)**2 + (clickY - pockets[i].y)**2);
            if (dist < POCKET_RADIUS) {
                declaredPocket = i;
                updateStatusDisplay();
                // A pocket has been selected, so we don't want to start a shot.
                return;
            }
        }
    }

    // Can only start aiming if balls are still, it's a valid time to shoot,
    // and if on the 8-ball, a pocket has been declared.
    if (!ballsAreMoving() && !shotTakenThisTurn && (!eightBallMode || declaredPocket !== null)) {
        shotStart = { x: cueBall.x, y: cueBall.y };
        
        // Swap to window-wide listeners for the duration of the drag
        canvas.removeEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
});

// --- Start Game ---
initGame();