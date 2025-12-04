// src/util/cropImage.js
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.setAttribute("crossOrigin", "anonymous"); // Cloudinary
    image.src = url;
  });

// Devuelve un Blob JPEG del recorte que ve el usuario en el modal
export async function getCroppedImage(imageSrc, cropPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  const { width, height } = cropPixels;

  canvas.width = width;
  canvas.height = height;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    cropPixels.x * scaleX,
    cropPixels.y * scaleY,
    cropPixels.width * scaleX,
    cropPixels.height * scaleY,
    0,
    0,
    width,
    height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.9
    );
  });
}
