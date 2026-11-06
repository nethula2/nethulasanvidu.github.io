/**
 * EXACT YOUTUBE DESKTOP SIMULATOR & MULTI-SLOT THUMBNAIL LAB
 * Features:
 * - 100% Fictional & Realistic Channels / Titles
 * - Multi-Slot Thumbnail Variation Testing (Up to 8 active slots)
 * - Pixel-perfect YouTube UI Layout (56px Header, 52px Chips, 4-Column Grid)
 */

// App State
const appState = {
    globalChannel: 'Aesthetic Studios',
    globalVerified: true,
    slots: [
        {
            id: 1,
            label: 'VARIATION A',
            title: 'I Built a $100,000 Creative Agency from My Bedroom (Full Breakdown)',
            views: '1.2M views',
            time: '2 hours ago',
            duration: '14:28',
            thumbnail: '',
        },
        {
            id: 2,
            label: 'VARIATION B',
            title: 'The Brutal Truth About Freelance Visual Design in 2026',
            views: '840K views',
            time: '4 hours ago',
            duration: '18:05',
            thumbnail: '',
        }
    ]
};

// 100% Fictional Competitor Videos (Realistic aesthetic titles & fictional channels)
const fakeCompetitorFeed = [
    {
        title: 'The 10-Minute Productivity Routine That Actually Changed My Life',
        channel: 'Mindset Orbit',
        verified: true,
        views: '420K views',
        time: '2 days ago',
        duration: '10:14',
        thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=640&auto=format&fit=crop&q=80',
        avatarText: 'M'
    },
    {
        title: 'How Modern Cinema Soundtracks Trigger Deep Emotional Immersion',
        channel: 'Sonic Wave Studios',
        verified: true,
        views: '89K views',
        time: '5 days ago',
        duration: '14:32',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=640&auto=format&fit=crop&q=80',
        avatarText: 'S'
    },
    {
        title: 'Speedrunning Retro Arcade Classics (World Record Pace Breakdown)',
        channel: 'Pixel Forge Gaming',
        verified: false,
        views: '1.1M views',
        time: '1 week ago',
        duration: '28:45',
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=640&auto=format&fit=crop&q=80',
        avatarText: 'P'
    },
    {
        title: 'Rainy Night in Shibuya – Ambient Lo-Fi Chill Beats for Focus & Sleep',
        channel: 'Echo Lo-Fi Beats',
        verified: true,
        views: '3.4M views',
        time: '2 weeks ago',
        duration: '3:00:00',
        thumbnail: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=640&auto=format&fit=crop&q=80',
        avatarText: 'E'
    },
    {
        title: 'Building a $5,000 Futuristic Desk Setup (Minimalist Dark Mode Aesthetics)',
        channel: 'Aesthetic Gear Labs',
        verified: true,
        views: '640K views',
        time: '3 weeks ago',
        duration: '16:50',
        thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&auto=format&fit=crop&q=80',
        avatarText: 'A'
    },
    {
        title: 'Mastering Cinematic Color Grading in 2026: Curves, LUTs & Scopes',
        channel: 'Lens & Frame',
        verified: false,
        views: '210K views',
        time: '1 month ago',
        duration: '12:08',
        thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=640&auto=format&fit=crop&q=80',
        avatarText: 'L'
    },
    {
        title: 'Deep Focus Coding Beats [Synthwave / Cyberpunk Radio 24/7]',
        channel: 'Code & Coffee',
        verified: false,
        views: 'Mix',
        time: '',
        duration: '▶ Mix',
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&auto=format&fit=crop&q=80',
        avatarText: 'C'
    },
    {
        title: 'Why 3D Motion Graphics & Interactive Web Design are Dominating',
        channel: 'Vector Lab',
        verified: true,
        views: '175K views',
        time: '2 months ago',
        duration: '18:22',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=640&auto=format&fit=crop&q=80',
        avatarText: 'V'
    },
    {
        title: 'Mix – Electronic Euphoria Vol. 4 [High Energy Focus Mix]',
        channel: 'Hyperwave Records',
        verified: false,
        views: 'Mix',
        time: '',
        duration: '▶ Mix',
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&auto=format&fit=crop&q=80',
        avatarText: 'H'
    },
    {
        title: 'Exploring the Subterranean Tunnel Architecture of an Old Metro',
        channel: 'Urban Expedition',
        verified: true,
        views: '1.6M views',
        time: '3 months ago',
        duration: '24:18',
        thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=640&auto=format&fit=crop&q=80',
        avatarText: 'U'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    renderSidebarSlots();
    renderYouTubeFeed();
    initEventListeners();
    initToolyardSuite();
});

