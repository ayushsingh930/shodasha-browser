#!/usr/bin/env node

/**
 * Premium Design Palette Generator
 * Generates color palette CSS custom properties and JSON output
 *
 * Usage:
 *   node generate-palette.js [mode]            Generate a palette by mode
 *   node generate-palette.js --list            List all available modes
 *   node generate-palette.js --help            Show this help message
 *   node generate-palette.js --primary #HEX    Use custom primary color
 *   node generate-palette.js --output file     Write output to file (use .css or .json extension)
 *   node generate-palette.js --json            Output JSON only
 *   node generate-palette.js --css             Output CSS only
 *
 * Modes: minimalist, luxury, bold, earthy, neon, pastel
 */

'use strict';

// ---------------------------------------------------------------------------
// Color Utilities
// ---------------------------------------------------------------------------

/**
 * Convert a hex color string to its RGBA components (0-255)
 * @param {string} hex - Hex color string (e.g. "#FF6B6B" or "FF6B6B")
 * @returns {{ r: number, g: number, b: number } | null}
 */
function hexToRgb(hex) {
  const cleaned = hex.replace(/^#/, '');
  if (!/^[0-9A-Fa-f]{6}$/.test(cleaned) && !/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
    return null;
  }
  let full;
  if (cleaned.length === 3) {
    full = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
  } else {
    full = cleaned;
  }
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Linearize an sRGB channel value for relative luminance calculation
 * @param {number} channel - 0-255 integer
 * @returns {number}
 */
function linearize(channel) {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance per WCAG 2.1
 * @param {string} hex - Hex color
 * @returns {number | null}
 */
function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

/**
 * Calculate WCAG contrast ratio between two hex colors
 * @param {string} hex1 - Foreground color
 * @param {string} hex2 - Background color
 * @returns {number | null}
 */
function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Grade contrast ratio per WCAG
 * @param {number} ratio
 * @returns {{ aa: boolean, aaa: boolean, aaLarge: boolean, label: string }}
 */
function gradeContrast(ratio) {
  const aa = ratio >= 4.5;
  const aaa = ratio >= 7;
  const aaLarge = ratio >= 3;
  let label = 'FAIL';
  if (aaa) label = 'AAA';
  else if (aa) label = 'AA';
  else if (aaLarge) label = 'AA (large)';
  return { aa, aaa, aaLarge, label, ratio: ratio.toFixed(2) };
}

/**
 * Validate and normalize a hex color string
 * @param {string} str
 * @returns {string | null}
 */
function validateHex(str) {
  const cleaned = str.replace(/^#/, '');
  if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) return '#' + cleaned.toUpperCase();
  if (/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
    return '#' + cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
  }
  return null;
}

/**
 * Darken or lighten a hex color by a percentage factor
 * @param {string} hex
 * @param {number} factor - positive to lighten, negative to darken (e.g. -0.1 = 10% darker)
 * @returns {string}
 */
function adjustBrightness(hex, factor) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.max(0, Math.round(rgb.r + (255 - rgb.r) * Math.max(0, factor) + rgb.r * Math.min(0, factor))));
  const g = Math.min(255, Math.max(0, Math.round(rgb.g + (255 - rgb.g) * Math.max(0, factor) + rgb.g * Math.min(0, factor))));
  const b = Math.min(255, Math.max(0, Math.round(rgb.b + (255 - rgb.b) * Math.max(0, factor) + rgb.b * Math.min(0, factor))));
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ---------------------------------------------------------------------------
// Palette Definitions
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} PaletteColorSet
 * @property {string} background
 * @property {string} background-alt
 * @property {string} text
 * @property {string} text-secondary
 * @property {string} accent
 * @property {string} accent-hover
 * @property {string} secondary
 * @property {string} border
 * @property {string} [gradient-start]
 * @property {string} [gradient-end]
 * @property {string} [highlight]
 * @property {string} success
 * @property {string} warning
 * @property {string} error
 */

/** @type {Object<string, { name: string, colors: PaletteColorSet }>} */
const palettes = {
  minimalist: {
    name: 'Modern Minimalist',
    colors: {
      background: '#FFFFFF',
      'background-alt': '#F8F9FA',
      text: '#1A1A2E',
      'text-secondary': '#6B7280',
      accent: '#4F46E5',
      'accent-hover': '#4338CA',
      secondary: '#E8E8EC',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  luxury: {
    name: 'Dark Luxury',
    colors: {
      background: '#0A0A0A',
      'background-alt': '#1A1A1A',
      text: '#F5F0EB',
      'text-secondary': '#A09888',
      accent: '#C9A96E',
      'accent-hover': '#D4AF37',
      secondary: '#2A2A2A',
      border: '#333333',
      highlight: '#F5E6C8',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  bold: {
    name: 'Bold & Expressive',
    colors: {
      background: '#0F0F1A',
      'background-alt': '#1E1E3F',
      text: '#FFFFFF',
      'text-secondary': '#B0B0C8',
      accent: '#FF6B6B',
      'accent-hover': '#FF8E8E',
      secondary: '#2D2D5E',
      'gradient-start': '#FF6B6B',
      'gradient-end': '#7C3AED',
      border: '#2D2D5E',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  earthy: {
    name: 'Earthy Premium',
    colors: {
      background: '#FAF7F2',
      'background-alt': '#F5F0EB',
      text: '#2C1810',
      'text-secondary': '#6B5B50',
      accent: '#8B6F47',
      'accent-hover': '#A67C52',
      secondary: '#E8DDD0',
      border: '#D4C5B2',
      highlight: '#C9A96E',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  neon: {
    name: 'Cyber Neon',
    colors: {
      background: '#0A0B1A',
      'background-alt': '#12132A',
      text: '#E0E0FF',
      'text-secondary': '#8888BB',
      accent: '#00FFC8',
      'accent-hover': '#33FFD6',
      secondary: '#1A1B3A',
      'gradient-start': '#00FFC8',
      'gradient-end': '#7B2FFF',
      border: '#2A2B4A',
      highlight: '#FF00E5',
      success: '#00FF88',
      warning: '#FFD700',
      error: '#FF3355',
    },
  },
  pastel: {
    name: 'Soft Pastel',
    colors: {
      background: '#FFF8F5',
      'background-alt': '#FFF0EB',
      text: '#3D2C2E',
      'text-secondary': '#8B7A7C',
      accent: '#A8D8EA',
      'accent-hover': '#8EC8DC',
      secondary: '#F0E4E0',
      border: '#E8D5CE',
      highlight: '#F7D1D1',
      success: '#B5EAD7',
      warning: '#FFDAC1',
      error: '#FF9AA2',
    },
  },
};

const MODE_NAMES = Object.keys(palettes);

// ---------------------------------------------------------------------------
// CSS / JSON Generation
// ---------------------------------------------------------------------------

/**
 * Format custom-property key from a color key
 * @param {string} key
 * @returns {string}
 */
function propName(key) {
  return `--color-${key}`;
}

/**
 * Generate CSS custom-property string with labelled sections
 * @param {PaletteColorSet} colors
 * @returns {string}
 */
function generateCSS(colors) {
  const grouped = {
    'Background': ['background', 'background-alt'],
    'Text': ['text', 'text-secondary'],
    'Action': ['accent', 'accent-hover'],
    'Surface': ['secondary', 'border'],
    'Gradient': ['gradient-start', 'gradient-end'],
    'Highlight': ['highlight'],
    'Feedback': ['success', 'warning', 'error'],
  };

  const lines = [];
  for (const [groupName, keys] of Object.entries(grouped)) {
    const defined = keys.filter(k => k in colors);
    if (defined.length === 0) continue;
    lines.push(`  /* ${groupName} */`);
    for (const k of defined) {
      lines.push(`  ${propName(k)}: ${colors[k]};`);
    }
    lines.push('');
  }

  return `:root {\n${lines.join('\n')}}`;
}

/**
 * Build a compact JSON representation of the palette
 * @param {PaletteColorSet} colors
 * @returns {string}
 */
function generateJSON(colors) {
  const ordered = {};
  const order = [
    'background', 'background-alt', 'text', 'text-secondary',
    'accent', 'accent-hover', 'secondary', 'border',
    'gradient-start', 'gradient-end', 'highlight',
    'success', 'warning', 'error',
  ];
  for (const k of order) {
    if (k in colors) ordered[k] = colors[k];
  }
  return JSON.stringify(ordered, null, 2);
}

/**
 * Run WCAG contrast checks on text/action pairs against background
 * @param {PaletteColorSet} colors
 * @returns {Array<{ pair: string, fg: string, bg: string, ratio: number | null, grade: string }>}
 */
function checkContrast(colors) {
  const checks = [
    { pair: 'text on background', fg: 'text', bg: 'background' },
    { pair: 'text-secondary on background', fg: 'text-secondary', bg: 'background' },
    { pair: 'accent on background', fg: 'accent', bg: 'background' },
    { pair: 'text on alt background', fg: 'text', bg: 'background-alt' },
    { pair: 'accent on alt background', fg: 'accent', bg: 'background-alt' },
  ];
  return checks.map(({ pair, fg, bg }) => {
    const fgColor = colors[fg];
    const bgColor = colors[bg];
    if (!fgColor || !bgColor) {
      return { pair, fg: fgColor || '?', bg: bgColor || '?', ratio: null, grade: 'SKIP' };
    }
    const ratio = contrastRatio(fgColor, bgColor);
    const grade = ratio !== null ? gradeContrast(ratio).label : 'ERR';
    return { pair, fg: fgColor, bg: bgColor, ratio, grade };
  });
}

/**
 * Apply a custom primary color to a palette, deriving accent, accent-hover, etc.
 * @param {PaletteColorSet} colors
 * @param {string} primaryHex - validated hex string
 * @returns {PaletteColorSet}
 */
function applyCustomPrimary(colors, primaryHex) {
  return {
    ...colors,
    accent: primaryHex,
    'accent-hover': adjustBrightness(primaryHex, -0.1),
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`
  Premium Design — Palette Generator
  ===================================

  USAGE
    node generate-palette.js [mode] [options]

  MODES
${MODE_NAMES.map(m => `    ${m.padEnd(18)}${palettes[m].name}`).join('\n')}

  OPTIONS
    --help, -h            Show this help message
    --list, -l            List all available modes with descriptions
    --primary <hex>       Override the accent color with a custom hex value
    --output <file>       Write output to file (.css / .json extension)
    --json                Output JSON only (omit CSS)
    --css                 Output CSS only (omit JSON)
    --contrast            Include WCAG contrast analysis in output

  EXAMPLES
    node generate-palette.js luxury
    node generate-palette.js neon --primary "#FF6600"
    node generate-palette.js --list
    node generate-palette.js earthy --output palette.css
    node generate-palette.js bold --json --contrast
`);
}

function printList() {
  console.log('\n  Available Palette Modes:\n');
  for (const mode of MODE_NAMES) {
    const { name, colors } = palettes[mode];
    const accent = colors.accent || 'N/A';
    const bg = colors.background || 'N/A';
    console.log(`  ${mode.padEnd(18)}${name.padEnd(24)} accent: ${accent}  bg: ${bg}`);
  }
  console.log('');
}

/**
 * Parse CLI arguments
 * @param {string[]} args - process.argv slice(2)
 * @returns {{ mode: string|null, help: boolean, list: boolean, primary: string|null, output: string|null, jsonOnly: boolean, cssOnly: boolean, contrast: boolean }}
 */
function parseArgs(args) {
  const result = {
    mode: null,
    help: false,
    list: false,
    primary: null,
    output: null,
    jsonOnly: false,
    cssOnly: false,
    contrast: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    switch (arg) {
      case '--help':
      case '-h':
        result.help = true;
        break;
      case '--list':
      case '-l':
        result.list = true;
        break;
      case '--primary':
        result.primary = args[++i] || null;
        break;
      case '--output':
        result.output = args[++i] || null;
        break;
      case '--json':
        result.jsonOnly = true;
        break;
      case '--css':
        result.cssOnly = true;
        break;
      case '--contrast':
        result.contrast = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          console.error('Use --help to see available options.');
          process.exit(1);
        } else if (!result.mode) {
          result.mode = arg;
        } else {
          console.error(`Unexpected argument: ${arg}`);
          process.exit(1);
        }
    }
    i++;
  }

  if (!result.mode && !result.help && !result.list) {
    result.mode = 'minimalist';
  }

  return result;
}

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (opts.list) {
    printList();
    process.exit(0);
  }

  const mode = opts.mode;
  if (!mode) {
    console.error('No mode specified. Use --help for usage information.');
    process.exit(1);
  }

  let palette = palettes[mode];
  if (!palette) {
    console.error(`\n  Unknown mode: "${mode}"`);
    console.error(`  Available modes: ${MODE_NAMES.join(', ')}\n`);
    process.exit(1);
  }

  // Apply custom primary color if provided
  let colors = { ...palette.colors };
  if (opts.primary) {
    const valid = validateHex(opts.primary);
    if (!valid) {
      console.error(`\n  Invalid hex color: "${opts.primary}"`);
      console.error('  Provide a standard 3- or 6-digit hex value (e.g. #FF6600)\n');
      process.exit(1);
    }
    colors = applyCustomPrimary(colors, valid);
  }

  // Validate all colors in the palette
  const invalidColors = Object.entries(colors).filter(([k, v]) => !validateHex(v));
  if (invalidColors.length > 0) {
    console.error('\n  Warning: The following palette color values are not valid hex:\n');
    for (const [k, v] of invalidColors) {
      console.error(`    ${k}: ${v}`);
    }
    console.error('');
  }

  // Generate outputs
  const css = generateCSS(colors);
  const json = generateJSON(colors);
  const output = [];

  output.push(`/* ============================================================`);
  output.push(` * Palette: ${palette.name}${opts.primary ? ' (custom primary)' : ''}`);
  output.push(` * Mode:    ${mode}`);
  output.push(` * Generated: ${new Date().toISOString().split('T')[0]}`);
  output.push(` * ============================================================ */`);
  output.push('');

  if (!opts.jsonOnly) {
    output.push(css);
    output.push('');
  }

  if (!opts.cssOnly) {
    output.push('/* JSON representation */');
    output.push(`/*${'*'.repeat(60)}`);
    output.push(' * Copy the object below for programmatic use');
    output.push(` ${'*'.repeat(60)}/`);
    output.push(json);
    output.push('');
  }

  // Contrast analysis
  if (opts.contrast) {
    output.push('/* WCAG Contrast Analysis */');
    output.push('/* ======================== */');
    output.push('/* Ratio thresholds: AA=4.5:1, AA-large=3:1, AAA=7:1 */');
    for (const { pair, fg, bg, ratio, grade } of checkContrast(colors)) {
      const r = ratio !== null ? `${ratio.toFixed(2)}:1` : 'N/A';
      output.push(`/* ${pair.padEnd(32)} ${r.padEnd(10)} ${grade.padEnd(12)} fg:${fg}  bg:${bg} */`);
    }
    output.push('');
  }

  const fullOutput = output.join('\n');

  // Write to file or stdout
  if (opts.output) {
    const fs = require('fs');
    try {
      fs.writeFileSync(opts.output, fullOutput, 'utf-8');
      console.log(`Palette written to: ${opts.output}`);
    } catch (err) {
      console.error(`Failed to write output file: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.log(fullOutput);
  }
}

main();
