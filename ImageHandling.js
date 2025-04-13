// --- Image Loading / Placeholder Generation ---

// Called from setup() in sketch.js
function loadImages() {
    console.log("Loading initial images...");
    
    // Check if gradient images were already created
    if (gradientImages.length > 0) {
        console.log(`Using ${gradientImages.length} existing gradient images.`);
        // Set initial sourceImages to gradients
        sourceImages = [...gradientImages];
        imageCount = sourceImages.length;
        return;
    }

    // Create gradient placeholders
    console.log("Creating gradient placeholders...");
    createPlaceholders();
}

// Creates the placeholder gradient images
function createPlaceholders() {
    console.log("Generating gradient placeholders...");
    
    // Reset gradient images array
    gradientImages = [];
    
    let placeholderWidth = MAX_CELL_SIZE*3;
    let placeholderHeight = MAX_CELL_SIZE*3;
    
    for (let i = 0; i < 4; i++) {
        let placeholder = createPlaceholderImage(placeholderWidth, placeholderHeight, i);
        if (placeholder) {
            gradientImages.push(placeholder);
            console.log(`Created gradient placeholder ${i + 1}`);
        } else {
            console.error(`Failed to create gradient placeholder ${i}`);
        }
    }
    
    // Set sourceImages to the gradient images
    sourceImages = [...gradientImages];
    imageCount = sourceImages.length;
    
    console.log(`Total gradient images created: ${gradientImages.length}`);
}

// Creates a single placeholder image with a gradient pattern
function createPlaceholderImage(w, h, index) {
    let img = createImage(w, h);
    img.pixelDensity=2;
    if (!img) return null;

    img.loadPixels();
    if (!img.pixels || img.pixels.length === 0) {
        console.error("Failed to load pixels for placeholder image.");
        return null;
    }

    // Convert hex colors to RGB arrays
    let startRGB = hexToRgb(startColor);
    let endRGB = hexToRgb(endColor);
    
    console.log(`Creating gradient ${index} with colors: ${startColor} to ${endColor}`);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let r, g, b;
            let pixelIndex = (y * w + x) * 4; // RGBA format

            // Check bounds just in case
            if (pixelIndex + 3 >= img.pixels.length) continue;

            switch (index % 4) {
                case 0: // Horizontal gradient
                    r = map(x, 0, w, startRGB[0], endRGB[0]);
                    g = map(x, 0, w, startRGB[1], endRGB[1]);
                    b = map(x, 0, w, startRGB[2], endRGB[2]);
                    break;
                case 1: // Vertical gradient
                    r = map(y, 0, h, startRGB[0], endRGB[0]);
                    g = map(y, 0, h, startRGB[1], endRGB[1]);
                    b = map(y, 0, h, startRGB[2], endRGB[2]);
                    break;
                case 2: // Radial gradient
                    let radius = dist(0, 0, w / 2, h / 2); radius = max(radius, 1);
                    let distFromCenter = dist(x, y, w / 2, h / 2);
                    let ratio = map(distFromCenter, 0, radius, 0, 1);
                    r = lerp(startRGB[0], endRGB[0], ratio);
                    g = lerp(startRGB[1], endRGB[1], ratio);
                    b = lerp(startRGB[2], endRGB[2], ratio);
                    break;
                default: // Diagonal gradient
                    let diagPos = map(x + y, 0, w + h, 0, 1);
                    r = lerp(startRGB[0], endRGB[0], diagPos);
                    g = lerp(startRGB[1], endRGB[1], diagPos);
                    b = lerp(startRGB[2], endRGB[2], diagPos);
            }

            img.pixels[pixelIndex + 0] = r; // Red
            img.pixels[pixelIndex + 1] = g; // Green
            img.pixels[pixelIndex + 2] = b; // Blue
            img.pixels[pixelIndex + 3] = 255; // Alpha (fully opaque)
        }
    }
    img.updatePixels();
    return img;
}

// Function to handle uploaded image files
function handleImageUpload(files) {
    console.log(`Processing ${files.length} uploaded image files`);
    
    // Remove any existing loading overlay
    background(255);
    
    // Reset uploaded images array
    uploadedImages = [];
    
    // Filter for valid image files and size limit
    let validFiles = [];
    const maxSize = maxFileSize || 2.5 * 1024 * 1024; // 2.5MB in bytes
    const maxCount = maxFileCount || 10; // Maximum number of files
    
    // First validate all files
    for (let i = 0; i < files.length && validFiles.length < maxCount; i++) {
        let file = files[i];
        
        // Check file type
        let validType = file.type === 'image/jpeg' || 
                        file.type === 'image/jpg' || 
                        file.type === 'image/png';
        
        // Check file size
        let validSize = file.size <= maxSize;
        
        if (validType && validSize) {
            validFiles.push(file);
            console.log(`File ${file.name} is valid (${Math.round(file.size/1024)}KB)`);
        } else {
            let reason = !validType ? `invalid type (${file.type})` : `exceeds size limit (${Math.round(file.size/1024)}KB)`;
            console.warn(`Skipping file "${file.name}" (${reason})`);
        }
    }
    
    // If no valid files, revert to placeholders
    if (validFiles.length === 0) {
        console.warn("No valid image files were provided. Using placeholders instead.");
        createPlaceholders();
        return;
    }
    
    // Load valid files into p5.js Image objects
    let loadPromises = validFiles.map((file, index) => {
        return new Promise((resolve, reject) => {
            // Create a temporary URL for the file
            let fileURL = URL.createObjectURL(file);
            
            // Use p5.js loadImage to load the file
            loadImage(
                fileURL, 
                // Success callback
                img => {
                    console.log(`Loaded image ${index + 1}: ${file.name}, Dimensions: ${img.width}x${img.height}`);
                    
                    // Revoke the URL to free up memory
                    URL.revokeObjectURL(fileURL);
                    
                    // Resolve with the loaded image
                    resolve(img);
                },
                // Error callback
                err => {
                    console.error(`Failed to load image "${file.name}":`, err);
                    URL.revokeObjectURL(fileURL);
                    reject(err);
                }
            );
        });
    });
    
    // Wait for all images to load
    Promise.allSettled(loadPromises).then(results => {
        // Filter out successfully loaded images
        uploadedImages = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value)
            .filter(img => img && img.width > 0 && img.height > 0);
        
        console.log(`Image Loading Results: 
            Total attempted: ${validFiles.length}
            Successful loads: ${uploadedImages.length}`);
        
        if (uploadedImages.length > 0) {
            // Successfully loaded some images
            hasUploadedImages = true;
            updateSourceTypeOptions();
            
            // Force redraw when successful
            redraw();
        } else {
            // No valid images loaded
            console.warn("No valid images were loaded. Falling back to placeholders.");
            createPlaceholders();
        }
    });
}

// Function to update gradient placeholders when color settings change
function updateGradients() {
    console.log("Updating gradients with colors:", startColor, endColor);
    
    // Regenerate gradient images with new colors
    createPlaceholders();
    
    // If currently in Gradients mode, update sourceImages
    if (sourceType === 'Gradients') {
        sourceImages = [...gradientImages];
        imageCount = sourceImages.length;
    }
    
    // Update letters with the current image source
    if (typeof updateLetterObjects === 'function') {
        updateLetterObjects();
    } else {
        console.warn("updateLetterObjects function not available for gradient update");
        // If function is not available, force redraw at least
        if (typeof redraw === 'function') {
            redraw();
        }
    }
}