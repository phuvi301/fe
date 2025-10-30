import { useState, useEffect } from 'react';

export const useImageColors = (imageUrl) => {
    const [colors, setColors] = useState({
        vibrant: '#3c74cfff',
        darkVibrant: '#1a1a1a',
        lightVibrant: '#5a5a5a',
        muted: '#666666',
        darkMuted: '#2a2a2a',
        lightMuted: '#8a8a8a'
    });
    const [isLoading, setIsLoading] = useState(false);

    // Hàm chuyển đổi RGB sang HSL
    const rgbToHsl = (r, g, b) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h * 360, s * 100, l * 100];
    };

    // Hàm chuyển đổi HSL sang RGB
    const hslToRgb = (h, s, l) => {
        h /= 360;
        s /= 100;
        l /= 100;
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        if (s === 0) {
            return [l * 255, l * 255, l * 255];
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            const r = hue2rgb(p, q, h + 1/3);
            const g = hue2rgb(p, q, h);
            const b = hue2rgb(p, q, h - 1/3);
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }
    };

    // Hàm chuyển RGB thành hex
    const rgbToHex = (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    // Hàm tính độ sáng của màu
    const getBrightness = (r, g, b) => {
        return (r * 299 + g * 587 + b * 114) / 1000;
    };

    // Hàm tính độ bão hòa của màu
    const getSaturation = (r, g, b) => {
        const [, s] = rgbToHsl(r, g, b);
        return s;
    };

    // Hàm trích xuất màu chủ đạo từ ảnh
    const extractColors = async (imageUrl) => {
        setIsLoading(true);
        
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        // Tạo canvas để xử lý ảnh
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Resize ảnh để tối ưu performance
                        const size = 50;
                        canvas.width = size;
                        canvas.height = size;
                        
                        ctx.drawImage(img, 0, 0, size, size);
                        const imageData = ctx.getImageData(0, 0, size, size);
                        const data = imageData.data;
                        
                        // Thu thập tất cả pixel colors
                        const colorMap = new Map();
                        
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const a = data[i + 3];
                            
                            // Bỏ qua pixel trong suốt
                            if (a < 128) continue;
                            
                            const color = `${r},${g},${b}`;
                            colorMap.set(color, (colorMap.get(color) || 0) + 1);
                        }
                        
                        // Sắp xếp màu theo tần suất
                        const sortedColors = Array.from(colorMap.entries())
                            .sort((a, b) => b[1] - a[1])
                            .map(entry => {
                                const [r, g, b] = entry[0].split(',').map(Number);
                                return {
                                    r, g, b,
                                    count: entry[1],
                                    brightness: getBrightness(r, g, b),
                                    saturation: getSaturation(r, g, b)
                                };
                            });
                        
                        // Lọc và phân loại màu
                        const vibrantColors = sortedColors.filter(color => 
                            color.saturation > 30 && color.brightness > 50 && color.brightness < 200
                        );
                        
                        const darkColors = sortedColors.filter(color => 
                            color.brightness < 100
                        );
                        
                        const lightColors = sortedColors.filter(color => 
                            color.brightness > 150
                        );
                        
                        const mutedColors = sortedColors.filter(color => 
                            color.saturation < 40
                        );
                        
                        // Tạo palette màu
                        const getColorHex = (colorArray, fallback) => {
                            if (colorArray.length > 0) {
                                const color = colorArray[0];
                                return rgbToHex(color.r, color.g, color.b);
                            }
                            return fallback;
                        };
                        
                        const generateVariant = (baseColor, lightnessAdjust, saturationAdjust = 0) => {
                            if (!baseColor || baseColor === '#3c74cfff') return baseColor;
                            
                            const r = parseInt(baseColor.slice(1, 3), 16);
                            const g = parseInt(baseColor.slice(3, 5), 16);
                            const b = parseInt(baseColor.slice(5, 7), 16);
                            
                            const [h, s, l] = rgbToHsl(r, g, b);
                            const newL = Math.max(0, Math.min(100, l + lightnessAdjust));
                            const newS = Math.max(0, Math.min(100, s + saturationAdjust));
                            
                            const [newR, newG, newB] = hslToRgb(h, newS, newL);
                            return rgbToHex(newR, newG, newB);
                        };
                        
                        const vibrant = getColorHex(vibrantColors, '#3c74cfff');
                        
                        const extractedColors = {
                            vibrant: vibrant,
                            darkVibrant: generateVariant(vibrant, -40) || getColorHex(darkColors, '#1a1a1a'),
                            lightVibrant: generateVariant(vibrant, 30) || getColorHex(lightColors, '#5a5a5a'),
                            muted: getColorHex(mutedColors, '#666666'),
                            darkMuted: generateVariant(getColorHex(mutedColors, '#666666'), -30) || '#2a2a2a',
                            lightMuted: generateVariant(getColorHex(mutedColors, '#666666'), 20) || '#8a8a8a'
                        };
                        
                        resolve(extractedColors);
                        
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
                
                img.src = imageUrl;
            });
            
        } catch (error) {
            console.warn('Color extraction error:', error);
            return {
                vibrant: '#3c74cfff',
                darkVibrant: '#1a1a1a',
                lightVibrant: '#5a5a5a',
                muted: '#666666',
                darkMuted: '#2a2a2a',
                lightMuted: '#8a8a8a'
            };
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!imageUrl) return;

        extractColors(imageUrl)
            .then(extractedColors => {
                setColors(extractedColors);
            })
            .catch(error => {
                console.warn('Failed to extract colors:', error);
                setIsLoading(false);
            });
    }, [imageUrl]);

    return { colors, isLoading };
};