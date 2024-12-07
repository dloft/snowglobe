const canvas = document.getElementById("snowCanvas");
const ctx = canvas.getContext("2d");
const globeContainer = document.querySelector(".globe-container");
canvas.width = 300;
canvas.height = 300;

const globeCenterX = canvas.width / 2;
const globeCenterY = canvas.height / 2;
const globeRadius = canvas.width / 2;
let numSnowflakes = 100;

// Global variables for tracking motion
let isDragging = false;
let offsetX = 0;
let offsetY = 0;
let lastX = 0;
let lastY = 0;
let lastTime = 0;
let vX = 0;
let vY = 0;

// Track accumulated snow
const ground = [];

class Snowflake {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 2 + 1;
    this.vX = 0;
    this.vY = Math.random() * 1 + 0.5; // Gentle downward drift
    this.opacity = Math.random() * 0.7 + 0.3;
    this.falling = true;
    this.minVY = Math.random() * 1 + 0.5; // Base falling speed
    this.minVX = Math.random() * 0.2 - 0.1; // Slight drift
    this.isShaken = false; // Track if snowflake was recently shaken

    // Let's use colors in lieu of custom snowflake shapes for now
    if (Math.random() < 0.2) {
      const colors = [
        'rgb(255, 182, 193)',  // light pink
        'rgb(173, 216, 230)',  // light blue
        'rgb(144, 238, 144)',  // light green
        'rgb(255, 218, 185)',  // peach
        'rgb(221, 160, 221)'   // plum
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    } else {
      this.color = 'white';
    }
  }

  update() {
    if (!this.falling) {
      return;
    }

    // Dampen velocities
    const xdampening = 0.98;
    const ydampening = 0.95;
    this.vX *= xdampening;
    
    // For vertical movement, always add a slight downward
    // acceleration This ensures snowflakes eventually fall down after
    // being thrown upward.
    
    const gravity = 0.01;
    this.vY += gravity;
    this.vY *= ydampening;

    // Only apply minimum velocities if not recently shaken
    if (!this.isShaken) {
      if (Math.abs(this.vX) < Math.abs(this.minVX)) {
	this.vX = this.minVX;
      }
      if (this.vY < this.minVY) {
	this.vY = this.minVY;
      }
    }

    // If velocities are close to minimums, return to natural falling state
    if (Math.abs(this.vX - this.minVX) < 0.1) {
      this.isShaken = false;
    }

    this.x += this.vX;
    this.y += this.vY;

    // If snow goes off the top, reappear near bottom
    if (this.y < 0) {
      this.y = canvas.height * 0.8 + Math.random() * canvas.height * 0.1;
      this.x = Math.random() * canvas.width;
    }
    
    // Check for ground collision
    const groundLevel = groundHeight(this.x);
    if (this.y + this.radius >= canvas.height - groundLevel) {
      if (Math.random() > 0.3) {
	this.falling = false;
	this.y = canvas.height - groundLevel;
	ground.push(this);
      } else {
	this.y = 0;
	this.x = Math.random() * canvas.width;
	this.vX = this.minVX;
	this.vY = this.minVY;
	this.isShaken = false;
      }
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color === 'white' ? '255, 255, 255' : this.color.slice(4, -1)}, ${this.opacity})`;
    ctx.fill();
    ctx.closePath();
  }
}

function groundHeight(x) {
  const distanceFromCenter = Math.abs(x - globeCenterX);
  
  if (distanceFromCenter > globeRadius) {
    return 0;
  }

  // Basic curved bottom
  const curveHeight = Math.sqrt(globeRadius ** 2 - distanceFromCenter ** 2);
  const baseHeight = globeCenterY + curveHeight;

  // Add height from accumulated snow
  return ground.reduce((height, snow) => {
    const distanceToSnow = Math.abs(snow.x - x);
    if (distanceToSnow < snow.radius * 2) {
      return height + snow.radius * 0.5;
    }
    return height;
  }, canvas.height - baseHeight);
}

function drawGround() {
  ground.forEach((snow) => {
    ctx.beginPath();
    ctx.arc(snow.x, snow.y, snow.radius, 0, Math.PI * 2);
    ctx.fillStyle = snow.color;
    ctx.fill();
    ctx.closePath();
  });
}

function mouseVelocity(x, y, time) {
  const deltaX = x - lastX;
  const deltaY = y - lastY;
  const deltaTime = time - lastTime || 1;
  
  return {
    velocityX: deltaX / deltaTime,
    velocityY: deltaY / deltaTime
  };
}

function shookGlobe() {
  const velocityScale = 2;
  const randomRange = 0.5;

  snowflakes.forEach(flake => {
    const randomX = (Math.random() * 2 - 1) * randomRange;
    const randomY = (Math.random() * 2 - 1) * randomRange;

    // FIXME there is duplicate logic below
    if (flake.falling) {
      flake.vX = vX * velocityScale + randomX;
      flake.vY = vY * velocityScale + randomY;
      flake.isShaken = true;
    } else {
      const index = ground.indexOf(flake);
      if (index > -1) {
        ground.splice(index, 1);
      }
      flake.falling = true;
      flake.vX = vX * velocityScale + randomX;
      flake.vY = vY * velocityScale + randomY;
      flake.isShaken = true;
    }
  });
}

// Initialize snowflakes
const snowflakes = [];
function initSnowflakes() {
  for (let i = 0; i < numSnowflakes; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    snowflakes.push(new Snowflake(x, y));
  }
}

// Event handlers
globeContainer.addEventListener('mousedown', (event) => {
  isDragging = true;
  offsetX = event.clientX - globeContainer.offsetLeft;
  offsetY = event.clientY - globeContainer.offsetTop;
  lastX = event.clientX;
  lastY = event.clientY;
  lastTime = performance.now();
});

document.addEventListener('mousemove', (event) => {
  if (isDragging) {
    // Update globe position
    const left = event.clientX - offsetX;
    const top = event.clientY - offsetY;
    globeContainer.style.left = `${left}px`;
    globeContainer.style.top = `${top}px`;
    
    // Calculate velocity
    const time = performance.now();
    const { velocityX, velocityY } = mouseVelocity(event.clientX, event.clientY, time);
    vX = velocityX;
    vY = velocityY;
    
    // Update tracking variables
    lastX = event.clientX;
    lastY = event.clientY;
    lastTime = time;
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  shookGlobe();
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  forest.forEach((tree) => {
    drawTree(tree.x, tree.y);
  });

  snowflakes.forEach(flake => {
    flake.update();
    flake.draw(ctx);
  });
  
  drawGround();
  
  requestAnimationFrame(animate);
}

// Start the simulation
initSnowflakes();
animate();
