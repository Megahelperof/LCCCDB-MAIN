const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const resultDiv = document.getElementById('result');
const errorMsgDiv = document.getElementById('errorMsg');
const studentInfoDiv = document.getElementById('studentInfo');
const canvasContext = canvas.getContext('2d');
const searchButton = document.getElementById('searchButton');
const studentNumberInput = document.getElementById('studentNumber');
const optionsModal = document.getElementById('optionsModal');
const dropdownButton = document.querySelector('.dropdown-button');
const dropdown = document.querySelector('.dropdown');
const settingsButton = document.querySelector('.settings-button');
const settingsPopup = document.querySelector('.settings-popup');
const settingsPopupClose = document.querySelector('.settings-popup-close');



    
let mainScannerActive = false;
    // Start the main scanner when the page loads

    const violationTypes = [
"Late Arrival",
"Dress Code Violation",
"Disruptive Behavior",
"Unauthorized Device Usage",
"Skipping Class"
];

let selectedViolations = [];      
let scanningEnabled = true; // Flag to control scanning
let lastScannedValue = null; // Store the last scanned barcode value
let lastScanTime = 0; // Store the timestamp of the last scan
let usbScannerActive = true;
let barcodeBuffer = '';
let cameraStream = null;
  

// Add this to your JavaScript file

// Wave generator
// Improved Wave Generator with smooth transitions

class WaveGenerator {
constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.lastTime = 0;
    this.loadingStartTime = Date.now();
    
    // Current and target wave parameters (for smooth transitions)
    this.waveParams = {
        layers: 3,
        colors: [
            'rgba(0, 0, 255, 0.5)',
            'rgba(0, 0, 255, 0.3)',
            'rgba(0, 0, 255, 0.2)'
        ],
        amplitudes: [30, 20, 15],
        frequencies: [0.02, 0.03, 0.015],
        speeds: [0.5, 0.3, 0.2],
        phases: [0, Math.PI/2, Math.PI],
    };
    
    // Target parameters (we'll interpolate toward these)
    this.targetParams = JSON.parse(JSON.stringify(this.waveParams));
    
    // Maximum allowed amplitude to prevent overflow
    this.maxAmplitude = this.height * 0.4; // 40% of container height
    
    // Transition settings
    this.transitionSpeed = 0.05; // How fast we move toward target values (0-1)
    this.lastParamChangeTime = 0;
    this.paramChangeInterval = 3000; // ms between parameter changes
    
    // Resize canvas to match container
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Start animation
    this.animate(0);
}

resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.offsetWidth;
    this.canvas.height = container.offsetHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    // Update maximum amplitude based on new height
    this.maxAmplitude = this.height * 0.4;
    
    // Cap current amplitudes to avoid overflow after resize
    for (let i = 0; i < this.waveParams.amplitudes.length; i++) {
        if (this.waveParams.amplitudes[i] > this.maxAmplitude) {
            this.waveParams.amplitudes[i] = this.maxAmplitude;
        }
        if (this.targetParams.amplitudes[i] > this.maxAmplitude) {
            this.targetParams.amplitudes[i] = this.maxAmplitude;
        }
    }
}

// Smoothly interpolate between current and target values
lerp(current, target, speed) {
    return current + (target - current) * speed;
}

