function resolveApiBase() {
    const fromStorage = localStorage.getItem("API_BASE_URL");
    if (fromStorage) return fromStorage.replace(/\/+$/, "");

    if (window.location.protocol.startsWith("http") && window.location.hostname) {
        return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    }
    return "http://127.0.0.1:5000/api";
}

const API_BASE = resolveApiBase();

function setStatus(el, type, msg) {
    if (!el) return;
    el.className = `status ${type}`;
    el.textContent = msg;
}

function escapeHtml(str) {
    return String(str || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function analyzeResumeSubmit(event) {
    event.preventDefault();
    const statusEl = document.getElementById("status");
    const form = document.getElementById("analyzeForm");
    const fileInput = document.getElementById("resumeFile");
    const jdInput = document.getElementById("jobDescription");

    if (!fileInput.files || !fileInput.files[0]) {
        setStatus(statusEl, "error", "Please select a resume file.");
        return;
    }

    setStatus(statusEl, "info", "Analyzing resume...");
    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);
    formData.append("job_description", jdInput.value || "");

    try {
        const response = await fetch(`${API_BASE}/analyze-resume`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || "Failed to analyze resume.");
        }

        localStorage.setItem("resume_analysis_result", JSON.stringify(data));
        setStatus(statusEl, "success", "Analysis complete. Redirecting...");
        form.reset();
        setTimeout(() => {
            window.location.href = "result.html";
        }, 500);
    } catch (err) {
        const msg = err?.message === "Failed to fetch"
            ? `Cannot connect to backend at ${API_BASE}. Start Flask server first.`
            : err.message;
        setStatus(statusEl, "error", msg);
    }
}

