// ======================================================
// CodeGuardian AI - Frontend JavaScript
// ======================================================

const API_BASE = "";

// Elements
const codeInput = document.getElementById("codeInput");
const languageSelect = document.getElementById("language");

const analyzeBtn = document.getElementById("analyzeBtn");
const fixBtn = document.getElementById("fixBtn");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const clearBtn = document.getElementById("clearBtn");

const lineNumbers = document.getElementById("lineNumbers");
const lineCount = document.getElementById("lineCount");
const charCount = document.getElementById("charCount");

const loading = document.getElementById("loading");

const resultMessage = document.getElementById("resultMessage");
const scoreValue = document.getElementById("scoreValue");
const scoreDescription = document.getElementById("scoreDescription");
const gradeBadge = document.getElementById("gradeBadge");

const securityCount = document.getElementById("securityCount");
const bugCount = document.getElementById("bugCount");
const performanceCount = document.getElementById("performanceCount");
const qualityCount = document.getElementById("qualityCount");

const metricLines = document.getElementById("metricLines");
const metricCodeLines = document.getElementById("metricCodeLines");
const metricBlankLines = document.getElementById("metricBlankLines");
const metricIssues = document.getElementById("metricIssues");

const issuesList = document.getElementById("issuesList");
const severityFilter = document.getElementById("severityFilter");

const fixSection = document.getElementById("fixSection");
const originalCode = document.getElementById("originalCode");
const fixedCode = document.getElementById("fixedCode");
const fixCount = document.getElementById("fixCount");
const fixesList = document.getElementById("fixesList");
const fixMessage = document.getElementById("fixMessage");
const copyFixedBtn = document.getElementById("copyFixedBtn");

const fileName = document.getElementById("fileName");


// ======================================================
// INITIAL SETUP
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    updateEditorStats();

    if (codeInput) {
        updateLineNumbers();
    }

});


// ======================================================
// EDITOR - LINE NUMBERS
// ======================================================

function updateLineNumbers() {

    if (!codeInput || !lineNumbers) {
        return;
    }

    const lines = codeInput.value.split("\n").length;

    let numbers = "";

    for (let i = 1; i <= lines; i++) {
        numbers += i;

        if (i < lines) {
            numbers += "\n";
        }
    }

    lineNumbers.textContent = numbers;
}


// ======================================================
// EDITOR - STATISTICS
// ======================================================

function updateEditorStats() {

    if (!codeInput) {
        return;
    }

    const code = codeInput.value;

    const lines = code
        ? code.split("\n").length
        : 0;

    const characters = code.length;

    if (lineCount) {
        lineCount.textContent = lines;
    }

    if (charCount) {
        charCount.textContent = characters;
    }

    updateLineNumbers();
}


// ======================================================
// TEXTAREA EVENTS
// ======================================================

if (codeInput) {

    codeInput.addEventListener("input", () => {
        updateEditorStats();
    });

    codeInput.addEventListener("scroll", () => {

        if (lineNumbers) {
            lineNumbers.scrollTop = codeInput.scrollTop;
        }

    });

}


// ======================================================
// CLEAR CODE
// ======================================================

if (clearBtn) {

    clearBtn.addEventListener("click", () => {

        codeInput.value = "";

        fileName.textContent =
            languageSelect.value === "Python"
                ? "untitled.py"
                : "untitled";

        updateEditorStats();

        hideFixSection();

        resetResults();

    });

}


// ======================================================
// UPLOAD BUTTON
// ======================================================

if (uploadBtn) {

    uploadBtn.addEventListener("click", () => {

        fileInput.click();

    });

}


// ======================================================
// FILE UPLOAD
// ======================================================

