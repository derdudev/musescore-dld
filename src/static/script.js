const dldBtnPDF = document.getElementById("dld-btn-pdf");
const dldBtnMP3 = document.getElementById("dld-btn-mp3");
const URLInput = document.getElementById("url-input");
const FNInput = document.getElementById("filename-input");

dldBtnPDF.onclick = async (e) => {
    const scoreID = (URLInput.value.match(/(?<=https:\/\/musescore\.com\/user\/.*\/scores\/).*/) || URLInput.value.match(/(?<=https:\/\/musescore\.com\/.*\/scores\/).*/))[0];
    console.log(scoreID);
    // https://stackoverflow.com/questions/63942715/how-to-download-a-readablestream-on-the-browser-that-has-been-returned-from-fetc
    let res = await fetch("/pdf", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            scoreID: scoreID,
            url: URLInput.value
        })
    }).then(async res => {
        return res.blob();
    });

    const newBlob = new Blob([res])

    const blobUrl = window.URL.createObjectURL(newBlob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', (FNInput.value) ? FNInput.value + ".pdf" : "msdld-" + new Date().toISOString().substr(0, 19).replace('T', '').replaceAll("-", "").replaceAll(":", "") + ".pdf");
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    // clean up Url
    window.URL.revokeObjectURL(blobUrl);
}