// Smoothly interpolate color values
lerpColor(currentColor, targetColor, speed) {
    // Parse rgba values
    const currentMatch = currentColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    const targetMatch = targetColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    
    if (!currentMatch || !targetMatch) return currentColor;
    
    const currentR = parseInt(currentMatch[1]);
    const currentG = parseInt(currentMatch[2]);
    const currentB = parseInt(currentMatch[3]);
    const currentA = parseFloat(currentMatch[4]);
    
    const targetR = parseInt(targetMatch[1]);
    const targetG = parseInt(targetMatch[2]);
    const targetB = parseInt(targetMatch[3]);
    const targetA = parseFloat(targetMatch[4]);
    
    const r = Math.round(this.lerp(currentR, targetR, speed));
    const g = Math.round(this.lerp(currentG, targetG, speed));
    const b = Math.round(this.lerp(currentB, targetB, speed));
    const a = this.lerp(currentA, targetA, speed);
    
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

// Set new target parameters that we'll smoothly transition toward
updateTargetParameters() {
    const now = Date.now();
    const elapsedTime = (now - this.loadingStartTime) / 1000;
    
    // Only update targets at specific intervals to avoid constant changes
    if (now - this.lastParamChangeTime < this.paramChangeInterval) {
        return;
    }
    
    this.lastParamChangeTime = now;
    
    // Create new target variations
    for (let i = 0; i < this.targetParams.layers; i++) {
        // Calculate progress-based amplitude (waves get larger as loading progresses)
        // But never exceed the maximum amplitude
        const progressFactor = Math.min(elapsedTime / 30, 1); // Normalize to 0-1 over 30 seconds
        const baseAmplitude = 10 + progressFactor * 30;
        const variationAmplitude = Math.sin(elapsedTime * 0.1) * 10 + Math.random() * 10;
        
        // Set new target amplitude, but cap it at the maximum
        this.targetParams.amplitudes[i] = Math.min(
            baseAmplitude + variationAmplitude,
            this.maxAmplitude
        );
        
        // Target frequency (lower means wider waves)
        this.targetParams.frequencies[i] = 0.01 + Math.sin(elapsedTime * 0.05) * 0.01 + Math.random() * 0.01;
        
        // Target speed
        this.targetParams.speeds[i] = 0.1 + Math.sin(elapsedTime * 0.02) * 0.2 + Math.random() * 0.2;
        
        // Target color - smoother transitions in blue intensity and opacity
        const blueIntensity = Math.floor(150 + Math.sin(elapsedTime * 0.1) * 50);
        const opacity = 0.2 + Math.sin(elapsedTime * 0.08) * 0.2;
        this.targetParams.colors[i] = `rgba(0, 0, ${blueIntensity}, ${opacity.toFixed(2)})`;
    }
    
    // After 30 seconds, gradually add more layers (but smoothly)
    if (elapsedTime > 30 && this.targetParams.layers < 5 && Math.random() > 0.8) {
        // Add a new layer
        this.targetParams.layers++;
        
        // Initialize the new layer with values similar to existing ones
        // but push it to both current and target parameters
        const lastIdx = this.targetParams.layers - 2;
        const newAmplitude = Math.min(this.targetParams.amplitudes[lastIdx] * 0.8, this.maxAmplitude);
        const newFrequency = this.targetParams.frequencies[lastIdx] * 1.2;
        const newSpeed = this.targetParams.speeds[lastIdx] * 0.9;
        const newPhase = Math.random() * Math.PI * 2;
        const newColor = `rgba(0, 0, 255, 0.2)`;
        
        // Add to target
        this.targetParams.amplitudes.push(newAmplitude);
        this.targetParams.frequencies.push(newFrequency);
        this.targetParams.speeds.push(newSpeed);
        this.targetParams.phases.push(newPhase);
        this.targetParams.colors.push(newColor);
        
        // Add to current (same values so no jarring transition)
        this.waveParams.amplitudes.push(newAmplitude);
        this.waveParams.frequencies.push(newFrequency);
        this.waveParams.speeds.push(newSpeed);
        this.waveParams.phases.push(newPhase);
        this.waveParams.colors.push(newColor);
    }
}

// Update current parameters by interpolating toward target parameters
updateCurrentParameters() {
    // Update phases continuously (no interpolation needed for smooth motion)
    for (let i = 0; i < this.waveParams.layers; i++) {
        this.waveParams.phases[i] += this.waveParams.speeds[i] * 0.02;
    }
    
    // Handle case where layer counts don't match
    if (this.waveParams.layers !== this.targetParams.layers) {
        this.waveParams.layers = this.targetParams.layers;
    }
    
    // Smoothly interpolate toward target parameters
    for (let i = 0; i < this.waveParams.layers; i++) {
        if (i < this.waveParams.amplitudes.length) {
            this.waveParams.amplitudes[i] = this.lerp(
                this.waveParams.amplitudes[i],
                this.targetParams.amplitudes[i],
                this.transitionSpeed
            );
            
            this.waveParams.frequencies[i] = this.lerp(
                this.waveParams.frequencies[i],
                this.targetParams.frequencies[i],
                this.transitionSpeed
            );
            
            this.waveParams.speeds[i] = this.lerp(
                this.waveParams.speeds[i],
                this.targetParams.speeds[i],
                this.transitionSpeed
            );
            
            this.waveParams.colors[i] = this.lerpColor(
                this.waveParams.colors[i],
                this.targetParams.colors[i],
                this.transitionSpeed
            );
        }
    }
}

drawWave(amplitude, frequency, phase, color) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height);
    
    // Use more points for smoother curves
    const step = 5; // Smaller step = smoother curve
    
    for (let x = 0; x <= this.width; x += step) {
        // Create complex wave by combining multiple sine waves with different frequencies
        const y = this.height - (
            amplitude * Math.sin(x * frequency + phase) + 
            amplitude/2 * Math.sin(x * frequency * 1.5 + phase * 1.2)
        );
        
        this.ctx.lineTo(x, y);
    }
    
    // Complete the wave by drawing to the bottom corners
    this.ctx.lineTo(this.width, this.height);
    this.ctx.lineTo(0, this.height);
    this.ctx.closePath();
    
    this.ctx.fillStyle = color;
    this.ctx.fill();
}

