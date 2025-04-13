// --- Global Variables for this sketch ---
let reusableLetterMask = null;
let reusableImageSection = null;


// Helper function (ensure transparency handling)
function ensureBuffer(buffer, w, h, density) {
    if (!buffer || buffer.width !== w || buffer.height !== h || buffer.pixelDensity() !== density) {
        if (buffer) buffer.remove();
        buffer = createGraphics(w, h);
        if (!buffer || !buffer.elt) {
             console.error("Failed to create graphics buffer!"); // Keeping minimal error log
             return null;
        }
        buffer.pixelDensity(density);
    }
    buffer.clear(); // Use clear() for robust transparency clearing before reuse
    return buffer;
}


// --- MODIFIED FUNCTION TO DRAW ONTO MAIN CANVAS (Handles Multiple Mask Types) ---
function drawLetterWithMask(
    // Existing parameters:
    char, x, y, cw, ch,
    imageIndex, imageSectionPos,
    inverted,
    // NEW parameters:
    fontType,  
    fontObject 
) {

    // --- Validation & Setup for Primitive ('Typocut') Mode ---
    let definition; // Only needed for Typocut mode
    if (fontType === 'Typocut Default') {
        definition = getLetterDefinition(char); // Ensure getLetterDefinition exists
        if (!definition || definition === "000000000000000000") return; // Exit if no definition for Typocut
    }

    // --- Minimal Validation for Font Mode ---
    if ((fontType === 'Built-in Fonts' || fontType === 'Uploaded Fonts') && !fontObject) {
        console.warn(`Font mode '${fontType}' selected for '${char}' but no font provided. Skipping draw.`);
        // Draw placeholder? For now, just exit.
        push(); fill(255,100,0,50); noStroke(); rect(x,y,cw*CELLS_PER_LETTER, ch*CELLS_PER_LETTER); pop();
        return;
    }

    // --- Validation for source image (Keep minimal) ---
    if (!sourceImages || imageIndex < 0 || imageIndex >= sourceImages.length || !sourceImages[imageIndex] || !sourceImages[imageIndex].width) {
        // console.error(`drawLetterWithMask: Invalid image index ${imageIndex} for '${char}'.`);
        push(); fill(128, 50); noStroke(); rect(x, y, cw * CELLS_PER_LETTER, ch * CELLS_PER_LETTER); pop();
        return;
    }
    let sourceImage = sourceImages[imageIndex];
      
    if (char === ' ' ) {return;}


    // --- Dimensions (Keep your existing logic) ---
    let d = pixelDensity(); // Use main canvas density
    let letterWidth = floor(cw * CELLS_PER_LETTER);
    let letterHeight = floor(ch * CELLS_PER_LETTER);
    let noiseAmt = (typeof noiseAmount !== 'undefined' ? noiseAmount : 0);
    let marginFct = (typeof marginFactor !== 'undefined' ? marginFactor : 0.1);
    let maxNoiseDisp = max(cw, ch) * noiseAmt;
    let marginX = floor(letterWidth * marginFct + maxNoiseDisp);
    let marginY = floor(letterHeight * marginFct + maxNoiseDisp);
    let totalWidth = max(1, letterWidth + 2 * marginX);
    let totalHeight = max(1, letterHeight + 2 * marginY);
    let scaledW = floor(totalWidth * d);
    let scaledH = floor(totalHeight * d);

    if (scaledW <= 0 || scaledH <= 0) return;
    
    

    let tempP5Image = null; // For the final masked image step

    try {
        // --- Ensure SHARED Buffers ---
        // These hold the mask shape and the intermediate image section
        reusableLetterMask = ensureBuffer(reusableLetterMask, scaledW, scaledH, d);
        reusableImageSection = ensureBuffer(reusableImageSection, scaledW, scaledH, d);
        if (!reusableLetterMask || !reusableImageSection) {
             // Simplified error handling if buffers fail
             console.error("Buffer creation failed in drawLetterWithMask.");
             return;
        }

        let letterMask = reusableLetterMask;
        let imageSectionBuffer = reusableImageSection;


        // --- *** 1. Draw MASK based on fontType *** ---
        letterMask.push();
        letterMask.noStroke();

        if ((fontType === 'Built-in Fonts' || fontType === 'Uploaded Fonts') && fontObject) {
            // --- FONT MASK LOGIC ---
            letterMask.textAlign(CENTER, CENTER);
            let targetScaledHeight = (letterHeight * d) * 0.8; // Size heuristic
            letterMask.textSize(targetScaledHeight);
            let glyphWidth = letterMask.textWidth(char); // Check width
            let maxWidth = scaledW * 0.95;
            if (glyphWidth > maxWidth) { // Scale down if too wide
                targetScaledHeight *= (maxWidth / glyphWidth);
                letterMask.textSize(targetScaledHeight);
            }
            letterMask.textFont(fontObject); // Apply the font
            let verticalOffset = targetScaledHeight * 0.1; // Visual centering offset

            if (inverted) { // Draw transparent text on opaque bg
                letterMask.background(255, 255);
                letterMask.erase();
                letterMask.text(char, scaledW / 2, scaledH / 2 - verticalOffset);
                letterMask.noErase();
            } else { // Draw opaque text on transparent bg
                letterMask.fill(255, 255);
                letterMask.text(char, scaledW / 2, scaledH / 2 - verticalOffset);
            }

        } else if (fontType === 'Typocut Default') {
            // --- PRIMITIVE ('Typocut') MASK LOGIC (Your existing logic) ---
            if (!definition) { letterMask.pop(); return; } // Check definition again
            let scaledMarginX = marginX * d;
            let scaledMarginY = marginY * d;
            let scaledCw = cw * d;
            let scaledCh = ch * d;

            if (inverted) { // Draw transparent primitives on opaque bg
                letterMask.background(255, 255);
                letterMask.erase();
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        let index = i * 3 + j;
                        if (index * 2 + 2 <= definition.length) {
                            let primCode = definition.substring(index * 2, index * 2 + 2);
                            if (scaledCw > 0 && scaledCh > 0) drawCellPrimitive(primCode, scaledMarginX + j * scaledCw, scaledMarginY + i * scaledCh, scaledCw, scaledCh, letterMask);
                        }
                    }
                }
                letterMask.noErase();
            } else { // Draw opaque primitives on transparent bg
                letterMask.fill(255, 255);
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        let index = i * 3 + j;
                        if (index * 2 + 2 <= definition.length) {
                            let primCode = definition.substring(index * 2, index * 2 + 2);
                             if (scaledCw > 0 && scaledCh > 0) drawCellPrimitive(primCode, scaledMarginX + j * scaledCw, scaledMarginY + i * scaledCh, scaledCw, scaledCh, letterMask);
                        }
                    }
                }
            }

        } else {
             // --- Handle Unknown fontType ---
             // console.warn(`Unknown fontType '${fontType}' for char '${char}'. Mask will be empty.`);
             letterMask.clear(); // Ensure mask is empty/transparent
        }
        letterMask.pop(); // Restore drawing styles


        // --- Steps 2, 3, 4, 5 (Image Section, Copy, Mask, Draw) remain THE SAME ---
        // (Keep your existing logic here - it's independent of how the mask was made)

        // --- 2. Draw Source Image Section onto Image Section Buffer ---
        let sx = imageSectionPos[0]; /* ... calculate sx, sy, sw, sh ... */
        let sy = imageSectionPos[1];
        let sw = totalWidth; let sh = totalHeight;
        sx = max(0, sx); sy = max(0, sy);
        let availableW = sourceImage.width - sx; let availableH = sourceImage.height - sy;
        sw = min(sw, availableW); sh = min(sh, availableH);

        imageSectionBuffer.push();
        imageSectionBuffer.background(0, 0); // Clear buffer
        if (sw > 0 && sh > 0) {
             imageSectionBuffer.image(sourceImage, 0, 0, scaledW, scaledH, sx, sy, sw, sh);
        }
        imageSectionBuffer.pop();

        // --- 3. Copy buffer to a p5.Image ---
        tempP5Image = createImage(scaledW, scaledH); // Create temporary image
        tempP5Image.copy(imageSectionBuffer, 0, 0, scaledW, scaledH, 0, 0, scaledW, scaledH);

        // --- 4. Apply the generated Alpha Mask ---
        tempP5Image.mask(letterMask); // Apply the mask (letterMask)
        if (noiseAmt > 0 && (fontType === 'Built-in Fonts' || fontType === 'Uploaded Fonts') ) {
        applyImageDistortion(tempP5Image, noiseAmt);
        }

        // --- 5. Draw the Final Masked Image ONTO THE MAIN CANVAS ---
        let drawX = x - marginX;
        let drawY = y - marginY;
        image(tempP5Image, drawX, drawY, totalWidth, totalHeight); // Draw to main canvas

    } catch (error) {
        // Minimal error handling for the try block
        console.error(`Error during letter masking for '${char}':`, error);
        // Draw simple error indicator on main canvas
        push(); fill(255, 0, 0, 100); noStroke(); rect(x, y, letterWidth, letterHeight); pop();
    } finally {
        // tempP5Image is temporary and will be garbage collected.
        // Reusable buffers are NOT removed here; ensure ensureBuffer clears them.
    }
} // End function


