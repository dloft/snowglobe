const canvas = document.getElementById("snowCanvas");
canvas.width = 300;
canvas.height = 300;
const ctx = canvas.getContext("2d");
const globeContainer = document.querySelector(".globe-container");
const globeCenterX = canvas.width / 2;
const globeCenterY = canvas.height / 2;
const globeRadius = canvas.width / 2;
let offsetX = 0;
let offsetY = 0;
let lastX = 0;
let lastY = 0;
let lastTime = 0;
let vX = 0;
let vY = 0;
let isDragging = false;

// Global configuration
let numSnowflakes = 100;
const groundRecycleRate = 0.3;
const xdamping = 0.99; // Damp horizontal velocity (1 = no damping)
const ydamping = 0.98; // Damp vertical velocity
const gravity = 0.02;  // Constant downward acceleration, so flakes shaken upwards fall back down
const windForce = 0.2;

const ground = [];

function setup() {
  // Event handlers
  globeContainer.addEventListener('mousedown', startDrag);
  globeContainer.addEventListener('touchstart', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);

  // Set globe size: 1/3 of longest side of window
  const globeElement = document.querySelector(".snow-globe");
  let maxDim = Math.max(window.innerWidth, window.innerHeight)
  globeElement.style.width = maxDim / 3 + "px";
  globeElement.style.height = maxDim / 3 + "px";

  initSnowflakes();
}

// Custom images for snowflakes
function getSnowflakeImageFile() {
  const snowflakeImages = {
    "bowl": "bowl.png",
    "flake": "flake.png",
    "globe": "globe.png",
    "iud": "iud.png",
    "nut": "nut.png",
    "pills": "pills.png",
    "wheat": "wheat.png",
  };

  const params = new URLSearchParams(window.location.search);
  const customImageFile = "images/" + snowflakeImages[params.get('img') || 'flake'];
  console.log(`Using custom image: ${customImageFile}`);
  return customImageFile;
}

const customImage = new Image();
customImage.src = getSnowflakeImageFile();

// Main loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawReflection();

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

    this.isCustomImage = Math.random() < 0.1; // 10% chance
    
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

    // Apply gravity
    this.vY += gravity;

    // Apply wind
    this.vX += windForce * (Math.random() - 0.5);

    // Gradually reduce the "shaken" state
    if (this.isShaken && Math.abs(this.vX - this.minVX) < 0.1 && this.vY > this.minVY) {
      this.isShaken = false;
    }

    // Allow natural upward and downward motion
    if (this.vY > this.minVY && !this.isShaken) {
      // Enforce minimum downward velocity once vY > minVY
      this.vY = Math.max(this.vY, this.minVY);
    }

    // Damp velocities
    this.vX *= xdamping;
    this.vY *= ydamping;

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
      if (Math.random() > groundRecycleRate) {
	// Stop the snowflake at the ground
	this.falling = false;
	this.y = canvas.height - groundLevel;
	ground.push(this);
      } else {
//	console.log("update reset: ", this)
	this.reset();
      }
    }
  }

  draw(ctx) {
    if (this.isCustomImage && customImage.complete) {
      // Draw the PNG image
      const size = this.radius * 10; // Scale based on radius
      ctx.globalAlpha = this.opacity; // Adjust transparency
      ctx.drawImage(customImage, this.x - size / 2, this.y - size / 2, size, size);
      ctx.globalAlpha = 1; // Reset transparency
    } else {
      // Draw as a standard snowflake
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.fill();
      ctx.closePath();
    }
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

function mouseVelocity_old(x, y, time) {
  const deltaX = x - lastX;
  const deltaY = y - lastY;
  const deltaTime = time - lastTime || 1;
  
  return {
    velocityX: deltaX / deltaTime,
    velocityY: deltaY / deltaTime
  };
}

let momentumX = 0;
let momentumY = 0;
const momentumDecay = 0.95; // How quickly the momentum fades (0.9 = slow fade)

function mouseVelocityMomentum(x, y, time) {
  const deltaX = x - lastX;
  const deltaY = y - lastY;
  const deltaTime = time - lastTime || 1;

  const velocityX = deltaX / deltaTime;
  const velocityY = deltaY / deltaTime;

  // Attempt at momentum smoothing
  momentumX = momentumDecay * momentumX + (1.1 - momentumDecay) * velocityX;
  momentumY = momentumDecay * momentumY + (1.1 - momentumDecay) * velocityY;

  lastX = x;
  lastY = y;
  lastTime = time;

  return {
    velocityX: momentumX,
    velocityY: momentumY,
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
  // Log the vX properties on a single line
  // const velocities = snowflakes.map(flake => flake.vX.toFixed(2));
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

function getEventCoordinates(event) {
  if (event.touches && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  } else {
    return {
      x: event.clientX,
      y: event.clientY,
    };
  }
}

//
// Dragging
//

function startDrag(event) {
  event.preventDefault();
  const { x, y } = getEventCoordinates(event);

  isDragging = true;
  offsetX = x - globeContainer.offsetLeft;
  offsetY = y - globeContainer.offsetTop;
  lastX = x;
  lastY = y;
  lastTime = performance.now();
}

function drag(event) {
  if (isDragging) {
    // Update globe position
    event.preventDefault();
    const { x, y } = getEventCoordinates(event);
    const left = x - offsetX;
    const top = y - offsetY;
    globeContainer.style.left = `${left}px`;
    globeContainer.style.top = `${top}px`;

    // Calculate velocity
    const time = performance.now();
    const { velocityX, velocityY } = mouseVelocityMomentum(x, y, time);
    vX = velocityX;
    vY = velocityY;

    // console.log('mouse vel=', vX, vY)

    // Update tracking variables
    lastX = x;
    lastY = y;
    lastTime = time;
    shookGlobe();
  }
}

function endDrag(event) {
  event.preventDefault();
  isDragging = false;
  const time = performance.now();
  const { x, y } = getEventCoordinates(event);
  const { velocityX, velocityY } = mouseVelocityMomentum(x, y, time);
  vX = velocityX;
  vY = velocityY;
  console.log("mouseUp vX, vY", vX, vY);
  shookGlobe();
}

let audioContext;
let gainNode;
let windSound;

function initializeAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    windSound = new Audio('wind.m4a'); // Replace with your wind sound file
    windSound.loop = true;

    // Connect the wind sound to the AudioContext
    const audioSource = audioContext.createMediaElementSource(windSound);
    audioSource.connect(gainNode).connect(audioContext.destination);

    // Set initial volume
    gainNode.gain.value = 100;

    console.log('AudioContext initialized');
  }

  // Resume AudioContext if suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('AudioContext resumed');
      windSound.play(); // Start playing the wind sound
    });
  }
}

// Attach a user gesture to initialize audio
document.addEventListener('click', initializeAudio, { once: true });
document.addEventListener('touchstart', initializeAudio, { once: true });

// Function to adjust wind volume based on velocity
function updateWindSound(volume) {
  if (gainNode) {
    gainNode.gain.value = Math.min(volume, 1); // Clamp volume between 0 and 1
  }
}

// Start the simulation
setup()
animate();