animate(timestamp) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Update target parameters (occasionally)
    this.updateTargetParameters();
    
    // Smoothly update current parameters toward targets
    this.updateCurrentParameters();
    
    // Draw waves from back to front
    for (let i = 0; i < this.waveParams.layers; i++) {
        this.drawWave(
            this.waveParams.amplitudes[i],
            this.waveParams.frequencies[i],
            this.waveParams.phases[i],
            this.waveParams.colors[i]
        );
    }
    
    // Continue animation
    requestAnimationFrame((timestamp) => this.animate(timestamp));
}
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
// Create canvas element
const waveContainer = document.querySelector('.wave-container');
if (!waveContainer) return;

// Remove any existing waves
waveContainer.innerHTML = '';

// Create canvas
const canvas = document.createElement('canvas');
canvas.id = 'waveCanvas';
waveContainer.appendChild(canvas);

// Initialize wave generator
const waveGen = new WaveGenerator(canvas);

// Track loading progress
window.trackLoadingProgress = function(progress) {
    // progress is 0-100
    if (waveGen && progress < 100) {
        // Make waves more intense when loading is slow, but still smooth
        const targetFactor = 1 + (100 - progress) / 200; // Less extreme factor for smoother transitions
        
        for (let i = 0; i < waveGen.targetParams.layers; i++) {
            // Adjust target amplitudes based on progress, but respect max amplitude
            waveGen.targetParams.amplitudes[i] = Math.min(
                waveGen.targetParams.amplitudes[i] * targetFactor,
                waveGen.maxAmplitude
            );
        }
    }
};
});

document.getElementById('cameraToggle').addEventListener('click', function() {
    const videoSection = document.querySelector('.video-section');
    if (videoSection.style.display === 'none') {
      videoSection.style.display = 'block';
      this.textContent = 'Hide Camera';
      startMainScanner();
      usbScannerActive = false;
    } else {
      videoSection.style.display = 'none';
      this.textContent = 'Show Camera';
      stopMainScanner();
      usbScannerActive = true;
    }
  });

// Example loading function - modify to match your actual loading process
function loadResources() {
let progress = 0;
const totalResources = 10; // Example

function updateProgress() {
    progress += 1;
    if (window.trackLoadingProgress) {
        window.trackLoadingProgress(progress / totalResources * 100);
    }
    
    if (progress < totalResources) {
        // Simulate slow loading
        setTimeout(updateProgress, 500 + Math.random() * 1000);
    } else {
        // Loading complete
        hideLoadingScreen();
    }
}

// Start loading simulation
updateProgress();
}

function hideLoadingScreen() {
const loadingOverlay = document.querySelector('.loading-overlay');
if (loadingOverlay) {
    // Smoothly animate height to zero
    loadingOverlay.style.height = '0';
    
    // Also animate the wave container for a smooth exit
    const waveContainer = document.querySelector('.wave-container');
    if (waveContainer) {
        waveContainer.style.height = '0';
    }
    
    setTimeout(() => {
        loadingOverlay.style.display = 'none';
        if (waveContainer) waveContainer.style.display = 'none';
    }, 2000); // Match transition duration in CSS
}
}

// Start loading when page loads
window.addEventListener('load', loadResources);

