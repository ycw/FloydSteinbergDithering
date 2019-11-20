import { Init } from '../dist/glue.js';

let imgUrl = '';
let wrapper = null;

(async function () {
    wrapper = await Init('../dist/optimized.wasm');
    document.body.ondragover = handleDragOver;
    document.body.ondrop = handleDrop;
    log('Please drop an image here');
}());



//----
// logger
//----

function log(msg) {
    document.querySelector('.status').textContent = msg;
}


//----
// ui
//----

function handleDragOver(e) {
    e.preventDefault();
}

async function handleDrop(e) {
    e.preventDefault();
    for (const item of e.dataTransfer.items) {
        if (item.kind == 'file' && item.type.startsWith('image/')) {
            const file = item.getAsFile();
            URL.revokeObjectURL(imgUrl);
            imgUrl = URL.createObjectURL(file);
            await dither(imgUrl);
        }
    }
}

async function dither(imgUrl) {
    const old = document.querySelector('canvas');
    old && old.remove();

    log('Processing');
    const imageData = await loadImageData(imgUrl);

    performance.mark('m0');
    wrapper.run(imageData);
    performance.measure('t0', 'm0');
    const { duration } = performance.getEntriesByName('t0')[0];
    performance.clearMarks();
    performance.clearMeasures();
    log(`Done (${duration | 0}ms)`);


    const nu = imageDataToCanvas(imageData);
    document.querySelector('.result').append(nu);
}



//----
// helpers
//----

async function loadImageData(imgUrl) {
    const image = await loadImage(imgUrl);
    return imageToImageData(image);
}

async function loadImage(imgUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject();
        img.src = imgUrl;
    });
}

function imageToImageData(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);;
}

function imageDataToCanvas(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}