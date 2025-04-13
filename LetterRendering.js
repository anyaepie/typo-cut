// --- Letter Definition ---
// Provides the 3x3 grid codes for each character, masking and then primitives drawing functions
// Please note that I have two functions with similar logic: drawLetterWithMask & drawLetterWithMaskonBuffer
// It happened because I first introduced just masking letters on canvas (drawLetterWithMask) by refactoring it from two functions
// - inverted and default, but then I've decided to produce A4 preview, save as png, svg, etc - which required a separate canvas
// I copied the working function into  drawLetterWithMaskonBuffer and updated it to support buffers
// and now I have two functions that do very similar things
// I'll refactor them when I solve the issue with masking

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