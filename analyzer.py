import re
from typing import List, Dict


LANGUAGE_EXTENSIONS = {
    ".py": "Python",
    ".js": "JavaScript",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".h": "C/C++",
    ".hpp": "C++",
}


def detect_language(filename: str) -> str:
    filename_lower = filename.lower()

    for extension, language in LANGUAGE_EXTENSIONS.items():
        if filename_lower.endswith(extension):
            return language

    return "Unknown"


def add_issue(
    issues: List[Dict],
    line: int,
    severity: str,
    category: str,
    title: str,
    description: str,
    suggestion: str,
):
    issues.append({
        "line": line,
        "severity": severity,
        "category": category,
        "title": title,
        "description": description,
        "suggestion": suggestion,
    })


def analyze_code(code: str, language: str = "Auto") -> Dict:

    lines = code.splitlines()

    issues = []

    total_lines = len(lines)

    blank_lines = sum(
        1 for line in lines
        if not line.strip()
    )

    comment_lines = sum(
        1
        for line in lines
        if line.strip().startswith(
            ("#", "//", "/*", "*", "*/")
        )
    )

    code_lines = total_lines - blank_lines


    # =====================================================
    # SECURITY
    # =====================================================

    password_pattern = re.compile(
        r"(password|passwd|pwd|secret|api[_-]?key|token)"
        r"\s*=\s*['\"][^'\"]+['\"]",
        re.IGNORECASE,
    )


    for number, line in enumerate(lines, start=1):

        if password_pattern.search(line):

            add_issue(
                issues,
                number,
                "HIGH",
                "Security",
                "Hardcoded secret detected",
                "A password, API key, token or secret is directly stored in source code.",
                "Use environment variables or a secure secret manager."
            )


        if re.search(
            r"\beval\s*\(",
            line
        ):

            add_issue(
                issues,
                number,
                "CRITICAL",
                "Security",
                "Dangerous eval() usage",
                "eval() can execute dynamically supplied code.",
                "Remove eval() and use safe parsing or explicit logic."
            )


        if re.search(
            r"\bexec\s*\(",
            line
        ):

            add_issue(
                issues,
                number,
                "HIGH",
                "Security",
                "Dynamic code execution",
                "exec() can execute dynamically generated code.",
                "Avoid exec() unless execution is strictly controlled."
            )


        if (
            "innerHTML" in line
            and "=" in line
        ):

            add_issue(
                issues,
                number,
                "HIGH",
                "Security",
                "Potential XSS vulnerability",
                "Untrusted content assigned to innerHTML can allow malicious HTML or JavaScript.",
                "Use textContent or sanitize HTML before rendering."
            )


        if re.search(
            r"subprocess\..*shell\s*=\s*True",
            line
        ):

            add_issue(
                issues,
                number,
                "HIGH",
                "Security",
                "Shell command injection risk",
                "shell=True can be dangerous when input is not trusted.",
                "Avoid shell=True and pass command arguments as a list."
            )


        if re.search(
            r"SELECT .*['\"].*\+",
            line,
            re.IGNORECASE
        ):

            add_issue(
                issues,
                number,
                "HIGH",
                "Security",
                "Possible SQL injection",
                "SQL is being constructed using string concatenation.",
                "Use parameterized queries."
            )


    # =====================================================
    # BUGS
    # =====================================================

    for number, line in enumerate(lines, start=1):

        stripped = line.strip()


        if language == "Python":

            if stripped == "except:":

                add_issue(
                    issues,
                    number,
                    "MEDIUM",
                    "Bug",
                    "Bare exception handler",
                    "A bare except can hide unexpected programming errors.",
                    "Catch a specific exception type."
                )


            if re.search(
                r"\bprint\s*\(",
                stripped
            ):

                add_issue(
                    issues,
                    number,
                    "LOW",
                    "Quality",
                    "Debug print detected",
                    "Print statements may be development debugging code.",
                    "Use logging or remove the debug statement."
                )


        if (
            "TODO" in line.upper()
            or "FIXME" in line.upper()
        ):

            add_issue(
                issues,
                number,
                "LOW",
                "Quality",
                "Pending work marker",
                "This line contains TODO or FIXME.",
                "Complete the task or create a tracked issue."
            )


        if "== None" in line:

            add_issue(
                issues,
                number,
                "LOW",
                "Quality",
                "Non-idiomatic None comparison",
                "Python recommends identity comparison for None.",
                "Use `is None` instead."
            )


    # =====================================================
    # PERFORMANCE
    # =====================================================

    for number, line in enumerate(lines, start=1):

        if re.search(
            r"^\s*(for|while)\b",
            line
        ):

            current_indent = (
                len(line)
                - len(line.lstrip())
            )


            for later_number in range(
                number + 1,
                min(number + 10, len(lines) + 1)
            ):

                later_line = lines[
                    later_number - 1
                ]


                if not later_line.strip():
                    continue


                later_indent = (
                    len(later_line)
                    - len(later_line.lstrip())
                )


                if (
                    later_indent > current_indent
                    and re.search(
                        r"^\s*(for|while)\b",
                        later_line
                    )
                ):

                    add_issue(
                        issues,
                        number,
                        "MEDIUM",
                        "Performance",
                        "Possible nested loop",
                        "Nested loops can become expensive for large datasets.",
                        "Consider optimizing the algorithm or using sets/dictionaries."
                    )

                    break


    # =====================================================
    # QUALITY
    # =====================================================

    for number, line in enumerate(lines, start=1):

        if len(line) > 120:

            add_issue(
                issues,
                number,
                "LOW",
                "Quality",
                "Very long line",
                f"This line contains {len(line)} characters.",
                "Break the line into smaller logical sections."
            )


        if "\t" in line:

            add_issue(
                issues,
                number,
                "LOW",
                "Quality",
                "Tab indentation detected",
                "Inconsistent indentation can reduce readability.",
                "Use consistent indentation."
            )


    # =====================================================
    # SCORE
    # =====================================================

    severity_points = {
        "CRITICAL": 25,
        "HIGH": 15,
        "MEDIUM": 8,
        "LOW": 3,
    }


    score = 100


    for issue in issues:

        score -= severity_points.get(
            issue["severity"],
            0
        )


    score = max(
        0,
        min(100, score)
    )


    if score >= 90:

        grade = "Excellent"

    elif score >= 75:

        grade = "Good"

    elif score >= 60:

        grade = "Needs Improvement"

    else:

        grade = "Critical"


    # =====================================================
    # COUNTS
    # =====================================================

    security_count = sum(
        1 for issue in issues
        if issue["category"] == "Security"
    )

    bug_count = sum(
        1 for issue in issues
        if issue["category"] == "Bug"
    )

    performance_count = sum(
        1 for issue in issues
        if issue["category"] == "Performance"
    )

    quality_count = sum(
        1 for issue in issues
        if issue["category"] == "Quality"
    )


    critical_count = sum(
        1 for issue in issues
        if issue["severity"] == "CRITICAL"
    )

    high_count = sum(
        1 for issue in issues
        if issue["severity"] == "HIGH"
    )

    medium_count = sum(
        1 for issue in issues
        if issue["severity"] == "MEDIUM"
    )

    low_count = sum(
        1 for issue in issues
        if issue["severity"] == "LOW"
    )


    # =====================================================
    # SUMMARY
    # =====================================================

    if score >= 90:

        summary = (
            "Your code looks strong and follows "
            "good development practices."
        )

    elif score >= 75:

        summary = (
            "Your code is generally healthy, "
            "but several improvements are recommended."
        )

    elif score >= 60:

        summary = (
            "Several issues were detected. "
            "Review the recommendations before deployment."
        )

    else:

        summary = (
            "Important problems were detected. "
            "Fix critical and high-severity issues first."
        )


    return {

        "language": language,

        "score": score,

        "grade": grade,

        "summary": summary,

        "metrics": {

            "total_lines": total_lines,

            "code_lines": code_lines,

            "blank_lines": blank_lines,

            "comment_lines": comment_lines,

            "issues": len(issues),

        },

        "categories": {

            "security": security_count,

            "bugs": bug_count,

            "performance": performance_count,

            "quality": quality_count,

        },

        "severity": {

            "critical": critical_count,

            "high": high_count,

            "medium": medium_count,

            "low": low_count,

        },

        "issues": issues,

    }


