// gui.js - GUI setup and controls for Typocut
// Uses variables defined in Constants.js

// --- Source Type Management ---
function updateSourceTypeVisibility() {
    console.log("Source type changed to:", sourceType);
    
    if (sourceType === 'Gradients') {
        // Explicitly show gradient settings
        if (gradientSettingsFolder) {
            gradientSettingsFolder.show();
        }
        
        // Switch to gradient images
        sourceImages = [...gradientImages];
        imageCount = sourceImages.length;
        
        console.log(`Switched to ${imageCount} gradient images`);
    } else if (sourceType === 'Uploaded Files') {
        // Explicitly hide gradient settings when using uploaded files
        if (gradientSettingsFolder) {
            gradientSettingsFolder.hide();
        }
        
        // Check if we have uploaded images
        if (uploadedImages.length > 0) {
            // Switch to uploaded images
            sourceImages = [...uploadedImages];
            imageCount = sourceImages.length;
            
            console.log(`Switched to ${imageCount} uploaded images`);
        } else {
            // No uploaded images available
            console.log("No uploaded images available, reverting to gradients");
            sourceType = "Gradients";
            
            // Show gradient settings
            if (gradientSettingsFolder) {
                gradientSettingsFolder.show();
            }
            
            // Switch back to gradient images
            sourceImages = [...gradientImages];
            imageCount = sourceImages.length;
        }
    }
    
    // Force letters to use only valid image indices when we randomize
    randomizeLetterImages();
    
    // Update letters with the current image source
    updateLetterObjects();
    
    // Force redraw
    redraw();
}

// Function to update text from GUI with character limit enforcement
function updateTextFromGUI(value) {
    const maxPossible = calculateMaxTextLength();
    
    // Convert to uppercase
    value = value.toUpperCase();
    
    // Check if the text exceeds the maximum length
    if (value.length > maxPossible) {
        value = value.substring(0, maxPossible);
        console.log(`Text truncated to maximum length: ${maxPossible} characters`);
    }
    
    // Update the global variable
    inputText = value;
    
    // Update UI
    updateLetterObjects();
    updateCharacterStats();
}

// Function to update character count stats
function updateCharacterStats() {
    // Update the character count stats
    const text = inputText || "";
    characterStats.currentCount = text.length;
    characterStats.maxPossible = calculateMaxTextLength();
}

