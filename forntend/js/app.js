function readApiBaseFromStorage() {
    try {
        return localStorage.getItem("API_BASE_URL");
    } catch (_err) {
        return null;
    }
}

function writeApiBaseToStorage(value) {
    try {
        localStorage.setItem("API_BASE_URL", value);
    } catch (_err) {
        // Ignore storage write errors (private mode/restricted storage).
    }
}

function resolveHostDefaultApiBase() {
    if (window.location.protocol.startsWith("http") && window.location.hostname) {
        const host = window.location.hostname;
        if (host === "localhost" || host === "127.0.0.1") {
            return `${window.location.protocol}//${host}:5000/api`;
        }
        // Production frontend (Vercel/custom domain) should use /api rewrite.
        return "/api";
    }
    return "http://127.0.0.1:5000/api";
}

function resolveApiBase(options = {}) {
    const { ignoreStorage = false } = options;
    if (!ignoreStorage) {
        const fromStorage = readApiBaseFromStorage();
        if (fromStorage) return fromStorage.replace(/\/+$/, "");
    }

    // Optional runtime override for production debugging/custom deployments.
    if (window.__API_BASE_URL__) {
        return String(window.__API_BASE_URL__).replace(/\/+$/, "");
    }

    return resolveHostDefaultApiBase();
}

let API_BASE = resolveApiBase();