if (fileInput) {

    fileInput.addEventListener("change", async () => {

        const file = fileInput.files[0];

        if (!file) {
            return;
        }

        const formData = new FormData();

        formData.append("file", file);

        try {

            uploadBtn.disabled = true;

            uploadBtn.textContent = "Uploading...";

            const response = await fetch(
                `${API_BASE}/api/upload`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Upload failed."
                );
            }

            codeInput.value = data.code;

            languageSelect.value = data.language;

            fileName.textContent = data.filename;

            updateEditorStats();

            hideFixSection();

            showNotification(
                "File uploaded successfully.",
                "success"
            );

        } catch (error) {

            console.error(error);

            showNotification(
                error.message,
                "error"
            );

        } finally {

            uploadBtn.disabled = false;

            uploadBtn.innerHTML =
                "📁 Upload Code";

            fileInput.value = "";

        }

    });

}


// ======================================================
// ANALYZE CODE
// ======================================================

if (analyzeBtn) {

    analyzeBtn.addEventListener("click", async () => {

        const code = codeInput.value.trim();

        if (!code) {

            showNotification(
                "Please enter some code first.",
                "error"
            );

            codeInput.focus();

            return;
        }

        await analyzeCode();

    });

}


// ======================================================
// ANALYZE FUNCTION
// ======================================================

async function analyzeCode() {

    const code = codeInput.value;

    const language = languageSelect.value;

    try {

        setLoading(true);

        analyzeBtn.disabled = true;

        analyzeBtn.innerHTML =
            "⏳ Analyzing...";

        const response = await fetch(
            `${API_BASE}/api/analyze`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    code: code,
                    language: language
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail || "Analysis failed."
            );

        }

        const result = data.result || data;

        displayAnalysisResults(result);

        showNotification(
            "Code analysis completed.",
            "success"
        );

    } catch (error) {

        console.error(
            "Analysis Error:",
            error
        );

        showNotification(
            error.message,
            "error"
        );

    } finally {

        setLoading(false);

        analyzeBtn.disabled = false;

        analyzeBtn.innerHTML =
            "🔍 Analyze Code";

    }

}


// ======================================================
// AUTO FIX BUTTON
// ======================================================

if (fixBtn) {

    fixBtn.addEventListener("click", async () => {

        const code = codeInput.value.trim();

        if (!code) {

            showNotification(
                "Please enter some code first.",
                "error"
            );

            codeInput.focus();

            return;
        }

        await fixCode();

    });

}


// ======================================================
// AUTO FIX FUNCTION
// ======================================================

async function fixCode() {

    const code = codeInput.value;

    const language = languageSelect.value;

    try {

        fixBtn.disabled = true;

        fixBtn.innerHTML =
            "⏳ Fixing Code...";

        const response = await fetch(
            `${API_BASE}/api/fix`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    code: code,
                    language: language
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail || "Auto-fix failed."
            );

        }

        displayFixResults(data);

        showNotification(
            "Code fixing completed.",
            "success"
        );

    } catch (error) {

        console.error(
            "Fix Error:",
            error
        );

        showNotification(
            error.message,
            "error"
        );

    } finally {

        fixBtn.disabled = false;

        fixBtn.innerHTML =
            "🛠️ Fix Code Automatically";

    }

}


// ======================================================
// DISPLAY ANALYSIS RESULTS
// ======================================================

function displayAnalysisResults(result) {

    if (!result) {
        return;
    }

    const score =
        Number(result.score ?? 0);

    const grade =
        result.grade ?? "--";

    scoreValue.textContent =
        Math.round(score);

    gradeBadge.textContent =
        grade;

    resultMessage.textContent =
        "Analysis completed successfully.";

    scoreDescription.textContent =
        getScoreDescription(score);


    // --------------------------------------------------
    // Categories
    // --------------------------------------------------

    const categories =
        result.categories || {};


    securityCount.textContent =
        getCategoryCount(
            categories,
            "security"
        );

    bugCount.textContent =
        getCategoryCount(
            categories,
            "bug",
            "bugs"
        );

    performanceCount.textContent =
        getCategoryCount(
            categories,
            "performance"
        );

    qualityCount.textContent =
        getCategoryCount(
            categories,
            "quality"
        );


    // --------------------------------------------------
    // Metrics
    // --------------------------------------------------

    const metrics =
        result.metrics || {};

    metricLines.textContent =
        metrics.total_lines ??
        metrics.lines ??
        0;

    metricCodeLines.textContent =
        metrics.code_lines ??
        0;

    metricBlankLines.textContent =
        metrics.blank_lines ??
        0;


    // --------------------------------------------------
    // Issues
    // --------------------------------------------------

    const issues =
        Array.isArray(result.issues)
            ? result.issues
            : [];

    metricIssues.textContent =
        issues.length;

    renderIssues(issues);

}


