// --- Letter Definition ---
// Provides the 3x3 grid codes for each character

function getLetterDefinition(c) {
    c = c.toUpperCase(); // Ensure uppercase for matching
    switch (c) {
        // Definitions as provided before...
        case 'A': return "201121101210103010";
        case 'B': return "101121101213101222";
        case 'C': return "201010101013231010";
        case 'D': return "101021101410101022";
        case 'E': return "201022101010231021";
        case 'F': return "101022101110230000";
        case 'G': return "201022100001231010";
        case 'H': return "100110101110100010";
        case 'I': return "141013141013141013";
        case 'J': return "001013011013101013";
        case 'K': return "101210101013103010";
        case 'L': return "210000100001101010";
        case 'M': return "101210101010220223";
        case 'N': return "102110101110100010";
        case 'O': return "201021101110231222";
        case 'P': return "101121101222220000";
        case 'Q': return "201121101210231023";
        case 'R': return "101121101222103021";
        case 'S': return "201011232101121022";
        case 'T': return "101210001000001000";
        case 'U': return "210020100010101210";
        case 'V': return "210020100110231022";
        case 'W': return "210120101010103010";
        case 'X': return "101210141013103010";
        case 'Y': return "101210231022001000";
        case 'Z': return "141022202200101013";
        case ' ': return "000000000000000000"; // Space is blank
        default: return "101010101010101010"; // Default block/question mark?
    }
}


// --- Letter Rendering (Masking & Primitives) ---

// Unified mask function - draws to the main canvas using MANUAL PIXEL MASKING
// Ideally mask() should be here, but I'm struggling as of now
function drawLetterWithMask(char, x, y, cw, ch, imageIndex, imageSectionPos, inverted) {

    let definition = getLetterDefinition(char);
    if (!definition || definition === "000000000000000000") return;

    // Ensure sourceImage exists and is valid
    if (!sourceImages || imageIndex < 0 || imageIndex >= sourceImages.length || !sourceImages[imageIndex] || !sourceImages[imageIndex].width || !sourceImages[imageIndex].height) {
        console.error(`drawLetterWithMask: Image index ${imageIndex} invalid or image not loaded/valid.`);
        push(); fill(128, 50); noStroke(); rect(x, y, cw * CELLS_PER_LETTER, ch * CELLS_PER_LETTER); pop();
        return;
    }
    let sourceImage = sourceImages[imageIndex];

    // Calculate dimensions for the mask/crop area
    let maxNoiseDisp = max(cw, ch) * noiseAmount; // noiseAmount is global
    let letterWidth = floor(cw * CELLS_PER_LETTER);
    let letterHeight = floor(ch * CELLS_PER_LETTER);
    let marginX = floor(letterWidth * marginFactor + maxNoiseDisp); // marginFactor is global
    let marginY = floor(letterHeight * marginFactor + maxNoiseDisp);
    let totalWidth = max(1, letterWidth + 2 * marginX);
    let totalHeight = max(1, letterHeight + 2 * marginY);

    // Temporary buffers
    let letterMask = null;
    let imgSection = null;
    let resultSection = null;

    try {
        // --- Create Small Letter Mask Graphics (Black/White shape) ---
        letterMask = createGraphics(totalWidth, totalHeight);
        if (!letterMask) throw new Error("Failed to create letterMask buffer.");
        letterMask.pixelDensity(1);
        letterMask.noStroke();
        if (inverted) { // isInvertedMask is global
            letterMask.background(255); letterMask.fill(0);
        } else {
            letterMask.background(0); letterMask.fill(255);
        }

        // Draw primitives onto the small letterMask buffer
        // random() calls inside drawCellPrimitive will use the seed set by caller
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let index = i * 3 + j;
                let cellX = marginX + j * cw;
                let cellY = marginY + i * ch;
                if (index * 2 + 1 < definition.length) {
                    let primCode = definition.substring(index * 2, index * 2 + 2);
                    if (cw > 0 && ch > 0) {
                        drawCellPrimitive(primCode, cellX, cellY, cw, ch, letterMask);
                    }
                }
            }
        }

        // --- Get Image Section ---
        let randomX = imageSectionPos[0];
        let randomY = imageSectionPos[1];
        let sectionWidth = min(totalWidth, sourceImage.width - randomX);
        let sectionHeight = min(totalHeight, sourceImage.height - randomY);
        if (sectionWidth <= 0 || sectionHeight <= 0 || randomX < 0 || randomY < 0 || randomX >= sourceImage.width || randomY >= sourceImage.height) {
           throw new Error(`Invalid dimensions for sourceImage.get(): sx=${randomX}, sy=${randomY}, sw=${sectionWidth}, sh=${sectionHeight}`);
        }
        imgSection = sourceImage.get(randomX, randomY, sectionWidth, sectionHeight);

        // Instead of resizing the actual image
