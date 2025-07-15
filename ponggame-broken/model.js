const SIDE = { NONE: 0, LEFT: 1, RIGHT: 2 };
const STATE = { STARTUP: 0, PLAYING: 1, GAMEOVER: 2 };
const CPU_DIFFICULTY = { EASY: 0, MEDIUM: 1, HARD: 2 };
const THEMES = {
    NEON: {
        name: 'NEON',
        cssPath: 'themes/neon/style.css',
        jsPath: 'themes/neon/view.js',
        paddleLColor: '#00FFFF', // Cyan
        paddleRColor: '#FF00FF', // Magenta
    },
    CLASSIC: {
        name: 'CLASSIC',
        cssPath: 'themes/classic/style.css',
        jsPath: 'themes/classic/view.js',
        paddleLColor: '#FFFFFF',
        paddleRColor: '#FFFFFF',
    }
};

const BOARD_WIDTH = 500;
const BOARD_HEIGHT = 500;
const PADDLE_WiDTH = 25;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 12.5;
const PADDLE_VELOCITY = 5;
const PADDLE_FORCE = 1.1; // 110% of speed before

class Model {
    ball;
    paddleL;
    paddleR;
    scoreL = 0;
    scoreR = 0;
    cpu_left = false; // Default to Player vs CPU
    cpu_right = true;
    winningScore = 10;
    cpu_difficulty = CPU_DIFFICULTY.EASY;
    theme = THEMES.CLASSIC; // Default theme
    state = STATE.STARTUP;
    intervalID = -1;

    constructor() {
        this.resetGame();
    }

    setTheme(themeName) {
        if (THEMES[themeName]) {
            this.theme = THEMES[themeName];
            // Update existing paddle colors for live theme switching
            if (this.paddleL) this.paddleL.color = this.theme.paddleLColor;
            if (this.paddleR) this.paddleR.color = this.theme.paddleRColor;
        }
    }

    resetGame() {
        this.state = STATE.STARTUP;
        this.scoreL = 0;
        this.scoreR = 0;
        updateScore(this); // Immediately update the scoreboard display
        clearTimeout(this.intervalID);
        this.resetBall();
        this.paddleL = new Paddle(0, 0, PADDLE_WiDTH, PADDLE_HEIGHT, SIDE.LEFT, this.theme.paddleLColor);
        this.paddleR = new Paddle(BOARD_WIDTH - PADDLE_WiDTH, 0, PADDLE_WiDTH, PADDLE_HEIGHT, SIDE.RIGHT, this.theme.paddleRColor);
    }

    resetBall() {
        this.ball = new Ball(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, 1, -1);
    }

}
