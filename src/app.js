const express = require("express");
const bodyParser = require("body-parser");
const path = require("path")
const app = express();
const axios = require("axios");
const PDFDocument = require('pdfkit');
const SVGtoPDF = require("svg-to-pdfkit")
const fs = require("fs");
const {
    parse,
    stringify
} = require('svgson');

app.use(express.json())
app.use("/public", express.static(path.join(__dirname, "static")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "static", "index.html"));
});

app.post("/pdf", async (req, res) => {
    const scoreID = req.body.scoreID;
    const msURL = req.body.url;
    let scoreURLs = [];
    let scorePages = [];

    let scan = true;
    let i = 0;
    while (scan) {
        await axios.get(`https://musescore.com/api/jmuse?id=${scoreID}&index=${i}&type=img&v2=1`, {
            headers: {
                "Authorization": "8c022bdef45341074ce876ae57a48f64b86cdcf5"
            }
        }).then(async res => {
            let url = res.data.info.url;
            await axios.get(url).then(res => {
                if (res.status != 404) {
                    scoreURLs.push(url)
                } else {
                    scan = false;
                }
                i++;
            }).catch(e => scan = false);;
            return;
        });
    }
    const fileType = scoreURLs[0].match(/(?<=https:\/\/s3\.ultimate-guitar\.com\/musescore\.scoredata\/g\/.+\/score_0\.).{3}/)[0];

    let docKit = new PDFDocument({
        compress: true,
        size: "A4"
    });
    for (let i = 0; i < scoreURLs.length; i++) {
        if (fileType == "svg") {
            await axios.get(scoreURLs[i]).then(res => scorePages.push(res.data));
            await parse(scorePages[i]).then(json => {
                let width = json.attributes.width;
                let height = json.attributes.height;
                let viewBox = "0 0 " + width + " " + height;
                json.attributes["viewBox"] = viewBox;
                json.attributes.width = "";
                json.attributes.height = "";
                scorePages[i] = stringify(json);
            });
            await SVGtoPDF(docKit, scorePages[i], 0, 0, {
                precision: 1
            });
        } else if (fileType == "png") {
            let chunks = [];
            await axios.get(scoreURLs[i], {
                responseType: "stream",
            }).then(res => {
                return new Promise(resolve => {
                    res.data.on("data", (chunk) => chunks.push(chunk));
                    res.data.on("end", () => {
                        scorePages[i] = Buffer.concat(chunks);
                        resolve();
                    });
                })
            });
            fs.writeFileSync("test.png", scorePages[i]);
            docKit.image(scorePages[i], 0, 0, {
                width: 595
            });
        }

        if (i < scoreURLs.length - 1) docKit.addPage();
    }

    // https://stackoverflow.com/questions/51063253/how-to-send-buffer-data-in-express
    res.writeHead(200, {'Content-Type': 'application/pdf'});
    // in pdfkit documentation: https://pdfkit.org/docs/getting_started.html#:~:text=write%20to%20PDF-,doc.pipe(res)%3B,-//%20HTTP%20response
    docKit.pipe(res);

    docKit.end();
    docKit = null;
    docKit = new PDFDocument({
        compress: false,
        size: "A4"
    }); // new instance for new stream!

})

app.listen(3000);