if (imgSection.width !== totalWidth || imgSection.height !== totalHeight) {
    if (imgSection.width > 0 && imgSection.height > 0) {
        // Don't resize, instead draw on larger buffer with proper scaling
        let tempBuffer = createGraphics(totalWidth, totalHeight);
        // Set same pixel density for all buffers
        tempBuffer.pixelDensity(1);
        
        // Use image() for high-quality resampling
        tempBuffer.image(imgSection, 0, 0, totalWidth, totalHeight);
        
        // Get the properly sized image
        imgSection = tempBuffer.get();
        
        // Clean up
        tempBuffer.remove();
    }
}
        imgSection.loadPixels();


        // --- Create Result Buffer ---
        resultSection = createImage(totalWidth, totalHeight);
        if (!resultSection) throw new Error("Failed to create resultSection buffer.");

        // --- Apply Manual Mask via Pixel Manipulation ---
        letterMask.loadPixels();
        resultSection.loadPixels();

        if (letterMask.pixels.length !== imgSection.pixels.length || letterMask.pixels.length !== resultSection.pixels.length) {
            console.error(`Pixel array length mismatch: Mask=${letterMask.pixels.length}, Img=${imgSection.pixels.length}, Result=${resultSection.pixels.length}`);
            throw new Error("Pixel array length mismatch between buffers.");
        }

        for (let i = 0; i < letterMask.pixels.length; i += 4) {
            let maskValue = letterMask.pixels[i]; // Mask brightness (0 or 255)
            resultSection.pixels[i]     = imgSection.pixels[i];
            resultSection.pixels[i + 1] = imgSection.pixels[i + 1];
            resultSection.pixels[i + 2] = imgSection.pixels[i + 2];
            resultSection.pixels[i + 3] = maskValue; // Alpha from mask
        }
        resultSection.updatePixels();

        // --- Draw Result ---
        let dx = x - marginX;
        let dy = y - marginY;
        image(resultSection, dx, dy); // Draw to main canvas

    } catch (error) {
        console.error("Error during manual letter masking:", error);
         push(); fill(255, 0, 0, 100); noStroke(); rect(x,y, letterWidth || cw*CELLS_PER_LETTER, letterHeight || ch*CELLS_PER_LETTER); pop();
    } finally {
        // --- Clean up temporary buffers ---
        if (letterMask) letterMask.remove();
    }
}


