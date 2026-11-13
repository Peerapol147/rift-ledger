// Original art embedded by esbuild: the city remains a live stage, not a flattened UI screenshot.
import cityUrl from '../art/ui/hunter-city.png';
let pixels = null;
export function loadHunterCity() {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 144;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, 256, 144);
    pixels = new Uint32Array(ctx.getImageData(0, 0, 256, 144).data.buffer);
  };
  image.id = 'title-backdrop'; image.alt = ''; image.setAttribute('aria-hidden', 'true');
  document.body.prepend(image);
  image.src = cityUrl;
}
export const hunterCityPixels = (scene) => scene === 'city' ? pixels : null;
