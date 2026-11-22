/**
 * Zero-Cost Image Compression via HTML5 Canvas
 * maxWidth: 720px, WebP with JPEG fallback, target size < 75KB Base64 data URL
 */
export async function compressImage(
  file: File,
  maxWidth = 720,
  initialQuality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('تعذر معالجة الصورة'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر إنشاء سياق رسم الصورة'));
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // 75KB in Base64 is approx 75 * 1024 * 1.37 ≈ 105,000 characters
        const MAX_BASE64_LEN = 105000;
        let currentQuality = initialQuality;
        let dataUrl = canvas.toDataURL('image/webp', currentQuality);

        // Check if webp is supported (if unsupported, browsers return image/png)
        if (dataUrl.startsWith('data:image/png')) {
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          while (dataUrl.length > MAX_BASE64_LEN && currentQuality > 0.25) {
            currentQuality -= 0.15;
            dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          }
        } else {
          while (dataUrl.length > MAX_BASE64_LEN && currentQuality > 0.25) {
            currentQuality -= 0.15;
            dataUrl = canvas.toDataURL('image/webp', currentQuality);
          }
        }

        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