function displayStudentInfo(data) {
    const container = document.querySelector('.student-info-container');
    const studentImage = document.getElementById('studentImage');
    
    // Set student image
// Modify the image HTML output
studentImage.innerHTML = data.imageUrl ? 
    `<img src="${data.imageUrl}" 
          alt="Student Image" 
          onerror="this.onerror=null;this.src='fallback.png'">` :
    '<div class="placeholder">No Image</div>';

    const studentDetails = document.getElementById('studentDetails');
    studentDetails.innerHTML = `
        <p><strong>Student Number:</strong> ${data.studentNumber}</p>
        <p><strong>Full Name:</strong> ${data.fullName}</p>
        <p><strong>Grade:</strong> ${data.grade || 'N/A'}</p>
        <p><strong>Section:</strong> ${data.section || 'N/A'}</p>
        <p><strong>Last Violations:</strong> ${data.lastViolations || 'None'}</p>
        <p><strong>Details:</strong> ${data.details || 'No additional details'}</p>
        <button class="btn" onclick="logEntrance('${data.studentNumber}')">Confirm and Log Entrance</button>
    `;

    container.style.display = 'block';
}

document.addEventListener('keypress', (e) => {
    if (!usbScannerActive) return;
    
    if (e.key === 'Enter') {
      if (barcodeBuffer.length > 0) {
        handleScannedValue(barcodeBuffer);
        barcodeBuffer = '';
      }
    } else {
      barcodeBuffer += e.key;
    }
  });
// Example usage

// Example posting data to your server
fetch('https://lcserver.onrender.com/api/data', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Ngrok-Skip-Browser-Warning': 'true',
'Content-Type': 'application/json'
},
body: JSON.stringify({ key: 'value', example: 'data' })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));

function applySharpenFilter(imageData) {
const width = imageData.width;
const height = imageData.height;
const output = canvasContext.createImageData(width, height);

// Simple sharpening kernel
const kernel = [
0, -1, 0,
-1, 5, -1,
0, -1, 0
];

const pixels = imageData.data;
const outputData = output.data;

for (let y = 1; y < height - 1; y++) {
for (let x = 1; x < width - 1; x++) {
  let r = 0, g = 0, b = 0;
  for (let ky = -1; ky <= 1; ky++) {
    for (let kx = -1; kx <= 1; kx++) {
      const pos = ((y + ky) * width + (x + kx)) * 4;
      const factor = kernel[(ky + 1) * 3 + (kx + 1)];
      r += pixels[pos] * factor;
      g += pixels[pos + 1] * factor;
      b += pixels[pos + 2] * factor;
    }
  }
  const newPos = (y * width + x) * 4;
  outputData[newPos] = Math.min(Math.max(r, 0), 255);
  outputData[newPos + 1] = Math.min(Math.max(g, 0), 255);
  outputData[newPos + 2] = Math.min(Math.max(b, 0), 255);
  outputData[newPos + 3] = pixels[newPos + 3]; // Preserve alpha
}
}

return output;
}



function scanBarcode() {
if (mainScannerActive && video.readyState === video.HAVE_ENOUGH_DATA && scanningEnabled) {
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);

const redRegion = detectRedLight(imageData);
if (redRegion) {
  const { x, y, width, height } = redRegion;
  let redImageData = canvasContext.getImageData(x, y, width, height);
  redImageData = applySharpenFilter(redImageData);

  const qrCode = jsQR(redImageData.data, redImageData.width, redImageData.height);
  if (qrCode) {
    handleScannedValue(qrCode.data);
  } else {
    Quagga.decodeSingle({
      src: canvas.toDataURL(),
      numOfWorkers: 0,
      inputStream: {
        size: 800
      },
      decoder: {
        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "codabar_reader", "code_39_reader", "i2of5_reader"]
      },
      locate: true,
    }, function(result) {
      if (result && result.codeResult) {
        handleScannedValue(result.codeResult.code);
      }
    });
  }
}
}
requestAnimationFrame(scanBarcode);
}

// Function to handle the scanned value
function handleScannedValue(scannedValue) {
    const currentTime = Date.now();
    if (scannedValue === lastScannedValue && (currentTime - lastScanTime) < 2000) {
      console.log("Scan cooldown");
      return;
    }
  
    console.log("Scanned Value:", scannedValue);
    handleBarcode(scannedValue);
    lastScannedValue = scannedValue;
    lastScanTime = currentTime;
    
    if (!usbScannerActive) {
      startScanCooldown();
    }
  }

// Function to start the cooldown period
function startScanCooldown() {
scanningEnabled = false; // Disable scanning
hideCameraForAWhile(); // Hide the camera for a moment
setTimeout(() => {
scanningEnabled = true; // Re-enable scanning after 2 seconds
}, 2000);
}

// Function to hide the camera for 1 second
function hideCameraForAWhile() {
const videoDiv = document.getElementById('video'); // Replace with your video div ID
videoDiv.style.display = 'none'; // Hide the camera
setTimeout(() => {
videoDiv.style.display = 'block'; // Show the camera again after 1 second
}, 1000);
}


