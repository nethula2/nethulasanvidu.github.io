/**
 * NETHULA SANVIDU — HIGH-FIDELITY LOSSLESS WATERMARKING ENGINE
 * 
 * Auto-detects 1080x1080 (1:1) vs 1080x1350 (4:5) aspect ratios
 * and overlays the exact official logo branding watermark at 100% full native resolution.
 * Zero downsampling, zero quality loss, lossless PNG output.
 */
(function(window) {
    'use strict';

    const WatermarkEngine = {
        WATERMARK_SQUARE: 'assets/watermark-1080x1080.png',
        WATERMARK_PORTRAIT: 'assets/watermark-1080x1350.png',

        cache: {
            square: null,
            portrait: null,
            promise: null
        },

        preload: function() {
            if (this.cache.promise) return this.cache.promise;

            const load = (src) => new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => {
                    const fallback = new Image();
                    fallback.crossOrigin = 'anonymous';
                    fallback.onload = () => resolve(fallback);
                    fallback.onerror = () => resolve(null);
                    fallback.src = src.replace('assets/', '');
                };
                img.src = src;
            });

            this.cache.promise = Promise.all([
                load(this.WATERMARK_SQUARE),
                load(this.WATERMARK_PORTRAIT)
            ]).then(([sq, pt]) => {
                this.cache.square = sq;
                this.cache.portrait = pt;
                return { square: sq, portrait: pt };
            });

            return this.cache.promise;
        },

        /**
         * Process an image (HTMLImageElement, File, Blob, or URL string)
         * @param {HTMLImageElement|File|Blob|string} source
         * @param {Object} options
         * @returns {Promise<Object>}
         */
        process: async function(source, options = {}) {
            await this.preload();

            let img;
            let filename = 'watermarked-post.png';

            if (source instanceof HTMLImageElement) {
                img = source;
            } else if (source instanceof File || source instanceof Blob) {
                if (source.name) {
                    filename = source.name.replace(/\.[^/.]+$/, "") + "-watermarked.png";
                }
                img = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const i = new Image();
                        i.onload = () => resolve(i);
                        i.onerror = reject;
                        i.src = e.target.result;
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(source);
                });
            } else if (typeof source === 'string') {
                img = await new Promise((resolve, reject) => {
                    const i = new Image();
                    i.crossOrigin = 'anonymous';
                    i.onload = () => resolve(i);
                    i.onerror = reject;
                    i.src = source;
                });
            } else {
                throw new Error("Invalid image source provided to WatermarkEngine");
            }

            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            const ratio = width / height;

            // Ratio threshold:
            // 1080x1350 is 4:5 = 0.8 (< 0.9)
            // 1080x1080 is 1:1 = 1.0 (>= 0.9)
            const isPortrait = ratio < 0.9;
            const ratioType = isPortrait ? '1080x1350 (4:5 Portrait)' : '1080x1080 (1:1 Square)';
            const watermarkImg = isPortrait ? this.cache.portrait : this.cache.square;
            const watermarkName = isPortrait ? '1080 x 1350 logos.png' : '1080 x 1080 logos.png';

            // Create 100% Full-Resolution Canvas (NO downsampling, ZERO quality loss)
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // 1. Draw base design at 100% native resolution
            ctx.drawImage(img, 0, 0, width, height);

            // 2. Draw ratio-matched logo watermark overlay
            if (watermarkImg) {
                ctx.drawImage(watermarkImg, 0, 0, width, height);
            }

            // 3. Subtle center confidentiality stamp if requested
            if (options.subtleCenterStamp) {
                ctx.save();
                const centerFontSize = Math.max(16, Math.round(width * 0.036));
                ctx.font = `700 ${centerFontSize}px "Syncopate", sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
                ctx.shadowBlur = Math.max(3, Math.round(centerFontSize * 0.18));
                ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
                ctx.fillText(options.centerText || "NETHULA SANVIDU", width / 2, height / 2);

                const subFontSize = Math.max(9, Math.round(centerFontSize * 0.32));
                ctx.font = `600 ${subFontSize}px "Space Grotesk", sans-serif`;
                ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
                ctx.fillText("CONFIDENTIAL // GRAPHIC DESIGN ARCHIVE", width / 2, (height / 2) + (centerFontSize * 0.85));
                ctx.restore();
            }

            // Export to lossless PNG Blob
            const blob = await new Promise((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/png');
            });

            return {
                canvas: canvas,
                width: width,
                height: height,
                ratio: ratio,
                isPortrait: isPortrait,
                ratioType: ratioType,
                watermarkName: watermarkName,
                filename: filename,
                blob: blob,
                dataUrl: canvas.toDataURL('image/png')
            };
        },

        download: function(canvasOrBlob, filename = 'watermarked-post.png') {
            const url = (canvasOrBlob instanceof HTMLCanvasElement)
                ? canvasOrBlob.toDataURL('image/png')
                : URL.createObjectURL(canvasOrBlob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            if (!(canvasOrBlob instanceof HTMLCanvasElement)) {
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
        }
    };

    // Preload watermarks immediately
    WatermarkEngine.preload();

    window.WatermarkEngine = WatermarkEngine;
})(window);
