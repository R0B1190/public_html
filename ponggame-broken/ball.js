class Ball {
    posx;
    posy;
    velx;
    vely;

    constructor(posx, posy, velx, vely) {
        this.posx = posx;
        this.posy = posy;
        this.velx = velx;
        this.vely = vely;
    }


    move() {
        this.posx += this.velx;
        this.posy += this.vely;

    }

    bounce(things) {
        this.bounceWalls();
        for (let thing of things) {
            // thing.bounce() will return the side of the paddle if a collision occurred.
            let paddleSideHit = thing.bounce(this);
            if (paddleSideHit !== SIDE.NONE) {
                return SIDE.NONE; // A paddle was hit, so no point is scored.
            }
        }
        // A point is scored only when the ball is completely off the screen.
        // For the right side, the ball's left edge must be past the board width.
        if (this.posx - BALL_RADIUS > BOARD_WIDTH) return SIDE.RIGHT;
        // For the left side, the ball's right edge must be past the left boundary (0).
        if (this.posx + BALL_RADIUS < 0) return SIDE.LEFT;

        return SIDE.NONE;
    }

    bounceWalls() {
        if (this.posy - BALL_RADIUS < 0) {
            this.vely = Math.abs(this.vely);
        }
        if (this.posy + BALL_RADIUS > BOARD_HEIGHT) {
            this.vely = -Math.abs(this.vely);
        }
    }
}