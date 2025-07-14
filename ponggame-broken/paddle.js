/**
 * Helper function to determine if two line segments intersect.
 *
 * @param {number} x1 - The x-coordinate of the start of the first line segment.
 * @param {number} y1 - The y-coordinate of the start of the first line segment.
 * @param {number} x2 - The x-coordinate of the end of the first line segment.
 * @param {number} y2 - The y-coordinate of the end of the first line segment.
 * @param {number} x3 - The x-coordinate of the start of the second line segment.
 * @param {number} y3 - The y-coordinate of the start of the second line segment.
 * @param {number} x4 - The x-coordinate of the end of the second line segment.
 * @param {number} y4 - The y-coordinate of the end of the second line segment.
 * @returns {boolean} - True if the line segments intersect, false otherwise.
 */
function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) {
        return false;
    }
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

    return t > 0 && t < 1 && u > 0 && u < 1;
}

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
        // Calculate the ball's previous position
        const prevBallX = ball.posx - ball.velx;
        const prevBallY = ball.posy - ball.vely;

        // Define the front face of the paddle as a line segment
        let paddleFrontX;
        if (this.side === SIDE.LEFT) {
            paddleFrontX = this.posx + this.width;
        } else {
            paddleFrontX = this.posx;
        }
        const paddleTop = this.posy;
        const paddleBottom = this.posy + this.height;

        // Check for intersection between the ball's movement vector and the paddle's front face
        if (linesIntersect(prevBallX, prevBallY, ball.posx, ball.posy, paddleFrontX, paddleTop, paddleFrontX, paddleBottom)) {
            // Reverse horizontal velocity and apply force
            ball.velx *= -1;
            ball.velx *= PADDLE_FORCE;

            // Add "spin" to the ball based on where it hit the paddle
            const MAX_SPIN_VELOCITY = 7; // Maximum vertical speed change from spin
            let intersectPoint = (ball.posy - (this.posy + this.height / 2)) / (this.height / 2);
            ball.vely = intersectPoint * MAX_SPIN_VELOCITY;
        }

        return SIDE.NONE;
    }
}