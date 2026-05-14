const hexInput = document.getElementById('hexInput');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const emptyState = document.getElementById('emptyState');
const colorResult = document.getElementById('colorResult');
const colorSwatch = document.getElementById('colorSwatch');
const colorName = document.getElementById('colorName');
const colorValues = document.getElementById('colorValues');
const jsonOutput = document.getElementById('jsonOutput');
const statusMessage = document.getElementById('statusMessage');
const copyJsonBtn = document.getElementById('copyJsonBtn');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const apiExample = document.getElementById('apiExample');
const recommendedColors = document.getElementById('recommendedColors');

const publicToolUrl = 'https://amadolazo.com/tools/color/';

const namedColors = [
    { name: 'Swiss Signal Red', hex: '#e63946', use: 'Action buttons, alerts, and primary accents' },
    { name: 'Scandinavian Paper', hex: '#f7f5f0', use: 'Warm page backgrounds and calm surfaces' },
    { name: 'Austin Night Ink', hex: '#171717', use: 'High-contrast text and borders' },
    { name: 'Civic Blue', hex: '#2563eb', use: 'Trustworthy public-sector interfaces' },
    { name: 'Deployment Green', hex: '#2f855a', use: 'Operational success states and readiness cues' },
    { name: 'Signal Amber', hex: '#ffb703', use: 'Warnings, pending states, and bright highlights' },
    { name: 'CareForge Violet', hex: '#6d28d9', use: 'AI product accents and premium tool surfaces' },
    { name: 'Fleet Slate', hex: '#475569', use: 'Dashboards, secondary text, and data-heavy UI' },
    { name: 'EMS Command Navy', hex: '#12355b', use: 'Command dashboards, headers, and serious operational screens' },
    { name: 'CAD Event Cyan', hex: '#0891b2', use: 'Live event indicators, links, and secondary actions' },
    { name: 'Inventory SQL Indigo', hex: '#3730a3', use: 'Database-backed tools and technical product accents' },
    { name: 'Chief Gold', hex: '#d97706', use: 'Priority callouts, leadership views, and decision points' },
    { name: 'Unit Ready Mint', hex: '#10b981', use: 'Available status, readiness labels, and completion states' },
    { name: 'Out Of Service Crimson', hex: '#b91c1c', use: 'Unavailable units, blockers, and high-priority errors' },
    { name: 'Veteran Support Teal', hex: '#0f766e', use: 'Health technology, calm states, and supportive UI moments' },
    { name: 'Power Apps Plum', hex: '#742774', use: 'Microsoft Power Apps references and low-code system branding' },
    { name: 'ETL Pipeline Purple', hex: '#7c3aed', use: 'Data movement, integrations, and automation flows' },
    { name: 'Municipal Concrete', hex: '#d6d3d1', use: 'Neutral cards, admin screens, and public-sector layouts' },
    { name: 'Dispatch Console Black', hex: '#0f172a', use: 'High-focus dashboards and control room style interfaces' },
    { name: 'New Mexico Clay', hex: '#c2410c', use: 'Warm personal accents and outdoor-inspired visual moments' },
    { name: 'Island University Blue', hex: '#005f86', use: 'Academic, recognition, and professional credibility sections' },
    { name: 'Minimalist Sand', hex: '#e5e0d8', use: 'Soft sections, muted panels, and Scandinavian page blocks' },
    { name: 'GitHub Graphite', hex: '#24292f', use: 'Developer links, code utilities, and technical footers' },
    { name: 'Umami Orchid', hex: '#a855f7', use: 'Analytics, tracking events, and product insight highlights' },
    { name: 'QR Utility Lime', hex: '#84cc16', use: 'Free public tools, lightweight utilities, and success accents' },
    { name: 'Stellar Scan Blue', hex: '#1d4ed8', use: 'Bluetooth scanning flows and mobile inventory UI' },
    { name: 'Care Coach Rose', hex: '#be185d', use: 'Human-centered AI, coaching interfaces, and warm CTAs' },
    { name: 'Zero Gravity Magenta', hex: '#db2777', use: 'Experimental interactions, easter eggs, and playful highlights' }
];

