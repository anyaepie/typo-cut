// Letter management functions for Typocut

// Function to randomize letter images and update the display
function randomizeLetterImagesAndUpdate() {
    console.log("Randomizing letter images");
    randomizeLetterImages();
    updateLetterObjects();
    redraw();
}

// Function to randomize letter images
function randomizeLetterImages() {
    // Ensure we have a valid image source
    if (!sourceImages || imageCount === 0) {
        console.log("No images loaded to randomize."); 
        // Fallback to creating placeholders if no images exist
        createPlaceholders();
        return;
    }
    
    // Validate imageCount against actual sourceImages array
    imageCount = Math.min(sourceImages.length, imageCount);
    
    for (let letter of letters) {
        // Generate a random image index within the valid range
        letter.imageIndex = floor(random(imageCount));
        
        // Defensive programming: ensure imageIndex is valid
        if (letter.imageIndex < 0 || letter.imageIndex >= imageCount) {
            letter.imageIndex = 0; // Fallback to first image if invalid
        }
        
        // Ensure the selected image is actually valid
        if (!sourceImages[letter.imageIndex] || 
            !sourceImages[letter.imageIndex].width || 
            !sourceImages[letter.imageIndex].height) {
            console.warn(`Invalid image at index ${letter.imageIndex}. Falling back to first image.`);
            letter.imageIndex = 0;
        }
        
        // Generate new noise seed and image section position
        letter.noiseSeed = floor(random(1000000)); 
        letter.updateImageSectionPos(); 
    }
}

// Function to reset letter layout
function resetLetterLayout() {
    updateLetterObjects();
}

// Function to enforce character limit
function enforceCharacterLimit(text) {
    const maxPossible = calculateMaxTextLength();
    if (text.length > maxPossible) {
        // Truncate text to the maximum limit
        text = text.substring(0, maxPossible);
        console.log(`Text truncated to maximum length: ${maxPossible} characters`);
    }
    return text;
}

// Function to update letter objects based on current text and canvas layout
function updateLetterObjects() {
    // Ensure we have at least some images to work with
    if (!sourceImages || sourceImages.length === 0) {
        console.warn("No images available. Creating placeholders.");
        createPlaceholders();
    }

    // Validate and potentially reset imageCount
    imageCount = Math.max(1, Math.min(sourceImages.length, imageCount));

    // Apply character limit to inputText
    inputText = enforceCharacterLimit(inputText);

    // Store existing letter properties
    let existingLetters = {};
    for (let i = 0; i < letters.length; i++) {
        let letter = letters[i];
        if (letter.textPosition !== -1) {
            let key = letter.character + "_" + letter.textPosition;
            existingLetters[key] = {
                imageIndex: letter.imageIndex,
                noiseSeed: letter.noiseSeed,
                imageSectionPos: letter.imageSectionPos
            };
        }
    }

    // Reset letters array
    letters = [];

    // If no input text, just redraw and return
    if (inputText.length === 0) { 
        redraw(); 
        return; 
    }

    // Calculate base dimensions
    let baseCellWidth = cellWidth;
    let baseCellHeight = cellHeight;
    let letterWidth = baseCellWidth * CELLS_PER_LETTER;
    let letterHeight = baseCellHeight * CELLS_PER_LETTER;

    // Validate dimensions
    if (letterWidth <= 0 || letterHeight <= 0 || usableWidth <= 0 || usableHeight <= 0) {
        console.error("Cannot update letters: Invalid dimensions.");
        redraw();
        return;
    }

    // Calculate spacing
    let letterSpacing = letterWidth * spacingFactor;
    let lineSpacing = letterHeight * lineSpacingFactor;
    let lineHeight = letterHeight + lineSpacing;

    // Calculate line breaks
    let lines = [];
    let currentLine = [];
    let currentLineWidth = 0;
    for (let i = 0; i < inputText.length; i++) {
        let charWidth = letterWidth;
        if (currentLine.length > 0) charWidth += letterSpacing;
        if (currentLineWidth + charWidth > usableWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [];
            currentLineWidth = letterWidth;
        } else {
            currentLineWidth += charWidth;
        }
        currentLine.push(i);
    }
    if (currentLine.length > 0) lines.push(currentLine);

    // REMOVED AUTOMATIC SCALING - We now enforce character limits instead
    // The scaleFactor will always be 1.0
    let scaleFactor = 1.0;
    
    // Use the original letter dimensions without scaling
    let scaledCellWidth = baseCellWidth;
    let scaledCellHeight = baseCellHeight;

    // Position letters
    let startY = (height - (lines.length * lineHeight - (lines.length > 0 ? lineSpacing : 0))) / 2;
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        let line = lines[lineIndex];
        let currentLineWidth = (line.length * letterWidth) + max(0, (line.length - 1) * letterSpacing);
        let startX = (width - currentLineWidth) / 2;
        let y = startY + (lineIndex * lineHeight);
        
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            let textIndex = line[charIndex];
            let c = inputText.charAt(textIndex);
            let x = startX + (charIndex * (letterWidth + letterSpacing));
            
            let letter;
            let key = c + "_" + textIndex;
            
            if (existingLetters.hasOwnProperty(key)) {
                let existing = existingLetters[key];
                
                // Validate image index
                let useImageIndex = existing.imageIndex;
                if (useImageIndex < 0 || useImageIndex >= imageCount) {
                    console.warn(`Invalid image index ${useImageIndex}. Resetting to 0.`);
                    useImageIndex = 0;
                }
                
                letter = new LetterObject(c, x, y, scaledCellWidth, scaledCellHeight, useImageIndex);
                letter.noiseSeed = existing.noiseSeed; // Restore seed
                letter.imageSectionPos = existing.imageSectionPos; // Restore crop pos
            } else {
                // For new letters, generate a valid image index
                let randomImageIndex = (imageCount > 0) ? floor(random(imageCount)) : 0;
                
                // Double-check image index is valid
                if (randomImageIndex < 0 || randomImageIndex >= imageCount) {
                    console.warn(`Generated invalid image index ${randomImageIndex}. Resetting to 0.`);
                    randomImageIndex = 0;
                }
                
                letter = new LetterObject(c, x, y, scaledCellWidth, scaledCellHeight, randomImageIndex);
            }
            
            letter.textPosition = textIndex;
            letters.push(letter);
        }
    }
    
    // Update GUI text input to reflect any character limit enforcement
    updateGUIWithCurrentText();
    
    // Update character stats
    updateCharacterStats();
    
    redraw();
}

// Function to update the GUI text input with the current inputText value
function updateGUIWithCurrentText() {
    if (gui && gui.controllers) {
        gui.controllers.forEach(c => {
            if (c.property === 'text') {
                if (typeof c.setValue === 'function') {
                    c.setValue(inputText);
                } else {
                    c.object[c.property] = inputText;
                    if (typeof c.updateDisplay === 'function') c.updateDisplay();
                }
            }
        });
    }
}