// Function to detect red light in the video stream
function detectRedLight(imageData) {
const pixels = imageData.data;
const width = imageData.width;
const height = imageData.height;

// Define thresholds for red color detection
const redThreshold = 150;
let detectedRedArea = null;

// Loop through pixels to find areas with strong red color
for (let i = 0; i < pixels.length; i += 4) {
const r = pixels[i];
const g = pixels[i + 1];
const b = pixels[i + 2];
if (r > redThreshold && g < redThreshold / 2 && b < redThreshold / 2) {
  // If a red pixel is found, define the Region of Interest (ROI) around it
  const pixelIndex = i / 4;
  const x = pixelIndex % width;
  const y = Math.floor(pixelIndex / width);
  const roiWidth = 200; // Define a reasonable size for ROI
  const roiHeight = 100;
  
  detectedRedArea = {
    x: Math.max(0, x - roiWidth / 2),
    y: Math.max(0, y - roiHeight / 2),
    width: roiWidth,
    height: roiHeight
  };
  break; // Exit the loop once a red area is found
}
}
return detectedRedArea;
}

function showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = type;
        notification.style.display = 'block';
        
        // Force reflow
        notification.offsetHeight;
        
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }

// Your actual token validation logic goes in the main process
async function validateToken(token) {
try {
const response = await fetch('https://lcserver.onrender.com/api/123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
});
return await response.json();
} catch (error) {
console.error('Token validation error:', error);
return { valid: false, error: error.message };
}
}

// renderer.js (your frontend code)
// Replace both validateToken functions with this single one
async function validateToken(token) {
try {
    console.log("Validating token:", token);
    
    const response = await fetch('https://lcserver.onrender.com/api/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });

    const data = await response.json();
    console.log("Server response:", data);

    if (data.valid) {
        console.log("✅ Token is valid. Hiding modal and refreshing...");
        document.getElementById('tokenModal').style.display = 'none';
        showNotification('Token is valid', 'success');
        startMainScanner();

        // Prevent multiple reloads
        if (!sessionStorage.getItem('validated')) {
            sessionStorage.setItem('validated', 'true');
            window.location.reload();
        }
    } else {
        console.log("❌ Token is invalid. Refreshing...");
        document.getElementById('errorMessage').innerText = 'Invalid token, please try again.';
        showNotification('Token is invalid', 'error');
        stopMainScanner();
        window.location.reload(); // Refresh on invalid token
    }
} catch (error) {
    console.error('🚨 Error validating token:', error);
    showNotification('Error validating token', 'error');
    document.getElementById('errorMessage').innerText = 'Error validating token. Please try again.';
}
}

// Modified stopMainScanner
function stopMainScanner() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    mainScannerActive = false;
  }

function startMainScanner() {
console.log("Main scanner started.");
}

// Use window.addEventListener instead of window.onload for better compatibility
window.addEventListener('load', () => {
const tokenModal = document.getElementById('tokenModal');
// Use localStorage instead of electron store
const storedToken = localStorage.getItem('token');

if (!storedToken) {
tokenModal.style.display = 'block';
} else {
validateToken(storedToken);
}

document.getElementById('submitToken').addEventListener('click', () => {
const token = document.getElementById('tokenInput').value;
if (token.length === 4) {
  localStorage.setItem('token', token); // Store token in localStorage
  validateToken(token);
} else {
  document.getElementById('errorMessage').innerText = 'Please enter a valid 4-digit token.';
  showNotification('Please enter a valid 4-digit token', 'error');
}
});
});


function startMainScanner() {
    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: 'environment', // Use rear camera
            width: { ideal: 1920 },    // Properly formatted constraints
            height: { ideal: 1080 }
        }
    })
    .then(stream => {
        cameraStream = stream; // Store stream reference for cleanup
        video.srcObject = stream;
        video.setAttribute('playsinline', true); // iOS fix
        video.style.display = 'block'; // Ensure visibility
        
        // Use metadata-loaded promise for better reliability
        video.play().then(() => {
            mainScannerActive = true;
            requestAnimationFrame(scanBarcode);
        }).catch(handleCameraError);
    })
    .catch(err => {
        handleCameraError(err);
        // Automatically fall back to USB scanner
        usbScannerActive = true;
        document.getElementById('cameraToggle').textContent = 'Show Camera';
        document.querySelector('.video-section').style.display = 'none';
    });
}