function normalizeHex(value) {
    const cleanValue = value.trim().replace(/^#/, '');

    if (/^[0-9a-fA-F]{3}$/.test(cleanValue)) {
        return `#${cleanValue.split('').map((char) => char + char).join('').toLowerCase()}`;
    }

    if (/^[0-9a-fA-F]{6}$/.test(cleanValue)) {
        return `#${cleanValue.toLowerCase()}`;
    }

    return null;
}

function hexToRgb(hex) {
    const numericValue = parseInt(hex.slice(1), 16);

    return {
        r: (numericValue >> 16) & 255,
        g: (numericValue >> 8) & 255,
        b: numericValue & 255
    };
}

function rgbToHsl({ r, g, b }) {
    const normalizedR = r / 255;
    const normalizedG = g / 255;
    const normalizedB = b / 255;
    const max = Math.max(normalizedR, normalizedG, normalizedB);
    const min = Math.min(normalizedR, normalizedG, normalizedB);
    const lightness = (max + min) / 2;

    if (max === min) {
        return { h: 0, s: 0, l: Math.round(lightness * 100) };
    }

    const delta = max - min;
    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    let hue;

    if (max === normalizedR) {
        hue = (normalizedG - normalizedB) / delta + (normalizedG < normalizedB ? 6 : 0);
    } else if (max === normalizedG) {
        hue = (normalizedB - normalizedR) / delta + 2;
    } else {
        hue = (normalizedR - normalizedG) / delta + 4;
    }

    return {
        h: Math.round(hue * 60),
        s: Math.round(saturation * 100),
        l: Math.round(lightness * 100)
    };
}

function getColorName(hex) {
    return namedColors.find((color) => color.hex.toLowerCase() === hex.toLowerCase())?.name || 'Converted Color';
}

function getColorPayload(hex) {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb);
    const name = getColorName(hex);

    return {
        name,
        hex,
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    };
}

function getReadableTextColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.62 ? '#171717' : '#ffffff';
}

function buildShareUrl(hex) {
    return `${publicToolUrl}?hex=${encodeURIComponent(hex.replace('#', ''))}`;
}

function updateApiExample(hex = '#e63946') {
    apiExample.textContent = buildShareUrl(hex);
}

function setResultState(hasResult) {
    emptyState.hidden = hasResult;
    colorResult.classList.toggle('is-hidden', !hasResult);
}

function renderColor(hex) {
    const payload = getColorPayload(hex);
    const json = JSON.stringify(payload, null, 2);

    colorSwatch.style.backgroundColor = payload.hex;
    colorName.textContent = payload.name;
    colorValues.textContent = `${payload.hex} | ${payload.rgb} | ${payload.hsl}`;
    jsonOutput.textContent = json;
    statusMessage.textContent = 'Color conversion ready.';
    updateApiExample(payload.hex);
    setResultState(true);
}

function convertColor() {
    const normalizedHex = normalizeHex(hexInput.value);

    if (!normalizedHex) {
        statusMessage.textContent = 'Enter a valid 3 or 6 digit HEX color.';
        setResultState(false);
        return;
    }

    hexInput.value = normalizedHex;
    renderColor(normalizedHex);
}

function clearColor() {
    hexInput.value = '';
    statusMessage.textContent = 'Waiting for a HEX color.';
    updateApiExample();
    setResultState(false);
}

async function copyText(value, successMessage) {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        statusMessage.textContent = 'Copy is not available in this browser.';
        return;
    }

    await navigator.clipboard.writeText(value);
    statusMessage.textContent = successMessage;
}

function renderRecommendedColors() {
    recommendedColors.innerHTML = '';

    namedColors.forEach((color) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'recommended-color';
        button.style.backgroundColor = color.hex;
        button.style.color = getReadableTextColor(color.hex);
        button.setAttribute('data-umami-event', `Color Converter - Recommended ${color.name}`);
        button.innerHTML = `
            <span class="recommended-name">${color.name}</span>
            <span class="recommended-meta">${color.hex}</span>
            <span>${color.use}</span>
        `;
        button.addEventListener('click', () => {
            hexInput.value = color.hex;
            renderColor(color.hex);
        });
        recommendedColors.appendChild(button);
    });
}

convertBtn.addEventListener('click', convertColor);
clearBtn.addEventListener('click', clearColor);
hexInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        convertColor();
    }
});

copyJsonBtn.addEventListener('click', () => {
    copyText(jsonOutput.textContent, 'JSON copied.').catch(() => {
        statusMessage.textContent = 'Could not copy JSON automatically.';
    });
});

copyUrlBtn.addEventListener('click', () => {
    const normalizedHex = normalizeHex(hexInput.value);
    const url = buildShareUrl(normalizedHex || '#e63946');

    copyText(url, 'Share URL copied.').catch(() => {
        statusMessage.textContent = 'Could not copy the URL automatically.';
    });
});

renderRecommendedColors();
updateApiExample();

const initialHex = new URLSearchParams(window.location.search).get('hex') || window.location.hash.replace(/^#/, '');
const normalizedInitialHex = normalizeHex(initialHex);

if (normalizedInitialHex) {
    hexInput.value = normalizedInitialHex;
    renderColor(normalizedInitialHex);
} else {
    setResultState(false);
}