// ADAPTED version to draw onto a specific buffer 'pg' using MANUAL PIXEL MASKING
function drawLetterWithMaskOnBuffer(pg, char, x, y, cw, ch, imageIndex, imageSectionPos, inverted) {

    let definition = getLetterDefinition(char);
    if (!definition || definition === "000000000000000000") return;

    // Ensure sourceImage exists and is valid
    if (!sourceImages || imageIndex < 0 || imageIndex >= sourceImages.length || !sourceImages[imageIndex] || !sourceImages[imageIndex].width || !sourceImages[imageIndex].height) {
        console.error(`drawLetterWithMaskOnBuffer: Image index ${imageIndex} invalid or image not loaded/valid.`);
        pg.push(); pg.fill(128, 50); pg.noStroke(); pg.rect(x, y, cw * CELLS_PER_LETTER, ch * CELLS_PER_LETTER); pg.pop();
        return;
    }
    let sourceImage = sourceImages[imageIndex];

    // Calculate dimensions for the mask/crop area
    let maxNoiseDisp = max(cw, ch) * noiseAmount;
    let letterWidth = floor(cw * CELLS_PER_LETTER);
    let letterHeight = floor(ch * CELLS_PER_LETTER);
    let marginX = floor(letterWidth * marginFactor + maxNoiseDisp);
    let marginY = floor(letterHeight * marginFactor + maxNoiseDisp);
    let totalWidth = max(1, letterWidth + 2 * marginX);
    let totalHeight = max(1, letterHeight + 2 * marginY);

    // Temporary buffers
    let letterMask = null;
    let imgSection = null;
    let resultSection = null;

    try {
        // --- Create Small Letter Mask Graphics ---
        letterMask = createGraphics(totalWidth, totalHeight);
        if (!letterMask) throw new Error("Failed to create letterMask buffer (for buffer draw).");
        letterMask.pixelDensity(1);
        letterMask.noStroke();
        if (inverted) { // isInvertedMask is global
            letterMask.background(255); letterMask.fill(0);
        } else {
            letterMask.background(0); letterMask.fill(255);
        }

        // Draw primitives onto the small letterMask buffer
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let index = i * 3 + j;
                let cellX = marginX + j * cw;
                let cellY = marginY + i * ch;
                if (index * 2 + 1 < definition.length) {
                    let primCode = definition.substring(index * 2, index * 2 + 2);
                    if (cw > 0 && ch > 0) {
                        drawCellPrimitive(primCode, cellX, cellY, cw, ch, letterMask);
                    }
                }
            }
        }

        // --- Get Image Section ---
        let randomX = imageSectionPos[0];
        let randomY = imageSectionPos[1];
        let sectionWidth = min(totalWidth, sourceImage.width - randomX);
        let sectionHeight = min(totalHeight, sourceImage.height - randomY);
        if (sectionWidth <= 0 || sectionHeight <= 0 || randomX < 0 || randomY < 0 || randomX >= sourceImage.width || randomY >= sourceImage.height) {
           throw new Error(`Invalid dimensions for sourceImage.get() (buffer draw): sx=${randomX}, sy=${randomY}, sw=${sectionWidth}, sh=${sectionHeight}`);
        }
        imgSection = sourceImage.get(randomX, randomY, sectionWidth, sectionHeight);

        if (imgSection.width !== totalWidth || imgSection.height !== totalHeight) {
             if (imgSection.width > 0 && imgSection.height > 0) {
                  imgSection.resize(totalWidth, totalHeight);
             } else {
                 throw new Error("imgSection invalid dimensions after get() (buffer draw).");
             }
        }
        imgSection.loadPixels();

        // --- Create Result Buffer ---
        resultSection = createImage(totalWidth, totalHeight);
        if (!resultSection) throw new Error("Failed to create resultSection buffer (for buffer draw).");


        // --- Apply Manual Mask via Pixel Manipulation ---
        letterMask.loadPixels();
        resultSection.loadPixels();

        if (letterMask.pixels.length !== imgSection.pixels.length || letterMask.pixels.length !== resultSection.pixels.length) {
            console.error(`Buffer Draw Pixel array length mismatch: Mask=${letterMask.pixels.length}, Img=${imgSection.pixels.length}, Result=${resultSection.pixels.length}`);
            throw new Error("Pixel array length mismatch between buffers (buffer draw).");
        }

        for (let i = 0; i < letterMask.pixels.length; i += 4) {
            let maskValue = letterMask.pixels[i]; // Mask brightness (0 or 255)
            resultSection.pixels[i]     = imgSection.pixels[i];
            resultSection.pixels[i + 1] = imgSection.pixels[i + 1];
            resultSection.pixels[i + 2] = imgSection.pixels[i + 2];
            resultSection.pixels[i + 3] = maskValue; // Alpha from mask
        }
        resultSection.updatePixels();

        // --- Draw Result onto TARGET BUFFER 'pg' ---
        let dx = x - marginX;
        let dy = y - marginY;
        pg.image(resultSection, dx, dy); // Draw result onto the target graphics buffer 'pg'

    } catch (error) {
        console.error("Error during manual letter masking onto buffer:", error);
        pg.push(); pg.fill(255, 0, 0, 100); pg.noStroke(); pg.rect(x,y, letterWidth || cw*CELLS_PER_LETTER, letterHeight || ch*CELLS_PER_LETTER); pg.pop();
    } finally {
        // --- Clean up temporary buffers ---
        if (letterMask) letterMask.remove();
        // resultSection is p5.Image, no remove() needed
    }
}