function applyImageDistortion(img, intensity) {
    const w = img.width;
    const h = img.height;
    const cols = Math.ceil(1 + 2 * intensity);
    const rows = Math.ceil(1 + 2 * intensity);
    const cellW = w / cols;
    const cellH = h / rows;
    
    // Precompute displacement arrays (faster than objects)
    const dxGrid = new Array(rows + 1);
    const dyGrid = new Array(rows + 1);
    for (let y = 0; y <= rows; y++) {
        dxGrid[y] = new Float32Array(cols + 1);
        dyGrid[y] = new Float32Array(cols + 1);
        for (let x = 0; x <= cols; x++) {
            const angle = random(TWO_PI);
            dxGrid[y][x] = cos(angle) * cellW * intensity * 0.5;
            dyGrid[y][x] = sin(angle) * cellH * intensity * 0.5;
        }
    }

    img.loadPixels();
    const pixels = img.pixels;
    const tempPixels = new Uint8ClampedArray(pixels);
    
    // Process by cell blocks for better cache performance
    for (let cellY = 0; cellY < rows; cellY++) {
        const yStart = Math.floor(cellY * cellH);
        const yEnd = Math.min(Math.floor((cellY + 1) * cellH), h);
        
        for (let cellX = 0; cellX < cols; cellX++) {
            const xStart = Math.floor(cellX * cellW);
            const xEnd = Math.min(Math.floor((cellX + 1) * cellW), w);
            
            // Get displacement values for cell corners
            const d00x = dxGrid[cellY][cellX];
            const d00y = dyGrid[cellY][cellX];
            const d01x = dxGrid[cellY][cellX + 1];
            const d01y = dyGrid[cellY][cellX + 1];
            const d10x = dxGrid[cellY + 1][cellX];
            const d10y = dyGrid[cellY + 1][cellX];
            const d11x = dxGrid[cellY + 1][cellX + 1];
            const d11y = dyGrid[cellY + 1][cellX + 1];
            
            // Process cell block
            for (let y = yStart; y < yEnd; y++) {
                const ty = (y - cellY * cellH) / cellH;
                const w1 = 1 - ty;
                const w2 = ty;
                
                for (let x = xStart; x < xEnd; x++) {
                    const tx = (x - cellX * cellW) / cellW;
                    const w3 = 1 - tx;
                    const w4 = tx;
                    
                    // Manual bilinear interpolation (faster than lerp)
                    const dx = (d00x * w3 + d01x * w4) * w1 + 
                              (d10x * w3 + d11x * w4) * w2;
                    const dy = (d00y * w3 + d01y * w4) * w1 + 
                              (d10y * w3 + d11y * w4) * w2;
                    
                    // Calculate source coordinates with wrapping
                    const srcX = (x + dx + w) % w;
                    const srcY = (y + dy + h) % h;
                    
                    // Direct pixel access (faster than subarray)
                    const srcIdx = ((srcY | 0) * w + (srcX | 0)) << 2;
                    const dstIdx = (y * w + x) << 2;
                    tempPixels[dstIdx] = pixels[srcIdx];
                    tempPixels[dstIdx + 1] = pixels[srcIdx + 1];
                    tempPixels[dstIdx + 2] = pixels[srcIdx + 2];
                    tempPixels[dstIdx + 3] = pixels[srcIdx + 3];
                }
            }
        }
    }
    
    img.pixels.set(tempPixels);
    img.updatePixels();
}
