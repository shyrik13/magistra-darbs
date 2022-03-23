export const GetTexture = async(device:GPUDevice, imageName:string, 
    addressModeU = 'repeat',addressModeV = 'repeat') => {

    // get image file
    const img = document.createElement('img');
    img.src = './build/resources/images/' + imageName;
    await img.decode();
    const imageBitmap = await createImageBitmap(img);

    // create sampler with linear filtering for smooth interpolation 
    const sampler = device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: addressModeU as GPUAddressMode,
        addressModeV: addressModeV as GPUAddressMode
    });       

    // create texture
    const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | 
               GPUTextureUsage.COPY_DST | 
               GPUTextureUsage.RENDER_ATTACHMENT
    });

    let queue:GPUQueue = device.queue;
    console.log(queue);
    console.log(device.queue);
    console.log(device);
    console.log(device.queue);

    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        [imageBitmap.width, imageBitmap.height]
    );

    return {
        texture,
        sampler
    }
}