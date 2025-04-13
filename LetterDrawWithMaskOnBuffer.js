// --- OPTIMIZED FUNCTION TO DRAW ONTO A BUFFER (Handles Multiple Mask Types) ---

function drawLetterWithMaskOnBuffer( // Using the more specific name we've used
    pg, char, x, y, cw, ch,
    imageIndex, imageSectionPos,
    inverted,
    fontType,   // Directly use this parameter
    fontObject // Directly use this parameter
) {

    // --- Basic Validation for target buffer 'pg' ---
    if (!pg || !pg.width || !pg.height || typeof pg.pixelDensity !== 'function') {
        console.error("drawLetterWithMaskOnBufferOptimized: Invalid target buffer 'pg' provided.");
        return;
    }

    // --- Validation for Font Mode (if applicable) ---
    // Check if a font mode is selected but no valid font object was passed
    if ((fontType === 'Built-in Fonts' || fontType === 'Uploaded Fonts') && !fontObject) {
        console.error(`drawLetterMaskOnBuffer: Mask type '${fontType}' requires a font object, but none was provided for char '${char}'.`);
        pg.push(); pg.fill(255, 100, 0, 100); pg.noStroke(); pg.rect(x, y, cw * CELLS_PER_LETTER, ch * CELLS_PER_LETTER); pg.pop();
        // Decide if we should try to fall back to Typocut or just stop
        return; // Stop drawing this letter
    }

    // --- Validation & Setup for Primitive ('Typocut') Mode ---
    let definition; // Only needed for Typocut mode
    if (fontType === 'Typocut Default') {
        definition = getLetterDefinition(char);
        if (!definition || definition === "000000000000000000") {
            console.warn(`No primitive definition found for '${char}' in Typocut mode.`);
            return; // Don't draw if definition is missing/empty for this mode
        }
    }

    // --- Validation for source image ---
    if (!sourceImages || imageIndex < 0 || imageIndex >= sourceImages.length ||
        !sourceImages[imageIndex] || !sourceImages[imageIndex].width || !sourceImages[imageIndex].height) {
        console.error(`drawLetterMaskOnBuffer: Source Image index ${imageIndex} invalid for char '${char}'.`);
        pg.push(); pg.fill(128, 50); pg.noStroke(); pg.rect(x, y, cw * CELLS_PER_LETTER, ch * CELLS_PER_LETTER); pg.pop();
        return;
    }
    let sourceImage = sourceImages[imageIndex];

    // --- Dimensions (Keep your existing logic) ---
    // let d = pg.pixelDensity();
    let d = savingPixelDensity;
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

    let tempP5Image = null;

    try {
        // --- Ensure SHARED Buffers ---
        reusableLetterMask = ensureBuffer(reusableLetterMask, scaledW, scaledH, d);
        reusableImageSection = ensureBuffer(reusableImageSection, scaledW, scaledH, d);
        if (!reusableLetterMask || !reusableImageSection) throw new Error("Shared buffer creation/retrieval failed.");

        let letterMask = reusableLetterMask;
        let imageSectionBuffer = reusableImageSection;

        // --- 1. Draw Letter onto Mask Buffer (Conditional Logic using parameters) ---
        letterMask.push();
        letterMask.noStroke();

        // --- Use the fontType and fontObject parameters directly ---

        // Check for Font modes first (Existing or Uploaded)
        if ((fontType === 'Built-in Fonts' || fontType === 'Uploaded Fonts') && fontObject) {
            // --- FONT MASK LOGIC ---
            letterMask.textAlign(CENTER, CENTER);

            // Calculate text size (keep your logic)
            let targetScaledHeight = (letterHeight * d) * 0.8;
            letterMask.textSize(targetScaledHeight);
            let glyphWidth = letterMask.textWidth(char);
            let maxWidth = scaledW * 0.95;
            if (glyphWidth > maxWidth) {
                let scaleDownFactor = maxWidth / glyphWidth;
                targetScaledHeight *= scaleDownFactor;
                letterMask.textSize(targetScaledHeight);
            }
            letterMask.textFont(fontObject); // Use the passed fontObject
            let verticalOffset = targetScaledHeight * 0.1;

            if (inverted) {
                letterMask.background(255, 255);
                letterMask.erase();
                letterMask.text(char, scaledW / 2, scaledH / 2 - verticalOffset);
                letterMask.noErase();
            } else {
                letterMask.fill(255, 255);
                letterMask.text(char, scaledW / 2, scaledH / 2 - verticalOffset);
            }
            // console.log(`Drew '${char}' using Font (${fontType})`); // Debug

        } else if (fontType === 'Typocut Default') {
            // --- PRIMITIVE ('Typocut') MASK LOGIC ---
            if (!definition) {
                 // Should have been caught earlier, but double-check
                 console.warn(`Skipping draw for '${char}' in Typocut mode - definition missing.`);
                 letterMask.pop(); return;
            }
            // Keep your existing primitive drawing logic
            let scaledMarginX = marginX * d;
            let scaledMarginY = marginY * d;
            let scaledCw = cw * d;
            let scaledCh = ch * d;
            if (inverted) {
                letterMask.background(255, 255);
                letterMask.erase();
                 for (let i = 0; i < 3; i++) { /* ... draw primitives ... */
                    for (let j = 0; j < 3; j++) {
                         let index = i * 3 + j;
                         if (index * 2 + 2 <= definition.length) {
                             let primCode = definition.substring(index * 2, index * 2 + 2);
                             let cellX = scaledMarginX + j * scaledCw;
                             let cellY = scaledMarginY + i * scaledCh;
                             if (scaledCw > 0 && scaledCh > 0) { drawCellPrimitive(primCode, cellX, cellY, scaledCw, scaledCh, letterMask); }
                         }
                     }
                 }
                letterMask.noErase();
            } else {
                letterMask.fill(255, 255);
                 for (let i = 0; i < 3; i++) { /* ... draw primitives ... */
                     for (let j = 0; j < 3; j++) {
                         let index = i * 3 + j;
                         if (index * 2 + 2 <= definition.length) {
                             let primCode = definition.substring(index * 2, index * 2 + 2);
                             let cellX = scaledMarginX + j * scaledCw;
                             let cellY = scaledMarginY + i * scaledCh;
                             if (scaledCw > 0 && scaledCh > 0) { drawCellPrimitive(primCode, cellX, cellY, scaledCw, scaledCh, letterMask); }
                         }
                     }
                 }
            }
            // console.log(`Drew '${char}' using Primitives (Typocut)`); // Debug

        } else {
             // --- Handle Error / Unknown fontType ---
             console.warn(`Unknown or invalid fontType ('${fontType}') or missing font object for char '${char}'. Drawing nothing for mask.`);
             // Explicitly clear the mask buffer to ensure it's transparent
             letterMask.clear(); // Make sure mask is empty/transparent
        }

        letterMask.pop(); // Restore drawing styles

        // --- Steps 2, 3, 4, 5 (Image Section, Copy, Mask, Draw) remain THE SAME ---
        // (Keep your existing logic here)
        let sx = imageSectionPos[0]; /* ... calculate sx, sy, sw, sh ... */
        let sy = imageSectionPos[1];
        let sw = totalWidth; let sh = totalHeight;
        sx = max(0, sx); sy = max(0, sy);
        let availableW = sourceImage.width - sx; let availableH = sourceImage.height - sy;
        sw = min(sw, availableW); sh = min(sh, availableH);

        imageSectionBuffer.push();
        imageSectionBuffer.background(0, 0);
        if (sw > 0 && sh > 0) {
            imageSectionBuffer.image(sourceImage, 0, 0, scaledW, scaledH, sx, sy, sw, sh);
        }
        imageSectionBuffer.pop();

        tempP5Image = createImage(scaledW, scaledH);
        tempP5Image.copy(imageSectionBuffer, 0, 0, scaledW, scaledH, 0, 0, scaledW, scaledH);

        tempP5Image.mask(letterMask);
        if (noiseAmt > 0 && (fontType === 'Built-in Fonts' || fontType === 'Uploaded Fonts') ) {
        applyImageDistortion(tempP5Image, noiseAmt);
        }

        let drawX = x - marginX;
        let drawY = y - marginY;
        pg.image(tempP5Image, drawX, drawY, totalWidth, totalHeight);

    } catch (error) {
        console.error(`Error during optimized masking onto buffer (char: ${char}, mode: ${fontType}):`, error);
        pg.push(); /* ... draw error rect ... */ pg.pop();
    } finally {
        // tempP5Image is temporary, garbage collected automatically.
    }
} // End function