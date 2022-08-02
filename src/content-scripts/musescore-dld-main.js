(async () => {
    try {
        const SCROLLER_ID = "jmuse-scroller-component";
        const TITLE_CL = "C4LKv DIiWA Pz1rt";
        const ARTIST_CL = "ASx44 AJXCt Bz0hi g1QZl";
        const DLD_BTN_ID = "9eb7dc50a34f5b5c1cff5f66d2e17b0b";
        const DLD_BTN_CL = "TtlUw TtlUw R1reb r6afg HFvdW Dhs0s nOTLW utani s_klh u_VDg";
        const DLD_SEC_CL = "lPCDt oJw2k UvTPO XyPHW g1QZl eDGkx";
    
        let sheets = [];
        let sheetsDataURLs = [];
        let fileType = "";
        let scoreID = (window.location.href.match(/(?<=https:\/\/musescore\.com\/user\/.*\/scores\/).*/) || window.location.href.match(/(?<=https:\/\/musescore\.com\/.*\/scores\/).*/))[0];
        let scroller; // = document.getElementById(SCROLLER_ID);
        let title, artist;
        let pageNum // = document.getElementsByClassName("BmIOX").length;
        let dldSection // = document.getElementsByClassName("js-page react-container")[0].children[0].children[1].children[1].children[0].children[3].children[0];
        let dldBtn // = dldSection.children[0];

        const init = async () => {
            let smPopup = document.createElement("div");
            smPopup.innerText = "Initiating MsDLD v6";
            smPopup.className = "sm-popup";
            document.body.appendChild(smPopup);

            return new Promise(resolve => {
                let interval = setInterval(()=>{
                    console.log("loading")
                    if(document.getElementsByClassName(TITLE_CL)[0]){
                        title = document.getElementsByClassName(TITLE_CL)[0].innerText;
                        artist = document.getElementsByClassName(ARTIST_CL)[0].children[1].children[0].innerText;
                    } else {
                        title = document.querySelector("meta[property='og:title']").content;
                        artist = "";
                    }

                    if(document.getElementById(SCROLLER_ID)!= null && document.getElementsByClassName("BmIOX") != null && document.getElementsByClassName("js-page react-container") != null && title != null) {
                        scroller = document.getElementById(SCROLLER_ID);
                        pageNum = document.getElementsByClassName("BmIOX").length;
                        dldSection = document.getElementsByClassName("js-page react-container")[0].children[0].children[1].children[1].children[0].children[3].children[0];
                        dldBtn = dldSection.children[0];
                        setTimeout(()=>document.body.removeChild(smPopup), 500)
                        clearInterval(interval);
                        resolve();
                    } 
                }, 100);
            });
        }

        await init();
        
        let popup = document.createElement("div");
        popup.className = "popup";
    
        popup.innerHTML = `
        <div class="header">MusescoreDLD</div>
        <div class="header-description">for musescore version 6.</div>
        <div class="page-info">
            <div class="tags">
                <div class="tag">Title:</div>
                <div class="tag">Artist:</div>
                <div class="tag">Pages:</div>
                <div class="tag">File name:</div>
            </div>
            <div class="tags-content">
                <div class="tag-content" id="title">${title}</div>
                <div class="tag-content" id="artist">${artist}</div>
                <div class="tag-content" id="page-num">${pageNum}</div>
                <div class="tag-content" id="file-name">${artist + " - " + title + ".pdf"}</div>
            </div>
        </div>
        <div id="page-content"></div>
        <div id="user-log"></div>
        <div class="btn-container">
            <div id="dld-btn">Download (PDF)</div>
            <div id="print-btn"><span class="material-symbols-outlined" style="font-size: 18px;">print</span></div>
        </div>
        `
    
        let popupClose = document.createElement("div");
        popupClose.className = "popup-close";
        popupClose.onclick = () => {
            popupContainer.style.display = "none";
        }
    
        let popupContainer = document.createElement("div");
        popupContainer.className = "popup-container";
        popupContainer.appendChild(popup);
        popupContainer.appendChild(popupClose);
    
        document.body.append(popupContainer);
        const pageContent = document.getElementById("page-content");
        const userLog = document.getElementById("user-log");
    
        const msgColor = {
            error: "#e53e3e",
            msg: "#fff",
            success: "#48BB78",
            warning: "#f5ab28",
        }
    
        const logToUser = (msg, color) => {
            let log = document.createElement("div");
            log.className = "log-msg";
            if(color) log.style.color = msgColor[color];
            else log.style.color = msgColor["msg"];
            log.innerText = msg;
            userLog.appendChild(log);
            log.scrollIntoView();
        }
    
        const getSheetDataURL = async (url, fileType) => {
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
                .catch(e => {
                    logToUser("Fetching Error: Server for fetching data URLs cannot be reached or it does not respond correctly.", "error");
                    throw new Error("Fetching Error: Server for fetching data URLs cannot be reached or it does not respond correctly.");
                })
        }
    
        // https://stackoverflow.com/questions/2219526/how-many-bytes-in-a-javascript-string#12205668
        function byteCount(s) {
            return encodeURI(s).split(/%..|./).length - 1;
        }
    
        const pDldBtn = document.getElementById("dld-btn"); // extension popup dld button
        pDldBtn.className = "unactive";
        pDldBtn.onclick = async () => {
            logToUser("PDF Download initiated...");
            logToUser(`Downloading ${pageNum} pages...`);
    
            let currentSheetURL;
            let completeString;
            for(let i=0; i<pageNum; i++){
                logToUser(`Downloading page ${i+1} of ${pageNum}...`);
                currentSheetURL = await getSheetDataURL(sheets[i], fileType)
                sheetsDataURLs[i] = currentSheetURL;
                completeString += currentSheetURL;
                logToUser(`Download of page ${i+1} of ${pageNum} complete.`, "success");
            }
            let estimatedDldTime = Math.floor(byteCount(completeString)/99333);
            logToUser("Estimated download time: " + estimatedDldTime + " seconds");
            browser.runtime.sendMessage({
                command: "download",
                data: JSON.stringify({
                    info: {
                        title: title,
                        artist: artist
                    }, 
                    type: "pdf",
                    fileType: fileType,
                    urls: sheetsDataURLs
                })
            });
            let counter = 2;
            let interval = setInterval(() => {
                logToUser(`Bear with us, the download is progressing... ${"(" + counter + "s passed)"}`);
                if(counter < estimatedDldTime+10) {
                    if(counter == 16) logToUser(`This is taking a little longer but nothing to worry about.`, "warning");
                    else if (counter == 26) logToUser(`Still going - must be a huge file. And YOU still got the brains to play it tho, amazing!`, "warning");
                    else if (counter == 36) logToUser(`Mmh, this really is taking its time, isnt it?`, "warning");
                    else if (counter == 46) logToUser(`And here we are, having waited 10 more seconds. What a life!`, "warning");
                    else if (counter == 56) logToUser(`Now its getting kind of embarrasing. This takes for ever! Anyway, let's blame the internet!`, "warning");
                    else if (counter == 66) logToUser(`This is the point at which you should head to Twitter and cancel this downloader. It's probably racist too!`, "warning");
                    counter += 2;
                } else {
                    logToUser(`Download TIMEOUT. Estimated download time: ${estimatedDldTime}s | Process interupted at ${counter}s`)
                }
            }, 2000);
            browser.runtime.onMessage.addListener(msg => {
                if(msg.command == "dldSucc") {
                    logToUser("PDF file was successfully created.", "success");
                    clearInterval(interval);
                    if(counter >= 30) logToUser(`Wow, this was a T H I C C boi.`, "warning");
                    counter = 0;
                } else if (msg.command == "received") {
                    logToUser("Getting together the tools for building this bad boi...", "warning");
                } else if (msg.command == "addingPage") {
                    logToUser(`Adding page ${msg.pageNum +" of "+pageNum} to PDF...`);
                } else if (msg.command == "addedPage") {
                    logToUser(`Successfully added page ${msg.pageNum +" of "+pageNum} to PDF.`, "success");
                } else if (msg.command == "backendError"){
                    logToUser("Backend Error: " + msg.error, "error");
                    clearInterval(interval);
                    throw new Error("Backend Error: " + msg.error);
                }
            })    
        }
    
        if(scroller){
            const pages = [];
            for(let i=0; i<scroller.children.length-2; i++){
                pages.push({
                    element: scroller.children[i],
                    scraped: false,
                    src: "",
                });
            }
    
            let lastPageIndex = scroller.children.length - 3;
            let lastPage = scroller.children[lastPageIndex];
    
            if(lastPage.className == ""){
                lastPage.parentNode.removeChild(lastPage);
                lastPageIndex = lastPageIndex-1;
                lastPage = scroller.children[lastPageIndex];
            }
    
            const getSheetURL = async (index) => {
                return fetch(`https://musescore.com/api/jmuse?id=${scoreID}&index=${index}&type=img&v2=1`, {
                    headers: {
                        "Authorization": "8c022bdef45341074ce876ae57a48f64b86cdcf5"
                    }
                }).then(r => r.json())
                .then(r => r.info.url);
            }
    
            const crawlSheets = async () => {
                let currentSheet = "";
                let img, imgContainer, psElem;
                let displaySheets = (pageContent.children.length == 0);
                for(let i=0; i<pageNum; i++){
                    currentSheet = await getSheetURL(i);
                    sheets.push(currentSheet);
                    if(displaySheets) {
                        img = document.createElement("img");
                        img.src = currentSheet;
                        img.className = "sheet";
                        imgContainer = document.createElement("div");
                        imgContainer.className = "sheet-container";
                        imgContainer.setAttribute("page-num", i+1);
                        imgContainer.appendChild(img);
                        pageContent.appendChild(imgContainer);
                    }
    
                    if(i==0) {
                        fileType = currentSheet.match(/(?<=https:\/\/s3\.ultimate-guitar\.com\/musescore\.scoredata\/g\/.+\/score_0\.).{3}/)[0];
                        console.log(fileType);
                    }
                }
    
                console.log(dldBtn);
                if(dldBtn){
                    let hBtn = document.createElement("button");
                    hBtn.className = DLD_BTN_CL;
                    hBtn.style.backgroundColor = "#26a875";
                    hBtn.innerHTML = dldBtn.innerHTML;
                    hBtn.onclick = () => {
                        popupContainer.style.display = "flex";
                    };
    
                    dldSection.replaceChild(hBtn, dldBtn);
                }
    
                if(sheets) pDldBtn.classList = "";
            }
            crawlSheets();
        }
    } catch (e) {
        console.error(e);
    }
})();