// Primitive "Broker" Function
function drawCellPrimitive(code, x, y, w, h, pg) {
    if (code === "00") return;
    if (!pg) { console.error("drawCellPrimitive called with invalid graphics context."); return; }
    let noise = noiseAmount; // Uses the global noiseAmount

    // random() calls inside primitives will respect seed set by caller of drawLetterWithMask...
    if (code === "01") { drawArcPrimitive(x, y, w, h, noise, 0, pg); }
    else if (code === "02") { drawArcPrimitive(x, y, w, h, noise, PI, pg); }
    else if (code === "10") { drawRectanglePrimitive(x, y, w, h, noise, pg); }
    else if (code === "20") { drawTrianglePrimitive(x, y, w, h, noise, PI, 1, pg); }
    else if (code === "21") { drawTrianglePrimitive(x, y, w, h, noise, PI, -1, pg); }
    else if (code === "22") { drawTrianglePrimitive(x, y, w, h, noise, 0, 1, pg); }
    else if (code === "23") { drawTrianglePrimitive(x, y, w, h, noise, 0, -1, pg); }
    else if (code === "30") { drawPolygonPrimitive(x, y, w, h, noise, 0, pg); }
    else if (code === "31") { drawPolygonPrimitive(x, y, w, h, noise, PI, pg); }
    else if (code === "11") { drawCutoutPrimitive(x, y, w, h, noise, 0, false, pg); }
    else if (code === "12") { drawCutoutPrimitive(x, y, w, h, noise, PI, false, pg); }
    else if (code === "13") { drawCutoutPrimitive(x, y, w, h, noise, -HALF_PI, true, pg); }
    else if (code === "14") { drawCutoutPrimitive(x, y, w, h, noise, HALF_PI, true, pg); }
}

// --- Primitive Drawing Functions ---
// I'm using relative random based on width/lenght of the cell and global noise parameter

function drawArcPrimitive(x, y, w, h, noise, rotation, pg) {
    pg.push();
    pg.translate(x + w / 2, y + h / 2);
    pg.rotate(rotation);
    pg.translate(-w / 2, -h / 2);
    let centerX = w / 2 + random(-w / 2 * noise, w / 2 * noise);
    let centerY = h + random(0, h / 2 * noise);
    let radiusX = ceil(w / 2 + random(0, w * noise));
    let radiusY = ceil(h / 2 + random(0, h* noise));
    pg.beginShape();
    let step = PI / 20;
    for (let angle = PI; angle <= TWO_PI + step; angle += step) {
        let px = centerX + radiusX * cos(angle);
        let py = centerY + radiusY * sin(angle);
        pg.vertex(px, py);
    }
    pg.endShape(CLOSE);
    pg.pop();
}

function drawRectanglePrimitive(x, y, w, h, noise, pg) {
    let noiseX = w * noise / 2;
    let noiseY = h * noise / 2;
    let ax = floor(x - random(0, noiseX));
    let ay = floor(y - random(0, noiseY));
    let bx = ceil(x + w + random(0, noiseX));
    let by = floor(y - random(0, noiseY));
    let cx = floor(x - random(0, noiseX));
    let cy = ceil(y + h + random(0, noiseY));
    let dx = ceil(x + w + random(0, noiseX));
    let dy = ceil(y + h + random(0, noiseY));
  
    pg.beginShape();
    pg.vertex(ax, ay); pg.vertex(bx, by); pg.vertex(dx, dy); pg.vertex(cx, cy);
    pg.endShape(CLOSE);
}