function initEventListeners() {
    // Add variation slot button
    const addSlotBtn = document.getElementById('btn-add-variation-slot');
    if (addSlotBtn) {
        addSlotBtn.addEventListener('click', () => {
            if (appState.slots.length >= 8) {
                alert('Maximum of 8 thumbnail variations reached.');
                return;
            }
            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            const nextIdx = appState.slots.length;
            const letter = letters[nextIdx] || `${nextIdx + 1}`;
            appState.slots.push({
                id: nextIdx + 1,
                label: `VARIATION ${letter}`,
                title: `Variation ${letter} - High-CTR YouTube Title`,
                views: '1.2M views',
                time: '2 hours ago',
                duration: '14:28',
                thumbnail: ''
            });
            renderSidebarSlots();
            renderYouTubeFeed();
        });
    }

    // Global Channel Name input
    const channelInput = document.getElementById('global-channel-input');
    if (channelInput) {
        channelInput.value = appState.globalChannel;
        channelInput.addEventListener('input', (e) => {
            appState.globalChannel = e.target.value;
            renderYouTubeFeed();
        });
    }

    // Filter chip click interaction
    document.querySelectorAll('.yt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.yt-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });
}

function renderSidebarSlots() {
    const list = document.getElementById('slot-cards-list');
    if (!list) return;

    const slotPill = document.getElementById('sidebar-slot-pill');
    if (slotPill) {
        slotPill.textContent = `${appState.slots.length} / 8 SLOTS`;
    }

    const addSlotBtn = document.getElementById('btn-add-variation-slot');
    if (addSlotBtn) {
        if (appState.slots.length >= 8) {
            addSlotBtn.disabled = true;
            addSlotBtn.innerHTML = '<i class="ri-check-line"></i> Maximum 8 Slots Added';
        } else {
            addSlotBtn.disabled = false;
            addSlotBtn.innerHTML = '<i class="ri-add-line"></i> Add variation slot';
        }
    }

    list.innerHTML = '';

    appState.slots.forEach((slot, index) => {
        const card = document.createElement('div');
        card.className = 'slot-item-card';

        const canDelete = appState.slots.length > 2;

        card.innerHTML = `
            <div class="slot-item-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="slot-tag"><i class="ri-image-2-line" style="color: #ff0000;"></i> ${slot.label}</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.65rem; color: #4ade80; font-weight: 700;">ACTIVE</span>
                    ${canDelete ? `
                        <button type="button" class="btn-remove-slot" data-index="${index}" title="Remove this variation">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="slot-thumb-preview-box ${!slot.thumbnail ? 'is-empty' : ''}" id="thumb-preview-box-${index}" title="Click to upload thumbnail" style="width: 100%; height: 180px; max-height: 180px; aspect-ratio: 16 / 9; border-radius: 6px; overflow: hidden; position: relative; cursor: pointer; border: 1px dashed rgba(255,255,255,0.2); background: #1c1c1f; margin-bottom: 10px;">
                ${slot.thumbnail ? `
                    <img src="${slot.thumbnail}" alt="${slot.label}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                    <div style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.75); color: #fff; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; pointer-events: none;"><i class="ri-edit-line"></i> Change</div>
                ` : `
                    <div class="slot-empty-content">
                        <i class="ri-image-add-line"></i>
                        <span class="upload-text">UPLOAD THUMBNAIL</span>
                        <span class="upload-hint">1280 × 720 (16:9)</span>
                    </div>
                `}
                <input type="file" accept="image/*" id="file-input-${index}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
            </div>

            <div class="slot-input-group" style="margin-bottom: 10px;">
                <label class="slot-input-label" style="display: block; font-size: 0.65rem; color: #888; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Title / Headline</label>
                <input type="text" class="slot-input" value="${escapeHtml(slot.title)}" data-index="${index}" data-field="title" style="width: 100%; box-sizing: border-box; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; padding: 8px 10px; border-radius: 5px; font-size: 0.8rem; outline: none; font-family: var(--font-cyber); display: block;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div class="slot-input-group" style="margin-bottom: 10px;">
                    <label class="slot-input-label" style="display: block; font-size: 0.65rem; color: #888; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Duration</label>
                    <input type="text" class="slot-input" value="${escapeHtml(slot.duration)}" data-index="${index}" data-field="duration" style="width: 100%; box-sizing: border-box; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; padding: 8px 10px; border-radius: 5px; font-size: 0.8rem; outline: none; font-family: var(--font-cyber); display: block;">
                </div>
                <div class="slot-input-group" style="margin-bottom: 10px;">
                    <label class="slot-input-label" style="display: block; font-size: 0.65rem; color: #888; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Views</label>
                    <input type="text" class="slot-input" value="${escapeHtml(slot.views)}" data-index="${index}" data-field="views" style="width: 100%; box-sizing: border-box; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; padding: 8px 10px; border-radius: 5px; font-size: 0.8rem; outline: none; font-family: var(--font-cyber); display: block;">
                </div>
            </div>
        `;

        // File upload for this slot
        const fileInput = card.querySelector(`#file-input-${index}`);
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        appState.slots[index].thumbnail = ev.target.result;
                        renderSidebarSlots();
                        renderYouTubeFeed();
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        }

        // Real-time text changes
        card.querySelectorAll('.slot-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const field = e.target.getAttribute('data-field');
                appState.slots[index][field] = e.target.value;
                renderYouTubeFeed();
            });
        });

        // Remove slot
        const removeBtn = card.querySelector('.btn-remove-slot');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                appState.slots.splice(index, 1);
                const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                appState.slots.forEach((s, idx) => {
                    s.id = idx + 1;
                    s.label = `VARIATION ${letters[idx] || (idx + 1)}`;
                });
                renderSidebarSlots();
                renderYouTubeFeed();
            });
        }

        list.appendChild(card);
    });
}

