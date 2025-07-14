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
        // Simplified collision and bounce logic
        const paddleTop = this.posy;
        const paddleBottom = this.posy + this.height;
        const paddleLeft = this.posx;
        const paddleRight = this.posx + this.width;

        const ballTop = ball.posy - BALL_RADIUS;
        const ballBottom = ball.posy + BALL_RADIUS;
        const ballLeft = ball.posx - BALL_RADIUS;
        const ballRight = ball.posx + BALL_RADIUS;

        // AABB collision detection that checks if the ball is moving towards the paddle
        const isMovingTowards = (this.side === SIDE.LEFT && ball.velx < 0) || (this.side === SIDE.RIGHT && ball.velx > 0);

        if (isMovingTowards && ballRight > paddleLeft && ballLeft < paddleRight && ballBottom > paddleTop && ballTop < paddleBottom) {
            // Reverse horizontal velocity and apply force
            ball.velx *= -1;
            ball.velx *= PADDLE_FORCE;

            // Add "spin" to the ball based on where it hit the paddle
            const MAX_SPIN_VELOCITY = 7; // Maximum vertical speed change from spin
            let intersectPoint = (ball.posy - (this.posy + this.height / 2)) / (this.height / 2);
            ball.vely = intersectPoint * MAX_SPIN_VELOCITY;

            return SIDE.NONE;
        }


        return SIDE.NONE;
    }
}
