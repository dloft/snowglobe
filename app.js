const canvas = document.getElementById("snowCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 300;
canvas.height = 300;

const globeCenterX = canvas.width / 2;
const globeCenterY = canvas.height / 2;
const globeRadius = canvas.width / 2;
let numSnowflakes = 300;

// We randomly shake left or right
let initialVelocityX = Math.random() > 0.5 ? 3 : -3;

// Snowflake class
class Snowflake {
  constructor(x, y, radius, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
    this.velocityX = initialVelocityX; // Horizontal velocity for swirling effect
    this.velocityY = speed; // Vertical velocity
    this.opacity = Math.random() * 0.8 + 0.2;
    this.falling = true;
  }

  update_new(shakeOffsetX, isShaking) {
    if (!this.falling) {
      return;
    }
    if (isShaking) {
      // Adjust shake offset based on distance to edge
      const distanceToCenter = Math.hypot(
        this.x - globeCenterX,
        this.y - globeCenterY,
      );
      const edgeFactor = 1 - Math.min(distanceToCenter / globeRadius, 1); // Closer to edge -> smaller effect
      this.x += shakeOffsetX * edgeFactor; // Apply reduced shake offset
    } else {
      // Reset to normal falling behavior
      this.velocityX *= 0.99; // Gradually slow down horizontal motion
      this.velocityY = Math.max(0.3, this.velocityY * 0.99); // this.speed;
    }

    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Gradually slow down as the snowflake approaches the ground but never stop completely
    this.speed = Math.max(0.25, this.speed - 0.004);

    // Reset position if snowflake reaches ground or goes out of bounds
    if (this.y + this.radius >= canvas.height - groundHeight(this.x)) {
      // Snowflake has reached the "ground"
      ground.push({
        x: this.x,
        y: canvas.height - groundHeight(this.x),
        radius: this.radius,
      });
      //      console.log("groundHeight", canvas.height - groundHeight(this.x));
      resetSnowflake(this);
      // Randomly reset snowflake to the top of the screen
      if (Math.random() > 0.5) {
        this.falling = false;
      }
    }

    // If snowflake is out of bounds, relocate it to the other side of the globe
    if (this.x < -this.radius) {
      this.x = canvas.width + this.radius - 10;
    } else if (this.x > canvas.width + this.radius) {
      this.x = -this.radius + 10;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.fill();
    ctx.closePath();
  }
}

// Reset snowflake position
function resetSnowflake(flake) {
  flake.x = Math.random() * canvas.width;
  flake.y = -flake.radius;
  flake.speed = Math.random() * 2 + 0.5;
  flake.velocityX = initialVelocityX;
  flake.velocityY = flake.speed;
}

// Parallax effect -- at 1.0, snowflakes will accumulate across the entire globe
// floor. Lower values will cause snowflakes to disappear towards the edges of the
// globe.
let parallax = 0.95;

// Ground accumulation
const ground = [];

function groundHeight(x) {
  const distanceFromCenter = Math.abs(x - globeCenterX);

  if (distanceFromCenter > globeRadius) {
    return 0; // Outside the globe's horizontal boundary
  }

  // Calculate the curved bottom boundary of the globe
  const curveHeight = Math.sqrt(
    globeRadius ** 2 - (distanceFromCenter * parallax) ** 2,
  );
  const baseHeight = globeCenterY + curveHeight;

  return ground.reduce((height, snow) => {
    const distanceToSnow = Math.abs(snow.x - x);
    if (distanceToSnow < snow.radius * 2) {
      return height + snow.radius * 0.5;
    }
    return height;
  }, canvas.height - baseHeight);
}

// Initialize snowflakes
const snowflakes = [];
for (let i = 0; i < numSnowflakes; i++) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const radius = Math.random() * 2 + 1;
  const speed = Math.random() * 1 + 0.5;
  snowflakes.push(new Snowflake(x, y, radius, speed));
}

// Shake effect
let shakeTimer = 100;
let isShaking = true;
let shakeAngle = 0;
let shakeMaxX = 50;

document.getElementById("shakeButton").addEventListener("click", () => {
  shakeTimer = 60; // Shake duration in frames
  isShaking = true;
  // randomize initial velocity
  initialVelocityX = Math.random() > 0.5 ? 3 : -3;
  ground.length = 0; // Clear the accumulated snow
  snowflakes.forEach((flake) => {
    flake.falling = true;
  });
});

function drawTree(offsetX = 0, offsetY = 0) {
  ctx.fillStyle = "#2e8b57"; // Green color for the tree
  ctx.beginPath();
  const x = globeCenterX + offsetX;
  const y = canvas.height - 50 + offsetY;
  ctx.moveTo(x - 10, y); // Base of the tree
  ctx.lineTo(x + 10, y); // Bottom right of the tree
  ctx.lineTo(x, y - 40); // Peak of the tree
  ctx.closePath();
  ctx.fill();
}

const forest = [
  { x: 0, y: 0 },
  { x: 10, y: -30 },
  { x: 20, y: 20 },
  { x: -20, y: 20 },
  { x: -40, y: 25 },
  { x: -60, y: 10 },
  { x: 40, y: 2 },
  { x: 60, y: 20 },
];

function animate_new() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  forest.forEach((tree) => {
    drawTree(tree.x, tree.y);
  });

  let shakeOffsetX = 0;
  initialVelocityX *= 0.99; // Gradually reduce the swirling effect

  // Apply shaking effect using a sine wave
  if (shakeTimer > 0) {
    shakeAngle += 0.3; // Increase the angle for the sine wave
    shakeOffsetX = Math.sin(shakeAngle) * shakeMaxX; // Generate smooth horizontal motion
    shakeMaxX *= 0.95; // Gradually reduce the shake intensity
    shakeTimer--;
  } else {
    isShaking = false;
    shakeAngle = 0; // Reset angle
    shakeMaxX = 50; // Reset shake intensity
  }

  // Update and draw snowflakes
  snowflakes.forEach((flake) => {
    flake.update_new(shakeOffsetX, isShaking);
    flake.draw();
  });

  // Draw ground
  ground.forEach((snow) => {
    ctx.beginPath();
    ctx.arc(snow.x, snow.y, snow.radius, 0, Math.PI * 2);
    //    console.log("snow.y", snow.y);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
  });

  // Smooth shake effect for the canvas itself
  canvas.style.transform = isShaking
    ? `translate(${shakeOffsetX * 0.5}px, 0)`
    : "translate(0, 0)";

  requestAnimationFrame(animate_new);
}

animate_new();
