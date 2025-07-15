const canvas = document.getElementById('pool-table');
const ctx = canvas.getContext('2d');
const turnIndicatorEl = document.getElementById('turn-indicator');
const player1StatusEl = document.getElementById('player1-status');
const player2StatusEl = document.getElementById('player2-status');

// --- Constants ---
const FRICTION = 0.985;
const BALL_RADIUS = 11; // Slightly smaller to fit them all
const MIN_VELOCITY = 0.05;
const POCKET_RADIUS = 18;

// --- Game State ---
let balls = [];
let pockets = [];
let cueBall;
let mouse = { x: 0, y: 0 };
let shotStart = null;
let currentPlayer = 1;
let shotTakenThisTurn = false;
let playerAssignments = { 1: null, 2: null }; // null, 'solid', or 'stripe'
let gameOver = false;

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
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw stripe for striped balls
        if (this.type === 'stripe') {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw number
        if (this.number) {
            ctx.fillStyle = (this.type === 'stripe' || this.number === 8) ? 'black' : 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.number.toString(), this.x, this.y);
        }

        // Add a highlight for a 3D effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius / 3, this.y - this.radius / 3, this.radius / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
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
    ctx.fillStyle = 'black';
    pockets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    });
}

// --- Game Logic ---
function initGame() {
    balls = [];
    gameOver = false;
    currentPlayer = 1;
    shotTakenThisTurn = false;
    playerAssignments = { 1: null, 2: null };

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
    
    turnIndicatorEl.textContent = `Player ${currentPlayer}'s Turn`;

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

    const pocketedThisTurn = [];
    let foul = false;

    // Check for pocketed balls
    for (let i = balls.length - 1; i >= 0; i--) {
        for (const pocket of pockets) {
            const dist = Math.sqrt((balls[i].x - pocket.x) ** 2 + (balls[i].y - pocket.y) ** 2);
            if (dist < POCKET_RADIUS) {
                const pocketedBall = balls.splice(i, 1)[0];
                if (pocketedBall.type === 'cue') {
                    foul = true;
                    setTimeout(() => { // Reset cue ball after a moment
                        cueBall.x = canvas.width / 4;
                        cueBall.y = canvas.height / 2;
                        cueBall.vx = 0; cueBall.vy = 0;
                        balls.push(cueBall);
                    }, 500);
                } else {
                    pocketedThisTurn.push(pocketedBall);
                }
                break; // Ball is pocketed, move to next ball
            }
        }
    }

    let legalPocket = false;
    for (const pocketed of pocketedThisTurn) {
        if (pocketed.type === '8ball') {
            gameOver = true;
            const remaining = balls.filter(b => b.type === playerAssignments[currentPlayer]).length;
            const assignmentsMade = playerAssignments[1] !== null;
            if (!foul && assignmentsMade && remaining === 0) {
                alert(`Player ${currentPlayer} WINS!`);
            } else {
                alert(`Player ${currentPlayer} loses! Illegal 8-ball pot.`);
            }
            setTimeout(initGame, 2000); // Restart after a delay
            return;
        } else if (playerAssignments[1] === null) { // Assigning groups
            playerAssignments[currentPlayer] = pocketed.type;
            playerAssignments[currentPlayer === 1 ? 2 : 1] = (pocketed.type === 'solid' ? 'stripe' : 'solid');
            legalPocket = true;
        } else if (pocketed.type === playerAssignments[currentPlayer]) {
            legalPocket = true; // Pocketed their own ball type
        }
    }

    if (foul || !legalPocket) {
        currentPlayer = currentPlayer === 1 ? 2 : 1; // Switch player
    }

    // Update the UI with new assignments or player turn
    updateStatusDisplay();
    // Turn processing is complete, reset the flag to allow the next shot
    shotTakenThisTurn = false;
}

function drawAimingLine() {
    // Only show aiming line if it's the current player's turn and they haven't shot
    if (shotStart && !shotTakenThisTurn) {
        ctx.beginPath();
        ctx.moveTo(shotStart.x, shotStart.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

// --- Game Loop ---
function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPockets();
    
    balls.forEach(ball => ball.update());
    handleCollisions();
    endTurnLogic();
    balls.forEach(ball => ball.draw());

    drawAimingLine();

    requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    // Can only start aiming if balls are still and it's a valid time to shoot.
    if (!ballsAreMoving() && !shotTakenThisTurn) {
        shotStart = { x: cueBall.x, y: cueBall.y };
    }
});

canvas.addEventListener('mouseup', e => {
    if (shotStart && !shotTakenThisTurn) {
        const dx = mouse.x - shotStart.x;
        const dy = mouse.y - shotStart.y;
        
        cueBall.vx = -dx * 0.1; // Power is proportional to drag distance, direction is opposite
        cueBall.vy = -dy * 0.1; // Direction is opposite of drag

        shotStart = null;
        shotTakenThisTurn = true;
    }
});

// --- Start Game ---
initGame();