# =========================================================
# AUTO FIX ENGINE
# =========================================================

def auto_fix_code(
    code: str,
    language: str = "Python"
) -> Dict:

    fixed_code = code

    fixes = []


    # -----------------------------------------------------
    # Python: eval()
    # -----------------------------------------------------

    if language == "Python":

        if re.search(
            r"\beval\s*\(",
            fixed_code
        ):

            fixed_code = re.sub(
                r"eval\s*\((.*?)\)",
                r"\1",
                fixed_code
            )

            fixes.append(
                "Removed dangerous eval() usage."
            )


        # -------------------------------------------------
        # Python: == None
        # -------------------------------------------------

        if "== None" in fixed_code:

            fixed_code = fixed_code.replace(
                "== None",
                "is None"
            )

            fixes.append(
                "Replaced == None with is None."
            )


        # -------------------------------------------------
        # Python: debug print
        # -------------------------------------------------

        lines = fixed_code.splitlines()

        new_lines = []


        for line in lines:

            stripped = line.strip()


            if (
                stripped.startswith("print(")
                and "logging" not in line
            ):

                new_lines.append(
                    line.replace(
                        "print(",
                        "# print("
                    )
                )

                if "Removed" not in " ".join(fixes):

                    fixes.append(
                        "Commented out debug print statements."
                    )

            else:

                new_lines.append(line)


        fixed_code = "\n".join(
            new_lines
        )


        # -------------------------------------------------
        # Bare except
        # -------------------------------------------------

        if re.search(
            r"^\s*except:\s*$",
            fixed_code,
            re.MULTILINE
        ):

            fixed_code = re.sub(
                r"(^\s*)except:\s*$",
                r"\1except Exception:",
                fixed_code,
                flags=re.MULTILINE
            )

            fixes.append(
                "Replaced bare except with except Exception."
            )


    return {

        "original_code": code,

        "fixed_code": fixed_code,

        "fixes": fixes,

        "fix_count": len(fixes),

    }