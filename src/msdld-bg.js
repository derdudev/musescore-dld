try {
    const downloadFile = (info, type, objectURL) => {
        browser.downloads.download({url: objectURL, filename: (info.artist) ? info.artist + " - " + info.title + ((type == "html") ? ".html" : ".pdf") : info.title + ".pdf"});
    
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
                const tabs = await browser.tabs.query({active: true, currentWindow: true}).then(tabs => tabs)
                try {
                    browser.tabs.sendMessage(tabs[0].id, {
                        command: "received",
                    })
                    
                    
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
        
                            browser.tabs.sendMessage(tabs[0].id, {
                                command: "addingPage",
                                pageNum: i+1,
                            })
                            await SVGtoPDF(docKit, tempSVG.firstChild, 0, 0);
                            browser.tabs.sendMessage(tabs[0].id, {
                                command: "addedPage",
                                pageNum: i+1,
                            })
                        }
                        if(i < data.urls.length-1) {
                            docKit.addPage();
                        }
                    }
                    
                    let stream = docKit.pipe(blobStream());
                    stream.on('finish', async () => {
                        let blob = stream.toBlob('application/pdf');
                        downloadFile(data.info, data.type, URL.createObjectURL(blob));
                        browser.tabs.sendMessage(tabs[0].id, {
                            command: "dldSucc",
                            data: ""
                        })
                        
                    });
                    docKit.end();
                    docKit = new PDFDocument({compress: false, size:"A4"}); // new instance for new stream!
                } catch (e) {
                    browser.tabs.sendMessage(tabs[0].id, {
                        command: "backendError",
                        error: e.message
                    }) 
                }
                
            })();
        }
    })    
} catch (e) {
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, {
            command: "backendError",
            error: e
        })
    })               
}