const virtualCanvas = document.getElementById("virtualCanvas");
const virtualCanvasCtx = virtualCanvas.getContext("2d");

const getSheetDataURL = async (url) => {
    let virtualImg = new Image();
    const imgLoadPromise = new Promise(resolve => {
        virtualImg.crossOrigin = "use-credentials";
        virtualImg.onload = resolve;
        virtualImg.src = url;
        document.body.appendChild(virtualImg)
    });

    await imgLoadPromise;
    
    virtualCanvasCtx.drawImage(virtualImg, 0, 0);
    let dataURL = virtualCanvas.toDataURL("data:image/png");
    return dataURL;
}

getSheetDataURL("https://musescore.com/static/musescore/scoredata/g/753fadfb32a6301c3699350088ea22249e7fc875/score_0.svg?no-cache=1579178546")
  .then(res => console.log(res));