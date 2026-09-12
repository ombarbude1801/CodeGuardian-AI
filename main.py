from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel
from pathlib import Path

from .analyzer import (
    analyze_code,
    detect_language,
    auto_fix_code
)


# =========================================================
# APP CONFIGURATION
# =========================================================

app = FastAPI(
    title="CodeGuardian AI",
    description="AI-powered Code Quality, Security & Auto-Fix Platform",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# PATH CONFIGURATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


# =========================================================
# STATIC FILES
# =========================================================

app.mount(
    "/assets",
    StaticFiles(directory=FRONTEND_DIR),
    name="assets"
)


# =========================================================
# REQUEST MODELS
# =========================================================

class CodeRequest(BaseModel):
    code: str
    language: str = "Python"


# =========================================================
# HOME PAGE
# =========================================================

@app.get("/")
async def home():
    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "CodeGuardian AI",
        "version": "1.0.0"
    }


# =========================================================
# ANALYZE CODE
# =========================================================

@app.post("/api/analyze")
async def analyze(request: CodeRequest):

    if not request.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter some code before analysis."
        )

    try:

        result = analyze_code(
            request.code,
            request.language
        )

        return {
            "success": True,
            "message": "Code analysis completed successfully.",
            "result": result
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(error)}"
        )


# =========================================================
# AUTO FIX CODE
# =========================================================

@app.post("/api/fix")
async def fix_code(request: CodeRequest):

    if not request.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter some code before fixing."
        )

    try:

        result = auto_fix_code(
            request.code,
            request.language
        )

        return {
            "success": True,
            "message": "Code fix process completed.",
            **result
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Auto-fix failed: {str(error)}"
        )


# =========================================================
# UPLOAD CODE FILE
# =========================================================

@app.post("/api/upload")
async def upload_code(file: UploadFile = File(...)):

    allowed_extensions = {
        ".py": "Python",
        ".js": "JavaScript",
        ".java": "Java",
        ".c": "C",
        ".cpp": "C++",
        ".h": "C/C++",
        ".hpp": "C++"
    }

    filename = file.filename or ""

    extension = Path(filename).suffix.lower()

    if extension not in allowed_extensions:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Supported files: .py, .js, .java, .c, .cpp, .h, .hpp"
            )
        )

    try:

        content = await file.read()

        code = content.decode(
            "utf-8",
            errors="replace"
        )

        language = allowed_extensions[extension]

        return {
            "success": True,
            "filename": filename,
            "language": language,
            "code": code,
            "message": "File uploaded successfully."
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"File upload failed: {str(error)}"
        )


# =========================================================
# API INFORMATION
# =========================================================

@app.get("/api")
async def api_info():

    return {
        "project": "CodeGuardian AI",
        "version": "1.0.0",
        "description": (
            "Intelligent code quality, security, "
            "bug detection and automatic code fixing platform."
        ),
        "endpoints": {
            "health": "/health",
            "analyze": "/api/analyze",
            "fix": "/api/fix",
            "upload": "/api/upload",
            "docs": "/docs"
        }
    }