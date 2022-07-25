(function () {
    const SCROLLER_ID = "jmuse-scroller-component";
    const TITLE_CL = "C4LKv DIiWA Pz1rt";
    const ARTIST_CL = "ASx44 AJXCt Bz0hi g1QZl";
    const DLD_BTN_ID = "9eb7dc50a34f5b5c1cff5f66d2e17b0b";
    const DLD_BTN_CL = "TtlUw TtlUw R1reb r6afg HFvdW Dhs0s nOTLW utani s_klh u_VDg";
    const DLD_SEC_CL = "lPCDt oJw2k UvTPO XyPHW g1QZl eDGkx";

    let scroller = document.getElementById(SCROLLER_ID);
    let title = document.getElementsByClassName(TITLE_CL)[0].innerText;
    let artist = document.getElementsByClassName(ARTIST_CL)[0].children[1].children[0].innerText;
    let pageNum = document.getElementsByClassName("BmIOX").length;

    const dldSection = document.getElementsByClassName("js-page react-container")[0].children[0].children[1].children[1].children[0].children[3].children[0];
    const dldBtn = dldSection.children[0];

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
            <div class="tag-content" id="file-name">${title + " - " + artist + ".pdf"}</div>
        </div>
    </div>
    <div id="page-content"></div>
    <div class="btn-container">
        <div class="unactive" id="dld-html-btn">HTML</div>
        <div class="unactive" id="dld-pdf-btn">PDF</div>
        <div class="unactive" id="print-btn"><span class="material-symbols-outlined" style="font-size: 14px;">print</span></div>
    </div>
    <div id="message"></div>
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

    if(scroller){
        let info = {
            title: title.innerText,
            artist: artist.innerText,
            pages: pageNum
        }

        browser.runtime.sendMessage({
            command: "page-info",
            data: info
        });

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

        const sendToEx = () => {
            const msgData = [];

            for(let j=0; j<=lastPageIndex; j++){
                msgData.push(pages[j].src);
            }

            browser.runtime.sendMessage({
                command: "pages",
                data: JSON.stringify({
                    info: info, 
                    // TODO: send sheets individually to allow loading progress
                    sheets: msgData
                })
            });
        }

        const getSheetURL = async (index) => {
            return fetch(`https://musescore.com/api/jmuse?id=769686&index=${index}&type=img&v2=1`, {
                headers: {
                    "Authorization": "8c022bdef45341074ce876ae57a48f64b86cdcf5"
                }
            }).then(r => r.json())
            .then(r => {
                return r.info.url
            });
        }

        // const getSheetDataURL = async (url, fileType) => {
        //     browser.runtime.sendMessage({command:"GetDataURL", data:JSON.stringify({url:url, ft:fileType})});

        //     return new Promise(resolve => {
        //         browser.runtime.onMessage.addListener(msg => {
        //             if(msg.command = "DataUrl"){
        //                 resolve(msg.dataURL);
        //             }
        //         });
        //     });
        // }

        const crawlSheets = async () => {
            scroller.scrollTo(0, 0);
            // first sheet over src on load

            // all following sheets over API

            let sheets = [];
            for(let i=0; i<pageNum; i++){
                sheets.push(await getSheetURL(i));
            }

            if(dldBtn){
                let hBtn = document.createElement("button");
                hBtn.className = DLD_BTN_CL;
                hBtn.innerHTML = dldBtn.innerHTML;
                hBtn.onclick = () => {
                    popupContainer.style.display = "flex";
                };

                dldSection.replaceChild(hBtn, dldBtn);
            }
        }
        crawlSheets();
    }
})();