function renderYouTubeFeed() {
    const feedGrid = document.getElementById('yt-feed-grid');
    if (!feedGrid) return;

    feedGrid.innerHTML = '';

    const cards = [];

    // Place active user variations at the top
    appState.slots.forEach((slot, index) => {
        cards.push({
            isUser: true,
            slotIndex: index,
            label: slot.label,
            title: slot.title,
            channel: appState.globalChannel,
            verified: appState.globalVerified,
            views: slot.views,
            time: slot.time,
            duration: slot.duration,
            thumbnail: slot.thumbnail,
            avatarText: appState.globalChannel ? appState.globalChannel.charAt(0).toUpperCase() : 'A'
        });
    });

    // Populate remaining spots with 100% fake competitor videos
    fakeCompetitorFeed.forEach(vid => {
        cards.push({
            isUser: false,
            title: vid.title,
            channel: vid.channel,
            verified: vid.verified,
            views: vid.views,
            time: vid.time,
            duration: vid.duration,
            thumbnail: vid.thumbnail,
            avatarText: vid.avatarText
        });
    });

    // Render 4-column feed
    cards.forEach(item => {
        const card = document.createElement('div');
        card.className = 'yt-video-card';

        const verifiedIcon = item.verified ? '<i class="ri-checkbox-circle-fill"></i>' : '';
        const userTag = item.isUser ? `<span class="user-variation-pill">${item.label}</span>` : '';

        card.innerHTML = `
            ${item.isUser && !item.thumbnail ? `
                <div class="yt-video-thumb-wrap yt-blank-slot-wrap" id="feed-thumb-slot-${item.slotIndex}" title="Click to upload ${item.label} thumbnail">
                    ${userTag}
                    <div class="yt-blank-slot-content">
                        <i class="ri-image-add-line"></i>
                        <span class="blank-slot-title">UPLOAD ${item.label}</span>
                        <span class="blank-slot-hint">Click or drop 16:9 thumbnail</span>
                    </div>
                    <span class="yt-time-badge">${item.duration}</span>
                    <input type="file" accept="image/*" class="feed-slot-input" data-slot-index="${item.slotIndex}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                </div>
            ` : `
                <div class="yt-video-thumb-wrap">
                    ${userTag}
                    <img src="${item.thumbnail}" alt="${escapeHtml(item.title)}">
                    <span class="yt-time-badge">${item.duration}</span>
                </div>
            `}
            <div class="yt-details-row">
                <div class="yt-channel-avatar" style="${item.isUser ? 'background: #ff0000;' : ''}">
                    ${item.avatarText}
                </div>
                <div class="yt-meta-content">
                    <h3 class="yt-video-title">${escapeHtml(item.title)}</h3>
                    <div class="yt-channel-title">
                        <span>${escapeHtml(item.channel)}</span>
                        ${verifiedIcon}
                    </div>
                    <div class="yt-stats-line">
                        ${item.views} ${item.time ? '• ' + item.time : ''}
                    </div>
                </div>
                <div class="yt-menu-dots">
                    <i class="ri-more-2-fill"></i>
                </div>
            </div>
        `;

        feedGrid.appendChild(card);
    });

    // Bind upload file listeners on feed blank slots
    document.querySelectorAll('.feed-slot-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const slotIdx = parseInt(e.target.getAttribute('data-slot-index'), 10);
            if (e.target.files && e.target.files[0] && !isNaN(slotIdx) && appState.slots[slotIdx]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    appState.slots[slotIdx].thumbnail = ev.target.result;
                    renderSidebarSlots();
                    renderYouTubeFeed();
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================================================
   TOOLYARD SUITE CONTROLLER & ENGINES
   ========================================================================== */

const toolyardState = {
    activeSection: 'compressor' // 'compressor' | 'yt'
};

const compressorState = {
    quality: 0.94,
    format: 'original',
    activeOriginalUrl: null,
    activeCompressedUrl: null,
    activeFile: null,
    activeResult: null,
    batchItems: []
};

const pdfState = {
    intensity: 'balanced', // 'balanced' | 'extreme' | 'master'
    activeFile: null,
    activeResult: null,
    isProcessing: false
};

function initToolyardSuite() {
    initNavSwitcher();
    initCompressorSuite();
    initSafeZoneStudio();
}

/**
 * Top Segmented Switcher
 */
function initNavSwitcher() {
    const navBtns = document.querySelectorAll('.nav-segment[data-section]');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            if (section) switchSection(section);
        });
    });
}

function switchSection(sectionId) {
    toolyardState.activeSection = sectionId;

    // Update Nav Segment Buttons
    document.querySelectorAll('.nav-segment[data-section]').forEach(btn => {
        if (btn.dataset.section === sectionId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update Sidebars
    const sidebarCompressor = document.getElementById('sidebar-compressor-controls');
    const sidebarSafezone = document.getElementById('sidebar-safezone-controls');
    const sidebarYt = document.getElementById('sidebar-yt-controls');

    if (sidebarCompressor) sidebarCompressor.style.display = (sectionId === 'compressor') ? 'block' : 'none';
    if (sidebarSafezone) sidebarSafezone.style.display = (sectionId === 'safezone') ? 'block' : 'none';
    if (sidebarYt) sidebarYt.style.display = (sectionId === 'yt') ? 'block' : 'none';

    // Update Workspaces
    const workspaceCompressor = document.getElementById('tool-workspace-compressor');
    const workspaceSafezone = document.getElementById('tool-workspace-safezone');
    const workspaceYt = document.getElementById('tool-workspace-yt');

    const workspaces = [
        { id: 'compressor', el: workspaceCompressor },
        { id: 'safezone', el: workspaceSafezone },
        { id: 'yt', el: workspaceYt }
    ];

    workspaces.forEach(ws => {
        if (ws.el) {
            if (ws.id === sectionId) {
                ws.el.classList.add('active');
                ws.el.style.display = 'block';
            } else {
                ws.el.classList.remove('active');
                ws.el.style.display = 'none';
            }
        }
    });

    if (sectionId === 'safezone') {
        renderSafeZoneStage();
    }
}

/* ==========================================================================
   UNIFIED FILE COMPRESSOR ENGINE (IMAGES & PDFS)
   ========================================================================== */

function initCompressorSuite() {
    initPresetControls();
    initUnifiedDropzone();
    initSplitSlider();
    initBatchDownload();
}

function initPresetControls() {
    // Image Quality Presets
    const presetPills = document.querySelectorAll('.btn-setting-pill');
    presetPills.forEach(pill => {
        pill.addEventListener('click', () => {
            presetPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            compressorState.quality = parseFloat(pill.dataset.quality) || 0.85;

            if (compressorState.activeFile) {
                processActiveImageFile(compressorState.activeFile);
            }
        });
    });

    // Output Format Selector
    const formatSelect = document.getElementById('select-output-format');
    if (formatSelect) {
        formatSelect.addEventListener('change', (e) => {
            compressorState.format = e.target.value;
            if (compressorState.activeFile) {
                processActiveImageFile(compressorState.activeFile);
            }
        });
    }

    // PDF Presets
    const pdfPresets = document.querySelectorAll('.btn-pdf-preset-pill');
    pdfPresets.forEach(pill => {
        pill.addEventListener('click', () => {
            pdfPresets.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            pdfState.intensity = pill.dataset.preset || 'balanced';

            if (pdfState.activeFile && !pdfState.isProcessing) {
                handleUploadedPdf(pdfState.activeFile);
            }
        });
    });
}

function initUnifiedDropzone() {
    const dropzone = document.getElementById('unified-dropzone');
    const fileInput = document.getElementById('unified-file-input');

    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files);
        routeUploadedFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        routeUploadedFiles(files);
        fileInput.value = '';
    });
}

