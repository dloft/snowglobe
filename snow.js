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
    this.vX = 0.0;
    this.vY = Math.random() * 1 + 0.5; // Gentle downward drift
    this.opacity = Math.random() * 0.7 + 0.3;
    this.falling = true;
    this.minVY = Math.random() * 1 + 0.5; // Base falling speed
    this.minVX = Math.random() * 0.2 - 0.1; // Slight drift
    this.isShaken = true; // Track if snowflake was recently shaken

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

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height * 0.1; // Reappear near top
    this.vX = this.minVX;
    this.vY = this.minVY;
    this.falling = true;
    this.isShaken = false;
  }
  
  update() {
    if (!this.falling) return;

    const xdampening = 0.99; // Damp horizontal velocity slightly
    const ydampening = 0.98; // Damp vertical velocity slightly
    const gravity = 0.02; // Constant downward acceleration

    // Apply gravity
    this.vY += gravity;

    // Gradually reduce the "shaken" state
    if (this.isShaken && Math.abs(this.vX - this.minVX) < 0.1 && this.vY > this.minVY) {
      this.isShaken = false;
    }

    // Allow natural upward and downward motion
    if (this.vY > this.minVY && !this.isShaken) {
      // Enforce minimum downward velocity once vY > minVY
      this.vY = Math.max(this.vY, this.minVY);
    }

    // Dampen velocities
    this.vX *= xdampening;
    this.vY *= ydampening;

    // Update position
    this.x += this.vX;
    this.y += this.vY;

    // Reset behavior if off the top
    if (this.y < 0) {
      this.reset(); // Reset snowflake to the top
    }

    // Check for ground collision
    const groundLevel = groundHeight(this.x);
    if (this.y + this.radius >= canvas.height - groundLevel) {
      if (Math.random() > 0.3) {
	// Stop the snowflake at the ground
	this.falling = false;
	this.y = canvas.height - groundLevel;
	ground.push(this);
      } else {
	this.reset();
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

function applyShakeVelocity(flake, scale, range) {
  const randomX = (Math.random() * 2 - 1) * range;
  const randomY = (Math.random() * 2 - 1) * range;
  flake.vX = vX * scale + randomX;
  flake.vY = vY * scale + randomY;
  flake.isShaken = true;
}

function shookGlobe() {
  const velocityScale = 2;
  const randomRange = 0.5;

  ground.length = 0;

  snowflakes.forEach(flake => {
    flake.falling = true;
    applyShakeVelocity(flake, velocityScale, randomRange);
  });
  // Collect all snowflake vX properties in an array
  const velocities = snowflakes.map(flake => flake.vX.toFixed(2));
  
  // Log the vX properties on a single line
  // console.log(`Snowflake vX values: [${velocities.join(", ")}]`);
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
  console.log("mouseUp vX, vY: ", vX, vY);
  shookGlobe();
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  forest.forEach((tree) => {
    drawTree(tree.x, tree.y);
  });

  // Collect all snowflake vX properties in an array
//  const velocities = snowflakes.map(flake => flake.vX.toFixed(2));
  
  // Log the vX properties on a single line
//  console.log(`Snowflake animate vX values: [${velocities.join(", ")}]`);

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
