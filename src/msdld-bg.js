const downloadFile = (info, type, objectURL) => {
    browser.downloads.download({url: objectURL, filename: info.artist + " - " + info.title + ((type == "html") ? ".html" : ".pdf")});

    browser.downloads.onChanged.addListener(({state})=>{
        // message.innerHTML = state.current;
        URL.revokeObjectURL(objectURL);
    });
}

// https://stackoverflow.com/questions/5913338/embedding-svg-in-pdf-exporting-svg-to-pdf-using-js
let docKit = new PDFDocument({compress: false, size:"A4"});

browser.runtime.onMessage.addListener(msg => {
    if(msg.command == "download"){
        (async ()=>{
            let data = JSON.parse(msg.data);

            let tempSVG;
            for(let i=0; i<data.urls.length; i++){
                if(data.fileType == "png") {
                    await docKit.image(data.urls[i], 0, 0, {width: 595});
                }
                else {
                    tempSVG = document.createElement("div");
                    tempSVG.innerHTML = atob(data.urls[i].match(/(?<=data:image\/svg\+xml;base64,).*/));
                    
                    console.log(tempSVG.firstChild);
                    let width = tempSVG.firstChild.getAttribute("width");
                    let height = tempSVG.firstChild.getAttribute("height");

                    tempSVG.firstChild.setAttribute("width", "");
                    tempSVG.firstChild.setAttribute("height", "");
                    tempSVG.firstChild.setAttribute("viewBox", "0 0 " + width + " " + height);

                    console.log(tempSVG.firstChild);

                    await SVGtoPDF(docKit, tempSVG.firstChild, 0, 0);
                }
                if(i < data.urls.length-1) {
                    docKit.addPage();
                }
            }
            
            let stream = docKit.pipe(blobStream());
            stream.on('finish', async () => {
                let blob = stream.toBlob('application/pdf');
                downloadFile(data.info, data.type, URL.createObjectURL(blob));
                browser.tabs.query({active: true, currentWindow: true}) // tabs id is required to send msg !
                    .then(tabs => {
                        browser.tabs.sendMessage(tabs[0].id, {
                            command: "dldSucc",
                            data: ""
                        })
                    })
                
            });
            docKit.end();
            docKit = new PDFDocument({compress: false, size:"A4"}); // new instance for new stream!
        })();
    }
})
