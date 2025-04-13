// constants.js - All global constants and state variables for Typocut
// 
// To be imported by other files

// --- Global Settings (Many controlled by GUI) ---
let cellWidth = 30;
let cellHeight = 60; // 2:1 ratio initially
let noiseAmount = 0.10; // Starting with some noise, but not max
let isInvertedMask = false; // Boolean state for mask type
let spacingFactor = 0.15; // Letter spacing
let lineSpacingFactor = 0.1; // Line spacing
let marginFactor = 0.05; // For mask buffer calculations

// --- Gradient settings ---
// Using hex format for better compatibility with lil-gui
let startColor ="#D3F11E"; // Default start color
let endColor = "#FFADCF";   // Default end color

// --- Source type selection ---
let sourceType = "Gradients"; // "Gradients" or "Uploaded Files"

// --- Image management ---
let sourceImages = []; // Current active images
let gradientImages = []; // Stored gradient images
let uploadedImages = []; // Stored uploaded images
let imageCount = 0;

// --- File uploader state ---
let fileInput; // File input element
let fileInputElement = null;
let maxFileCount = 10;
let maxFileSize = 2.5 * 1024 * 1024; // 2.5MB in bytes
let hasUploadedImages = false; // Flag to track if user has uploaded images
let savingPixelDensity=4;

// --- Font Uploading Stuff ---
let fontType = "Typocut Default"; 
let existingFontCollection = [];
let uploadedFontCollection = [];
let fontFileInputElement = null;  // Hidden input for font uploads
const existingFontFilenames = [
    "cutoutoff.otf",
    "simpleslum.ttf",
    "survivant.ttf",
    "wunderbar.ttf",
    "witless.ttf",
    "troika.otf",
    "notqr.ttf",
    "rocks.ttf"
];

// --- Limits and Constants ---
const MIN_CELL_SIZE = 20;
const MAX_CELL_SIZE = 200;
const CELLS_PER_LETTER = 3;
const MIN_NOISE = 0.00;
const MAX_NOISE = 0.5;
const MIN_SPACING = 0.0;
const MAX_SPACING = 1.0;
const MIN_LINE_SPACING = 0.1;
const MAX_LINE_SPACING = 0.5;

// --- Text and Layout State ---
let inputText = "TYPOCUT";
let letters = []; // Array to hold LetterObject instances
let boundaryPercent = 0.01;
let boundary, usableWidth, usableHeight; // Canvas layout helpers

// --- Interaction State ---
let mouseDragging = false;
let selectedLetterIndex = -1;
let dragOffsetX, dragOffsetY; // For smooth dragging relative to click point

// --- UI Variables ---
let gui; // For lil-gui panel
let guiSourceController=null; // For dynamic source selection controls
let gradientSettingsFolder; // For gradient color settings
let guiFontController = null;
let statusMessage='';

// Note: Global image variables `sourceImages`, `imageCount` are in ImageHandling.js
// Note: Global sticker sheet variables `showPreview`, etc. are in StickerSheet.js

// --- Helper functions ---
// Convert hex color to RGB array - this is legacy as I later read that you can actually consume RGB from GUI directly
function hexToRgb(hex) {
  // Remove the hash character if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    // Short form #RGB
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else if (hex.length === 6) {
    // Long form #RRGGBB
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    // Invalid hex, return black
    console.error("Invalid hex color: " + hex);
    return [0, 0, 0];
  }
  
  return [r, g, b];
}