// Add this error handler function
function handleCameraError(err) {
    console.error("Camera Error:", err);
    resultDiv.textContent = "Camera access denied or unavailable";
    resultDiv.style.backgroundColor = '#f8d7da';
    
    // Clean up any existing stream
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    mainScannerActive = false;
}

function handleBarcode(studentNumber) {
console.log("Main Barcode:", studentNumber); // Debugging
lastScannedValue = studentNumber; // Update lastScannedValue

fetch('https://lcserver.onrender.com/api/validateMainBarcode', {
method: 'POST',
headers: {
  'Content-Type': 'application/json'
},
body: JSON.stringify({ studentNumber })
})
.then(response => response.json())
.then(data => {
if (data.success) {
  console.log(`Student Id accepted: ${studentNumber}`);
  resultDiv.textContent = `Student Id accepted: ${studentNumber}`;
  resultDiv.style.backgroundColor = '#d4edda';

  // Trigger logEntrance
  return fetch('https://lcserver.onrender.com/api/logEntrance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ studentNumber: studentNumber })
  });
} else {
  throw new Error('Main barcode not found');
}
})
.then(response => response.json())
.then(data => {
if (data.success) {
  console.log('Entrance logged successfully.');
  updateSelectedViolationsDisplay(); // Update the violations display
  promptForViolations(studentNumber);
  searchStudent(studentNumber); // Fetch and display student info // New function to prompt for violations
} else {
  console.error('Failed to log entrance:', data.message);
}
})
.catch(error => {
console.error('Error:', error.message);
resultDiv.textContent = error.message === 'Main barcode not found' 
  ? `Main barcode not found: ${studentNumber}`
  : "Error processing barcode.";
resultDiv.style.backgroundColor = '#f8d7da';
});
}

function promptForViolations(studentNumber) {
// Clear any previously selected violations
selectedViolations = [];
updateSelectedViolationsDisplay();

// Highlight the violation buttons or container to draw attention
const violationContainer = document.getElementById('violationContainer');
violationContainer.style.border = '2px solid red';
violationContainer.style.padding = '10px';

// Display a message prompting to select violations
const promptMessage = document.createElement('div');
promptMessage.textContent = `Select violations for student ${studentNumber} (if any) and click 'Log Violations'`;
promptMessage.style.color = 'red';
promptMessage.style.marginBottom = '10px';
violationContainer.insertBefore(promptMessage, violationContainer.firstChild);

// Automatically remove the highlight and prompt after a set time (e.g., 10 seconds)
setTimeout(() => {
violationContainer.style.border = '';
violationContainer.style.padding = '';
if (promptMessage.parentNode === violationContainer) {
  violationContainer.removeChild(promptMessage);
}
}, 10000);
}



function resetViolationButtons() {
const buttons = document.querySelectorAll('#violationContainer button');
buttons.forEach(button => {
button.style.backgroundColor = ''; // Reset to default color
});
}

function toggleViolation(index) {
const button = document.querySelector(`#violationContainer button:nth-child(${index + 1})`);
if (selectedViolations.includes(index)) {
    selectedViolations = selectedViolations.filter(i => i !== index);
    button.style.backgroundColor = '';
    button.style.border = '';
} else {
    selectedViolations.push(index);
    button.style.backgroundColor = '#e0f0ff';
    button.style.border = '2px solid #2196F3';
}
updateSelectedViolationsDisplay();
}


// Function to create violation buttons
function createViolationButtons() {
const violationContainer = document.getElementById('violationContainer');
violationContainer.innerHTML = '';

violationTypes.forEach((violation, index) => {
    const button = document.createElement('button');
    button.textContent = violation;
    button.classList.add('btn');
    button.onclick = () => toggleViolation(index);

    if (index < 4) {
        // First row: 4 buttons in 4 columns
        button.style.gridColumn = index + 1;
        button.style.gridRow = "1";
    } else {
        // Fifth violation: centered in second row
        button.style.gridColumn = "2 / span 2";
        button.style.gridRow = "2";
    }
    
    violationContainer.appendChild(button);
});

// Log button in third row
const logButton = document.createElement('button');
logButton.textContent = 'Log Violations';
logButton.classList.add('btn');
logButton.onclick = logViolations;
logButton.style.gridColumn = "2 / span 2";
logButton.style.gridRow = "3";
logButton.style.justifySelf = "center";
violationContainer.appendChild(logButton);
}



