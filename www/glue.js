export async function Init(wasmUrl) {
    const imports = { env: { abort: console.error } };
    const respond = await fetch(wasmUrl);
    const bytes = await respond.arrayBuffer();
    const waSrc = await WebAssembly.instantiate(bytes, imports);
    return new Wrapper(waSrc);
}
class Wrapper {
    constructor(waSrc) {
        this.waSrc = waSrc;
        this.waExports = waSrc.instance.exports;
    }
    run(imageData) {
        // step 1 
        this.load(imageData);
        // step 2
        this.waExports.run(imageData.width, imageData.height);
        // step 3
        this.map(imageData);
        // step 4
        return imageData;
    }
    load(imageData) {
        const view = new DataView(this.waExports.memory.buffer);
        const data = imageData.data;
        const len = data.length;
        for (let i = 0; i < len; ++i) {
            view.setUint8(i, data[i]);
        }
    }
    map(imageData) {
        const view = new DataView(this.waExports.memory.buffer);
        const data = imageData.data;
        const len = data.length;
        for (let i = 0; i < len; ++i) {
            data[i] = view.getUint8(i);
        }
    }
}