async function rankCandidatesSubmit(event) {
    event.preventDefault();
    const statusEl = document.getElementById("recruiterStatus");
    const files = document.getElementById("resumesFiles").files;
    const jd = document.getElementById("recruiterJobDescription").value;
    const output = document.getElementById("rankOutput");

    if (!files || files.length === 0) {
        setStatus(statusEl, "error", "Upload at least one resume.");
        return;
    }
    if (!jd.trim()) {
        setStatus(statusEl, "error", "Job description is required.");
        return;
    }

    setStatus(statusEl, "info", "Ranking candidates...");
    const formData = new FormData();
    formData.append("job_description", jd);
    for (const file of files) {
        formData.append("resumes", file);
    }

    try {
        const response = await fetch(`${API_BASE}/rank-candidates`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || "Ranking failed.");
        }

        const rows = data.ranked_candidates
            .map(
                (c, idx) =>
                    `<tr><td>${idx + 1}</td><td>${escapeHtml(c.filename)}</td><td>${escapeHtml(c.category)}</td><td>${c.ats_score}%</td></tr>`
            )
            .join("");
        output.innerHTML = `
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px;">Rank</th>
                        <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px;">File</th>
                        <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px;">Category</th>
                        <th style="text-align:left;border-bottom:1px solid #ddd;padding:6px;">ATS Score</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
        setStatus(statusEl, "success", "Ranking complete.");
    } catch (err) {
        const msg = err?.message === "Failed to fetch"
            ? `Cannot connect to backend at ${API_BASE}. Start Flask server first.`
            : err.message;
        setStatus(statusEl, "error", msg);
    }
}

function renderResultPage() {
    const store = localStorage.getItem("resume_analysis_result");
    if (!store) {
        document.getElementById("resultEmpty").style.display = "block";
        return;
    }

    const data = JSON.parse(store);
    const analysis = data.analysis || {};
    document.getElementById("atsScore").textContent = `${analysis.ats_score ?? 0}%`;
    document.getElementById("category").textContent = analysis.category || "General";
    document.getElementById("skills").textContent =
        (analysis.skills || []).length > 0 ? analysis.skills.join(", ") : "No skills detected";

    const missing = (analysis.missing_keywords || [])
        .map((k) => `<li>${escapeHtml(k)}</li>`)
        .join("");
    document.getElementById("missingKeywords").innerHTML = missing || "<li>No missing keywords found.</li>";

    const suggestions = (analysis.suggestions || [])
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join("");
    document.getElementById("suggestions").innerHTML = suggestions || "<li>No suggestions.</li>";

    const jobs = (data.job_recommendations || [])
        .map(
            (j) => `
                <div class="card">
                    <h4 style="margin:0 0 6px;">${escapeHtml(j.title)} - ${escapeHtml(j.company)}</h4>
                    <p style="margin:0 0 8px;"><strong>Match Score:</strong> ${j.score}%</p>
                    <p style="margin:0 0 8px;"><strong>Matched Skills:</strong> ${escapeHtml((j.matched_skills || []).join(", ") || "None")}</p>
                    <p style="margin:0;"><strong>Missing Skills:</strong> ${escapeHtml((j.missing_skills || []).join(", ") || "None")}</p>
                </div>
            `
        )
        .join("");
    document.getElementById("jobs").innerHTML = jobs || "<p>No recommendations available.</p>";
}

async function initChatbotPage() {
    const chatBox = document.getElementById("chatbox");
    const input = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const genBtn = document.getElementById("generateBtn");
    const statusEl = document.getElementById("chatStatus");
    const resumeOutput = document.getElementById("generatedResume");
    const jobsOutput = document.getElementById("chatJobs");

    let questions = [];
    const answers = {};
    let index = 0;

    function appendMessage(role, text) {
        chatBox.innerHTML += `<div class="chat-msg"><strong>${role}:</strong> ${escapeHtml(text)}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function askNextQuestion() {
        if (index < questions.length) {
            appendMessage("Bot", questions[index].question);
            input.placeholder = questions[index].question;
        } else {
            appendMessage("Bot", "All details captured. Click Generate Resume.");
            input.disabled = true;
            sendBtn.disabled = true;
            genBtn.disabled = false;
        }
    }

    try {
        const response = await fetch(`${API_BASE}/chatbot/questions`);
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || "Could not load questions.");
        }
        questions = data.questions || [];
        askNextQuestion();
    } catch (err) {
        const msg = err?.message === "Failed to fetch"
            ? `Cannot connect to backend at ${API_BASE}. Start Flask server first.`
            : err.message;
        setStatus(statusEl, "error", msg);
        return;
    }

    sendBtn.addEventListener("click", () => {
        const value = input.value.trim();
        if (!value || index >= questions.length) return;
        appendMessage("You", value);
        answers[questions[index].key] = value;
        input.value = "";
        index += 1;
        askNextQuestion();
    });

    genBtn.addEventListener("click", async () => {
        setStatus(statusEl, "info", "Generating resume...");
        try {
            const response = await fetch(`${API_BASE}/chatbot/generate-resume`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || "Generation failed.");
            }
            resumeOutput.textContent = data.resume_text || "";
            jobsOutput.innerHTML = (data.job_recommendations || [])
                .map(
                    (j) =>
                        `<li>${escapeHtml(j.title)} (${escapeHtml(j.company)}) - ${j.score}% match</li>`
                )
                .join("");
            setStatus(statusEl, "success", "Resume generated.");
        } catch (err) {
            const msg = err?.message === "Failed to fetch"
                ? `Cannot connect to backend at ${API_BASE}. Start Flask server first.`
                : err.message;
            setStatus(statusEl, "error", msg);
        }
    });
}

async function checkBackend(statusElementId) {
    const el = document.getElementById(statusElementId);
    if (!el) return;
    try {
        const res = await fetch(`${API_BASE}/health`);
        if (!res.ok) throw new Error("Health check failed");
        setStatus(el, "success", `Backend connected: ${API_BASE}`);
    } catch (_err) {
        setStatus(el, "error", `Backend not reachable at ${API_BASE}. Run: python backend/app.py`);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("analyzeForm")) {
        checkBackend("status");
        document.getElementById("analyzeForm").addEventListener("submit", analyzeResumeSubmit);
    }
    if (document.getElementById("recruiterForm")) {
        checkBackend("recruiterStatus");
        document.getElementById("recruiterForm").addEventListener("submit", rankCandidatesSubmit);
    }
    if (document.getElementById("resultPage")) {
        renderResultPage();
    }
    if (document.getElementById("chatbotPage")) {
        checkBackend("chatStatus");
        initChatbotPage();
    }
});