// Function to update the display of selected violations
function updateSelectedViolationsDisplay() {
const selected = selectedViolations.map(idx => violationTypes[idx]);
const resultDiv = document.getElementById('result');
resultDiv.innerHTML = selected.length > 0 
    ? `Selected: ${selected.join(', ')}`
    : 'No violations selected';
}

// Update the logViolations function to reset the UI after logging
function logViolations() {
    if (selectedViolations.length === 0 && !confirm('No violations selected. Do you want to proceed without logging any violations?')) {
        return;
    }

    if (!lastScannedValue) {
        alert('No student scanned. Please scan a student barcode or enter a student number first.');
        return;
    }

    const violationsToLog = selectedViolations.map(index => violationTypes[index]);
    if (violationsToLog.length === 0) {
        violationsToLog.push("No specific violation");
    }

    fetch('https://lcserver.onrender.com/api/logViolation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            studentNumber: lastScannedValue,
            violations: violationsToLog,
            date: new Date().toISOString(),
            manualEntry: lastScannedValue === studentNumberInput.value.trim()
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Violations logged successfully.');
            selectedViolations = [];
            updateSelectedViolationsDisplay();
            resetViolationButtons();
        } else {
            alert('Failed to log violations: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error logging violations:', error);
        alert('Error logging violations. Please try again.');
    });
}

const rainBackground = document.querySelector('.rain-background');

function createShape() {
const shape = document.createElement('div');
shape.classList.add('shape');

// Random size between 10px and 50px
const size = Math.random() * 40 + 10;
shape.style.width = `${size}px`;
shape.style.height = `${size}px`;

// Random starting position from left (within the viewport)
shape.style.left = `${Math.random() * 100}%`;

// Random duration for falling animation
shape.style.animationDuration = `${Math.random() * 3 + 2}s`;

rainBackground.appendChild(shape);

// Remove shape after animation is done
setTimeout(() => {
    shape.remove();
}, 5000); // Adjust to match the longest animation duration
}

// Create new shapes at intervals
setInterval(createShape, 200);

  function displayStudentInfoPopup(studentInfo, studentNumber) {
const popup = document.createElement('div');
popup.id = 'studentInfoPopup';
popup.style.position = 'fixed';
popup.style.left = '50%';
popup.style.top = '50%';
popup.style.transform = 'translate(-50%, -50%)';
popup.style.backgroundColor = '#f0f0f0';
popup.style.padding = '20px';
popup.style.borderRadius = '10px';
popup.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
popup.style.zIndex = '1000';

popup.innerHTML = `
    <h3>Student Information</h3>
    <p><strong>Student Number:</strong> ${studentInfo.studentNumber}</p>
    <p><strong>Full Name:</strong> ${studentInfo.fullName}</p>
    <p><strong>Last Written Violations:</strong> ${studentInfo.lastViolations || 'None'}</p>
    <p><strong>Details:</strong> ${studentInfo.details || 'No additional details'}</p>
    <button id="confirmLog">Confirm and Log Entrance</button>
    <button id="cancelLog">Cancel</button>
`;

document.body.appendChild(popup);

// Use event delegation for button clicks
popup.addEventListener('click', function(event) {
    if (event.target.id === 'confirmLog') {
        logEntrance(studentNumber);
        document.body.removeChild(popup);
    } else if (event.target.id === 'cancelLog') {
        document.body.removeChild(popup);
    }
});
  }


  function searchStudent(input) {
    const container = document.querySelector('.student-info-container');
    fetch(`https://lcserver.onrender.com/api/getStudentInfo`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: input })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayStudentInfo(data.studentInfo);
        } else {
            container.style.display = 'none';
            alert(`No information found for: ${input}`);
        }
    })
    .catch(error => {
        console.error('Error fetching student data:', error);
        container.style.display = 'none';
        alert("Error fetching student data.");
    });
}
    // Function to check if the password exists in localStorage
            function isPopupOpen() {
return document.getElementById('studentInfoPopup') !== null;
            }

