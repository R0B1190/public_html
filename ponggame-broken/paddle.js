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

    move(is_cpu, ball) {
        if (is_cpu) {
            // Simple AI: try to center the paddle on the ball
            const paddleCenter = this.posy + this.height / 2;
            if (paddleCenter < ball.posy - 10) { // a small deadzone to prevent jittering
                this.vely = PADDLE_VELOCITY;
            } else if (paddleCenter > ball.posy + 10) {
                this.vely = -PADDLE_VELOCITY;
            } else {
                this.vely = 0;
            }
        }
        this.posy = Math.min(BOARD_HEIGHT - this.height, Math.max(0, this.posy + this.vely));
    }

    bounce(ball) {
        let bounce_dir = Math.sign(BOARD_WIDTH / 2 - this.posx);
        // Check for collision using the edges of the ball and paddle
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
