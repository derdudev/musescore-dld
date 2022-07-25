(function () {
    const SCROLLER_ID = "jmuse-scroller-component";
    const TITLE_CL = "C4LKv DIiWA Pz1rt";
    const ARTIST_CL = "ASx44 AJXCt Bz0hi g1QZl";
    const DLD_BTN_ID = "9eb7dc50a34f5b5c1cff5f66d2e17b0b";
    const DLD_BTN_CL = "TtlUw TtlUw R1reb r6afg HFvdW Dhs0s nOTLW utani s_klh u_VDg";
    const DLD_SEC_CL = "lPCDt oJw2k UvTPO XyPHW g1QZl eDGkx";

    let scroller = document.getElementById(SCROLLER_ID);

    const dldBtn = document.getElementById(DLD_BTN_ID);
    const dldSection = document.getElementsByClassName(DLD_SEC_CL)[0];

    let popup = document.createElement("div");
    popup.style.backgroundColor = "#1A202C";
    popup.style.color = "#fff";
    popup.style.height = "50vh";
    popup.style.width = "50vw";
    popup.style.zIndex = "102";
    popup.style.padding = "20px";

    let header = document.createElement("div");
    header.className = "header";
    header.innerHTML = "MusescodeDLD";
    popup.appendChild(header);

    let popupClose = document.createElement("div");
    popupClose.style.position = "fixed";
    popupClose.style.top = "0px";
    popupClose.style.left = "0px";
    popupClose.style.height = "100vh";
    popupClose.style.width = "100vw";
    popupClose.style.zIndex = "101";
    popupClose.style.backgroundColor = "rgba(0,0,0,.54)";
    popupClose.onclick = () => {
        popupContainer.style.display = "none";
    }

    let popupContainer = document.createElement("div");
    popupContainer.style.position = "fixed";
    popupContainer.style.top = "0px";
    popupContainer.style.left = "0px";
    popupContainer.style.height = "100vh";
    popupContainer.style.width = "100vw";
    popupContainer.style.display = "none";
    popupContainer.style.justifyContent = "center";
    popupContainer.style.alignItems = "center";
    popupContainer.style.zIndex = "1051";
    popupContainer.appendChild(popup);
    popupContainer.appendChild(popupClose);

    document.body.append(popupContainer);

    if(scroller){
        let title = document.getElementsByClassName(TITLE_CL)[0];
        let artist = document.getElementsByClassName(ARTIST_CL)[0].children[1].children[0];
        let pageNum = document.getElementsByClassName("BmIOX").length;

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