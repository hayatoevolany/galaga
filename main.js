const canvas = document.querySelector('#Canvas');
const ctx = canvas.getContext('2d');

// --- Constants
const CANV_W = 600;
const CANV_H = 800;
const SHIP_X = canvas.width / 2;
const SHIP_Y = canvas.height - 100; // 100 px off the bottom of canvas
const SPR_SIZE = 25; // sprite size (h x w)
const MAX = canvas.width - SPR_SIZE; // max x-axis location
const MIN = 0; // Minimum X-axis location

let enemies = [];
let ship;

document.addEventListener('keydown', ({ key }) => {
    if (key === 'ArrowLeft') {
        if (lPress) return;

        lPress = true;
    } else if (key === 'ArrowRight') {
        if (rPress) return;

        rPress = true;
    }
});

document.addEventListener('keyup', ({ key }) => {
    if (key === 'ArrowLeft') {
        lPress = false;
    } else if (key === 'ArrowRight') {
        rPress = false;
    }
});

let lPress = false;
let rPress = false;

const drawBg = () => {
    ctx.fillStyle='black';
    ctx.fillRect(0, 0, CANV_W, CANV_H);
}

const bullets = [];

let spaceDown = false;

class Ship {
    constructor() {
        this.height = SPR_SIZE;
        this.width = SPR_SIZE;
        this.pos = SHIP_X;
        this.y = SHIP_Y;
        this.vel = 0;
        this.img = new Image();
        this.img.src = './images/1-ship.svg';
        ctx.drawImage(this.img, this.pos, this.y);

        document.addEventListener('keydown', ({ key }) => {
            if (key === ' ') {
                if (spaceDown) return;
                
                spaceDown = true;
                this.shoot();
            }
        });
        document.addEventListener('keyup', ({ key }) => {
            if (key === ' ') {
                spaceDown = false;
            }
        });
    }
    draw() {
        ctx.drawImage(this.img, this.pos, this.y);
    }
    tick() {
        this.accelerate();
        this.move();
        this.draw();
    }
    move() {
        if (this.pos + this.vel < MIN) { // left boundary
            this.pos = MIN;
            this.vel = 0;
        } else if (this.pos + this.vel > MAX) { // right boundary
            this.pos = MAX;
            this.vel = 0;
        } else {
            this.pos += this.vel;
        }
    }
    accelerate() {
        const goingRight = this.vel > 0;
        const goingLeft = this.vel < 0;
        if (goingRight && lPress) {
            this.vel-=2; // slow down doubly much.
        } else if (goingLeft && rPress) {
            this.vel+=2; // slow down doubly much.
        } else if (rPress) {
            this.vel++; // accelerate rightwards
        } else if (lPress) {
            this.vel--; // accelerate leftwards
        } else {
            // slow down when not holding btns
            if (goingRight) {
                this.vel--; 
            } else if (goingLeft) {
                this.vel++;
            }
        }
    }
    shoot() {
        const bullet = new Bullet(this.pos);
        bullets.push(bullet);
    }
}

class Bullet {
    constructor(x) {
        this.height = SPR_SIZE;
        this.width = SPR_SIZE;
        this.x = x;
        this.y = SHIP_Y - SPR_SIZE; // start one square above ship
        this.vel = 25;
        this.img = new Image();
        this.img.src = './images/2-bullet.svg';
        // const id = generateId();
        // bullets[id] = 
        ctx.drawImage(this.img, this.x, this.y);
    }
    // generateId() {
    //     Date.now().toString(36) + Math.random().toString(36).substr(2);
    // }
    move() {
        this.y = this.y - this.vel;
        if (this.y < MIN) {
            this.disappear();
        }
    }
    tick() {
        this.move();
        this.draw();
        this.checkCollision();
    }
    draw() {
        ctx.drawImage(this.img, this.x, this.y);
    }
    checkCollision() {
        const tipX = this.x + (this.width / 2); // tip of bullet.
        enemies.forEach(enemy => {
            const { height, width, x, y } = enemy;
            if (this.y > (y + height) || this.y < y - 50) return; // miss if went too far?

            if (tipX < (x + enemyX + width) && tipX > (x + enemyX)) {
                this.disappear(enemy);
            }
        })
    }
    disappear(enemy=false) {
        const idx = bullets.indexOf(this);
        if (idx > -1) { // only splice array when item is found
            delete bullets[idx]
            bullets.splice(idx, 1); // 2nd parameter means remove one item only
            enemy && enemy.die();
        }
    }
}

const ENEMY_PER_LINE = 7; // max enemies per line
const ENEMY_Y_START = 100;
const ENEMY_X_START = 100;
const ENEMY_GAP = 38;

const enemyImgs = [];
const makeEnemyImgs = () => {
    const image = new Image();
    // Wait for the sprite sheet to load
    image.onload = () => {
        Promise.all([
            // Cut out two sprites from the sprite sheet
            createImageBitmap(image, 0, 0, 25, 25),
            createImageBitmap(image, 25, 0, 25, 25),
            createImageBitmap(image, 50, 0, 25, 25),
            createImageBitmap(image, 75, 0, 25, 25),
            createImageBitmap(image, 100, 0, 25, 25),
            createImageBitmap(image, 125, 0, 25, 25),
            createImageBitmap(image, 150, 0, 25, 25),
        ]).then((sprites) => {
            sprites.forEach((x, i) => enemyImgs[i] = x);
        });
    }
    image.src = './images/3-enemy.svg';
}
makeEnemyImgs();

let enemyX = 0;
let enemyXVel = 10;
const moveEnemies = () => {
    const maxEnemyX = CANV_W - (ENEMY_PER_LINE * (ENEMY_GAP + SPR_SIZE)) + 120
    if (enemyX + enemyXVel < MIN) { // left boundary
        enemyX = MIN;
        enemyXVel = 10;
    } else if (enemyX + enemyXVel > maxEnemyX) { // right boundary
        enemyX = maxEnemyX;
        enemyXVel = -10;
    } else {
        enemyX += enemyXVel;
    }
}


class Enemy {
    constructor(num=0) {
        this.img_num = 6;
        this.height = SPR_SIZE;
        this.width = SPR_SIZE;
        this.x = enemyX + (num * ENEMY_GAP + SPR_SIZE);
        this.y = ENEMY_Y_START;
        ctx.drawImage(enemyImgs[this.img_num], this.x, this.y);
    }
    draw() {
        ctx.drawImage(enemyImgs[this.img_num], this.x + enemyX, this.y);
    }
    tick() {
        this.draw();
    }
    move() {
    }
    attack() {

    }
    die() {
        const idx = enemies.indexOf(this);
        if (idx > -1) { // only splice array when item is found
            delete enemies[idx]
            enemies.splice(idx, 1); // 2nd parameter means remove one item only
        }
    }
}

function start() {
    ship = new Ship();
    enemies = [0, 1, 2, 3, 4, 5, 6].map(x => new Enemy(x));

    const playIntv = setInterval(() => {
        drawBg();
        if (enemies.length === 0) {
            clearInterval(playIntv);
            alert("YOU WIN. GOOD JOB.");
        }
        ship.tick();
        moveEnemies();
        enemies.forEach(en => en.tick())
        bullets.forEach(bullet => bullet.tick());
    }, 50);
}