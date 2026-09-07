/**
 * Converts a File or Blob into a Base64 string and detects its MIME type.
 * Downscales images exceeding max dimension to prevent network bloat while maintaining high visual fidelity.
 */
export async function fileToBase64(file: File | Blob): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const mime = file.type || 'image/jpeg';
            const resizedDataUrl = canvas.toDataURL(mime, 0.88);
            const cleanBase64 = resizedDataUrl.split(',')[1];
            resolve({ base64: cleanBase64, mimeType: mime });
            return;
          }
        }
        const cleanBase64 = dataUrl.split(',')[1];
        resolve({ base64: cleanBase64, mimeType: file.type || 'image/jpeg' });
      };
      img.onerror = () => {
        const cleanBase64 = dataUrl.split(',')[1];
        resolve({ base64: cleanBase64, mimeType: file.type || 'image/jpeg' });
      };
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts an external image URL to base64 by drawing it to a canvas.
 */
export async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  return fileToBase64(blob);
}
