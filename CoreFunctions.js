// Core utility functions for Typocut
// (or just something is not directly related to other files)

//Calculate maximum symbols for this canvas size and letter size combination
function calculateMaxTextLength() {
    let letterWidth = cellWidth * CELLS_PER_LETTER;
    let letterHeight = cellHeight * CELLS_PER_LETTER;
    let letterSpacing = letterWidth * spacingFactor;
    let lineSpacing = letterHeight * lineSpacingFactor;
    
    console.log("CALCULATION START");
    console.log("cellWidth:", cellWidth, "cellHeight:", cellHeight);
    console.log("CELLS_PER_LETTER:", CELLS_PER_LETTER);
    console.log("letterWidth:", letterWidth, "letterHeight:", letterHeight);
    console.log("spacingFactor:", spacingFactor, "lineSpacingFactor:", lineSpacingFactor);
    console.log("letterSpacing:", letterSpacing, "lineSpacing:", lineSpacing);
    console.log("usableWidth:", usableWidth, "usableHeight:", usableHeight);
    
    // Calculate chars per line matching layout logic
    let charsPerLine = 1; // First char always fits
    let runningWidth = letterWidth;
    console.log("First char width:", letterWidth, "Running width:", runningWidth);
    
    // Keep adding chars until we exceed usable width
    while (runningWidth + letterWidth + letterSpacing <= usableWidth) {
        charsPerLine++;
        runningWidth += letterWidth + letterSpacing;
        console.log("Added char", charsPerLine, "Running width:", runningWidth);
    }
    console.log("Final chars per line:", charsPerLine);
    
    // Calculate lines with correct spacing logic
    let totalHeight = function(lines) {
        return lines * letterHeight + (lines - 1) * lineSpacing;
    };
    
    let maxLines = 1;
    console.log("First line height:", totalHeight(1));
    while (totalHeight(maxLines + 1) <= usableHeight) {
        maxLines++;
        console.log("Added line", maxLines, "Total height:", totalHeight(maxLines));
    }
    console.log("Final max lines:", maxLines);
    
    let result = charsPerLine * maxLines;
    console.log("FINAL RESULT:", result);
    
    return result;
}

// Debugging function to log detailed information about image sources
// This is for troubleshooting as I've spent quite some time iterating fancy image uploading
function logImageSourceDetails() {
    console.log("--- Image Source Debug Info ---");
    console.log("Gradient Images:", gradientImages.length);
    gradientImages.forEach((img, index) => {
        console.log(`  Gradient Image ${index}:`, 
            img ? `Valid (${img.width}x${img.height})` : "Invalid"
        );
    });
    
    console.log("Uploaded Images:", uploadedImages.length);
    uploadedImages.forEach((img, index) => {
        console.log(`  Uploaded Image ${index}:`, 
            img ? `Valid (${img.width}x${img.height})` : "Invalid"
        );
    });
    
    console.log("Current Source Images:", sourceImages.length);
    sourceImages.forEach((img, index) => {
        console.log(`  Source Image ${index}:`, 
            img ? `Valid (${img.width}x${img.height})` : "Invalid"
        );
    });
    
    console.log("Current Source Type:", sourceType);
    console.log("Image Count:", imageCount);
    console.log("Has Uploaded Images:", hasUploadedImages);
}