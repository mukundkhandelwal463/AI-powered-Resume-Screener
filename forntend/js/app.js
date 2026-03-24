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
    const streamInput = document.getElementById("streamCategory");
    const hasFile = !!(fileInput.files && fileInput.files[0]);
    const hasCategory = !!(streamInput && streamInput.value.trim());
    const hasJD = !!(jdInput.value || "").trim();
    if (!hasFile && !(hasCategory && hasJD)) {
        setStatus(statusEl, "error", "Upload a resume, or provide both Category/Stream and Job Description.");
        return;
    }

    setStatus(statusEl, "info", "Analyzing resume...");
    const formData = new FormData();
    if (hasFile) formData.append("resume", fileInput.files[0]);
    formData.append("job_description", jdInput.value || "");
    formData.append("stream_or_category", streamInput?.value || "");

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
        .flatMap((s) =>
            String(s || "")
                .split("\n")
                .map((line) => line.replace(/^[\-\*\d\.\)\s]+/, "").trim())
                .filter((line) => line.length > 0)
        )
        .slice(0, 12)
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join("");
    document.getElementById("suggestions").innerHTML = suggestions || "<li>No suggestions.</li>";

    // Inject Dynamic Model Router Component
    const ats = analysis.ats_score ?? 0;
    const box = document.getElementById("decisionBox");
    const btn = document.getElementById("decisionBtn");
    if(box && btn) {
        box.style.display = "block";
        if (ats >= 70) {
            document.getElementById("decisionTitle").innerText = `Great ATS Score (${ats}%)! You're ready to apply!`;
            btn.innerText = "Proceed to Target Live Jobs →";
            btn.style.background = "#2563eb";
            btn.onclick = () => window.location.href = "jobs.html";
        } else {
            box.style.background = "#fff1f2";
            box.style.borderColor = "#fecdd3";
            document.getElementById("decisionTitle").innerText = `ATS Score is low (${ats}%). We should fix this.`;
            btn.innerText = "Let's Build a Better Resume! (Model 3) →";
            btn.style.background = "#e11d48";
            btn.onclick = () => window.location.href = "maker_options.html";
        }
    }
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
        setStatus(statusEl, "info", "Consulting Gemini AI and Generating Resume files...");
        const tempVal = document.getElementById("templateChoice")?.value || "Classic ATS";
        
        try {
            const response = await fetch(`${API_BASE}/chatbot/generate-resume`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers, template_choice: tempVal })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || "Generation failed.");
            }
            resumeOutput.textContent = data.resume_text || "";
            jobsOutput.innerHTML = (data.job_recommendations || [])
                .map(
                    (j) =>
                        `<li style="margin-bottom:6px;">
                            ${escapeHtml(j.title)} (${escapeHtml(j.company)}) - <strong>${j.score}% match</strong>
                            ${j.url && j.url !== "#" ? `<br/><a href="${escapeHtml(j.url)}" target="_blank" style="color:#2563eb;font-size:13px;text-decoration:none;">Apply on Arbeitnow &rarr;</a>` : ''}
                        </li>`
                )
                .join("");
                
            if (data.gemini_suggestions) {
                const sugEl = document.getElementById("geminiSuggestions");
                sugEl.style.display = "block";
                sugEl.innerHTML = "<strong>Model 3 AI Tips:</strong><br/><br/>" + escapeHtml(data.gemini_suggestions).replace(/\n/g, '<br>');
            }
            if (data.docx_b64 && data.pdf_b64) {
               const acts = document.getElementById("downloadActions");
               acts.innerHTML = `
                   <a class="btn-primary" style="text-decoration:none;" download="My_Resume.docx" href="data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.docx_b64}">Download DOCX</a>
                   <a class="btn-primary" style="text-decoration:none;" download="My_Resume.pdf" href="data:application/pdf;base64,${data.pdf_b64}">Download PDF</a>
                   <button class="btn-primary" onclick="window.location.href='jobs.html'" style="background:#0f9d58;">Proceed to Live Jobs!</button>
               `;
            }
                
            setStatus(statusEl, "success", "Resume generated successfully!");
        } catch (err) {
            const msg = err?.message === "Failed to fetch"
                ? `Cannot connect to backend at ${API_BASE}. Start Flask server first.`
                : err.message;
            setStatus(statusEl, "error", msg);
        }
    });
}

