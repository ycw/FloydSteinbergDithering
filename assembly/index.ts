export function run(w: i32, h: i32): i32 {
  dither(w, h);
  return 0;
}



//
// Floyd–Steinberg dithering
//

function dither(w: i32, h: i32): void {
  let $pxIdx: i32;

  for (let y = 0, yL = h - 1; y < yL; ++y) { //y
    for (let x = 1, xL = w - 1; x < xL; ++x) { //x
      $pxIdx = idx(x, y, w);
      const old = loadPixel($pxIdx);
      const nu = old.quant();
      storePixel($pxIdx, nu);
      const err = old.sub(nu);

      $pxIdx = idx(x + 1, y, w);
      storePixel($pxIdx, loadPixel($pxIdx).add(err.scale(7.0 / 16)));
      $pxIdx = idx(x - 1, y + 1, w);
      storePixel($pxIdx, loadPixel($pxIdx).add(err.scale(3.0 / 16)));
      $pxIdx = idx(x, y + 1, w);
      storePixel($pxIdx, loadPixel($pxIdx).add(err.scale(5.0 / 16)));
      $pxIdx = idx(x + 1, y + 1, w);
      storePixel($pxIdx, loadPixel($pxIdx).add(err.scale(1.0 / 16)));
    }
  }

  // Update left|right edge pixels
  for (let y = 0, yL = h - 1; y < yL; ++y) {
    $pxIdx = idx(0, y, w);
    storePixel($pxIdx, loadPixel($pxIdx).quant());
    $pxIdx = idx(w - 1, y, w);
    storePixel($pxIdx, loadPixel($pxIdx).quant());
  }

  // Update bottom edge pixels
  for (let x = 0; x < w; ++x) {
    $pxIdx = idx(x, h - 1, w);
    storePixel($pxIdx, loadPixel($pxIdx).quant());
  }
}



//
// Pixel
//

class Pixel {
  constructor(
    public r: f32,
    public g: f32,
    public b: f32,
  ) {
    this.r = Pixel.Clamp(r);
    this.g = Pixel.Clamp(g);
    this.b = Pixel.Clamp(b);
  }

  // @ts-ignore
  @inline
  static Clamp(x: f32): f32 {
    return x < 0 ? 0 : (x > 255 ? 255 : x);
  }

  add(p: Pixel): Pixel {
    return new Pixel(
      this.r + p.r,
      this.g + p.g,
      this.b + p.b
    );
  }

  sub(p: Pixel): Pixel {
    return new Pixel(
      this.r - p.r,
      this.g - p.g,
      this.b - p.b
    );
  }

  scale(n: f32): Pixel {
    return new Pixel(
      n * this.r,
      n * this.g,
      n * this.b
    );
  }

  // @ts-ignore
  @inline
  quant(): Pixel {
    const x: f32 = (0.299 * this.r + 0.587 * this.g + 0.114 * this.b) < 127
      ? 0
      : 255;
    return new Pixel(x, x, x);
  }
}



// @ts-ignore
@inline
function loadPixel(pxIdx: i32): Pixel {
  let byteIdx: i32;
  return new Pixel(
    load<u8>(byteIdx = (pxIdx << 2)),
    load<u8>(byteIdx + 1),
    load<u8>(byteIdx + 2)
  );
}



// @ts-ignore
@inline
function storePixel(pxIdx: i32, nu: Pixel): void {
  let byteIdx: i32;
  store<u8>(byteIdx = (pxIdx << 2), u8(nu.r));
  store<u8>(byteIdx + 1, u8(nu.g));
  store<u8>(byteIdx + 2, u8(nu.b));
}



// @ts-ignore
@inline
function idx(x: i32, y: i32, w: i32): i32 {
  return y * w + x;
}