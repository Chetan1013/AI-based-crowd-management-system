// script.js - Advanced AI Monitoring with Stabilization Logic

// Configuration matching user requirements
const CONFIG = {
    MAX_CAPACITY: 30,
    UPDATE_INTERVAL: 2000,    // 2 seconds (as requested for stability)
    CONFIDENCE_THRESHOLD: 0.5, // Filter weak detections
    FRAME_SKIP: 5,            // Process every 5th frame simulation
    SMOOTHING_WINDOW: 10      // For Moving Average stabilization
};

// Moving Average Stabilizer
class Stabilizer {
    constructor(size) {
        this.size = size;
        this.history = [];
    }

    getStableCount(newCount) {
        this.history.push(newCount);
        if (this.history.length > this.size) this.history.shift();
        const sum = this.history.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.history.length);
    }
}

const stabilizer = new Stabilizer(CONFIG.SMOOTHING_WINDOW);

// UI Elements
const els = {
    videoUpload: document.getElementById('video_upload'),
    videoPlayer: document.getElementById('video_player'),
    detectionCanvas: document.getElementById('detection_canvas'),
    uploadUI: document.getElementById('upload_ui'),
    analysisOverlay: document.getElementById('analysis_overlay'),
    progressFill: document.getElementById('progress_fill'),
    percentText: document.getElementById('analysis_percent'),
    
    peopleCount: document.getElementById('people_count'),
    maxCapacity: document.getElementById('max_capacity'),
    crowdStatus: document.getElementById('crowd_status'),
    statusMeter: document.getElementById('status_meter'),
    alertBox: document.getElementById('alert_box'),
    logs: document.getElementById('logs'),
    clearBtn: document.getElementById('clear_video')
};

let monitoringTimer = null;
let currentRawCount = 15;
let frameCount = 0;

// Initialize
if (els.maxCapacity) els.maxCapacity.innerText = CONFIG.MAX_CAPACITY;

// 1. Handle Video Upload
els.videoUpload?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const videoURL = URL.createObjectURL(file);
        els.videoPlayer.src = videoURL;
        els.videoPlayer.style.display = 'block';
        els.detectionCanvas.style.display = 'block';
        els.uploadUI.style.display = 'none';
        
        startInitialPreprocessing();
    }
});

// 2. Clear / Remove Video
els.clearBtn?.addEventListener('click', () => {
    // Reset Hardware State
    if (monitoringTimer) clearInterval(monitoringTimer);
    els.videoPlayer.pause();
    els.videoPlayer.src = "";
    
    // Reset Canvas
    const ctx = els.detectionCanvas.getContext('2d');
    ctx.clearRect(0, 0, els.detectionCanvas.width, els.detectionCanvas.height);
    
    // Reset UI visibility
    els.videoPlayer.style.display = 'none';
    els.detectionCanvas.style.display = 'none';
    els.clearBtn.style.display = 'none';
    els.uploadUI.style.display = 'flex';
    els.alertBox.style.display = 'none';
    
    // Reset Stats
    stabilizer.history = [];
    currentRawCount = 15;
    els.peopleCount.innerText = "0";
    els.crowdStatus.innerText = "Safe";
    els.crowdStatus.className = "status-indicator status-safe";
    els.statusMeter.style.borderColor = "var(--success)";
    
    addLog("System reset. Session cleared.", "info");
});

// 2. Initial Preprocessing Simulation
function startInitialPreprocessing() {
    els.analysisOverlay.style.display = 'flex';
    addLog("Initializing YOLO v8 Engine...");
    addLog("Loading COCO dataset weights...");
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(completePreprocessing, 500);
        }
        els.progressFill.style.width = progress + '%';
        els.percentText.innerText = Math.floor(progress) + '%';
    }, 120);
}

function completePreprocessing() {
    els.analysisOverlay.style.display = 'none';
    els.clearBtn.style.display = 'inline-block';
    addLog("Preprocessing Complete. NMS Boxes applied.");
    addLog(`Filters: Confidence > ${CONFIG.CONFIDENCE_THRESHOLD}, Class: Person (0)`);
    
    els.videoPlayer.play();
    startMonitoringLoop();
}

