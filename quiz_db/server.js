const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

/* MIDDLEWARE */
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/certificates", express.static("certificates"));

/* DB CONNECTION */
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Karthik#2005",
    database: "quiz_db"
});

db.connect(err => {
    if (err) throw err;
    console.log("MySQL Connected...");
});

/* GET QUESTIONS */
app.get("/questions", (req, res) => {
    db.query("SELECT * FROM questions", (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

/* SUBMIT QUIZ */
app.post("/submit", (req, res) => {
    const { name, answers } = req.body;

    db.query("SELECT * FROM questions", (err, questions) => {
        if (err) throw err;

        let score = 0;

        questions.forEach((q, index) => {
            if (answers[index] === q.correct_answer) {
                score++;
            }
        });

        /* CREATE CERTIFICATE */
        if (!fs.existsSync("certificates")) {
            fs.mkdirSync("certificates");
        }

        const fileName = `${name.replace(/\s+/g, "_")}.pdf`;
        const filePath = path.join("certificates", fileName);

        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(filePath));

        doc.fontSize(26).text("CERTIFICATE OF ACHIEVEMENT", { align: "center" });
        doc.moveDown();
        doc.fontSize(18).text("This certifies that", { align: "center" });
        doc.moveDown();
        doc.fontSize(22).text(name, { align: "center" });
        doc.moveDown();
        doc.fontSize(16).text(`Score: ${score}/${questions.length}`, { align: "center" });
        doc.moveDown();
        doc.text("Successfully completed the Quiz", { align: "center" });

        doc.end();

        res.json({
            score,
            total: questions.length,
            certificate: "certificates/" + fileName
        });
    });
});

/* START SERVER */
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});