class ArkanoidGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Game state
        this.gameStarted = false;
        this.score = 0;
        this.lives = 3;
        
        // Paddle properties
        this.paddleHeight = 10;
        this.paddleWidth = 75;
        this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
        this.paddleSpeed = 7;
        
        // Ball properties
        this.ballRadius = 8;
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height - 30;
        this.ballSpeedX = 5;
        this.ballSpeedY = -5;
        
        // Bricks properties
        this.brickRowCount = 5;
        this.brickColumnCount = 8;
        this.brickWidth = 75;
        this.brickHeight = 20;
        this.brickPadding = 10;
        this.brickOffsetTop = 30;
        this.brickOffsetLeft = 30;
        
        // Controls state
        this.rightPressed = false;
        this.leftPressed = false;
        
        // Initialize bricks
        this.bricks = this.initializeBricks();
        
        // Power-ups properties
        this.powerUps = [];
        this.activePowerUps = {
            laser: false,
            fireball: false,
            shield: false,
            multiBall: false,
            slowMotion: false
        };
        this.powerUpDuration = 10000; // 10 seconds
        this.powerUpChance = 0.2; // 20% chance of power-up drop
        
        // Laser properties
        this.lasers = [];
        this.laserWidth = 2;
        this.laserHeight = 10;
        this.laserSpeed = 7;
        
        // Multi-ball properties
        this.balls = [{
            x: this.canvas.width / 2,
            y: this.canvas.height - 30,
            speedX: 5,
            speedY: -5,
            radius: 8
        }];
        
        // Shield properties
        this.shieldWidth = this.paddleWidth + 20;
        this.shieldHeight = 5;
        this.shieldColor = 'rgba(0, 255, 255, 0.5)';
        
        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleShoot = this.handleShoot.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        // Add event listeners
        this.setupEventListeners();
        
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            if (!this.gameStarted) {
                this.startGame();
            }
        });
    }
    
    setupCanvas() {
        // Set canvas size based on window size
        const updateCanvasSize = () => {
            this.canvas.width = Math.min(800, window.innerWidth);
            this.canvas.height = Math.min(600, window.innerHeight * 0.7);
            
            // Update paddle and ball positions
            this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
            this.ballX = this.canvas.width / 2;
            this.ballY = this.canvas.height - 30;
        };
        
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }
    
    initializeBricks() {
        const bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                // 30% chance of having a power-up
                const hasPowerUp = Math.random() < 0.3;
                // If it has a power-up, randomly select one
                const powerUpType = hasPowerUp ? ['laser', 'fireball', 'shield', 'multiBall', 'slowMotion'][Math.floor(Math.random() * 5)] : null;
                bricks[c][r] = { 
                    x: 0, 
                    y: 0, 
                    status: 1,
                    powerUpType: powerUpType
                };
            }
        }
        return bricks;
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        // Arrow button controls
        const leftArrow = document.getElementById('leftArrow');
        const rightArrow = document.getElementById('rightArrow');
        
        // Touch events for arrow buttons
        leftArrow.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.leftPressed = true;
        });
        
        leftArrow.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.leftPressed = false;
        });
        
        rightArrow.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.rightPressed = true;
        });
        
        rightArrow.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.rightPressed = false;
        });
        
        // Mouse events for arrow buttons
        leftArrow.addEventListener('mousedown', () => {
            this.leftPressed = true;
        });
        
        leftArrow.addEventListener('mouseup', () => {
            this.leftPressed = false;
        });
        
        rightArrow.addEventListener('mousedown', () => {
            this.rightPressed = true;
        });
        
        rightArrow.addEventListener('mouseup', () => {
            this.rightPressed = false;
        });
        
        // Add shooting control for keyboard
        document.addEventListener('keydown', this.handleShoot);
    }
    
    handleKeyDown(e) {
        if (e.key === 'Right' || e.key === 'ArrowRight') {
            this.rightPressed = true;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            this.leftPressed = true;
        }
    }
    
    handleKeyUp(e) {
        if (e.key === 'Right' || e.key === 'ArrowRight') {
            this.rightPressed = false;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            this.leftPressed = false;
        }
    }
    
    handleShoot(e) {
        if (e.key === ' ' && this.activePowerUps.laser) {
            this.shootLaser();
        }
    }
    
    shootLaser() {
        this.lasers.push({
            x: this.paddleX + this.paddleWidth / 2 - this.laserWidth / 2,
            y: this.canvas.height - this.paddleHeight - this.laserHeight
        });
    }
    
    updateLasers() {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.y -= this.laserSpeed;
            
            // Check collision with bricks
            for (let c = 0; c < this.brickColumnCount; c++) {
                for (let r = 0; r < this.brickRowCount; r++) {
                    const brick = this.bricks[c][r];
                    if (brick.status === 1) {
                        if (laser.x > brick.x && laser.x < brick.x + this.brickWidth &&
                            laser.y > brick.y && laser.y < brick.y + this.brickHeight) {
                            brick.status = 0;
                            this.lasers.splice(i, 1);
                            this.score++;
                            document.getElementById('scoreValue').textContent = this.score;
                            break;
                        }
                    }
                }
            }
            
            // Remove laser if it goes off screen
            if (laser.y < 0) {
                this.lasers.splice(i, 1);
            }
        }
    }
    
    drawBall() {
        this.balls.forEach(ball => {
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = ball.fireball ? '#ff6600' : '#0095DD';
            this.ctx.fill();
            this.ctx.closePath();
        });
    }
    
    drawPaddle() {
        this.ctx.beginPath();
        this.ctx.rect(this.paddleX, this.canvas.height - this.paddleHeight, this.paddleWidth, this.paddleHeight);
        this.ctx.fillStyle = '#0095DD';
        this.ctx.fill();
        this.ctx.closePath();
    }
    
    drawBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    const brickX = (c * (this.brickWidth + this.brickPadding)) + this.brickOffsetLeft;
                    const brickY = (r * (this.brickHeight + this.brickPadding)) + this.brickOffsetTop;
                    this.bricks[c][r].x = brickX;
                    this.bricks[c][r].y = brickY;
                    this.ctx.beginPath();
                    this.ctx.rect(brickX, brickY, this.brickWidth, this.brickHeight);
                    
                    // Set color based on power-up type
                    const brick = this.bricks[c][r];
                    if (brick.powerUpType) {
                        switch(brick.powerUpType) {
                            case 'laser': this.ctx.fillStyle = '#ff0000'; break;
                            case 'fireball': this.ctx.fillStyle = '#ff6600'; break;
                            case 'shield': this.ctx.fillStyle = '#00ffff'; break;
                            case 'multiBall': this.ctx.fillStyle = '#ffff00'; break;
                            case 'slowMotion': this.ctx.fillStyle = '#9933ff'; break;
                        }
                    } else {
                        this.ctx.fillStyle = '#0095DD'; // Default color for blocks without power-ups
                    }
                    
                    this.ctx.fill();
                    this.ctx.closePath();
                }
            }
        }
    }
    
    drawShield() {
        if (this.activePowerUps.shield) {
            this.ctx.beginPath();
            this.ctx.rect(
                this.paddleX - 10,
                this.canvas.height - this.paddleHeight - this.shieldHeight,
                this.shieldWidth,
                this.shieldHeight
            );
            this.ctx.fillStyle = this.shieldColor;
            this.ctx.fill();
            this.ctx.closePath();
        }
    }
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            this.ctx.beginPath();
            this.ctx.rect(powerUp.x, powerUp.y, 20, 20);
            
            // Different colors for different power-ups
            switch(powerUp.type) {
                case 'laser': this.ctx.fillStyle = '#ff0000'; break;
                case 'fireball': this.ctx.fillStyle = '#ff6600'; break;
                case 'shield': this.ctx.fillStyle = '#00ffff'; break;
                case 'multiBall': this.ctx.fillStyle = '#ffff00'; break;
                case 'slowMotion': this.ctx.fillStyle = '#9933ff'; break;
            }
            
            this.ctx.fill();
            this.ctx.closePath();
        });
    }
    
    collisionDetection() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const b = this.bricks[c][r];
                if (b.status === 1) {
                    this.balls.forEach(ball => {
                        if (ball.x > b.x && ball.x < b.x + this.brickWidth && 
                            ball.y > b.y && ball.y < b.y + this.brickHeight) {
                            if (!ball.fireball) {
                                ball.speedY = -ball.speedY;
                            }
                            b.status = 0;
                            this.score++;
                            document.getElementById('scoreValue').textContent = this.score;
                            
                            // Only spawn power-up if the brick has one
                            if (b.powerUpType) {
                                this.createPowerUp(b.x + this.brickWidth/2, b.y + this.brickHeight, b.powerUpType);
                            }
                            
                            if (this.score === this.brickRowCount * this.brickColumnCount) {
                                alert('¡Felicitaciones! ¡Has ganado!');
                                document.location.reload();
                            }
                        }
                    });
                }
            }
        }
    }
    
    movePaddle() {
        if (this.rightPressed && this.paddleX < this.canvas.width - this.paddleWidth) {
            this.paddleX += this.paddleSpeed;
        } else if (this.leftPressed && this.paddleX > 0) {
            this.paddleX -= this.paddleSpeed;
        }
    }
    
    moveBall() {
        this.balls = this.balls.filter(ball => {
            ball.x += ball.speedX;
            ball.y += ball.speedY;
            
            // Collision with walls
            if (ball.x + ball.radius > this.canvas.width || ball.x - ball.radius < 0) {
                ball.speedX = -ball.speedX;
            }
            
            if (ball.y - ball.radius < 0) {
                ball.speedY = -ball.speedY;
            } else if (ball.y + ball.radius > this.canvas.height) {
                if (ball.x > this.paddleX && ball.x < this.paddleX + this.paddleWidth) {
                    ball.speedY = -ball.speedY;
                } else if (this.balls.length === 1) {
                    if (!this.activePowerUps.shield) {
                        this.lives--;
                        document.getElementById('livesValue').textContent = this.lives;
                        
                        if (this.lives === 0) {
                            alert('Game Over');
                            document.location.reload();
                        } else {
                            ball.x = this.canvas.width / 2;
                            ball.y = this.canvas.height - 30;
                            ball.speedX = 5;
                            ball.speedY = -5;
                            this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
                        }
                    } else {
                        ball.speedY = -ball.speedY;
                    }
                }
                return ball.y < this.canvas.height;
            }
            return true;
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBricks();
        this.drawBall();
        this.drawPaddle();
        this.drawShield();
        this.drawPowerUps();
        if (this.activePowerUps.laser) {
            this.drawLasers();
        }
        this.collisionDetection();
        this.moveBall();
        this.movePaddle();
        this.updatePowerUps();
        if (this.activePowerUps.laser) {
            this.updateLasers();
        }
    }
    
    gameLoop() {
        if (this.gameStarted) {
            this.draw();
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    startGame() {
        this.gameStarted = true;
        document.getElementById('startButton').style.display = 'none';
        this.gameLoop();
    }
    
    createPowerUp(x, y, type) {
        this.powerUps.push({ x, y, type, speed: 2 });
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += powerUp.speed;
            
            // Check collision with paddle
            if (powerUp.y + 20 > this.canvas.height - this.paddleHeight &&
                powerUp.x > this.paddleX && 
                powerUp.x < this.paddleX + this.paddleWidth) {
                this.activatePowerUp(powerUp.type);
                this.powerUps.splice(i, 1);
            }
            
            // Remove if off screen
            if (powerUp.y > this.canvas.height) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    activatePowerUp(type) {
        this.activePowerUps[type] = true;
        
        switch(type) {
            case 'multiBall':
                this.createMultiBalls();
                break;
            case 'slowMotion':
                this.balls.forEach(ball => {
                    ball.speedX *= 0.5;
                    ball.speedY *= 0.5;
                });
                break;
            case 'fireball':
                this.balls.forEach(ball => ball.fireball = true);
                break;
        }
        
        setTimeout(() => {
            this.deactivatePowerUp(type);
        }, this.powerUpDuration);
    }
    
    deactivatePowerUp(type) {
        this.activePowerUps[type] = false;
        
        if (type === 'slowMotion') {
            this.balls.forEach(ball => {
                ball.speedX *= 2;
                ball.speedY *= 2;
            });
        } else if (type === 'fireball') {
            this.balls.forEach(ball => ball.fireball = false);
        }
    }
    
    createMultiBalls() {
        const mainBall = this.balls[0];
        this.balls.push(
            {
                x: mainBall.x,
                y: mainBall.y,
                speedX: -mainBall.speedX,
                speedY: mainBall.speedY,
                radius: mainBall.radius
            },
            {
                x: mainBall.x,
                y: mainBall.y,
                speedX: mainBall.speedX * 1.2,
                speedY: mainBall.speedY,
                radius: mainBall.radius
            }
        );
    }
    
    drawLasers() {
        this.ctx.fillStyle = '#ff0000';
        for (const laser of this.lasers) {
            this.ctx.beginPath();
            this.ctx.rect(laser.x, laser.y, this.laserWidth, this.laserHeight);
            this.ctx.fill();
            this.ctx.closePath();
        }
    }
}

// Initialize game when window loads
window.onload = () => {
    window.gameInstance = new ArkanoidGame();
}; 