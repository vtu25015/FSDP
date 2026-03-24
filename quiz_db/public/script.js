// ===== Quiz Variables =====
let questions = [];
let current = 0;
let answers = [];
let timer;
let timeLeft = 30; // seconds per question
let username = "";

// ===== Start Quiz =====
function startQuiz() {
    username = document.getElementById("name").value.trim();
    if (!username) return alert("Enter your name");
    localStorage.setItem("username", username);

    document.getElementById("startScreen").style.display = "none";
    document.getElementById("quizScreen").style.display = "block";

    fetch("/questions")
        .then(res => res.json())
        .then(data => {
            questions = data;
            current = 0;
            answers = [];
            loadQuestion();
            updateProgress();
        })
        .catch(err => console.error("Error fetching questions:", err));
}

// ===== Load Question =====
function loadQuestion() {
    clearInterval(timer);          // Clear any previous timer
    timeLeft = 30;                 // Reset time
    document.getElementById("time").innerText = timeLeft;

    const q = questions[current];
    document.getElementById("question").innerText = q.question;

    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";

    [q.option1, q.option2, q.option3, q.option4].forEach(opt => {
        optionsDiv.innerHTML += `
            <label class="option fade-in">
                <input type="radio" name="option" value="${opt}"> ${opt}
            </label>
        `;
    });

    startTimer(); // start countdown
}

// ===== Timer =====
function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("time").innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timer);
            answers.push(""); // unanswered
            current++;
            updateProgress();
            if (current < questions.length) loadQuestion();
            else submitQuiz();
        }
    }, 1000);
}

// ===== Next Question =====
function nextQuestion() {
    const selected = document.querySelector('input[name="option"]:checked');
    if (!selected) return alert("Select an option");

    clearInterval(timer);
    answers.push(selected.value);
    current++;
    updateProgress();

    if (current < questions.length) loadQuestion();
    else submitQuiz();
}

// ===== Progress Bar =====
function updateProgress() {
    const progress = (current / questions.length) * 100;
    document.getElementById("progressBar").style.width = progress + "%";
}

// ===== Submit Quiz =====
function submitQuiz() {
    if (!username) username = localStorage.getItem("username");
    if (!username) return alert("User not found. Go back and enter your name.");

    fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, answers })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem("score", data.score);
        localStorage.setItem("certificate", data.certificate);
        document.getElementById("quizScreen").style.display = "none";
        document.getElementById("resultScreen").style.display = "block";
        document.getElementById("score").innerText = `${data.score} / ${data.total}`;
    })
    .catch(err => console.error("Error submitting quiz:", err));
}

// ===== Download PDF Certificate =====
function downloadCertificate() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    const name = localStorage.getItem("username") || "Student";
    const score = localStorage.getItem("score") || 0;

    // Background
    doc.setFillColor(30,41,59);
    doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, "F");

    // Border
    doc.setDrawColor(56,189,248);
    doc.setLineWidth(8);
    doc.rect(20, 20, doc.internal.pageSize.width-40, doc.internal.pageSize.height-40);

    // Title
    doc.setTextColor(56,189,248);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(50);
    doc.text("Certificate of Completion", doc.internal.pageSize.width/2, 150, { align: "center" });

    // Subtitle
    doc.setTextColor(255,255,255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "normal");
    doc.text("This certificate is proudly presented to", doc.internal.pageSize.width/2, 220, { align: "center" });

    // Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.setTextColor(250,204,21);
    doc.text(name, doc.internal.pageSize.width/2, 280, { align: "center" });

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(24);
    doc.setTextColor(255,255,255);
    doc.text("For successfully completing the Automated Quiz Engine", doc.internal.pageSize.width/2, 340, { align: "center" });

    // Score
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(56,189,248);
    doc.text(`Score: ${score}`, doc.internal.pageSize.width/2, 400, { align: "center" });

    // Footer: Date and Signature
    const date = new Date().toLocaleDateString();
    doc.setFontSize(16);
    doc.setTextColor(148,163,184);
    doc.text(`Date: ${date}`, 50, doc.internal.pageSize.height - 50);
    doc.text("Signature", doc.internal.pageSize.width - 150, doc.internal.pageSize.height - 50);

    doc.save(`Certificate_${name.replace(/\s/g,'_')}.pdf`);
}