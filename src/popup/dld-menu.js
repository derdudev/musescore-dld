const dldBtn = document.getElementById("dld-btn");
const message = document.getElementById("message");
const pageContent = document.getElementById("page-content");

const getSheetDataURL = async (url, fileType) => {
    message.innerText = url;
    return fetch("https://msdld.mertz-es.de", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "Accept": '*/*'
        },
        body: JSON.stringify({url: url, ft: fileType}),
    })
        .then(r => r.json())
        .then(resBody => resBody.dataURL)
        .catch(e => message.innerText = e)
}

// https://stackoverflow.com/questions/5913338/embedding-svg-in-pdf-exporting-svg-to-pdf-using-js
const docKit = new PDFDocument({compress: false, size:"A4"});

// check if score is already in local storage based on score ID

browser.tabs.query({active: true, currentWindow: true})
    .then((tabs) => {
        browser.tabs.get(tabs[0].id)
            .then((tab) => {
                let scoreID = tab.url.match(/(?<=https\:\/\/musescore\.com\/user\/[0-9]+\/scores\/).+/);
                if(scoreID == null){
                    scoreID = tab.url.match(/(?<=https\:\/\/musescore\.com\/\w+\/scores\/).+/);
                }

                let fileType = "";

                const displayPages = (data) => {
                    let page;
                
                    pageContent.innerHTML = "";
                    for(let i=0; i<data.length; i++){
                        page = document.createElement("img");
                        page.src = data[i];
                        page.className = "sheet";
                        pageContent.appendChild(page);
                    }
                }

                const displayInfo = (data) => {
                    document.getElementById("title").innerText = data.title;
                    document.getElementById("artist").innerText = data.artist;
                    document.getElementById("page-num").innerText = data.pages;
                    document.getElementById("file-name").innerText = data.title + " - " + data.artist + ".pdf";
                }

                const createHTML = (info, sheets) => {
                    let file = document.createElement("html");
                    let body = document.createElement("body");
                    let page;

                    let tempSVG;
                    for(let i=0; i<sheets.length; i++){
                        page = document.createElement("img");
                        page.src = sheets[i];
                        page.style.height = "100vh"; 
                        body.appendChild(page);

                        if(info.fileType == "png") {
                            docKit.image(sheets[i], 0, 0, {width: 595});
                        }
                        else {
                            tempSVG = document.createElement("div");
                            tempSVG.innerHTML = atob(sheets[i].match(/(?<=data:image\/svg\+xml;base64,).*/));
                            
                            console.log(tempSVG.firstChild);
                            let width = tempSVG.firstChild.getAttribute("width");
                            let height = tempSVG.firstChild.getAttribute("height");

                            tempSVG.firstChild.setAttribute("width", "");
                            tempSVG.firstChild.setAttribute("height", "");
                            tempSVG.firstChild.setAttribute("viewBox", "0 0 " + width + " " + height);

                            console.log(tempSVG.firstChild);

                            SVGtoPDF(docKit, tempSVG.firstChild, 0, 0);
                        }
                        if(i < sheets.length-1) {
                            docKit.addPage();
                        }
                    }

                    let stream = docKit.pipe(blobStream());
                    stream.on('finish', () => {
                        let blob = stream.toBlob('application/pdf');
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = "t" + ".pdf";
                        link.click();
                    });
                    docKit.end();

                    file.appendChild(body);

                    let url = URL.createObjectURL(new Blob(["<html>"+file.innerHTML+"</html>"]));
                    return url;
                }

                const downloadFile = (info, objectURL) => {
                    console.log(objectURL);
                    browser.downloads.download({url: objectURL, filename: info.title + " - " + info.artist + ".html"});

                    browser.downloads.onChanged.addListener(({state})=>{
                        message.innerHTML = state.current;
                        URL.revokeObjectURL(objectURL);
                    });
                }
                
                browser.storage.local.get("msdld-"+scoreID)
                    .then((promiseData) => {
                        let storageData = (Object.entries(promiseData) == 0) ? null : promiseData["msdld-"+scoreID];

                        console.log(JSON.parse(storageData));
                        if(storageData){
                            displayPages(JSON.parse(storageData).sheets);
                            displayInfo(JSON.parse(storageData).info);

                            let dataURL = createHTML(JSON.parse(storageData).info, JSON.parse(storageData).sheets);

                            dldBtn.addEventListener("click", ()=>{downloadFile(JSON.parse(storageData).info, dataURL)});
                        } else {
                            browser.tabs
                                .executeScript({ file: "/content-scripts/musescore-dld-main.js" })
                                .catch((error) => message.innerText = error.message);
                        
                            browser.runtime.onMessage.addListener((msg) => {
                                if(msg.command == "page-info"){
                                    displayInfo(msg.data);
                                } else if (msg.command == "pages"){
                                    let sheets = JSON.parse(msg.data).sheets;
                                    fileType = sheets[0].match(/(?<=https\:\/\/musescore\.com\/static\/musescore\/scoredata\/g\/\w+\/score_0.).{3}/)[0];  

                                    (async function () {
                                        displayPages(sheets);
                                        
                                        let sheetsDataURLs = [];
                                        for(let i=0; i<sheets.length; i++){
                                            sheetsDataURLs[i] = await getSheetDataURL(sheets[i], fileType);
                                        }

                                        let infoFT = JSON.parse(msg.data).info;
                                        infoFT.fileType = fileType;

                                        console.log(infoFT, JSON.parse(msg.data));
                            
                                        let storeData = {};
                                        storeData["msdld-"+scoreID] = JSON.stringify({
                                            info: infoFT, 
                                            sheets: sheetsDataURLs
                                        });

                                        browser.storage.local.set(storeData); 

                                        let dataURL = createHTML(infoFT, sheetsDataURLs);
                                        
                                        dldBtn.addEventListener("click", ()=>{downloadFile(JSON.parse(msg.data).info, dataURL)});
                                    })();
                                }
                            })
                        }
                    });
            })
    })
