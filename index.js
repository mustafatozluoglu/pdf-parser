const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");

const app = express();

app.use("/", express.static("public"));
app.use(fileUpload());

app.post("/extract-text", (req, res) => {
    if (!req.files || !req.files.pdfFile) {
        res.status(400).send("No file uploaded");
        return;
    }

    pdfParse(req.files.pdfFile.data).then((result) => {
        const text = result.text;
        try {
            const structuredData = parseTextToStructuredData(text);
            res.json(structuredData);
        } catch (error) {
            console.error('Parsing error:', error);
            res.status(500).send("Error parsing the PDF content");
        }
    }).catch(error => {
        console.error('PDF processing error:', error);
        res.status(500).send("Error parsing PDF");
    });
});

function parseTextToStructuredData(text) {
    const lines = text.split('\n');
    const data = [];
    let patientInfo = {};

    lines.forEach(line => {
        line = line.trim();
        if (!line) return; // Skip empty lines

        // Extract patient name and date
        if (line.startsWith('Adı Soyadı:')) {
            const name = line.split(':')[1].trim();
            patientInfo.name = name;
        } else if (line.startsWith('Tarih:')) {
            const date = line.split(':')[1].trim();
            patientInfo.date = date;
        } else {
            // Parsing test results
            const parts = line.split(/\s+/);
            if (parts.length >= 4) {
                const testName = parts.slice(0, -3).join(' ');
                const value = parts[parts.length - 3];
                const unit = parts[parts.length - 2];
                const referenceRange = parts[parts.length - 1];

                data.push({
                    testName,
                    value,
                    unit,
                    referenceRange
                });
            }
        }
    });

    return {
        patientInfo,
        results: data
    };
}

app.listen(3000, () => {
    console.log("Server running on port 3000");
});