function routeUploadedFiles(files) {
    if (!files || files.length === 0) return;

    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    // If PDF present, prioritize processing the PDF
    if (pdfFiles.length > 0) {
        const splitWrapper = document.getElementById('split-viewer-wrapper');
        const pdfArea = document.getElementById('pdf-workspace-area');
        if (splitWrapper) splitWrapper.style.display = 'none';
        if (pdfArea) pdfArea.style.display = 'block';

        handleUploadedPdf(pdfFiles[0]);
    }

    // If images present, process images
    if (imageFiles.length > 0) {
        if (pdfFiles.length === 0) {
            const pdfArea = document.getElementById('pdf-workspace-area');
            if (pdfArea) pdfArea.style.display = 'none';
        }
        handleUploadedImageFiles(imageFiles);
    }
}

async function handleUploadedImageFiles(files) {
    if (!files || files.length === 0) return;

    await processActiveImageFile(files[0]);

    for (const file of files) {
        try {
            const result = await compressImageFile(file, compressorState.quality, compressorState.format);
            const downloadName = getDownloadFileName(file.name, result.mimeType);

            const existingIdx = compressorState.batchItems.findIndex(item => item.name === file.name);
            const batchEntry = {
                id: 'img-' + Date.now() + Math.random().toString(36).substr(2, 6),
                type: 'image',
                file,
                name: file.name,
                downloadName,
                result
            };

            if (existingIdx >= 0) {
                compressorState.batchItems[existingIdx] = batchEntry;
            } else {
                compressorState.batchItems.unshift(batchEntry);
            }
        } catch (err) {
            console.error('Compression error for image', file.name, err);
        }
    }

    renderBatchList();
}

async function processActiveImageFile(file) {
    compressorState.activeFile = file;

    if (compressorState.activeOriginalUrl) {
        URL.revokeObjectURL(compressorState.activeOriginalUrl);
    }
    compressorState.activeOriginalUrl = URL.createObjectURL(file);

    try {
        const result = await compressImageFile(file, compressorState.quality, compressorState.format);
        compressorState.activeResult = result;

        if (compressorState.activeCompressedUrl) {
            URL.revokeObjectURL(compressorState.activeCompressedUrl);
        }
        compressorState.activeCompressedUrl = result.url;

        const splitWrapper = document.getElementById('split-viewer-wrapper');
        const layerBefore = document.getElementById('split-layer-before');
        const layerAfter = document.getElementById('split-layer-after');
        const metricOrig = document.getElementById('metric-original-size');
        const metricComp = document.getElementById('metric-compressed-size');
        const metricSaved = document.getElementById('metric-saved-percent');

        if (splitWrapper) splitWrapper.style.display = 'block';

        if (layerBefore) {
            layerBefore.style.backgroundImage = `url("${compressorState.activeOriginalUrl}")`;
        }
        if (layerAfter) {
            layerAfter.style.backgroundImage = `url("${compressorState.activeCompressedUrl}")`;
        }

        if (metricOrig) metricOrig.textContent = `Original: ${formatBytes(result.originalSize)}`;
        if (metricComp) metricComp.textContent = `Compressed: ${formatBytes(result.compressedSize)}`;
        if (metricSaved) {
            metricSaved.textContent = result.savedPercent > 0 ? `–${result.savedPercent}%` : `Optimal`;
        }

        setSplitDivider(50);
    } catch (err) {
        console.error('Error in processActiveImageFile:', err);
    }
}

function compressImageFile(file, quality, outputFormat) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');

                let targetMime = outputFormat;
                if (!targetMime || targetMime === 'original' || targetMime === 'auto') {
                    const lowerName = (file.name || '').toLowerCase();
                    if (file.type === 'image/png' || lowerName.endsWith('.png')) {
                        targetMime = 'image/png';
                    } else if (file.type === 'image/jpeg' || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
                        targetMime = 'image/jpeg';
                    } else if (file.type === 'image/webp' || lowerName.endsWith('.webp')) {
                        targetMime = 'image/webp';
                    } else {
                        targetMime = file.type || 'image/png';
                    }
                }

                if (targetMime === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0);

                // --- ADVANCED LOSSLESS / HIGH-FIDELITY PNG ENGINE VIA UPNG.JS ---
                if (targetMime === 'image/png' && window.UPNG) {
                    try {
                        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        // In UPNG: cnum = 0 means true 100% LOSSLESS compression (24/32-bit true color without palette quantization)
                        // This prevents any color banding, noise, or gradient loss.
                        let cnum = 0;
                        let dither = 0;
                        if (quality < 0.70) {
                            cnum = 256;
                            dither = 0.2;
                        }

                        const pngBuffer = window.UPNG.encode([imgData.data.buffer], canvas.width, canvas.height, cnum, dither);
                        let finalBlob = new Blob([pngBuffer], { type: 'image/png' });
                        let compSize = finalBlob.size;
                        const origSize = file.size;

                        let savedPct = Math.round(((origSize - compSize) / origSize) * 100);
                        if (compSize >= origSize) {
                            finalBlob = file;
                            compSize = origSize;
                            savedPct = 0;
                        }

                        const compressedUrl = URL.createObjectURL(finalBlob);
                        resolve({
                            blob: finalBlob,
                            url: compressedUrl,
                            originalSize: origSize,
                            compressedSize: compSize,
                            savedPercent: savedPct,
                            mimeType: 'image/png'
                        });
                        return;
                    } catch (err) {
                        console.warn('UPNG encoding error, falling back to canvas', err);
                    }
                }

                canvas.toBlob((blob) => {
                    if (!blob) {
                        const fallbackUrl = URL.createObjectURL(file);
                        resolve({
                            blob: file,
                            url: fallbackUrl,
                            originalSize: file.size,
                            compressedSize: file.size,
                            savedPercent: 0,
                            mimeType: file.type
                        });
                        return;
                    }

                    const origSize = file.size;
                    let compSize = blob.size;
                    let finalBlob = blob;

                    let savedPct = Math.round(((origSize - compSize) / origSize) * 100);
                    if (compSize >= origSize) {
                        finalBlob = file;
                        compSize = origSize;
                        savedPct = 0;
                    }

                    const compressedUrl = URL.createObjectURL(finalBlob);
                    resolve({
                        blob: finalBlob,
                        url: compressedUrl,
                        originalSize: origSize,
                        compressedSize: compSize,
                        savedPercent: savedPct,
                        mimeType: finalBlob.type
                    });
                }, targetMime, quality);
            };

            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