// --- GUI Setup Function ---
function setupGUI() {
    // Create GUI and position it in the dedicated container
    gui = new lil.GUI({ 
      title: "Typocut Controls",
      width: 300, 
      container: document.getElementById('gui-container')
    });

    // Initialize character stats object
    characterStats = {
        currentCount: 0,
        maxPossible: 0
    };
  
    // Use an object to hold variables for lil-gui databinding
    const guiSettings = {
        text: inputText,
        cellWidth: cellWidth,
        cellHeight: cellHeight,
        noiseAmount: noiseAmount,
        spacingFactor: spacingFactor,
        lineSpacingFactor: lineSpacingFactor,
        isInvertedMask: isInvertedMask,
        uploadImages: uploadImagesClicked,
        sourceType: sourceType,
        randomize: randomizeLetterImagesAndUpdate,
        resetLayout: resetLetterLayout,
        savePNG: savePNG,
        previewStickerSheet: toggleStickerPreview,
        saveStickerSheet: saveStickerSheet,
        startColor: startColor,
        endColor: endColor
    };

    // Top level controls
    gui.add(guiSettings, 'uploadImages').name('Upload Images');
    
    // Text input with character count update and limit enforcement
    gui.add(guiSettings, 'text')
        .name('Input Text')
        .onChange(value => {
            updateTextFromGUI(value);
        });

    // Source Selection (initially hidden, shown after file upload)
    sourceSelectionFolder = gui.addFolder('Source Selection');
    sourceSelectionFolder.add(guiSettings, 'sourceType', ['Gradients', 'Uploaded Files'])
        .name('Source Type')
        .onChange(value => {
            console.log(`Switching source type to: ${value}`);
            sourceType = value;
            updateSourceTypeVisibility();
        });
    sourceSelectionFolder.hide(); // Initially hidden

    // Gradient Settings (shown when Gradients is selected)
    gradientSettingsFolder = gui.addFolder('Gradient Settings');
    gradientSettingsFolder.addColor(guiSettings, 'startColor').name('Color 1').onChange(value => {
        console.log(`Changing start color to: ${value}`);
        startColor = value;
        updateGradients();
    });
    gradientSettingsFolder.addColor(guiSettings, 'endColor').name('Color 2').onChange(value => {
        console.log(`Changing end color to: ${value}`);
        endColor = value;
        updateGradients();
    });

    // Style Controls
    const styleFolder = gui.addFolder('Style Controls');
    styleFolder.add(guiSettings, 'cellWidth', MIN_CELL_SIZE, MAX_CELL_SIZE)
        .name('Letter Width')
        .step(5) // Set step to 5 pixels
        .onChange(value => {
            // Round to nearest multiple of 5
            cellWidth = Math.round(value / 5) * 5;
            
            // Ensure value is within min/max constraints
            cellWidth = Math.max(MIN_CELL_SIZE, Math.min(cellWidth, MAX_CELL_SIZE));
            
            // Update the GUI to show the rounded value
            if (typeof this.setValue === 'function') this.setValue(cellWidth);
            
            updateLetterObjects();
            updateCharacterStats();
        });
    
    styleFolder.add(guiSettings, 'cellHeight', MIN_CELL_SIZE, MAX_CELL_SIZE)
        .name('Letter Height')
        .step(5) // Set step to 5 pixels
        .onChange(value => {
            // Round to nearest multiple of 5
            cellHeight = Math.round(value / 5) * 5;
            
            // Ensure value is within min/max constraints
            cellHeight = Math.max(MIN_CELL_SIZE, Math.min(cellHeight, MAX_CELL_SIZE));
            
            // Update the GUI to show the rounded value
            if (typeof this.setValue === 'function') this.setValue(cellHeight);
            
            updateLetterObjects();
            updateCharacterStats();
        });

    styleFolder.add(guiSettings, 'noiseAmount', MIN_NOISE, MAX_NOISE)
        .step(0.01)
        .name('Noise Amount')
        .onChange(value => {
            noiseAmount = value;
            redraw(); // Noise only affects drawing, not layout
        });

    styleFolder.add(guiSettings, 'spacingFactor', MIN_SPACING, MAX_SPACING)
        .step(0.01)
        .name('Letter Spacing')
        .onChange(value => {
            spacingFactor = value;
            updateLetterObjects();
            updateCharacterStats();
        });

    styleFolder.add(guiSettings, 'lineSpacingFactor', MIN_LINE_SPACING, MAX_LINE_SPACING)
        .step(0.01)
        .name('Line Spacing')
        .onChange(value => {
            lineSpacingFactor = value;
            updateLetterObjects();
            updateCharacterStats();
        });

    styleFolder.add(guiSettings, 'isInvertedMask')
        .name('Inverted Mask')
        .onChange(value => {
            isInvertedMask = value;
            redraw(); // Update visual style
        });

    // Image Controls
    const imageFolder = gui.addFolder('Image Controls');
    imageFolder.add(guiSettings, 'randomize').name('Randomize Images');
    imageFolder.add(guiSettings, 'resetLayout').name('Reset Letter Layout');

    // Export Options
    const exportFolder = gui.addFolder('Export Options');
    exportFolder.add(guiSettings, 'savePNG').name('Save as PNG');
    exportFolder.add(guiSettings, 'previewStickerSheet').name('Preview A4 Sticker Sheet');
    exportFolder.add(guiSettings, 'saveStickerSheet').name('Save A4 Sticker Sheet');

    // Set initial visibility for source options
    updateSourceTypeVisibility();
    
    // Add Stats folder last (at the bottom of the GUI)
    const statsFolder = gui.addFolder('Canvas Statistics');
    statsFolder.add(characterStats, 'currentCount').name('Inputted Symbols').disable().listen();
    statsFolder.add(characterStats, 'maxPossible').name('Max Possible Symbols').disable().listen();
    
    // Initialize character stats
    updateCharacterStats();
}