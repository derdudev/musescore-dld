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

        const checkDeadLink = (url) => {
            fetch(url, {method: "GET"})
                .then(res => res)
                .then(data => console.log(data));
        }

        const getSheet = async (url) => {
            return fetch(url, {method: "GET", mode:"cors"})
                .then(res => res)
                .then(data => {
                    console.log(data.type)
                    if(data.ok) {
                        let reader = data.body.getReader();

                        let sheet = [];
                        return reader.read().then(function processPage({done, value}) {
                            if(done) {
                                console.log(sheet);
                                var u8 = new Uint8Array(sheet);
                                let base64Sheet = "data:image/svg+xml;base64,"+btoa(String.fromCharCode.apply(null,u8));
                                return base64Sheet;
                            };
                            sheet = sheet.concat(...value);
                            return reader.read().then(processPage);
                        });
                    } else {
                        // clearInterval(loopID);
                    }
                }).catch(e => alert(e));
        }

        const crawlSheets = async () => {
            scroller.scrollTo(0, 0);
            setTimeout(()=>{}, 10)
            pages[0].src = scroller.children[0].children[0].src;
            let base64Sheet = await getSheet(pages[0].src);
            console.log(base64Sheet);
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
                                pages[i].src = await getSheet(currentSheet.src);
                                pages[i].scraped = true;
                            }
                            else {
                                currentSheet.onload = async () => {
                                    console.log("async");
                                    pages[i].src = await getSheet(currentSheet.src);
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
            }, 1000);
        }
        crawlSheets();
    }
})();