// ======================================================
// CATEGORY COUNT
// ======================================================

function getCategoryCount(
    categories,
    ...names
) {

    for (const name of names) {

        if (
            categories[name] !== undefined
        ) {

            const value =
                categories[name];

            if (typeof value === "number") {
                return value;
            }

            if (
                typeof value === "object" &&
                value !== null
            ) {

                return (
                    value.count ??
                    value.total ??
                    0
                );

            }

        }

    }

    return 0;
}


// ======================================================
// SCORE DESCRIPTION
// ======================================================

function getScoreDescription(score) {

    if (score >= 90) {
        return "Excellent code health.";
    }

    if (score >= 75) {
        return "Good code with some improvements needed.";
    }

    if (score >= 50) {
        return "Moderate issues detected. Review recommended.";
    }

    if (score >= 25) {
        return "Several important issues require attention.";
    }

    return "Critical issues detected. Fixes are recommended.";
}


// ======================================================
// RENDER ISSUES
// ======================================================

let currentIssues = [];


function renderIssues(issues) {

    currentIssues = issues;

    const filter =
        severityFilter
            ? severityFilter.value
            : "all";

    const filteredIssues =
        filter === "all"
            ? issues
            : issues.filter(
                issue =>
                    String(
                        issue.severity || ""
                    ).toLowerCase() === filter
            );


    if (!filteredIssues.length) {

        issuesList.innerHTML = `

            <div class="empty-state">

                <div>✅</div>

                <h3>
                    No issues found
                </h3>

                <p>
                    Your code looks good for the
                    selected severity.
                </p>

            </div>

        `;

        return;
    }


    issuesList.innerHTML =
        filteredIssues
            .map(
                (issue, index) =>
                    createIssueHTML(
                        issue,
                        index
                    )
            )
            .join("");

}


// ======================================================
// ISSUE HTML
// ======================================================