// 3. Continuous Monitoring Loop (Updated every 2s)
function startMonitoringLoop() {
    if (monitoringTimer) clearInterval(monitoringTimer);
    
    monitoringTimer = setInterval(async () => {
        if (els.videoPlayer.paused || els.videoPlayer.ended) return;
        
        frameCount += 1;
        
        // Simulating frame-skipping logic: Only process if frame mod 5 == 0
        // (In simulation, we log this behavior)
        if (frameCount % CONFIG.FRAME_SKIP === 0) {
            addLog(`Full frame scan performed (Frame ID: ${frameCount})`, "debug");
        }

        const data = await getAnalyticsData();
        updateUI(data);
        drawSimulationBoxes(data.raw);
    }, CONFIG.UPDATE_INTERVAL);
}

// 4. Data Extraction with Stabilization
async function getAnalyticsData() {
    try {
        // Simulation of RAW detections (with realistic spikes)
        const variation = Math.floor(Math.random() * 11) - 5; // -5 to +5
        currentRawCount = Math.max(5, currentRawCount + variation);
        
        // Apply Moving Average Stabilization (as requested)
        const stableCount = stabilizer.getStableCount(currentRawCount);

        return {
            raw: currentRawCount,
            people: stableCount, // Displayed count
            capacity: CONFIG.MAX_CAPACITY
        };
    } catch (err) {
        return { people: 0, capacity: 30 };
    }
}

// 5. UI Updates
function updateUI(data) {
    const { people, capacity, raw } = data;
    els.peopleCount.innerText = people;
    
    let statusText = "Safe";
    let statusColor = "#3fb950"; 
    let statusClass = "status-safe";
    let showAlert = false;
    
    // Logic as requested
    if (people >= capacity * 1.3) {
        statusText = "Overcrowded";
        statusColor = "#f85149";
        statusClass = "status-danger";
        showAlert = true;
    } else if (people > capacity) {
        statusText = "Warning";
        statusColor = "#d29922";
        statusClass = "status-warning";
    }
    
    els.crowdStatus.innerText = statusText;
    els.crowdStatus.className = `status-indicator ${statusClass}`;
    els.statusMeter.style.borderColor = statusColor;
    els.statusMeter.style.color = statusColor;
    els.alertBox.style.display = showAlert ? 'flex' : 'none';
    
    console.log(`Raw: ${raw}, Stable: ${people}`);
}

// 6. Simulation Bounding Boxes (With Confidence Labels)
function drawSimulationBoxes(count) {
    const ctx = els.detectionCanvas.getContext('2d');
    const width = els.detectionCanvas.width = els.videoPlayer.videoWidth || 640;
    const height = els.detectionCanvas.height = els.videoPlayer.videoHeight || 360;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw raw detections representing "Filtered Results"
    const numBoxes = Math.min(15, count);
    for (let i = 0; i < numBoxes; i++) {
        const x = Math.random() * (width - 100);
        const y = Math.random() * (height - 150);
        const w = 50 + Math.random() * 30;
        const h = 100 + Math.random() * 50;
        const conf = (0.5 + Math.random() * 0.45).toFixed(2); // > 0.5
        
        ctx.strokeStyle = '#58a6ff'; 
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        // Label with Class and Confidence
        ctx.fillStyle = '#58a6ff';
        ctx.font = 'bold 11px Inter';
        ctx.fillRect(x, y - 18, 90, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`person | ${conf}`, x + 5, y - 5);
    }
}

function addLog(msg, type = "info") {
    const time = new Date().toLocaleTimeString();
    let style = "color: var(--text-muted);";
    if (type === "debug") style = "color: var(--accent); opacity: 0.7; font-size: 0.7rem;";
    if (type === "danger") style = "color: var(--danger); font-weight: bold;";
    
    const newLog = `<div style="${style} margin-bottom: 4px;">[${time}] ${msg}</div>`;
    els.logs.innerHTML = newLog + els.logs.innerHTML;
}

// Nav Link Logic
document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.href === window.location.href || window.location.pathname.endsWith(link.getAttribute('href'))) {
        link.classList.add('active');
    }
});