function initSplitSlider() {
    const frame = document.getElementById('split-canvas-frame');
    if (!frame) return;

    let isDragging = false;

    function handleMove(clientX) {
        const rect = frame.getBoundingClientRect();
        let pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(1, Math.min(99, pct));
        setSplitDivider(pct);
    }

    frame.addEventListener('mousedown', (e) => {
        isDragging = true;
        handleMove(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            handleMove(e.clientX);
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    frame.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
            isDragging = true;
            handleMove(e.touches[0].clientX);
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches && e.touches[0]) {
            handleMove(e.touches[0].clientX);
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });
}

function setSplitDivider(pct) {
    const divider = document.getElementById('split-divider-line');
    const layerAfter = document.getElementById('split-layer-after');

    if (divider) {
        divider.style.left = `${pct}%`;
    }
    if (layerAfter) {
        layerAfter.style.clipPath = `polygon(${pct}% 0, 100% 0, 100% 100%, ${pct}% 100%)`;
    }
}

function renderBatchList() {
    const container = document.getElementById('batch-queue-container');
    const list = document.getElementById('batch-items-list');

    if (!container || !list) return;

    if (compressorState.batchItems.length === 0) {
        container.style.display = 'none';
        list.innerHTML = '';
        return;
    }

    container.style.display = 'block';
    list.innerHTML = '';

    compressorState.batchItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'batch-item-row';
        row.style.cursor = 'pointer';

        const savedTag = item.result.savedPercent > 0 
            ? `<span class="batch-saved-tag">–${item.result.savedPercent}%</span>` 
            : `<span style="color: #71717a;">Optimal</span>`;

        const thumbHtml = item.type === 'pdf' 
            ? `<div class="batch-badge-mini">PDF</div>`
            : `<img src="${item.result.url}" alt="${escapeHtml(item.name)}" class="batch-thumb-mini">`;

        row.innerHTML = `
            <div class="batch-item-left">
                ${thumbHtml}
                <div>
                    <div class="batch-file-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
                    <div class="batch-file-sizes">
                        <span>${formatBytes(item.result.originalSize)}</span> ➔ 
                        <span style="color: #4ade80; font-weight: 600;">${formatBytes(item.result.compressedSize)}</span> 
                        ${savedTag}
                    </div>
                </div>
            </div>
            <a href="${item.result.url}" download="${item.downloadName}" class="btn-download-single" onclick="event.stopPropagation();">
                Download
            </a>
        `;

        row.addEventListener('click', () => {
            if (item.type === 'image') {
                const pdfArea = document.getElementById('pdf-workspace-area');
                if (pdfArea) pdfArea.style.display = 'none';
                processActiveImageFile(item.file);
            } else if (item.type === 'pdf') {
                const splitWrapper = document.getElementById('split-viewer-wrapper');
                const pdfArea = document.getElementById('pdf-workspace-area');
                if (splitWrapper) splitWrapper.style.display = 'none';
                if (pdfArea) pdfArea.style.display = 'block';
            }
        });

        list.appendChild(row);
    });
}

function initBatchDownload() {
    const downloadAllBtn = document.getElementById('btn-download-all-batch');
    if (!downloadAllBtn) return;

    downloadAllBtn.addEventListener('click', () => {
        if (compressorState.batchItems.length === 0) return;

        compressorState.batchItems.forEach((item, idx) => {
            setTimeout(() => {
                const a = document.createElement('a');
                a.href = item.result.url;
                a.download = item.downloadName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }, idx * 250);
        });
    });
}

async function handleUploadedPdf(file) {
    pdfState.activeFile = file;
    pdfState.isProcessing = true;

    const progressCard = document.getElementById('pdf-progress-card');
    const resultCard = document.getElementById('pdf-result-card');
    const progressStatus = document.getElementById('pdf-progress-status');
    const progressPercent = document.getElementById('pdf-progress-percent');
    const progressFill = document.getElementById('pdf-progress-fill');

    if (resultCard) resultCard.style.display = 'none';
    if (progressCard) progressCard.style.display = 'block';

    if (progressStatus) progressStatus.textContent = 'Initializing in-browser PDF engine...';
    if (progressPercent) progressPercent.textContent = '0%';
    if (progressFill) progressFill.style.width = '0%';

    try {
        const result = await compressPdfDocument(file, pdfState.intensity, (page, total, pct) => {
            if (progressStatus) {
                progressStatus.textContent = `Optimizing page ${page} of ${total}...`;
            }
            if (progressPercent) progressPercent.textContent = `${pct}%`;
            if (progressFill) progressFill.style.width = `${pct}%`;
        });

        pdfState.activeResult = result;

        if (progressCard) progressCard.style.display = 'none';
        if (resultCard) resultCard.style.display = 'block';

        // Update Metadata & Metric Badges
        const resultName = document.getElementById('pdf-result-name');
        const resultPages = document.getElementById('pdf-result-pages');
        const metricOrig = document.getElementById('pdf-metric-orig');
        const metricComp = document.getElementById('pdf-metric-comp');
        const metricSaved = document.getElementById('pdf-metric-saved');
        const downloadBtn = document.getElementById('btn-download-pdf-result');
        const previewGrid = document.getElementById('pdf-preview-grid');

        if (resultName) resultName.textContent = file.name;
        if (resultPages) resultPages.textContent = `${result.totalPages} Page${result.totalPages > 1 ? 's' : ''} Document`;
        if (metricOrig) metricOrig.textContent = `Original: ${formatBytes(result.originalSize)}`;
        if (metricComp) metricComp.textContent = `Compressed: ${formatBytes(result.compressedSize)}`;
        if (metricSaved) {
            metricSaved.textContent = result.savedPercent > 0 ? `–${result.savedPercent}%` : 'Optimal';
        }

        if (downloadBtn) {
            downloadBtn.href = result.url;
            downloadBtn.download = getPdfDownloadName(file.name);
        }

        // Render Page Thumbnail Previews
        if (previewGrid) {
            previewGrid.innerHTML = '';
            result.thumbnails.forEach((thumbUrl, idx) => {
                const card = document.createElement('div');
                card.className = 'pdf-page-card';
                card.innerHTML = `
                    <img src="${thumbUrl}" alt="Page ${idx + 1}" class="pdf-page-thumb">
                    <div class="pdf-page-num">Page ${idx + 1}</div>
                `;
                previewGrid.appendChild(card);
            });
        }

        // Add to Unified Batch Queue
        const existingIdx = compressorState.batchItems.findIndex(item => item.name === file.name);
        const pdfBatchEntry = {
            id: 'pdf-' + Date.now() + Math.random().toString(36).substr(2, 6),
            type: 'pdf',
            file: file,
            name: file.name,
            downloadName: getPdfDownloadName(file.name),
            result: {
                url: result.url,
                originalSize: result.originalSize,
                compressedSize: result.compressedSize,
                savedPercent: result.savedPercent
            }
        };

        if (existingIdx >= 0) {
            compressorState.batchItems[existingIdx] = pdfBatchEntry;
        } else {
            compressorState.batchItems.unshift(pdfBatchEntry);
        }

        renderBatchList();
    } catch (err) {
        console.error('PDF compression error:', err);
        if (progressStatus) {
            progressStatus.innerHTML = `<span style="color: #ef4444;">${escapeHtml(err.message || 'Error optimizing PDF')}</span>`;
        }
    } finally {
        pdfState.isProcessing = false;
    }
}