function drawTrianglePrimitive(x, y, w, h, noise, angle, scaleX, pg) {
    pg.push();
    pg.translate(x + w / 2, y + h / 2);
    pg.rotate(angle);
    pg.scale(scaleX, 1);
    let noise_w = w * noise / 2;
    let noise_h = h * noise / 2;
    let x1 = floor(-w / 2 + random(-noise_w, 0));
    let y1 = floor(-h / 2 + random(-noise_h, 0));
    let x2 = ceil(w / 2 + random(0, noise_w));
    let y2 = floor(-h / 2 + random(-noise_h, 0));
    let x3 = floor(-w / 2 + random(-noise_w, 0));
    let y3 = ceil (h / 2 + random(0, noise_h));
    pg.beginShape();
    pg.vertex(x1, y1); pg.vertex(x2, y2); pg.vertex(x3, y3);
    pg.endShape(CLOSE);
    pg.pop();
}

function drawPolygonPrimitive(x, y, w, h, noise, rotation, pg) {
    pg.push();
    pg.translate(x + w / 2, y + h / 2);
    pg.rotate(rotation);
    pg.translate(-w / 2, -h / 2);
    let noise_w = w * noise / 2;
    let noise_h = h * noise / 2;
    let ax = floor(0 - random(0, noise_w));
    let ay = floor(0 - random(0, noise_h));
    let bx = ceil(w + random(0, noise_w));
    let by = floor(0-random(0, noise_h));
    let midABx = w / 2 + random(noise_w, noise_w);
    let midABy = random(0, noise_h);
    let cx = floor(0 - random(0, noise_w));
    let cy = ceil(h + random(0, noise_h));
    let dx = ceil(w + random(0, noise_w));
    let dy = ceil(h + random(0, noise_h));
    pg.beginShape();
    pg.vertex(ax, ay); pg.vertex(bx, by); pg.vertex(dx, dy); pg.vertex(midABx, midABy); pg.vertex(cx, cy);
    pg.endShape(CLOSE);
    pg.pop();
}

function drawCutoutPrimitive(x, y, w, h, noise, rotation, swapDimensions, pg) {
    // Handle dimension swapping if needed
    let useW = swapDimensions ? h : w;
    let useH = swapDimensions ? w : h;
    if (useW <= 0 || useH <= 0) { return; }

    pg.push(); 
    pg.translate(x + w / 2, y + h / 2); // Move to center of original cell
    pg.rotate(rotation); // Apply rotation
    pg.translate(-useW / 2, -useH / 2); // Translate origin to top-left of useW/useH box

    // Calculate corners relative to the new (0,0) origin
    let ax = 0;
    let ay = 0;
    let bx = ceil(useW); 
    let by = ay;
    let cx = ax;
    let cy = ceil(useH);
    let dx = bx;
    let dy = cy;

    pg.beginShape();
    pg.vertex(ax, ay); // A (top-left)
    pg.vertex(bx, by); // B (top-right)
    pg.vertex(dx, dy); // D (bottom-right)
    pg.vertex(cx, cy); // C (bottom-left)

    // Calculate parameters for the bottom cutout exactly as in Processing
    let centerX = cx + (dx - cx) / 2; // Center X on the bottom edge
    let centerY = cy;                // Y coordinate of the bottom edge

    let halfWidth = (dx - cx) / 2; 
    let halfHeight = (cy - by) / 2;

    let radiusX = min(0.8 * halfWidth + random(0, useW / 2 * noise), halfWidth);
    let radiusY = min(0.8 * halfHeight + random(0, useH / 2 * noise), halfHeight);
    // Ensure minimum radius to avoid visual glitches
    radiusX = max(1, radiusX);
    radiusY = max(1, radiusY);

    // Create the cutout contour
    pg.beginContour();

    // Draw the arc for the cutout (upwards from the bottom edge)
    // Loop from angle 0 to PI
    let step = PI / 20; // Angle increment
    for (let angle = 0; angle <= PI; angle += step) {
        let px = centerX + radiusX * cos(angle);
        // Subtract sin(angle) because centerY is at the bottom edge,
        // and positive sin values would go downwards (outside the shape).
        // Negative sin values (for angles 0 to PI) go upwards.
        let py = centerY - radiusY * sin(angle);
        pg.vertex(px, py);
    }

    pg.endContour(); // End the hole definition
    pg.endShape(CLOSE); // Close the main rectangle shape (which now includes the contour)

    pg.pop(); // Equivalent to popMatrix()
}