async function apiFetch(path, options) {
    const primaryBase = API_BASE;
    try {
        return await fetch(`${primaryBase}${path}`, options);
    } catch (primaryErr) {
        const fallbackBase = resolveApiBase({ ignoreStorage: true });
        if (fallbackBase !== primaryBase) {
            try {
                const response = await fetch(`${fallbackBase}${path}`, options);
                API_BASE = fallbackBase;
                writeApiBaseToStorage(fallbackBase);
                return response;
            } catch (_fallbackErr) {
                // Fall through to original error.
            }
        }
        throw primaryErr;
    }
}

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
        const response = await apiFetch("/analyze-resume", {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || "Failed to analyze resume.");
        }

        localStorage.setItem("resume_analysis_result", JSON.stringify(data));
        // Also save to server-side session
        try { await apiFetch("/session/analysis", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data) }); } catch(_e) {}
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
        const response = await apiFetch("/rank-candidates", {
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

async function renderResultPage() {
    let store = localStorage.getItem("resume_analysis_result");
    // If not in localStorage, try server session
    if (!store) {
        try {
            const res = await apiFetch("/session/analysis");
            const sData = await res.json();
            if (sData.success && sData.data) {
                store = JSON.stringify(sData.data);
                localStorage.setItem("resume_analysis_result", store);
            }
        } catch(_e) {}
    }
    if (!store) {
        document.getElementById("resultEmpty").style.display = "block";
        return;
    }

    const data = JSON.parse(store);
    const analysis = data.analysis || {};
    const isAtsAvailable = analysis.ats_available !== false && typeof analysis.ats_score === "number";
    document.getElementById("atsScore").textContent = isAtsAvailable ? `${analysis.ats_score}%` : "N/A";
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
        if (!isAtsAvailable) {
            box.style.background = "#eef2ff";
            box.style.borderColor = "#bfdbfe";
            document.getElementById("decisionTitle").innerText = "ATS score needs a Job Description to calculate.";
            btn.innerText = "Add Job Description and Re-analyze →";
            btn.style.background = "#2563eb";
            btn.onclick = () => window.location.href = "upload.html";
        } else if (ats >= 70) {
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
        const response = await apiFetch("/chatbot/questions");
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
        const tempVal = document.getElementById("templateChoice")?.value || "classical.pdf";
        
        try {
            const response = await apiFetch("/chatbot/generate-resume", {
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
    const queryInput = document.getElementById("jobQuery");
    
    // Auto-fill category if available from ATS/Resume Maker
    if (store && queryInput) {
        try {
            const data = JSON.parse(store);
            if (data.analysis && data.analysis.category) {
                queryInput.value = data.analysis.category;
            }
        } catch(e) {}
    }

    const form = document.getElementById("jobSearchForm");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = document.getElementById("btnSearchJobs");
            const statusEl = document.getElementById("jobsStatus");
            const fileInput = document.getElementById("jobResumeFile");
            
            btn.disabled = true;
            btn.innerText = "Analyzing & Searching...";
            statusEl.style.display = "block";
            statusEl.className = "status info";
            statusEl.innerText = "Running Model 1 & Fetching Arbeitnow API...";
            document.getElementById("jobsResultsSection").style.display = "none";
            document.getElementById("geminiCareerContainer").style.display = "none";

            try {
                const formData = new FormData();
                if (fileInput.files.length > 0) {
                    formData.append("resume", fileInput.files[0]);
                } else if (queryInput.value.trim()) {
                    formData.append("resume_text", queryInput.value.trim());
                } else {
                    throw new Error("Please enter a job category or upload a resume.");
                }

                const response = await apiFetch("/recommend-jobs", {
                    method: "POST",
                    body: formData
                });
                
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || "Search failed.");
                }

                const jobsList = data.jobs || [];
                const careerMap = data.gemini_career_map || "";
                
                if (careerMap) {
                    document.getElementById("geminiCareerContainer").style.display = "block";
                    document.getElementById("geminiCareerMap").innerHTML = escapeHtml(careerMap).replace(/\n/g, '<br>');
                }

                document.getElementById("jobsResultsSection").style.display = "block";
                document.getElementById("jobs").innerHTML = jobsList.length ? jobsList.map(j => `
                    <div class="card" style="box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <h4 style="margin:0 0 6px;">${escapeHtml(j.title)} - ${escapeHtml(j.company)}</h4>
                        <p style="margin:0 0 8px;"><strong>Match Score:</strong> ${j.score}%</p>
                        <p style="margin:0 0 8px;"><strong>Missing Skills:</strong> ${escapeHtml((j.missing_skills || []).join(", ") || "None")}</p>
                        <a href="${escapeHtml(j.url)}" target="_blank" style="color:#2563eb;font-weight:600;text-decoration:none;">Apply to '${escapeHtml(j.company)}' &rarr;</a>
                    </div>
                `).join("") : "<p>No exact live jobs found for this query right now.</p>";
                
                statusEl.style.display = "none";
            } catch(err) {
                statusEl.className = "status error";
                statusEl.innerText = err.message;
            } finally {
                btn.disabled = false;
                btn.innerText = "Search Live Jobs";
            }
        });
    }
}

async function checkBackend(statusElementId) {
    const el = document.getElementById(statusElementId);
    if (!el) return;
    try {
        const res = await apiFetch("/health");
        if (!res.ok) throw new Error("Health check failed");
        // Connected — no message needed
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
        const form = document.getElementById("buildForm");
        const stat = document.getElementById("fStatus");
        const previewEl = document.getElementById("fPreview");
        const templateSelect = document.getElementById("fTemplate");
        const templateLabel = document.getElementById("selectedTemplateLabel");
        const templateButtons = Array.from(document.querySelectorAll(".template-option[data-template]"));
        const headingListEl = document.getElementById("templateHeadingList");
        const toJobsBtn = document.getElementById("toJobsBtnForm");
        const geminiBox = document.getElementById("fGemini");
        const downloadsBox = document.getElementById("fDownloads");

        const fields = {
            name: document.getElementById("fName"),
            headline: document.getElementById("fHeadline"),
            email: document.getElementById("fEmail"),
            phone: document.getElementById("fPhone"),
            location: document.getElementById("fLocation"),
            website: document.getElementById("fWebsite"),
            summary: document.getElementById("fSummary"),
            skills: document.getElementById("fSkills"),
            side_skills: document.getElementById("fSideSkills"),
            languages: document.getElementById("fLanguages"),
            experience: document.getElementById("fExp"),
            education: document.getElementById("fEdu"),
        };

        const templateValues = new Set([
            "classical.pdf",
            "freasher.pdf",
            "resume for experienced.pdf",
            "resume for experienced2.pdf",
        ]);

        const TEMPLATE_CONFIGS = {
            "classical.pdf": {
                headings: ["ABOUT ME", "EDUCATION", "WORK EXPERIENCE", "SKILLS"],
                previewType: "classical",
                fields: ["name", "headline", "email", "phone", "location", "summary", "education", "experience", "skills"],
                labels: { summary: "About Me" },
            },
            "resume for experienced.pdf": {
                headings: ["ABOUT ME", "EDUCATION", "WORK EXPERIENCE", "SKILLS"],
                previewType: "classical",
                fields: ["name", "headline", "email", "phone", "location", "summary", "education", "experience", "skills"],
                labels: { summary: "About Me" },
            },
            "freasher.pdf": {
                headings: ["ABOUT ME", "EDUCATION", "WORK EXPERIENCE", "CONTACT", "SKILLS", "LANGUAGES"],
                previewType: "freasher",
                fields: ["name", "headline", "email", "phone", "location", "website", "summary", "education", "experience", "skills", "side_skills", "languages"],
                labels: { summary: "About Me", side_skills: "Personal Skills" },
            },
            "resume for experienced2.pdf": {
                headings: ["SUMMARY", "WORK EXPERIENCE", "EDUCATION"],
                previewType: "experienced2",
                fields: ["name", "headline", "email", "phone", "location", "website", "summary", "experience", "education"],
                labels: { summary: "Summary", headline: "Role (Uppercase in template)" },
            },
        };

        const fieldBlocks = Object.fromEntries(
            Object.keys(fields).map((key) => [key, form.querySelector(`[data-field="${key}"]`)])
        );
        const fieldLabels = {
            name: document.getElementById("lblName"),
            headline: document.getElementById("lblHeadline"),
            email: document.getElementById("lblEmail"),
            phone: document.getElementById("lblPhone"),
            location: document.getElementById("lblLocation"),
            website: document.getElementById("lblWebsite"),
            summary: document.getElementById("lblSummary"),
            skills: document.getElementById("lblSkills"),
            side_skills: document.getElementById("lblSideSkills"),
            languages: document.getElementById("lblLanguages"),
            experience: document.getElementById("lblExperience"),
            education: document.getElementById("lblEducation"),
        };

        function normalizeTemplate(value) {
            return templateValues.has(value) ? value : "classical.pdf";
        }

        function getTemplateConfig(templateKey) {
            return TEMPLATE_CONFIGS[normalizeTemplate(templateKey)] || TEMPLATE_CONFIGS["classical.pdf"];
        }

        function splitLines(text) {
            return String(text || "")
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean);
        }

        function splitBlocks(text) {
            return String(text || "")
                .split(/\r?\n\s*\r?\n/)
                .map((block) => splitLines(block))
                .filter((lines) => lines.length > 0);
        }

        function parseCommaOrLineItems(text) {
            return String(text || "")
                .split(/[,\n]/)
                .map((item) => item.trim())
                .filter(Boolean);
        }

        function parseEntryBlocks(rawText, defaultLabel) {
            return splitBlocks(rawText).map((lines, index) => {
                if (lines.length === 1) {
                    return {
                        meta: `${defaultLabel} ${index + 1}`,
                        title: lines[0],
                        detailLines: [],
                    };
                }
                if (lines.length === 2) {
                    return {
                        meta: lines[0],
                        title: lines[1],
                        detailLines: [],
                    };
                }
                return {
                    meta: lines[0],
                    title: lines[1],
                    detailLines: lines.slice(2),
                };
            });
        }

        function toHtmlWithBreaks(text) {
            return escapeHtml(String(text || "")).replace(/\r?\n/g, "<br>");
        }

        function renderParagraphOrFallback(text, fallback) {
            const cleaned = String(text || "").trim();
            if (!cleaned) {
                return `<p class="resume-sample-copy resume-sample-empty">${escapeHtml(fallback)}</p>`;
            }
            return `<p class="resume-sample-copy">${toHtmlWithBreaks(cleaned)}</p>`;
        }

        function renderEntryBlocks(rawText, defaultLabel, emptyText) {
            const blocks = parseEntryBlocks(rawText, defaultLabel);
            if (blocks.length === 0) {
                return `<p class="resume-sample-copy resume-sample-empty">${escapeHtml(emptyText)}</p>`;
            }
            return blocks
                .map((entry) => `
                    <div class="resume-sample-block">
                        <p class="resume-sample-meta">${escapeHtml(entry.meta)}</p>
                        <p class="resume-sample-roleline">${escapeHtml(entry.title)}</p>
                        ${entry.detailLines.length ? `<p class="resume-sample-copy">${escapeHtml(entry.detailLines.join(" "))}</p>` : ""}
                    </div>
                `)
                .join("");
        }

        function renderSkillList(rawText, emptyText = "Add your strongest skills, separated by commas.") {
            const skills = parseCommaOrLineItems(rawText);
            if (skills.length === 0) {
                return `<p class="resume-sample-copy resume-sample-empty">${escapeHtml(emptyText)}</p>`;
            }
            return `<ul class="resume-sample-skills">${skills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join("")}</ul>`;
        }

        function renderSimpleList(rawText, emptyText = "Add at least one item.") {
            const items = parseCommaOrLineItems(rawText);
            if (!items.length) {
                return `<p class="resume-sample-copy resume-sample-empty">${escapeHtml(emptyText)}</p>`;
            }
            return `<ul class="resume-exp-bullets">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
        }

        function buildClassicalPreview() {
            const name = (fields.name?.value || "").trim() || "YOUR NAME";
            const role = (fields.headline?.value || "").trim() || "Professional Role";
            const email = (fields.email?.value || "").trim() || "hello@email.com";
            const phone = (fields.phone?.value || "").trim() || "+91 XXXXX XXXXX";
            const location = (fields.location?.value || "").trim() || "City, Country";

            return `
                <div class="resume-sample-shell">
                    <article class="resume-sample-page">
                        <h2 class="resume-sample-name">${escapeHtml(name)}</h2>
                        <p class="resume-sample-role">${escapeHtml(role)}</p>
                        <div class="resume-sample-contact">
                            <div class="resume-sample-contact-item">${escapeHtml(phone)}</div>
                            <div class="resume-sample-contact-item">${escapeHtml(email)}</div>
                            <div class="resume-sample-contact-item">${escapeHtml(location)}</div>
                        </div>
                        <section class="resume-sample-section">
                            <h3 class="resume-sample-title">About Me</h3>
                            ${renderParagraphOrFallback(fields.summary?.value, "Write a short profile about your background and strengths.")}
                        </section>
                        <section class="resume-sample-section">
                            <h3 class="resume-sample-title">Education</h3>
                            ${renderEntryBlocks(fields.education?.value, "Education", "Add education timeline blocks. Use blank lines to create multiple entries.")}
                        </section>
                        <section class="resume-sample-section">
                            <h3 class="resume-sample-title">Work Experience</h3>
                            ${renderEntryBlocks(fields.experience?.value, "Experience", "Add work experience blocks. Use blank lines to separate roles.")}
                        </section>
                        <section class="resume-sample-section">
                            <h3 class="resume-sample-title">Skills</h3>
                            ${renderSkillList(fields.skills?.value)}
                        </section>
                    </article>
                </div>
            `;
        }

        function buildFreasherPreview() {
            const name = (fields.name?.value || "").trim() || "YOUR NAME";
            const role = (fields.headline?.value || "").trim() || "Professional Role";
            const contactLines = [
                (fields.phone?.value || "").trim(),
                (fields.email?.value || "").trim(),
                (fields.location?.value || "").trim(),
                (fields.website?.value || "").trim(),
            ].filter(Boolean);

            return `
                <div class="resume-sample-shell">
                    <article class="resume-fresh-page">
                        <h2 class="resume-fresh-name">${escapeHtml(name)}</h2>
                        <p class="resume-fresh-role">${escapeHtml(role)}</p>
                        <section class="resume-fresh-section">
                            <h3 class="resume-fresh-title">About Me</h3>
                            ${renderParagraphOrFallback(fields.summary?.value, "Write your introduction summary.")}
                        </section>
                        <div class="resume-fresh-main">
                            <div class="resume-fresh-left">
                                <section class="resume-fresh-section">
                                    <h3 class="resume-fresh-title">Education</h3>
                                    ${renderEntryBlocks(fields.education?.value, "Education", "Add education entries.")}
                                </section>
                                <section class="resume-fresh-section">
                                    <h3 class="resume-fresh-title">Work Experience</h3>
                                    ${renderEntryBlocks(fields.experience?.value, "Experience", "Add work experience entries.")}
                                </section>
                            </div>
                            <aside class="resume-fresh-right">
                                <section class="resume-fresh-section resume-fresh-contact">
                                    <h3 class="resume-fresh-title">Contact</h3>
                                    ${contactLines.length ? contactLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("") : '<p class="resume-sample-empty">Add contact lines.</p>'}
                                </section>
                                <section class="resume-fresh-section">
                                    <h3 class="resume-fresh-title">Skills</h3>
                                    <div class="resume-fresh-skills-group">
                                        <h4>Professional</h4>
                                        ${renderSimpleList(fields.skills?.value, "Add professional skills.")}
                                    </div>
                                    <div class="resume-fresh-skills-group">
                                        <h4>Personal</h4>
                                        ${renderSimpleList(fields.side_skills?.value, "Add personal skills.")}
                                    </div>
                                </section>
                                <section class="resume-fresh-section">
                                    <h3 class="resume-fresh-title">Languages</h3>
                                    ${renderSimpleList(fields.languages?.value, "Add language proficiency entries.")}
                                </section>
                            </aside>
                        </div>
                    </article>
                </div>
            `;
        }

        function buildExperienced2Preview() {
            const name = (fields.name?.value || "").trim() || "YOUR NAME";
            const role = (fields.headline?.value || "").trim() || "BUSINESS CONSULTANT";
            const contactLine = [
                (fields.location?.value || "").trim(),
                (fields.phone?.value || "").trim(),
                (fields.email?.value || "").trim(),
            ].filter(Boolean).join(" • ");
            const website = (fields.website?.value || "").trim();
            const experienceBlocks = parseEntryBlocks(fields.experience?.value, "Experience");
            const educationBlocks = parseEntryBlocks(fields.education?.value, "Education");

            return `
                <div class="resume-sample-shell">
                    <article class="resume-exp-page">
                        <header class="resume-exp-header">
                            <h2 class="resume-exp-name">${escapeHtml(name)}</h2>
                            <p class="resume-exp-role">${escapeHtml(role)}</p>
                            <p class="resume-exp-contact">${escapeHtml(contactLine || "City, Country • +91 XXXXX XXXXX • hello@email.com")}</p>
                            <p class="resume-exp-contact">${escapeHtml(website || "www.yourwebsite.com")}</p>
                        </header>
                        <hr class="resume-exp-rule">
                        <section class="resume-exp-section">
                            <h3 class="resume-exp-title">Summary</h3>
                            <p class="resume-exp-copy">${toHtmlWithBreaks(fields.summary?.value || "Write your consulting summary.")}</p>
                        </section>
                        <hr class="resume-exp-rule">
                        <section class="resume-exp-section">
                            <h3 class="resume-exp-title">Work Experience</h3>
                            ${experienceBlocks.length ? experienceBlocks.map((entry) => `
                                <div class="resume-exp-entry">
                                    <p class="resume-exp-entry-role">${escapeHtml(entry.title)}</p>
                                    <p class="resume-exp-entry-meta">${escapeHtml(entry.meta)}</p>
                                    ${entry.detailLines.length ? `<ul class="resume-exp-bullets">${entry.detailLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` : ""}
                                </div>
                            `).join("") : '<p class="resume-exp-copy resume-sample-empty">Add work experience entries.</p>'}
                        </section>
                        <hr class="resume-exp-rule">
                        <section class="resume-exp-section">
                            <h3 class="resume-exp-title">Education</h3>
                            ${educationBlocks.length ? educationBlocks.map((entry) => `
                                <div class="resume-exp-entry">
                                    <p class="resume-exp-entry-role">${escapeHtml(entry.title)}</p>
                                    <p class="resume-exp-entry-meta">${escapeHtml(entry.meta)}</p>
                                    ${entry.detailLines.length ? `<ul class="resume-exp-bullets">${entry.detailLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` : ""}
                                </div>
                            `).join("") : '<p class="resume-exp-copy resume-sample-empty">Add education entries.</p>'}
                        </section>
                    </article>
                </div>
            `;
        }

        function applyTemplateConfig(templateKey) {
            const selected = normalizeTemplate(templateKey);
            const cfg = getTemplateConfig(selected);

            templateSelect.value = selected;
            if (templateLabel) templateLabel.textContent = selected;

            templateButtons.forEach((btn) => {
                const isActive = btn.dataset.template === selected;
                btn.classList.toggle("active", isActive);
                btn.setAttribute("aria-pressed", String(isActive));
            });

            if (headingListEl) {
                headingListEl.innerHTML = cfg.headings.map((h) => `<span class="heading-pill">${escapeHtml(h)}</span>`).join("");
            }

            const visibleSet = new Set(cfg.fields || []);
            Object.keys(fieldBlocks).forEach((key) => {
                const block = fieldBlocks[key];
                if (!block) return;
                block.classList.toggle("hidden", !visibleSet.has(key));
            });

            Object.keys(fieldLabels).forEach((key) => {
                const labelEl = fieldLabels[key];
                if (!labelEl) return;
                const defaultText = {
                    name: "Name",
                    headline: "Professional Role",
                    email: "Email",
                    phone: "Phone",
                    location: "Location",
                    website: "Website",
                    summary: "About Me",
                    skills: "Skills",
                    side_skills: "Personal Skills",
                    languages: "Languages",
                    experience: "Work Experience",
                    education: "Education",
                }[key] || key;
                labelEl.textContent = (cfg.labels && cfg.labels[key]) || defaultText;
            });
        }

        function renderLivePreview() {
            if (!previewEl) return;
            const cfg = getTemplateConfig(templateSelect.value);
            previewEl.classList.remove("resume-preview-plain");
            previewEl.classList.add("resume-preview-rich");

            if (cfg.previewType === "freasher") {
                previewEl.innerHTML = buildFreasherPreview();
                return;
            }
            if (cfg.previewType === "experienced2") {
                previewEl.innerHTML = buildExperienced2Preview();
                return;
            }
            previewEl.innerHTML = buildClassicalPreview();
        }

        templateButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                applyTemplateConfig(btn.dataset.template || "classical.pdf");
                renderLivePreview();
            });
        });

        const prefFromUrl = new URLSearchParams(window.location.search).get("pref");
        applyTemplateConfig(prefFromUrl || templateSelect.value);

        Object.values(fields).forEach((field) => {
            if (!field) return;
            field.addEventListener("input", renderLivePreview);
        });
        renderLivePreview();

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            setStatus(stat, "info", "Building template and generating updated files...");

            const answers = {
                full_name: fields.name.value,
                headline: fields.headline.value,
                email: fields.email.value,
                phone: fields.phone.value,
                location: fields.location.value,
                website: fields.website.value,
                summary: fields.summary.value,
                skills: fields.skills.value,
                side_skills: fields.side_skills.value,
                languages: fields.languages.value,
                experience: fields.experience.value,
                education: fields.education.value
            };
            const tempVal = templateSelect.value;

            try {
                const response = await apiFetch("/chatbot/generate-resume", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers, template_choice: tempVal })
                });
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || "Could not build resume.");
                }

                renderLivePreview();

                if (data.gemini_suggestions) {
                    geminiBox.style.display = "block";
                    geminiBox.innerHTML = "<strong>Model 3 Gemini Engine Core Checklist:</strong><br/><br/>" + escapeHtml(data.gemini_suggestions).replace(/\n/g, "<br>");
                }

                if (data.pdf_b64) {
                    const safeTemplateName = String(tempVal || "resume").replace(/\.pdf$/i, "").replace(/\s+/g, "_");
                    downloadsBox.innerHTML = `
                        <a class="btn-primary" style="text-decoration:none;" download="${safeTemplateName}_updated.pdf" href="data:application/pdf;base64,${data.pdf_b64}">Download Updated PDF</a>
                    `;
                    toJobsBtn.style.display = "inline-block";
                }

                setStatus(stat, "success", "Updated resume generated successfully.");
            } catch (e) {
                const msg = e?.message === "Failed to fetch"
                    ? `Cannot connect to backend at ${API_BASE}. Start Flask server first.`
                    : e.message;
                setStatus(stat, "error", msg);
            }
        });
    }    
    if(document.getElementById("blanksPage")) {
        document.getElementById("downloadBlanksBtn").addEventListener("click", async () => {
            const stat = document.getElementById("blankStatus");
            setStatus(stat, "info", "Generating clean blank template structure...");
            const tempVal = document.getElementById("blankTemplate").value;
            try {
                const response = await apiFetch("/chatbot/generate-resume", {
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



