const dldBtn = document.getElementById("dld-btn");
const message = document.getElementById("message");
const pageContent = document.getElementById("page-content");

// Default export is a4 paper, portrait, using millimeters for units
try {
    const doc = new jspdf.jsPDF();

    // doc.text("Hello world!", 10, 10);
    // doc.save("a4.pdf");
} catch (error) {
    message.innerText = error;
}

// for promise event handling see: http://stackoverflow.com/questions/37854355/ddg#56341485
// const getSheetDataURL = async (url) => {
//     let virtualImg = new Image();
//     const imgLoadPromise = new Promise(resolve => {
//         virtualImg.onload = () => {
//             virtualCanvasCtx.drawImage(virtualImg, 0, 0);
//         }
//         virtualImg.src = url;
//     });

//     await imgLoadPromise;
//     let dataURL = virtualCanvas.toDataURL();
//     return dataURL;
// }

// check if score is already in local storage based on score ID

browser.tabs.query({active: true, currentWindow: true})
    .then((tabs) => {
        browser.tabs.get(tabs[0].id)
            .then((tab) => {
                let scoreID = tab.url.match(/(?<=https\:\/\/musescore\.com\/user\/[0-9]+\/scores\/).+/);
                if(scoreID == null){
                    scoreID = tab.url.match(/(?<=https\:\/\/musescore\.com\/\w+\/scores\/).+/);
                }

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

                    for(let i=0; i<sheets.length; i++){
                        page = document.createElement("img");
                        page.src = sheets[i];
                        page.style.height = "100vh"; 
                        body.appendChild(page);
                    }

                    file.appendChild(body);

                    let url = URL.createObjectURL(new Blob(["<html>"+file.innerHTML+"</html>"]));

                    return url;
                }

                const downloadFile = (info, objectURL) => {
                    browser.downloads.download({url: objectURL, filename: info.title + " - " + info.artist + ".html"});

                    browser.downloads.onChanged.addListener(()=>{
                        URL.revokeObjectURL(objectURL);
                    });
                }
                
                browser.storage.local.get("msdld-"+scoreID)
                    .then((promiseData) => {
                        let storageData = (Object.entries(promiseData) == 0) ? null : promiseData["msdld-"+scoreID];
                        message.innerText = JSON.stringify(promiseData);
                        if(storageData){
                            try {
                                displayPages(JSON.parse(storageData).sheets);
                                displayInfo(JSON.parse(storageData).info);

                                let dataURL = createHTML(JSON.parse(storageData).info, JSON.parse(storageData).sheets);

                                dldBtn.addEventListener("click", ()=>{downloadFile(JSON.parse(storageData).info, dataURL)});
                            } catch (error) {
                                message.innerText = error;
                            }
                        } else {
                            browser.tabs
                                .executeScript({ file: "/content-scripts/musescore-dld-main.js" })
                                .catch((error) => message.innerText = error.message);
                        
                            browser.runtime.onMessage.addListener((msg) => {
                                if(msg.command == "page-info"){
                                    displayInfo(msg.data);
                                } else if (msg.command == "pages"){
                                    displayPages(JSON.parse(msg.data).sheets);
                            
                                    let storeData = {};
                                    storeData["msdld-"+scoreID] = msg.data;

                                    browser.storage.local.set(storeData);

                                    let dataURL = createHTML(JSON.parse(msg.data).info, JSON.parse(msg.data).sheets);

                                    dldBtn.addEventListener("click", ()=>{downloadFile(JSON.parse(msg.data).info, dataURL)});
                                }
                            })
                        }
                    });
            })
    })
