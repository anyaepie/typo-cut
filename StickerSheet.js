// --- Sticker Sheet Generation & Handling ---

// Global state for preview
let showPreview = false;
let previewX = 0, previewY = 0, previewWidth = 0, previewHeight = 0;
let stickerSheetBuffer = null; // To store the generated sticker sheet PGraphics
let stickerSheetLayoutInfo = null; // Stores calculated layout details {cols, rows, max, w, h, fits}

function toggleStickerPreview() {
    showPreview = !showPreview;
    if (showPreview) {
        previewWidth = 300;
        previewX = width - previewWidth - 20;
        previewY = 60;
        stickerSheetBuffer = createStickerSheetGraphics(previewWidth);
        if (!stickerSheetBuffer) { showPreview = false; }
    } else {
        if (stickerSheetBuffer) { stickerSheetBuffer.remove(); stickerSheetBuffer = null; }
        stickerSheetLayoutInfo = null;
    }
    redraw();
}

// --- Letter Sequence Generation ---

function generateLetterSequence(maxLetters) {
    const freqLetters = ["E", "T", "A", "O", "I", "N", "S", "H", "R", "D", "L", "C", "U", "M", "W", "F", "G", "Y", "P", "B", "V", "K", "J", "X", "Q", "Z"];
    const frequency = [12, 9, 8, 8, 7, 7, 6, 6, 6, 4, 4, 3, 3, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    if (maxLetters <= 0) return "";
    if (maxLetters === 26) return alphabet;
    if (maxLetters < 26) {
         console.warn("Not enough space for full alphabet on sticker sheet.");
         return alphabet.substring(0, maxLetters);
    }

    let counts = new Array(26).fill(0);
    for (let i = 0; i < 26; i++) counts[i] = 1;
    let remaining = maxLetters - 26;
    let totalAdded = 0;
    let freqSum = frequency.reduce((a, b) => a + b, 0);
     if (freqSum <= 0) { freqSum = 1; console.warn("Letter frequencies sum to zero."); }

    for (let i = 0; i < freqLetters.length && totalAdded < remaining; i++) {
        let letterIndex = freqLetters[i].charCodeAt(0) - 'A'.charCodeAt(0);
        let proportion = frequency[i] / freqSum;
        let idealAddition = round(proportion * remaining);
        let actualAddition = min(idealAddition, remaining - totalAdded);
        actualAddition = max(0, actualAddition);
        counts[letterIndex] += actualAddition;
        totalAdded += actualAddition;
    }

    let freqIndex = 0;
    while (totalAdded < remaining) {
        let letterIndex = freqLetters[freqIndex % freqLetters.length].charCodeAt(0) - 'A'.charCodeAt(0);
        counts[letterIndex]++;
        totalAdded++;
        freqIndex++;
    }

    let sequence = "";
    for (let i = 0; i < 26; i++) {
        let letter = String.fromCharCode('A'.charCodeAt(0) + i);
        sequence += letter.repeat(counts[i]);
    }
    return sequence.substring(0, maxLetters);
}

// --- Sticker Sheet Graphics Creation ---

function createStickerSheetGraphics(targetPreviewWidth = 0) {
    const A4_WIDTH_PX = 1654;
    const A4_HEIGHT_PX = 2339;
    const DPI = 200;
    const INCH_TO_CM = 2.54;

    let pageMarginPx = A4_WIDTH_PX * boundaryPercent; // boundaryPercent is global
    let availableWidth = A4_WIDTH_PX - (2 * pageMarginPx);
    let availableHeight = A4_HEIGHT_PX - (2 * pageMarginPx);

    // cellWidth, cellHeight, CELLS_PER_LETTER, spacingFactor, lineSpacingFactor are global
    if (availableWidth <= 0 || availableHeight <= 0 || cellWidth <= 0 || cellHeight <= 0) {
        console.error("Invalid dimensions for sticker sheet calculation."); return null;
    }
    let baseLetterWidth = cellWidth * CELLS_PER_LETTER;
    let baseLetterHeight = cellHeight * CELLS_PER_LETTER;
    if (baseLetterWidth <= 0 || baseLetterHeight <= 0) {
        console.error("Base letter dimensions are zero or negative."); return null;
    }
    let aspectRatio = baseLetterWidth / baseLetterHeight;
    let spaceMultiplier = 2 * max(aspectRatio, 1 / aspectRatio);

    function calculateLayout(lw, lh) {
        lw = max(1, lw); lh = max(1, lh);
        let letterSpacingPx = max(0, lw * spaceMultiplier * spacingFactor);
        let lineSpacingPx = max(0, lh * spaceMultiplier * lineSpacingFactor);
        let effectiveW = lw + letterSpacingPx;
        let effectiveH = lh + lineSpacingPx;
        if (effectiveW <= 0 || effectiveH <= 0) return { cols: 0, rows: 0, maxLetters: 0, letterSpacingPx, lineSpacingPx };
        let cols = floor((availableWidth + letterSpacingPx) / (lw + letterSpacingPx));
        let rows = floor((availableHeight + lineSpacingPx) / (lh + lineSpacingPx));
        let maxLetters = max(0, cols * rows);
        return { cols, rows, maxLetters, letterSpacingPx, lineSpacingPx };
    }

    let currentLetterWidth = baseLetterWidth;
    let currentLetterHeight = baseLetterHeight;
    let layout = calculateLayout(currentLetterWidth, currentLetterHeight);

    if (layout.maxLetters < 26 && layout.maxLetters >= 0) {
        console.log("Scaling down sticker size to fit alphabet...");
        let scale = 0.95;
        while (layout.maxLetters < 26 && scale > 0.1) {
            currentLetterWidth = floor(baseLetterWidth * scale);
            currentLetterHeight = floor(baseLetterHeight * scale);
             if (currentLetterWidth < 1 || currentLetterHeight < 1) {
                 console.warn("Sticker size became too small during scaling.");
                 layout = calculateLayout(max(1, currentLetterWidth), max(1, currentLetterHeight));
                 break;
             }
            layout = calculateLayout(currentLetterWidth, currentLetterHeight);
            scale -= 0.05;
        }
        if (layout.maxLetters < 26) console.warn("Cannot fit all 26 letters even at minimum size.");
    } else if (layout.maxLetters < 0) {
         console.error("Error calculating initial sticker layout."); return null;
    }

    let finalCellW = max(1, floor(currentLetterWidth / CELLS_PER_LETTER));
    let finalCellH = max(1, floor(currentLetterHeight / CELLS_PER_LETTER));
    if (layout.cols <= 0 || layout.rows <= 0) {
        console.warn(`Calculated zero columns (${layout.cols}) or rows (${layout.rows}).`);
         stickerSheetLayoutInfo = { cols: 0, rows: 0, max: 0, w: 0, h: 0, fits: false }; return null;
    }

    let totalLayoutWidth = layout.cols * (currentLetterWidth + layout.letterSpacingPx) - layout.letterSpacingPx;
    let totalLayoutHeight = layout.rows * (currentLetterHeight + layout.lineSpacingPx) - layout.lineSpacingPx;
    let startX = pageMarginPx + (availableWidth - totalLayoutWidth) / 2;
    let startY = pageMarginPx + (availableHeight - totalLayoutHeight) / 2;
    let letterSequence = generateLetterSequence(layout.maxLetters);
    let widthCm = currentLetterWidth / (DPI / INCH_TO_CM);
    let heightCm = currentLetterHeight / (DPI / INCH_TO_CM);
    stickerSheetLayoutInfo = { cols: layout.cols, rows: layout.rows, max: layout.maxLetters, w: widthCm, h: heightCm, fits: layout.maxLetters >= 26 };
    console.log(`Sticker Sheet: ${layout.cols}x${layout.rows}=${layout.maxLetters}. Letter: ${nfc(widthCm, 1)}x${nfc(heightCm, 1)} cm`);

    // --- Create Graphics Buffer ---
    let pg = createGraphics(A4_WIDTH_PX, A4_HEIGHT_PX);
     if (!pg) { console.error("Failed to create sticker sheet graphics buffer."); return null;}
    pg.pixelDensity(1); // Match pixel density?
    pg.background(255);

    // Temporarily create LetterObjects for the sheet
    let stickerLetters = [];
    for (let i = 0; i < min(letterSequence.length, layout.maxLetters); i++) {
        let row = floor(i / layout.cols);
        let col = i % layout.cols;
        let x = startX + col * (currentLetterWidth + layout.letterSpacingPx);
        let y = startY + row * (currentLetterHeight + layout.lineSpacingPx);
        let letterChar = letterSequence.charAt(i);
        let randomImageIndex = (imageCount > 0) ? floor(random(imageCount)) : 0; // imageCount is global
        let stickerLetter = new LetterObject(letterChar, x, y, finalCellW, finalCellH, randomImageIndex);
        stickerLetters.push(stickerLetter);
    }

    // Draw each sticker letter onto the graphics buffer 'pg'
    for (let stickerLetter of stickerLetters) {
        // note how I reset randomseed by picking up a letter before attempting to draw a letter, clever, right?
        randomSeed(stickerLetter.noiseSeed);
        // Call the buffer-drawing function (relies on seed being set)
        drawLetterWithMaskOnBuffer(
            pg,
            stickerLetter.character, stickerLetter.x, stickerLetter.y,
            stickerLetter.cellWidth, stickerLetter.cellHeight,
            stickerLetter.imageIndex, stickerLetter.imageSectionPos,
            isInvertedMask // isInvertedMask is global
        );
    }

    if (targetPreviewWidth > 0) {
        previewHeight = pg.height * (targetPreviewWidth / pg.width);
    }

    return pg; // Return the graphics buffer
}

// --- Sticker Sheet Saving ---

function saveStickerSheet() {
    console.log("Generating sticker sheet for saving...");
    let pg = createStickerSheetGraphics(); // Generate the full A4 buffer
    if (pg) {
        let timestamp = `${year()}${nf(month(), 2)}${nf(day(), 2)}_${nf(hour(), 2)}${nf(minute(), 2)}${nf(second(), 2)}`;
        let filename = `sticker_sheet_${timestamp}.png`;
        save(pg, filename);
        console.log("Saved Sticker Sheet PNG:", filename);
        pg.remove();
    } else {
        console.error("Failed to generate sticker sheet buffer for saving.");
        alert("Error: Could not generate sticker sheet.");
    }
}