function createIssueHTML(issue, index) {

    const severity =
        String(
            issue.severity || "info"
        ).toLowerCase();

    const title =
        escapeHTML(
            issue.title ||
            issue.name ||
            "Code Issue"
        );

    const message =
        escapeHTML(
            issue.message ||
            issue.description ||
            issue.explanation ||
            "Potential issue detected."
        );

    const line =
        issue.line ??
        issue.line_number ??
        "-";

    return `

        <div class="issue-item severity-${severity}">

            <div class="issue-number">
                ${index + 1}
            </div>

            <div class="issue-content">

                <div class="issue-top">

                    <strong>
                        ${title}
                    </strong>

                    <span class="severity-badge ${severity}">
                        ${severity.toUpperCase()}
                    </span>

                </div>

                <p>
                    ${message}
                </p>

                <div class="issue-meta">

                    <span>
                        📍 Line ${line}
                    </span>

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// SEVERITY FILTER
// ======================================================

if (severityFilter) {

    severityFilter.addEventListener(
        "change",
        () => {

            renderIssues(
                currentIssues
            );

        }
    );

}


// ======================================================
// DISPLAY FIX RESULTS
// ======================================================

function displayFixResults(data) {

    if (!fixSection) {
        return;
    }

    fixSection.classList.remove(
        "hidden"
    );


    const original =
        data.original_code ??
        codeInput.value;

    const fixed =
        data.fixed_code ??
        codeInput.value;

    const fixes =
        Array.isArray(data.fixes)
            ? data.fixes
            : [];


    originalCode.textContent =
        original;

    fixedCode.textContent =
        fixed;

    fixCount.textContent =
        data.fix_count ??
        fixes.length;


    if (fixes.length === 0) {

        fixMessage.textContent =
            "No automatic changes were required.";

        fixesList.innerHTML = `

            <div class="fix-item">

                <span>ℹ️</span>

                <div>

                    <strong>
                        No fixes applied
                    </strong>

                    <p>
                        CodeGuardian AI did not find
                        a safe automatic fix for this code.
                    </p>

                </div>

            </div>

        `;

        return;
    }


    fixMessage.textContent =
        `${fixes.length} improvement(s) applied to your code.`;


    fixesList.innerHTML =
        fixes
            .map(
                (fix, index) => {

                    let text = "";

                    if (typeof fix === "string") {

                        text = fix;

                    } else {

                        text =
                            fix.message ||
                            fix.description ||
                            fix.title ||
                            JSON.stringify(fix);

                    }

                    return `

                        <div class="fix-item">

                            <span>
                                ${index + 1}
                            </span>

                            <div>

                                <strong>
                                    Fix Applied
                                </strong>

                                <p>
                                    ${escapeHTML(text)}
                                </p>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


// ======================================================
// COPY FIXED CODE
// ======================================================

if (copyFixedBtn) {

    copyFixedBtn.addEventListener(
        "click",
        async () => {

            const code =
                fixedCode.textContent;

            if (!code) {
                return;
            }

            try {

                await navigator.clipboard.writeText(
                    code
                );

                copyFixedBtn.textContent =
                    "✅ Copied!";

                setTimeout(() => {

                    copyFixedBtn.textContent =
                        "📋 Copy Code";

                }, 1500);

            } catch (error) {

                showNotification(
                    "Could not copy code.",
                    "error"
                );

            }

        }
    );

}


// ======================================================
// HIDE FIX SECTION
// ======================================================

function hideFixSection() {

    if (fixSection) {

        fixSection.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// RESET RESULTS
// ======================================================

function resetResults() {

    scoreValue.textContent = "0";
    gradeBadge.textContent = "--";

    securityCount.textContent = "0";
    bugCount.textContent = "0";
    performanceCount.textContent = "0";
    qualityCount.textContent = "0";

    metricLines.textContent = "0";
    metricCodeLines.textContent = "0";
    metricBlankLines.textContent = "0";
    metricIssues.textContent = "0";

    resultMessage.textContent =
        "Run an analysis to see your code health.";

    scoreDescription.textContent =
        "No analysis performed yet.";

    currentIssues = [];

    issuesList.innerHTML = `

        <div class="empty-state">

            <div>🔎</div>

            <h3>
                No analysis yet
            </h3>

            <p>
                Add code above and click
                <strong>Analyze Code</strong>.
            </p>

        </div>

    `;

}


// ======================================================
// LOADING
// ======================================================

function setLoading(isLoading) {

    if (!loading) {
        return;
    }

    if (isLoading) {

        loading.classList.remove(
            "hidden"
        );

    } else {

        loading.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// NOTIFICATION
// ======================================================

function showNotification(
    message,
    type = "info"
) {

    const old =
        document.querySelector(
            ".cg-notification"
        );

    if (old) {
        old.remove();
    }


    const notification =
        document.createElement(
            "div"
        );

    notification.className =
        `cg-notification ${type}`;


    notification.innerHTML = `

        <span>
            ${
                type === "success"
                    ? "✅"
                    : type === "error"
                    ? "❌"
                    : "ℹ️"
            }
        </span>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    document.body.appendChild(
        notification
    );


    setTimeout(() => {

        notification.classList.add(
            "show"
        );

    }, 10);


    setTimeout(() => {

        notification.classList.remove(
            "show"
        );

        setTimeout(() => {
            notification.remove();
        }, 300);

    }, 3000);

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}