/**
 * 100% In-Browser PDF Compression Engine using PDF.js & PDF-Lib
 */
async function compressPdfDocument(file, intensityPreset, onProgress) {
    if (!window.pdfjsLib || !window.PDFLib) {
        throw new Error('PDF engines are still initializing. Please wait a few seconds and try again.');
    }

    const { PDFDocument } = window.PDFLib;
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    // Intensity Presets (High-Fidelity rendering to prevent text & graphic blur)
    let scale = 1.75;
    let quality = 0.88;
    if (intensityPreset === 'extreme') {
        scale = 1.4;
        quality = 0.78;
    } else if (intensityPreset === 'master') {
        scale = 2.2;
        quality = 0.94;
    }

    const newPdfDoc = await PDFDocument.create();
    const thumbnails = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (onProgress) {
            const pct = Math.round(((pageNum - 1) / totalPages) * 100);
            onProgress(pageNum, totalPages, pct);
        }

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');

        // Draw solid white canvas background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        // Extract compressed JPEG stream
        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
        thumbnails.push(jpegDataUrl);

        // Convert base64 data to binary Uint8Array
        const base64Data = jpegDataUrl.split(',')[1];
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        const embeddedImage = await newPdfDoc.embedJpg(bytes);

        // Maintain accurate unscaled page aspect ratio and dimensions in points
        const originalViewport = page.getViewport({ scale: 1.0 });
        const newPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height]);

        newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: originalViewport.width,
            height: originalViewport.height
        });
    }

    if (onProgress) {
        onProgress(totalPages, totalPages, 100);
    }

    const compressedPdfBytes = await newPdfDoc.save();
    let finalBlob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
    let finalSize = finalBlob.size;

    let savedPct = Math.round(((file.size - finalSize) / file.size) * 100);
    if (finalSize >= file.size) {
        finalBlob = file;
        finalSize = file.size;
        savedPct = 0;
    }

    const compressedUrl = URL.createObjectURL(finalBlob);

    return {
        blob: finalBlob,
        url: compressedUrl,
        originalSize: file.size,
        compressedSize: finalSize,
        totalPages: totalPages,
        thumbnails: thumbnails,
        savedPercent: savedPct
    };
}

/* ==========================================================================
   FORMAT & STRING UTILITIES
   ========================================================================== */

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getDownloadFileName(originalName, mimeType) {
    const lastDot = originalName.lastIndexOf('.');
    const base = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
    const originalExt = lastDot > 0 ? originalName.substring(lastDot).toLowerCase() : '';

    let ext = originalExt || '.png';
    if (mimeType === 'image/jpeg') {
        ext = (originalExt === '.jpeg') ? '.jpeg' : '.jpg';
    } else if (mimeType === 'image/webp') {
        ext = '.webp';
    } else if (mimeType === 'image/png') {
        ext = '.png';
    }

    return `${base}-compressed${ext}`;
}

function getPdfDownloadName(originalName) {
    const lastDot = originalName.lastIndexOf('.');
    const base = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
    return `${base}-compressed.pdf`;
}

/* ==========================================================================
   MODULE 2: SOCIAL SAFE-ZONE & MULTI-PLATFORM CANVAS
   ========================================================================== */

const safezoneState = {
    platform: 'tiktok',
    showUI: true,
    showGuides: true,
    opacity: 0.7,
    scaleMode: 'cover', // 'cover' | 'contain'
    artworkSrc: '',
    rawImage: null
};

const safezonePlatforms = {
    'tiktok': {
        name: 'TikTok & Reels',
        dimText: '1080 × 1920 (9:16)',
        width: 1080,
        height: 1920,
        displayW: 280,
        displayH: 498,
        guides: [
            { top: '8%', bottom: '22%', left: '4%', right: '20%', label: 'Safe Content Zone' }
        ]
    },
    'ig-post-portrait': {
        name: 'Instagram Portrait',
        dimText: '1080 × 1350 (4:5)',
        width: 1080,
        height: 1350,
        displayW: 340,
        displayH: 425,
        guides: [
            { top: '5.5%', bottom: '5.5%', left: '0%', right: '0%', label: 'Feed Grid Crop (1:1 Center)' }
        ]
    },
    'ig-post-square': {
        name: 'Instagram Square',
        dimText: '1080 × 1080 (1:1)',
        width: 1080,
        height: 1080,
        displayW: 360,
        displayH: 360,
        guides: [
            { top: '4%', bottom: '4%', left: '4%', right: '4%', label: 'Square Safe Area' }
        ]
    },
    'ig-story': {
        name: 'Instagram Story',
        dimText: '1080 × 1920 (9:16)',
        width: 1080,
        height: 1920,
        displayW: 280,
        displayH: 498,
        guides: [
            { top: '14%', bottom: '15%', left: '5%', right: '5%', label: 'Story Safe Area' }
        ]
    },
    'yt-banner': {
        name: 'YouTube Channel Banner',
        dimText: '2560 × 1440 (16:9)',
        width: 2560,
        height: 1440,
        displayW: 640,
        displayH: 360,
        guides: [
            { top: '35.3%', bottom: '35.3%', left: '0%', right: '0%', label: 'Desktop Safe (2560 × 423)' },
            { top: '35.3%', bottom: '35.3%', left: '19.8%', right: '19.8%', label: 'Mobile Safe (1546 × 423)' }
        ]
    },
    'twitter-header': {
        name: 'X / Twitter Header',
        dimText: '1500 × 500 (3:1)',
        width: 1500,
        height: 500,
        displayW: 600,
        displayH: 200,
        guides: [
            { top: '5%', bottom: '5%', left: '15%', right: '5%', label: 'Safe Area (Avoid Avatar Left)' }
        ]
    },
    'twitter-feed': {
        name: 'X / Twitter Feed Card',
        dimText: '1200 × 675 (16:9)',
        width: 1200,
        height: 675,
        displayW: 560,
        displayH: 315,
        guides: [
            { top: '4%', bottom: '4%', left: '4%', right: '4%', label: 'Timeline Card Safe' }
        ]
    },
    'linkedin-banner': {
        name: 'LinkedIn Banner',
        dimText: '1584 × 396 (4:1)',
        width: 1584,
        height: 396,
        displayW: 640,
        displayH: 160,
        guides: [
            { top: '5%', bottom: '5%', left: '18%', right: '5%', label: 'Safe Area (Avatar Cutout Left)' }
        ]
    }
};

