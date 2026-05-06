const qrInput = document.getElementById('qrInput');
const qrForm = document.getElementById('qrForm');
const qrSize = document.getElementById('qrSize');
const qrSizeValue = document.getElementById('qrSizeValue');
const embedMode = document.getElementById('embedMode');
const clearBtn = document.getElementById('clearBtn');
const emptyState = document.getElementById('emptyState');
const qrResult = document.getElementById('qrResult');
const qrCanvas = document.getElementById('qrCanvas');
const resultLabel = document.getElementById('resultLabel');
const statusMessage = document.getElementById('statusMessage');
const downloadBtn = document.getElementById('downloadBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const generateBtn = document.getElementById('generateBtn');
const prettyUrlExample = document.getElementById('prettyUrlExample');
const queryUrlExample = document.getElementById('queryUrlExample');
const publicOrigin = 'https://amadolazo.com';

let qr = null;

function safeDecode(value) {
    try {
        return decodeURIComponent(value);
    } catch (error) {
        return value;
    }
}

function isFileProtocol() {
    return window.location.protocol === 'file:';
}

function ensureQrLibrary() {
    if (qr) {
        return true;
    }

    if (typeof window.QRious !== 'function') {
        statusMessage.textContent = 'QR generator library could not be loaded.';
        return false;
    }

    qr = new window.QRious({
        element: qrCanvas,
        value: 'https://amadolazo.com',
        size: Number(qrSize.value),
        background: '#ffffff',
        foreground: '#111111',
        padding: 16
    });

    return true;
}

function getBasePath() {
    const marker = '/qrgenerator/';
    const currentPath = window.location.pathname;
    const matchIndex = currentPath.toLowerCase().indexOf(marker);

    if (matchIndex === -1) {
        return marker;
    }

    return currentPath.slice(0, matchIndex) + marker;
}

function getPagePath() {
    return isFileProtocol() ? `${getBasePath()}index.html` : getBasePath();
}

function canRewriteHistory() {
    return !isFileProtocol() && typeof window.history?.replaceState === 'function';
}

function getPathValue() {
    const basePath = getBasePath();
    const currentPath = window.location.pathname;

    if (!currentPath.startsWith(basePath)) {
        return '';
    }

    const suffix = currentPath.slice(basePath.length).replace(/^\/+|\/+$/g, '');

    if (!suffix || suffix.toLowerCase() === 'index.html') {
        return '';
    }

    return safeDecode(suffix);
}

function getUrlState() {
    const params = new URLSearchParams(window.location.search);
    const text = params.get('text') || params.get('data') || params.get('url') || getPathValue() || safeDecode(window.location.hash.replace(/^#/, ''));
    const size = Number(params.get('size')) || Number(qrSize.value);
    const embed = ['1', 'true', 'yes'].includes((params.get('embed') || '').toLowerCase());

    return {
        text: text ? text.trim() : '',
        size: Math.min(512, Math.max(160, size)),
        embed
    };
}

function buildPrettyUrl(text, size, embed) {
    if (isFileProtocol()) {
        return buildQueryUrl(text, size, embed);
    }

    const encodedText = encodeURIComponent(text);
    const query = new URLSearchParams();

    if (size !== 256) {
        query.set('size', String(size));
    }

    if (embed) {
        query.set('embed', '1');
    }

    const suffix = query.toString() ? `?${query.toString()}` : '';
    return `${publicOrigin}${getBasePath()}${encodedText}${suffix}`;
}

function buildQueryUrl(text, size, embed) {
    const query = new URLSearchParams();
    query.set('text', text);

    if (size !== 256) {
        query.set('size', String(size));
    }

    if (embed) {
        query.set('embed', '1');
    }

    if (isFileProtocol()) {
        return `index.html?${query.toString()}`;
    }

    return `${publicOrigin}${getBasePath()}?${query.toString()}`;
}

function updateExamples(text, size, embed) {
    const exampleText = text || 'https://example.com';
    prettyUrlExample.textContent = buildPrettyUrl(exampleText, size, embed);
    queryUrlExample.textContent = buildQueryUrl(exampleText, size, embed);
}

function setEmbedMode(enabled) {
    document.body.classList.toggle('embed-mode', enabled);
    embedMode.checked = enabled;
}

function setUiState(hasResult) {
    emptyState.hidden = hasResult;
    qrResult.classList.toggle('is-hidden', !hasResult);
}

function updateHistory(text, size, embed) {
    if (!canRewriteHistory()) {
        return;
    }

    const params = new URLSearchParams();

    if (text) {
        // Pretty URLs only work when the site is actually being served.
        const nextPath = `${getBasePath()}${encodeURIComponent(text)}`;

        if (size !== 256) {
            params.set('size', String(size));
        }

        if (embed) {
            params.set('embed', '1');
        }

        const suffix = params.toString() ? `?${params.toString()}` : '';
        window.history.replaceState({}, '', `${nextPath}${suffix}`);
        return;
    }

    if (size !== 256) {
        params.set('size', String(size));
    }

    if (embed) {
        params.set('embed', '1');
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, '', `${getPagePath()}${suffix}`);
}

function renderQr() {
    const text = qrInput.value.trim();
    const size = Number(qrSize.value);
    const embed = embedMode.checked;

    qrSizeValue.textContent = `${size}px`;
    setEmbedMode(embed);
    updateExamples(text, size, embed);

    if (!text) {
        setUiState(false);
        statusMessage.textContent = 'Waiting for input.';
        resultLabel.textContent = '';
        updateHistory('', size, embed);
        return;
    }

    if (!ensureQrLibrary()) {
        setUiState(false);
        return;
    }

    qr.set({
        size,
        value: text
    });

    setUiState(true);
    statusMessage.textContent = 'QR code ready.';
    resultLabel.textContent = text;
    updateHistory(text, size, embed);
}

function downloadQr() {
    const text = qrInput.value.trim();

    if (!text) {
        return;
    }

    const link = document.createElement('a');
    link.href = qrCanvas.toDataURL('image/png');
    link.download = 'amadolazo-qr-code.png';
    link.click();
}

async function copyShareUrl() {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        statusMessage.textContent = 'Copy is not available in this browser.';
        return;
    }

    const text = qrInput.value.trim();
    const size = Number(qrSize.value);
    const embed = embedMode.checked;
    const shareUrl = text ? buildPrettyUrl(text, size, embed) : buildPrettyUrl('https://example.com', size, embed);

    await navigator.clipboard.writeText(shareUrl);
    statusMessage.textContent = 'Share URL copied.';

    window.setTimeout(() => {
        if (qrInput.value.trim()) {
            statusMessage.textContent = 'QR code ready.';
        } else {
            statusMessage.textContent = 'Waiting for input.';
        }
    }, 1800);
}

function handleGenerate(event) {
    event?.preventDefault?.();
    renderQr();
}

generateBtn.addEventListener('click', handleGenerate);

qrSize.addEventListener('input', () => {
    qrSizeValue.textContent = `${qrSize.value}px`;
    if (qrInput.value.trim()) {
        renderQr();
    } else {
        updateExamples('', Number(qrSize.value), embedMode.checked);
    }
});

embedMode.addEventListener('change', () => {
    if (qrInput.value.trim()) {
        renderQr();
    } else {
        setEmbedMode(embedMode.checked);
        updateExamples('', Number(qrSize.value), embedMode.checked);
        updateHistory('', Number(qrSize.value), embedMode.checked);
    }
});

clearBtn.addEventListener('click', () => {
    qrInput.value = '';
    renderQr();
});

downloadBtn.addEventListener('click', downloadQr);
copyLinkBtn.addEventListener('click', () => {
    copyShareUrl().catch(() => {
        statusMessage.textContent = 'Could not copy the URL automatically.';
    });
});

const initialState = getUrlState();
qrInput.value = initialState.text;
qrSize.value = String(initialState.size);
qrSizeValue.textContent = `${initialState.size}px`;
setEmbedMode(initialState.embed);
updateExamples(initialState.text, initialState.size, initialState.embed);
ensureQrLibrary();

if (initialState.text) {
    renderQr();
} else {
    setUiState(false);
}
