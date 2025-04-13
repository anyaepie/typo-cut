// sketch.js - Main p5.js sketch file for Typocut
// Uses modular functions from separate files

function preload() {

    // Call the font loading function
    loadFontsFromArray();


}

function setup() {
    // Set higher pixel density for sharper graphics
    pixelDensity(2);
    
    // Create canvas inside the canvas container
    const canvasContainer = document.getElementById('canvas-container');
    const guiContainer = document.getElementById('gui-container');
    const textContainer = document.getElementById('text-container');
    
    // Match canvas container height to GUI container
    const guiContainerHeight = guiContainer.offsetHeight;
    canvasContainer.style.height = `${guiContainerHeight}px`;
    
    // Ensure container has a visible size
    const containerWidth = Math.max(800, canvasContainer.clientWidth || window.innerWidth - 300);
    const containerHeight = guiContainerHeight;
    
    console.log(`Creating canvas: ${containerWidth}x${containerHeight}`);
    
    const canvas = createCanvas(containerWidth, containerHeight);
    canvas.parent(canvasContainer);
    noSmooth();

    // Initialize boundary calculations
    boundary = width * boundaryPercent;
    usableWidth = width - (2 * boundary);
    usableHeight = height - (2 * boundary);

    // Create hidden file input for image uploads
    setTimeout(initializeFileInputs, 100);

    // Initialize lil-gui
    setupGUI();

    // Load images (uses preload results or generates placeholders)
    loadImages();

    // Initial letter object creation
    updateLetterObjects();

    // Set default text properties
    // This is legacy now as I don't have any text outputted
    textSize(12);
    fill(0);
    textAlign(LEFT, BASELINE);
    strokeWeight(1);
    //This is still not legacy
    imageMode(CORNER);

    // Force a redraw to ensure content is visible
    redraw();
}

function draw() {
    // Set background to white
    background(255);

    // Draw all current letter objects
    for (let letter of letters) {
        letter.draw();
    }

    // Draw sticker sheet preview if active and buffer exists
    if (showPreview && stickerSheetBuffer) {
        image(stickerSheetBuffer, previewX, previewY, previewWidth, previewHeight);
        // Draw border and info text for the preview
        push();
        noFill(); stroke(10);
        rect(previewX, previewY, previewWidth, previewHeight);
        textFont('-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif');
        fill(0); stroke(0); textSize(11); textAlign(LEFT, BOTTOM);
        let info = stickerSheetLayoutInfo || { cols: '?', rows: '?', max: '?', w: '?', h: '?', fits: false };
        text(`A4 Preview (${info.cols}x${info.rows}=${info.max}), Letter: ${nfc(info.w, 1)}x${nfc(info.h, 1)} cm`,
             previewX, previewY - 5);
        if (!info.fits) {
            fill(255, 0, 0); textAlign(LEFT, TOP);
            text("Warning: Cannot fit all 26 letters!", previewX, previewY + previewHeight + 5);
        }
        pop();
    }
    if (statusMessage!=='') {
        push();
        fill(0);
        noStroke();
        textAlign(LEFT, LEFT);
        textSize(11);
        text(statusMessage, 20, height - 20);
        pop();
    }
}

// Resize canvas when window is resized
function windowResized() {
    const canvasContainer = document.getElementById('canvas-container');
    const guiContainer = document.getElementById('gui-container');
    
    // Match canvas container height to GUI container
    const guiContainerHeight = guiContainer.offsetHeight;
    canvasContainer.style.height = `${guiContainerHeight}px`;
    
    const containerWidth = Math.max(800, canvasContainer.clientWidth || window.innerWidth - 300);
    const containerHeight = guiContainerHeight;
    
    resizeCanvas(containerWidth, containerHeight);
    
    // Recalculate boundary and usable area
    boundary = width * boundaryPercent;
    usableWidth = width - (2 * boundary);
    usableHeight = height - (2 * boundary);
    
    // Update letter layout to fit new canvas size
    updateLetterObjects();
}