function initSafeZoneStudio() {
    // Platform Selection Buttons
    const platformBtns = document.querySelectorAll('.btn-platform-pill');
    platformBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            platformBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const p = btn.dataset.platform;
            if (p && safezonePlatforms[p]) {
                safezoneState.platform = p;
                renderSafeZoneStage();
            }
        });
    });

    // Toggle UI Mockup
    const toggleUI = document.getElementById('toggle-platform-ui');
    if (toggleUI) {
        toggleUI.addEventListener('change', (e) => {
            safezoneState.showUI = e.target.checked;
            const mockupLayer = document.getElementById('safezone-mockup-layer');
            if (mockupLayer) mockupLayer.style.display = safezoneState.showUI ? 'block' : 'none';
        });
    }

    // Toggle Guides
    const toggleGuides = document.getElementById('toggle-safe-guides');
    if (toggleGuides) {
        toggleGuides.addEventListener('change', (e) => {
            safezoneState.showGuides = e.target.checked;
            const guidesLayer = document.getElementById('safezone-guides-layer');
            if (guidesLayer) guidesLayer.style.display = safezoneState.showGuides ? 'block' : 'none';
        });
    }

    // Opacity Slider
    const opacityRange = document.getElementById('safezone-opacity-range');
    const opacityLabel = document.getElementById('label-safezone-opacity');
    if (opacityRange) {
        opacityRange.addEventListener('input', (e) => {
            const val = e.target.value;
            safezoneState.opacity = val / 100;
            if (opacityLabel) opacityLabel.textContent = `${val}%`;
            const mockupLayer = document.getElementById('safezone-mockup-layer');
            if (mockupLayer) mockupLayer.style.opacity = safezoneState.opacity;
        });
    }

    // Fit & Fill Buttons
    const btnFill = document.getElementById('btn-scale-fill');
    const btnFit = document.getElementById('btn-scale-fit');
    if (btnFill && btnFit) {
        btnFill.addEventListener('click', () => {
            btnFill.classList.add('active');
            btnFit.classList.remove('active');
            safezoneState.scaleMode = 'cover';
            const artContainer = document.getElementById('safezone-artwork-container');
            if (artContainer) artContainer.classList.remove('fit-contain');
        });
        btnFit.addEventListener('click', () => {
            btnFit.classList.add('active');
            btnFill.classList.remove('active');
            safezoneState.scaleMode = 'contain';
            const artContainer = document.getElementById('safezone-artwork-container');
            if (artContainer) artContainer.classList.add('fit-contain');
        });
    }

    // Dropzone & File Input
    const dropzone = document.getElementById('safezone-dropzone');
    const fileInput = document.getElementById('safezone-file-input');

    if (dropzone && fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                loadSafezoneArtwork(e.target.files[0]);
            }
        });

        ['dragenter', 'dragover'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.style.borderColor = '#fff';
            });
        });
        ['dragleave', 'drop'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            });
        });
        dropzone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                loadSafezoneArtwork(e.dataTransfer.files[0]);
            }
        });
    }

    // Export Buttons
    const exportCroppedBtn = document.getElementById('btn-export-cropped-graphic');
    if (exportCroppedBtn) {
        exportCroppedBtn.addEventListener('click', () => exportSafezoneGraphic(false));
    }
    const exportGuidesBtn = document.getElementById('btn-export-with-guides');
    if (exportGuidesBtn) {
        exportGuidesBtn.addEventListener('click', () => exportSafezoneGraphic(true));
    }

    // Initial render
    renderSafeZoneStage();
    // Bind safezone empty placeholder click to file input
    const canvasInput = document.getElementById('safezone-canvas-file-input');
    if (canvasInput) {
        canvasInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                loadSafezoneArtwork(e.target.files[0]);
            }
        });
    }
    const placeholder = document.getElementById('safezone-empty-placeholder');
    if (placeholder) {
        placeholder.addEventListener('click', () => {
            const fileInput = document.getElementById('safezone-file-input');
            if (fileInput) fileInput.click();
        });
    }

    // Drag and drop onto device frame
    const deviceFrame = document.getElementById('safezone-device-frame');
    if (deviceFrame) {
        deviceFrame.addEventListener('dragover', (e) => { e.preventDefault(); });
        deviceFrame.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                loadSafezoneArtwork(e.dataTransfer.files[0]);
            }
        });
    }
}

function loadSafezoneArtwork(file) {
    if (!file) return;
    safezoneState.artworkFile = file;
    const url = URL.createObjectURL(file);
    safezoneState.artworkSrc = url;

    const img = document.getElementById('safezone-artwork-img');
    const placeholder = document.getElementById('safezone-empty-placeholder');
    const label = document.getElementById('safezone-file-label');

    if (img) {
        img.src = url;
        img.style.display = 'block';
    }
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    if (label) {
        label.textContent = file.name;
    }
}

