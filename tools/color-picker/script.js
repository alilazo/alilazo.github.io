const nativeColor = document.getElementById('nativeColor');
const hueRange = document.getElementById('hueRange');
const satRange = document.getElementById('satRange');
const lightRange = document.getElementById('lightRange');
const hueValue = document.getElementById('hueValue');
const satValue = document.getElementById('satValue');
const lightValue = document.getElementById('lightValue');
const previewCard = document.getElementById('previewCard');
const selectedName = document.getElementById('selectedName');
const selectedHex = document.getElementById('selectedHex');
const rgbValue = document.getElementById('rgbValue');
const hslValue = document.getElementById('hslValue');
const hexValue = document.getElementById('hexValue');
const statusMessage = document.getElementById('statusMessage');
const copyHexBtn = document.getElementById('copyHexBtn');
const copyRgbBtn = document.getElementById('copyRgbBtn');
const copyHslBtn = document.getElementById('copyHslBtn');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const converterLink = document.getElementById('converterLink');
const paletteGrid = document.getElementById('paletteGrid');

const publicPickerUrl = 'https://amadolazo.com/tools/color-picker/';

const paletteColors = [
    { name: 'Swiss Signal Red', hex: '#e63946', use: 'Portfolio accent' },
    { name: 'EMS Command Navy', hex: '#12355b', use: 'Operational dashboards' },
    { name: 'Power Apps Plum', hex: '#742774', use: 'Power Apps work' },
    { name: 'CareForge Violet', hex: '#6d28d9', use: 'AI health tools' },
    { name: 'Unit Ready Mint', hex: '#10b981', use: 'Readiness states' },
    { name: 'Signal Amber', hex: '#ffb703', use: 'Attention moments' },
    { name: 'New Mexico Clay', hex: '#c2410c', use: 'Warm personal accents' },
    { name: 'Dispatch Console Black', hex: '#0f172a', use: 'High-focus UI' }
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
    const value = parseInt(hex.slice(1), 16);

    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
    };
}

function rgbToHex({ r, g, b }) {
    return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
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

function hslToRgb({ h, s, l }) {
    const saturation = s / 100;
    const lightness = l / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs((h / 60) % 2 - 1));
    const match = lightness - chroma / 2;
    let r1 = 0;
    let g1 = 0;
    let b1 = 0;

    if (h < 60) {
        r1 = chroma;
        g1 = x;
    } else if (h < 120) {
        r1 = x;
        g1 = chroma;
    } else if (h < 180) {
        g1 = chroma;
        b1 = x;
    } else if (h < 240) {
        g1 = x;
        b1 = chroma;
    } else if (h < 300) {
        r1 = x;
        b1 = chroma;
    } else {
        r1 = chroma;
        b1 = x;
    }

    return {
        r: Math.round((r1 + match) * 255),
        g: Math.round((g1 + match) * 255),
        b: Math.round((b1 + match) * 255)
    };
}

function getReadableTextColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.62 ? '#171717' : '#ffffff';
}

function getColorName(hex) {
    return paletteColors.find((color) => color.hex.toLowerCase() === hex.toLowerCase())?.name || 'Custom Pick';
}

function buildPickerUrl(hex) {
    return `${publicPickerUrl}?hex=${hex.replace('#', '')}`;
}

function setColor(hex, syncSliders = true) {
    const normalizedHex = normalizeHex(hex) || '#e63946';
    const rgb = hexToRgb(normalizedHex);
    const hsl = rgbToHsl(rgb);
    const rgbText = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hslText = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    const readableColor = getReadableTextColor(normalizedHex);

    document.documentElement.style.setProperty('--picked', normalizedHex);
    nativeColor.value = normalizedHex;
    previewCard.style.color = readableColor;
    selectedName.textContent = getColorName(normalizedHex);
    selectedHex.textContent = normalizedHex;
    hexValue.textContent = normalizedHex;
    rgbValue.textContent = rgbText;
    hslValue.textContent = hslText;
    statusMessage.textContent = `${getColorName(normalizedHex)} is ready.`;
    converterLink.href = `../color/index.html?hex=${normalizedHex.replace('#', '')}`;

    if (syncSliders) {
        hueRange.value = hsl.h;
        satRange.value = hsl.s;
        lightRange.value = hsl.l;
    }

    hueValue.textContent = hueRange.value;
    satValue.textContent = `${satRange.value}%`;
    lightValue.textContent = `${lightRange.value}%`;
}

function setColorFromSliders() {
    const hsl = {
        h: Number(hueRange.value),
        s: Number(satRange.value),
        l: Number(lightRange.value)
    };

    setColor(rgbToHex(hslToRgb(hsl)), false);
}

async function copyText(value, label) {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        statusMessage.textContent = 'Copy is not available in this browser.';
        return;
    }

    await navigator.clipboard.writeText(value);
    statusMessage.textContent = `${label} copied.`;
}

function renderPalette() {
    paletteGrid.innerHTML = '';

    paletteColors.forEach((color) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'palette-button';
        button.style.backgroundColor = color.hex;
        button.style.color = getReadableTextColor(color.hex);
        button.setAttribute('data-umami-event', `Color Picker - Palette ${color.name}`);
        button.innerHTML = `
            <span class="palette-name">${color.name}</span>
            <span>${color.hex}</span>
            <span>${color.use}</span>
        `;
        button.addEventListener('click', () => setColor(color.hex));
        paletteGrid.appendChild(button);
    });
}

nativeColor.addEventListener('input', (event) => setColor(event.target.value));
[hueRange, satRange, lightRange].forEach((slider) => {
    slider.addEventListener('input', setColorFromSliders);
});

copyHexBtn.addEventListener('click', () => {
    copyText(hexValue.textContent, 'HEX').catch(() => {
        statusMessage.textContent = 'Could not copy HEX automatically.';
    });
});

copyRgbBtn.addEventListener('click', () => {
    copyText(rgbValue.textContent, 'RGB').catch(() => {
        statusMessage.textContent = 'Could not copy RGB automatically.';
    });
});

copyHslBtn.addEventListener('click', () => {
    copyText(hslValue.textContent, 'HSL').catch(() => {
        statusMessage.textContent = 'Could not copy HSL automatically.';
    });
});

copyUrlBtn.addEventListener('click', () => {
    copyText(buildPickerUrl(hexValue.textContent), 'Picker URL').catch(() => {
        statusMessage.textContent = 'Could not copy the picker URL automatically.';
    });
});

renderPalette();

const initialHex = new URLSearchParams(window.location.search).get('hex') || window.location.hash.replace(/^#/, '');
setColor(normalizeHex(initialHex) || '#e63946');
