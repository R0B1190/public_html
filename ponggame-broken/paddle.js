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
        let bounce_dir = Math.sign(BOARD_WIDTH / 2 - this.posx);
        // Check for collision using the edges of the ball and paddle
        if (ball.velx > this.width) { // Tunneling catch.
            // linear equation.
            let m = (ball.vely / ball.velx);
            ball.posy = ball.posy + m * (this.posx - ball.posx);
            ball.posx = this.posx + this.width / 2

            // consol log params

            console.log(`Tunneling catch: ball pos (${ball.posx}, ${ball.posy}), paddle pos (${this.posx}, ${this.posy}), width ${this.width}, height ${this.height}`);
        }

        if (ball.posy + BALL_RADIUS >= this.posy && ball.posy - BALL_RADIUS <= this.posy + this.height && // within y
            (ball.posx - BALL_RADIUS <= this.posx + this.width && ball.posx + BALL_RADIUS >= this.posx) &&  // within x 
            ball.velx * bounce_dir < 0 // ball going into wall
        ) {
            ball.velx = bounce_dir * PADDLE_FORCE * Math.abs(ball.velx);
            return SIDE.NONE;
        }


        return SIDE.NONE;
    }
}

// function bounceRightPaddle(paddle) {
//     if (this.posx + BALL_RADIUS < paddle.posx) return SIDE.NONE;
//     if (this.posx + BALL_RADIUS > paddle.posx + paddle.width) return SIDE.LEFT; // Someone got a point...
//     if (this.posy < paddle.posy) return SIDE.NONE;
//     if (this.posy > paddle.posy + paddle.height) return SIDE.NONE;
//     if (this.velx > 0) {
//         this.velx = -PADDLE_FORCE * Math.abs(this.velx);
//         // add other spin, etc.
//         // add sound?
//     }
//     return SIDE.NONE;
// }
