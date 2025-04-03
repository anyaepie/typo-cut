// --- LetterObject Class ---
// Stores properties for a single character instance

class LetterObject {
    constructor(c, x, y, cw, ch, imgIndex) {
        // Validate image index
        if (imgIndex < 0 || imgIndex >= sourceImages.length) {
            console.warn(`Invalid image index ${imgIndex}. Resetting to 0.`);
            imgIndex = 0;
        }

        this.character = c;
        this.x = x;
        this.y = y;
        this.cellWidth = cw;
        this.cellHeight = ch;
        this.imageIndex = imgIndex;
        
        // Initialize noiseSeed ONCE per object instance
        this.noiseSeed = floor(random(1000000));
        
        this.imageSectionPos = [0, 0]; // Stores [x, y] for image crop
        this.textPosition = -1; // Original index in inputText string
        
        // Calculate initial image crop position
        this.updateImageSectionPos();
    }

    getWidth() {
        return this.cellWidth * CELLS_PER_LETTER;
    }

    getHeight() {
        return this.cellHeight * CELLS_PER_LETTER;
    }

    getSpacing() {
        // spacingFactor is global, defined in sketch.js
        return this.getWidth() * spacingFactor;
    }

    // Calculate margins needed for the mask buffer size
    _calculateMargins() {
        // noiseAmount and marginFactor are global
        let maxNoiseDisplacement = max(this.cellWidth, this.cellHeight) * noiseAmount;
        let marginX = this.getWidth() * marginFactor + maxNoiseDisplacement;
        let marginY = this.getHeight() * marginFactor + maxNoiseDisplacement;
        return [marginX, marginY];
    }

    // Calculate the required pixel dimensions for the mask buffer & image crop
    _calculateRequiredDimensions() {
        let margins = this._calculateMargins();
        let letterW = max(1, floor(this.getWidth()));
        let letterH = max(1, floor(this.getHeight()));
        let totalWidth = max(1, floor(letterW + 2 * margins[0]));
        let totalHeight = max(1, floor(letterH + 2 * margins[1]));
        // Return dimensions needed for the offscreen buffer/crop
        return [
            max(letterW, totalWidth),
            max(letterH, totalHeight)
        ];
    }

    // Calculate and store a random top-left position for cropping the source image
    updateImageSectionPos() {
        // Validate source images
        if (!sourceImages || sourceImages.length === 0 || 
            this.imageIndex < 0 || this.imageIndex >= sourceImages.length) {
            console.warn(`Cannot update image section: Invalid image index ${this.imageIndex}`);
            this.imageSectionPos = [0, 0]; 
            return;
        }
        
        let sourceImage = sourceImages[this.imageIndex];
        
        // Check if source image is valid
        if (!sourceImage || !sourceImage.width || !sourceImage.height || 
            sourceImage.width <= 0 || sourceImage.height <= 0) {
            console.warn(`Cannot update image section: Invalid source image at index ${this.imageIndex}`);
            this.imageSectionPos = [0, 0]; 
            return;
        }
        
        // Get dimensions needed for the crop
        let dimensions = this._calculateRequiredDimensions();
        if (dimensions[0] <= 0 || dimensions[1] <= 0) {
            console.warn("Cannot update image section: Invalid calculated dimensions.");
            this.imageSectionPos = [0, 0]; 
            return;
        }
        
        // Calculate max valid top-left corner for the crop
        let maxX = sourceImage.width - dimensions[0];
        let maxY = sourceImage.height - dimensions[1];
        
        // Set random position within valid bounds
        this.imageSectionPos[0] = (maxX > 0) ? floor(random(maxX)) : 0;
        this.imageSectionPos[1] = (maxY > 0) ? floor(random(maxY)) : 0;
    }

    // Check if a point (px, py) is within the letter's bounding box
    contains(px, py) {
        return (px >= this.x && px <= this.x + this.getWidth() &&
                py >= this.y && py <= this.y + this.getHeight());
    }

    // Main drawing function for this letter instance
    draw() {
        // Validate image index before drawing
        if (this.imageIndex < 0 || this.imageIndex >= sourceImages.length) {
            console.warn(`Invalid image index ${this.imageIndex} when drawing. Resetting to 0.`);
            this.imageIndex = 0;
        }

        // <<< SET SEED HERE - using the instance's stored seed >>>
        // This ensures consistent random numbers for this letter's drawing operations this frame
        randomSeed(this.noiseSeed);

        // Call the masking/drawing function (defined in LetterRendering.js)
        // It will use the seed that was just set.
        drawLetterWithMask(
            this.character, this.x, this.y,
            this.cellWidth, this.cellHeight,
            this.imageIndex,
            this.imageSectionPos,
            isInvertedMask // Global variable from sketch.js
        );
    }

    // Update the letter's top-left position
    moveTo(newX, newY) {
        this.x = newX;
        this.y = newY;
    }
}