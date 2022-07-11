(function () {
    let scroller = document.getElementById("jmuse-scroller-component");

    if(scroller){
        let title = document.getElementsByClassName("_13XTP _1eJPh _2Ovu-")[0];
        let artist = document.getElementsByClassName("_1Uhe3 _2yieq _2YIuG _3LaBc")[0].children[1].children[0];

        let info = {
            title: title.innerText,
            artist: artist.innerText,
            pages: document.getElementsByClassName("vAVs3").length
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

            console.log(msgData, msgData.length);

            browser.runtime.sendMessage({
                command: "pages",
                data: JSON.stringify({
                    info: info, 
                    sheets: msgData
                })
            });
        }

        const crawlSheets = () => {
            scroller.scrollTo(0, 0);
            setTimeout(()=>{}, 10)
            pages[0].src = scroller.children[0].children[0].src;
            pages[0].scraped = true;
            let id = setInterval(async ()=>{
                if(lastPage.children.length == 0){
                    scroller.scrollBy({
                        top: 100,
                        behavior: "smooth"
                    });
                    let currentSheet;
                    for(let i=1; i<lastPageIndex; i++){
                        if(scroller.children[i].children.length != 0 && !pages[i].scraped) {
                            currentSheet = scroller.children[i].children[0];
                            if(currentSheet.src != "") {
                                console.log("sync");
                                pages[i].src = currentSheet.src;
                                pages[i].scraped = true;
                            }
                            else {
                                currentSheet.onload = async () => {
                                    console.log("async");
                                    pages[i].src = currentSheet.src;
                                    pages[i].scraped = true;
                                }
                            }
                        }
                    }
                } else {
                    pages[lastPageIndex].src = scroller.children[lastPageIndex].children[0].src;
                    if(pages[lastPageIndex].src == "") {
                        scroller.children[i].children[0].onload = () => {
                            pages[lastPageIndex].src = scroller.children[lastPageIndex].children[0].src;
                            pages[lastPageIndex].scraped = true;
                            sendToEx();
                            clearInterval(id);
                        }
                    } else {
                        pages[lastPageIndex].scraped = true;
                        sendToEx();
                        clearInterval(id);
                    }
                }
            }, 10);
        }
        crawlSheets();
    }
})();