async function renderLiveJobsPage() {
    const store = localStorage.getItem("resume_analysis_result");
    let jobsList = [];
    let careerMap = "";
    
    if (store) {
        const data = JSON.parse(store);
        jobsList = data.job_recommendations || [];
        careerMap = data.gemini_career_map || "";
        document.getElementById("jobsStatus").style.display = "none";
    } else {
        try {
            const formData = new FormData();
            formData.append("resume_text", "Technology Software Analyst Developer Data");
            const response = await fetch(`${API_BASE}/recommend-jobs`, {
                method: "POST",
                body: formData
            });
            const data = await response.json();
            jobsList = data.jobs || [];
            careerMap = data.gemini_career_map || "Please go to 'ATS Score' tab and upload your specific resume to get targeted, highly personalized Gemini Career Mappings entirely modeled to your distinct background!";
            document.getElementById("jobsStatus").style.display = "none";
        } catch(err) {
            document.getElementById("jobsStatus").className = "status error";
            document.getElementById("jobsStatus").innerText = "Could not ping Live Jobs server.";
        }
    }
    
    if(careerMap) {
        document.getElementById("geminiCareerMap").style.display = "block";
        document.getElementById("geminiCareerMap").innerHTML = escapeHtml(careerMap).replace(/\n/g, '<br>');
    }
    
    document.getElementById("jobs").innerHTML = jobsList.map(j => `
        <div class="card" style="box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h4 style="margin:0 0 6px;">${escapeHtml(j.title)} - ${escapeHtml(j.company)}</h4>
            <p style="margin:0 0 8px;"><strong>Match Score:</strong> ${j.score}%</p>
            <p style="margin:0 0 8px;"><strong>Missing Skills:</strong> ${escapeHtml((j.missing_skills || []).join(", ") || "None")}</p>
            ${j.url && j.url !== "#" ? `<a href="${escapeHtml(j.url)}" target="_blank" style="color:#2563eb;font-weight:600;text-decoration:none;">Apply on Arbeitnow &rarr;</a>` : ''}
        </div>
    `).join("");
}

async function checkBackend(statusElementId) {
    const el = document.getElementById(statusElementId);
    if (!el) return;
    try {
        const res = await fetch(`${API_BASE}/health`);
        if (!res.ok) throw new Error("Health check failed");
        setStatus(el, "success", `Backend connected`);
    } catch (_err) {
        setStatus(el, "error", `Backend not reachable at ${API_BASE}. Run: python backend/app.py`);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("analyzeForm")) {
        checkBackend("status");
        document.getElementById("analyzeForm").addEventListener("submit", analyzeResumeSubmit);
    }
    if (document.getElementById("resultPage")) {
        renderResultPage();
    }
    if (document.getElementById("chatbotPage")) {
        checkBackend("chatStatus");
        initChatbotPage();
    }
    if (document.getElementById("liveJobsPage")) {
        renderLiveJobsPage();
    }
    
    if (document.getElementById("formPage")) {
        document.getElementById("buildForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const stat = document.getElementById("fStatus");
            setStatus(stat, "info", "Building layout and Consulting Gemini API...");
            const answers = {
                full_name: document.getElementById("fName").value,
                email: document.getElementById("fEmail").value,
                phone: document.getElementById("fPhone").value,
                location: document.getElementById("fLocation").value,
                summary: document.getElementById("fSummary").value,
                skills: document.getElementById("fSkills").value,
                experience: document.getElementById("fExp").value,
                education: document.getElementById("fEdu").value
            };
            const tempVal = document.getElementById("fTemplate").value;
            try {
                const response = await fetch(`${API_BASE}/chatbot/generate-resume`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers, template_choice: tempVal })
                });
                const data = await response.json();
                document.getElementById("fPreview").textContent = data.resume_text || "";
                if (data.gemini_suggestions) {
                    const sugEl = document.getElementById("fGemini");
                    sugEl.style.display = "block";
                    sugEl.innerHTML = "<strong>Model 3 Gemini Engine Core Checklist:</strong><br/><br/>" + escapeHtml(data.gemini_suggestions).replace(/\n/g, '<br>');
                }
                if (data.docx_b64) {
                   document.getElementById("fDownloads").innerHTML = `
                       <a class="btn-primary" style="text-decoration:none;" download="Web_Resume.docx" href="data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.docx_b64}">Download DOCX</a>
                       <a class="btn-primary" style="text-decoration:none;" download="Web_Resume.pdf" href="data:application/pdf;base64,${data.pdf_b64}">Download PDF</a>
                   `;
                   document.getElementById("toJobsBtnForm").style.display = "inline-block";
                }
                setStatus(stat, "success", "Built perfectly!");
            } catch(e) { setStatus(stat, "error", e.message); }
        });
    }
    
    if(document.getElementById("blanksPage")) {
        document.getElementById("downloadBlanksBtn").addEventListener("click", async () => {
            const stat = document.getElementById("blankStatus");
            setStatus(stat, "info", "Generating clean blank template structure...");
            const tempVal = document.getElementById("blankTemplate").value;
            try {
                const response = await fetch(`${API_BASE}/chatbot/generate-resume`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers: {"full_name":"[YOUR NAME HERE]", "email":"email@domain.com"}, template_choice: tempVal })
                });
                const data = await response.json();
                document.getElementById("blankDownloads").innerHTML = `
                   <a class="btn-primary" style="text-decoration:none;" download="Blank_Template.docx" href="data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.docx_b64}">Get Blank DOCX</a>
                   <a class="btn-primary" style="text-decoration:none;" download="Blank_Template.pdf" href="data:application/pdf;base64,${data.pdf_b64}">Get Blank PDF</a>
                `;
                setStatus(stat, "success", "Blanks structured successfully!");
            } catch(e) { setStatus(stat, "error", e.message); }
        });
    }
});



