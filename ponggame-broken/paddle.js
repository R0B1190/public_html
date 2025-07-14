
const SIDE = { NONE: 0, LEFT: 1, RIGHT: 2 };

class Paddle {
    posx;
    posy;
    width;
    height;
    color;
    constructor(posx, posy, width, height, side, color) {
        this.posx = posx;
        this.posy = posy;
        this.width = width;
        this.height = height;
        this.color = color;
        this.side = side;
        this.vely = 0;
    }

    move(is_cpu, ball, difficulty) {
        if (is_cpu) {
            const paddleCenter = this.posy + this.height / 2;
            const targetY = ball.posy;
            let deadzone = 10;
            let speed_mod = 1.0;
            let should_move = false;

            const isRightPaddle = this.side === SIDE.RIGHT;

            switch (difficulty) {
                case CPU_DIFFICULTY.HARD:
                    should_move = true; // Always follow the ball
                    deadzone = 5;       // More precise
                    speed_mod = 1.0;    // Normal speed
                    break;
                case CPU_DIFFICULTY.MEDIUM:
                    // Only follow when ball is coming towards the paddle
                    should_move = isRightPaddle ? (ball.velx > 0) : (ball.velx < 0);
                    deadzone = 10;
                    speed_mod = 0.9;    // Slightly slower
                    break;
                case CPU_DIFFICULTY.EASY:
                default:
                    // Follow if ball is on the CPU's half of the board
                    should_move = isRightPaddle
                        ? (ball.posx > BOARD_WIDTH / 2)
                        : (ball.posx < BOARD_WIDTH / 2);
                    deadzone = 15;      // Less precise
                    speed_mod = 0.8;    // Slower
                    break;
            }

            if (should_move) {
                if (paddleCenter < targetY - deadzone) this.vely = PADDLE_VELOCITY * speed_mod;
                else if (paddleCenter > targetY + deadzone) this.vely = -PADDLE_VELOCITY * speed_mod;
                else this.vely = 0;
            } else {
                this.vely = 0;
            }
        }
        this.posy = Math.min(BOARD_HEIGHT - this.height, Math.max(0, this.posy + this.vely));
    }

    bounce(ball) {
        // These constants must be defined in your project for this to work.
        // const BALL_RADIUS = 5;
        // const PADDLE_FORCE = 1.1;

        // First, check if the ball is moving towards the paddle to avoid "back-of-paddle" collisions
        const isMovingTowards = (this.side === SIDE.LEFT && ball.velx < 0) || (this.side === SIDE.RIGHT && ball.velx > 0);
        if (!isMovingTowards) {
            return SIDE.NONE;
        }

        // Calculate the ball's previous position to define its path
        const prevBallX = ball.posx - ball.velx;
        const prevBallY = ball.posy - ball.vely;

        // Create a "swept" bounding box that covers the ball's entire movement this frame
        const ballSweptRect = {
            left: Math.min(ball.posx, prevBallX) - BALL_RADIUS,
            right: Math.max(ball.posx, prevBallX) + BALL_RADIUS,
            top: Math.min(ball.posy, prevBallY) - BALL_RADIUS,
            bottom: Math.max(ball.posy, prevBallY) + BALL_RADIUS
        };

        const paddleRect = {
            left: this.posx,
            right: this.posx + this.width,
            top: this.posy,
            bottom: this.posy + this.height
        };

        // Check for an intersection between the ball's swept path and the paddle
        if (
            ballSweptRect.right > paddleRect.left &&
            ballSweptRect.left < paddleRect.right &&
            ballSweptRect.bottom > paddleRect.top &&
            ballSweptRect.top < paddleRect.bottom
        ) {
            // --- COLLISION DETECTED ---

            // COLLISION RESOLUTION:
            // Move ball to be flush with the paddle's surface to prevent it getting stuck
            if (this.side === SIDE.LEFT) {
                ball.posx = paddleRect.right + BALL_RADIUS;
            } else { // SIDE.RIGHT
                ball.posx = paddleRect.left - BALL_RADIUS;
            }

            // Reverse horizontal velocity and apply paddle force
            ball.velx *= -1;
            ball.velx *= PADDLE_FORCE;

            // Add "spin" to the ball based on where it hit the paddle
            const MAX_SPIN_VELOCITY = 7;
            const intersectRatio = (ball.posy - (this.posy + this.height / 2)) / (this.height / 2);

            // Clamp the ratio to [-1, 1] to prevent extreme spin from corner hits
            const clampedRatio = Math.max(-1, Math.min(1, intersectRatio));
            ball.vely = clampedRatio * MAX_SPIN_VELOCITY;

            return SIDE.NONE; // Or return a value indicating a collision occurred if needed
        }

        return SIDE.NONE;
    }
}