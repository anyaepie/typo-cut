// gui.js - GUI setup and controls for Typocut
// Uses variables defined in Constants.js

// --- Source Type Management ---

function updateSourceTypeOptions() {
    const currentOptions = ['Gradients'];
    if (uploadedImages.length > 0) {
        currentOptions.push('Uploaded Images');
    }

    if (!currentOptions.includes(sourceType)) {
        sourceType = 'Gradients';
    }

    guiSourceController.options(currentOptions);
    guiSourceController.setValue(sourceType);
}


function updateFontTypeDropdown() {
    // Build current options
    const currentOptions = ['Typocut Default','Built-in Fonts'];
    if (uploadedFontCollection?.length) currentOptions.push('Uploaded Fonts');

    // Reset fontType if needed
    if (!currentOptions.includes(fontType)) {
        fontType = 'Typocut Default';
    }

    // Update controller
    guiFontController.options(currentOptions);
    guiFontController.setValue(fontType); // Sync displayed value
    
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
        uploadFonts: uploadFontsClicked, 
        fontType:fontType,
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
    gui.add(guiSettings, 'uploadImages')
       .name('Upload Images (up to 10 x 2.5 MB)');
  
    gui.add(guiSettings, 'uploadFonts')
       .name('Upload Fonts (up to 10 x 500 KB)');
  
    
    // Text input with character count update and limit enforcement
    gui.add(guiSettings, 'text')
        .name('Input Text')
        .onChange(value => {
            updateTextFromGUI(value);
        });
  
    guiFontController = gui.add({ fontType: 'Typocut Default' }, 'fontType', ['Typocut Default','Built-in Fonts'])
                           .name('Fonts Used')
                           .onChange(value => {
                            fontType = value;
                            updateLetterObjects();
                            redraw();
    });
  
   guiSourceController = gui.add({ sourceType: 'Gradients' }, 'sourceType', ['Gradients'])
                            .name('Source Type')
                            .onChange(value => {
                                console.log("Source type changed to:", value);
        
        // 1. Handle visibility of gradient settings
                                if (value === 'Gradients') {
                                gradientSettingsFolder.show();
                                sourceImages = [...gradientImages];
                                console.log(`Switched to ${gradientImages.length} gradient images`);
                                } else if (value === 'Uploaded Images') {
                                gradientSettingsFolder.hide();
                                if (uploadedImages.length > 0) {
                                sourceImages = [...uploadedImages];
                                console.log(`Switched to ${uploadedImages.length} uploaded images`);
                                } else {
                                console.log("No uploaded images - reverting to gradients");
                                guiSourceController.setValue('Gradients'); // Auto-revert
                                return;
                                }
                            }
        imageCount = sourceImages.length;
        randomizeLetterImages();
        updateLetterObjects();
        redraw();
    });
  


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
    
    // Add Stats folder last (at the bottom of the GUI)
    const statsFolder = gui.addFolder('Canvas Statistics');
    statsFolder.add(characterStats, 'currentCount').name('Inputted Symbols').disable().listen();
    statsFolder.add(characterStats, 'maxPossible').name('Max Possible Symbols').disable().listen();
    
    // Initialize all the default choices for the things
    updateCharacterStats();
}