function logEntrance(studentNumber) {
fetch('https://lcserver.onrender.com/api/logEntrance', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ studentNumber: studentNumber })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        console.log('Entrance logged successfully.');
        alert('Entrance logged successfully.');
        lastScannedValue = studentNumber;
        promptForViolations(studentNumber);
    } else {
        console.error('Failed to log entrance:', data.message);
        alert('Failed to log entrance: ' + data.message);
    }
})
.catch(error => {
    console.error('Error logging entrance:', error);
    alert('Error logging entrance. Please try again.');
});
}


    window.addEventListener('load', function() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        const loadingText = document.querySelector('.loading-text');
        const smallText = document.querySelector('.small-text');
        const header = document.querySelector('.header');
        const headerLogo = header.querySelector('.logo');
        const waveContainer = document.querySelector('.wave-container');
        const dropdownButton = document.querySelector('.dropdown-button');
        const dropdown = document.querySelector('.dropdown');

        // Check if this is the first visit
        const isFirstVisit = !localStorage.getItem('visited');

        // Function to handle the loading animation
        function handleLoading() {
            setTimeout(function() {
                smallText.style.opacity = '0';
            }, 100);

            setTimeout(function() {
                // Move the text to the header position
                const headerRect = headerLogo.getBoundingClientRect();
                loadingText.style.fontSize = getComputedStyle(headerLogo).fontSize;
                loadingText.style.fontWeight = getComputedStyle(headerLogo).fontWeight;
                loadingText.style.top = headerRect.top + 'px';
                loadingText.style.left = headerRect.left + 'px';
                loadingText.style.transform = 'none';
                
                // Animate the loading overlay height
                loadingOverlay.style.height = '60px';
                waveContainer.style.height = '200px';
            }, isFirstVisit ? 5000 : 2000);

            setTimeout(function() {
                loadingOverlay.style.display = 'none';
            }, isFirstVisit ? 7000 : 4000);
        }

        // Simulate waiting for all components to load
        if (isFirstVisit) {
            setTimeout(handleLoading, 5000);  // Wait 5 seconds before starting animation
            localStorage.setItem('visited', 'true');
        } else {
            handleLoading();  // Start animation immediately for returning visitors
        }
    });  

    document.addEventListener("DOMContentLoaded", function() {
// Get the necessary elements
const hamburgerInput = document.querySelector(".hamburger input");
const hamburgerButton = document.querySelector(".hamburger");
const dropdownContent = document.querySelector(".dropdown-content");
const header = document.querySelector("header"); // Assuming the button is inside a header element

// Position the hamburger button at the left side of the header
function positionHamburgerButton() {
// Set the hamburger button position
hamburgerButton.style.position = "absolute";
hamburgerButton.style.left = "15px"; // Add some padding from the left edge
hamburgerButton.style.top = "50%";
hamburgerButton.style.transform = "translateY(-50%)"; // Center vertically in the header
hamburgerButton.style.zIndex = "999";
}

// Function to position the dropdown below the hamburger button
function positionDropdown() {
const buttonRect = hamburgerButton.getBoundingClientRect();
dropdownContent.style.position = "absolute";
dropdownContent.style.top = buttonRect.bottom + "px";
dropdownContent.style.left = "15px"; // Match the left position of the hamburger
dropdownContent.style.zIndex = "1000";
}

// Position the hamburger button on page load
positionHamburgerButton();

// Toggle dropdown when hamburger is clicked
hamburgerInput.addEventListener("change", function() {
if (this.checked) {
  positionDropdown(); // Position before showing
  dropdownContent.classList.add("show");
} else {
  dropdownContent.classList.remove("show");
}
});

// Reposition elements on window resize
window.addEventListener("resize", function() {
positionHamburgerButton();
if (hamburgerInput.checked) {
  positionDropdown();
}
});

// Close dropdown when clicking outside
document.addEventListener("click", function(event) {
const isHamburger = event.target.closest(".hamburger");
const isDropdown = event.target.closest(".dropdown-content");

if (!isHamburger && !isDropdown) {
  dropdownContent.classList.remove("show");
  hamburgerInput.checked = false;
}
});
document.getElementById('searchButton').addEventListener('click', () => {
const input = document.getElementById('studentNumber').value.trim();
if (input) {
    searchStudent(input);
}
});


// Connect settings button
const settingsButton = document.querySelector(".settings-button");
const settingsPopup = document.querySelector(".settings-popup");

settingsButton.addEventListener("click", function() {
settingsPopup.style.display = "block";
});

// Close settings popup
const closeButton = document.querySelector(".settings-popup-close");
closeButton.addEventListener("click", function() {
settingsPopup.style.display = "none";
});
});

// Call this function when the page loads
window.addEventListener('load', () => {
    createViolationButtons();
    // ... (rest of your load event listener code) ...
});