function renderSafeZoneStage() {
    const p = safezonePlatforms[safezoneState.platform] || safezonePlatforms['tiktok'];
    const frame = document.getElementById('safezone-device-frame');
    const nameLabel = document.getElementById('safezone-platform-name');
    const dimLabel = document.getElementById('safezone-dim-text');
    const guidesLayer = document.getElementById('safezone-guides-layer');
    const mockupLayer = document.getElementById('safezone-mockup-layer');

    if (!frame) return;

    if (nameLabel) nameLabel.textContent = p.name;
    if (dimLabel) dimLabel.textContent = p.dimText;
    const emptyBadge = document.getElementById('safezone-empty-badge');
    if (emptyBadge) emptyBadge.innerHTML = `${p.name} &bull; ${p.dimText}`;

    // Set dimensions of frame
    frame.style.width = `${p.displayW}px`;
    frame.style.height = `${p.displayH}px`;

    // Render Guides
    if (guidesLayer) {
        guidesLayer.innerHTML = '';
        p.guides.forEach(g => {
            const box = document.createElement('div');
            box.className = 'guide-box';
            box.style.top = g.top;
            box.style.bottom = g.bottom;
            box.style.left = g.left;
            box.style.right = g.right;

            const tag = document.createElement('span');
            tag.className = 'guide-tag';
            tag.textContent = g.label;
            box.appendChild(tag);

            guidesLayer.appendChild(box);
        });
    }

    // Render Mockup UI
    if (mockupLayer) {
        mockupLayer.innerHTML = '';
        mockupLayer.style.opacity = safezoneState.opacity;

        if (safezoneState.platform === 'tiktok' || safezoneState.platform === 'ig-story') {
            mockupLayer.innerHTML = `
                <div class="mockup-tt-header">
                    <span style="opacity: 0.6;">Following</span>
                    <span class="active">For You</span>
                </div>
                <div class="mockup-tt-right-actions">
                    <div class="mockup-tt-avatar">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar">
                    </div>
                    <div class="mockup-tt-action-item">
                        <i class="ri-heart-3-fill" style="color: #ff2d55;"></i>
                        <span>142.8K</span>
                    </div>
                    <div class="mockup-tt-action-item">
                        <i class="ri-chat-3-fill"></i>
                        <span>2,480</span>
                    </div>
                    <div class="mockup-tt-action-item">
                        <i class="ri-bookmark-fill"></i>
                        <span>18.5K</span>
                    </div>
                    <div class="mockup-tt-action-item">
                        <i class="ri-share-forward-fill"></i>
                        <span>Share</span>
                    </div>
                    <div class="mockup-tt-disc">
                        <i class="ri-disc-fill" style="font-size: 1rem; color: #fff;"></i>
                    </div>
                </div>
                <div class="mockup-tt-bottom-info">
                    <div class="mockup-tt-username">@design.studio • Follow</div>
                    <div class="mockup-tt-caption">Testing safe margin layout in Toolyard Studio. Keep primary focal text inside the dashed zone! #design #ui #creator</div>
                    <div class="mockup-tt-audio-tag">
                        <i class="ri-music-2-fill"></i> Original Audio – Aesthetic Beats
                    </div>
                </div>
            `;
        } else if (safezoneState.platform === 'twitter-header' || safezoneState.platform === 'linkedin-banner') {
            mockupLayer.innerHTML = `
                <div style="position: absolute; bottom: 10px; left: 24px; width: 64px; height: 64px; border-radius: 50%; border: 3px solid #000; background: #222; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: #888;">
                    Avatar
                </div>
            `;
        } else if (safezoneState.platform === 'yt-banner') {
            mockupLayer.innerHTML = `
                <div style="position: absolute; top: 12px; left: 16px; font-size: 0.75rem; font-weight: 700; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 6px;">
                    <i class="ri-youtube-fill" style="color: #ff0000; font-size: 1.1rem;"></i> Channel Art Preview
                </div>
            `;
        }
    }
}

async function exportSafezoneGraphic(includeGuides = false) {
    const p = safezonePlatforms[safezoneState.platform] || safezonePlatforms['tiktok'];
    const canvas = document.createElement('canvas');
    canvas.width = p.width;
    canvas.height = p.height;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        // Draw background image
        if (safezoneState.scaleMode === 'cover') {
            const hRatio = canvas.width / img.naturalWidth;
            const vRatio = canvas.height / img.naturalHeight;
            const ratio = Math.max(hRatio, vRatio);
            const centerShiftX = (canvas.width - img.naturalWidth * ratio) / 2;
            const centerShiftY = (canvas.height - img.naturalHeight * ratio) / 2;
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
                centerShiftX, centerShiftY, img.naturalWidth * ratio, img.naturalHeight * ratio);
        } else {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const hRatio = canvas.width / img.naturalWidth;
            const vRatio = canvas.height / img.naturalHeight;
            const ratio = Math.min(hRatio, vRatio);
            const centerShiftX = (canvas.width - img.naturalWidth * ratio) / 2;
            const centerShiftY = (canvas.height - img.naturalHeight * ratio) / 2;
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
                centerShiftX, centerShiftY, img.naturalWidth * ratio, img.naturalHeight * ratio);
        }

        // Draw guides if requested
        if (includeGuides) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 4;
            ctx.setLineDash([12, 10]);

            p.guides.forEach(g => {
                const parsePct = (val, max) => (parseFloat(val) / 100) * max;
                const top = parsePct(g.top, canvas.height);
                const bottom = parsePct(g.bottom, canvas.height);
                const left = parsePct(g.left, canvas.width);
                const right = parsePct(g.right, canvas.width);

                const w = canvas.width - left - right;
                const h = canvas.height - top - bottom;

                ctx.strokeRect(left, top, w, h);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(left, top - 40, 260, 36);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(g.label, left + 10, top - 16);
            });
        }

        canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safezoneState.platform}-${p.width}x${p.height}${includeGuides ? '-with-guides' : ''}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        }, 'image/png');
    };
    img.src = safezoneState.artworkSrc;
}



