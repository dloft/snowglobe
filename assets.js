// Load the Golden Gate Bridge image
const bridgeImage = new Image();
bridgeImage.src = "golden-gate-bridge.png";

function drawArrow() {
  ctx.strokeStyle = "#d9534f"; // Red color
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(globeCenterX, globeCenterY);
  ctx.lineTo(globeCenterX + deltaX, globeCenterY + deltaY);
  ctx.stroke();
  ctx.closePath();
}

function drawBridge() {
  const bridgeWidth = 300; // Adjust size
  const bridgeHeight = 150; // Adjust size
  const bridgeX = globeCenterX - bridgeWidth / 2;
  const bridgeY = canvas.height - 200; // Position near the bottom

  ctx.drawImage(bridgeImage, bridgeX, bridgeY, bridgeWidth, bridgeHeight);
}

function drawBridge2() {
  const bridgeBaseY = canvas.height - 90;
  const bridgeWidth = 100;
  const bridgeX = globeCenterX - bridgeWidth / 2;

  // Draw bridge pillars
  ctx.strokeStyle = "#d9534f"; // Red color
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(bridgeX + 20, bridgeBaseY);
  ctx.lineTo(bridgeX + 20, bridgeBaseY - 50); // Left pillar
  ctx.moveTo(bridgeX + 80, bridgeBaseY);
  ctx.lineTo(bridgeX + 80, bridgeBaseY - 50); // Right pillar
  ctx.stroke();

  // Draw bridge cables
  //  ctx.strokeStyle = "#ffcc00"; // Yellow color
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(bridgeX + 20, bridgeBaseY - 50);
  ctx.lineTo(bridgeX + 50, bridgeBaseY - 70); // Left cable
  ctx.lineTo(bridgeX + 80, bridgeBaseY - 50); // Right cable
  ctx.stroke();

  // Draw bridge road
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(bridgeX, bridgeBaseY);
  ctx.lineTo(bridgeX + bridgeWidth, bridgeBaseY); // Bridge road
  ctx.stroke();
}

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

function drawDetailedBridge() {
  const bridgeBaseY = canvas.height - 90;
  const bridgeWidth = 180;
  const bridgeX = globeCenterX - bridgeWidth / 2;

  const towerHeight = 60;
  const cableArcHeight = -towerHeight * 1.8;

  // Draw bridge towers
  ctx.strokeStyle = "#d9534f"; // Red for the towers
  ctx.lineWidth = 4;

  ctx.beginPath();
  // Left tower
  ctx.moveTo(bridgeX + 20, bridgeBaseY);
  ctx.lineTo(bridgeX + 20, bridgeBaseY - towerHeight);
  // Right tower
  ctx.moveTo(bridgeX + bridgeWidth, bridgeBaseY);
  ctx.lineTo(bridgeX + bridgeWidth, bridgeBaseY - towerHeight);
  ctx.stroke();

  // Draw cables between the towers (arc shape)
  //  ctx.strokeStyle = "#ffcc00"; // Yellow for the cables
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(bridgeX + 20, bridgeBaseY - towerHeight); // Top of left tower
  ctx.quadraticCurveTo(
    globeCenterX, // Control point at the center of the globe
    bridgeBaseY - towerHeight - cableArcHeight, // Highest point of the arc
    bridgeX + bridgeWidth, // End at the right tower
    bridgeBaseY - towerHeight,
  );
  ctx.stroke();

  // Draw additional cables (symmetrical arcs)
  ctx.beginPath();
  ctx.moveTo(bridgeX + 20, bridgeBaseY - towerHeight); // Left tower top
  ctx.quadraticCurveTo(
    globeCenterX, // Center
    bridgeBaseY - towerHeight - cableArcHeight + 10, // Slightly lower arc
    bridgeX + bridgeWidth, // Right tower
    bridgeBaseY - towerHeight,
  );
  ctx.stroke();

  // Draw bridge road
  //  ctx.strokeStyle = "#000";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(bridgeX, bridgeBaseY);
  ctx.lineTo(bridgeX + bridgeWidth, bridgeBaseY); // Road across the bridge
  ctx.stroke();

  // Add vertical suspension cables
  //  ctx.strokeStyle = "#ffcc00"; // Same color as the main cables
  ctx.lineWidth = 1;

  const cableSpacing = 10; // Spacing between vertical cables
  for (let i = 0; i <= bridgeWidth; i += cableSpacing) {
    const x = bridgeX + i;
    const cableTopY = bridgeBaseY - towerHeight - cableArcHeight + 5; // Approximate height of the arc
    ctx.beginPath();
    ctx.moveTo(x, bridgeBaseY - towerHeight);
    ctx.lineTo(x, bridgeBaseY); // Vertical cable down to the road
    ctx.stroke();
  }
}

function drawReflection() {
  const gradient = ctx.createLinearGradient(
    globeCenterX - globeRadius * 0.4, globeCenterY - globeRadius * 0.4,
    globeCenterX + globeRadius * 0.4, globeCenterY + globeRadius * 0.4
  );
  
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)'); // Fully transparent at start
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)'); // Bright white in middle
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Fully transparent at end

  // Apply the gradient as a stroke style
  ctx.strokeStyle = gradient;
  ctx.lineWidth = globeRadius * 0.05; // Middle thickness
  ctx.beginPath();
  ctx.arc(
    globeCenterX,
    globeCenterY,
    globeRadius * 0.9,
    Math.PI * 1.5,   // Start angle
    Math.PI * 0,     // End angle
  );
  ctx.stroke();
}

