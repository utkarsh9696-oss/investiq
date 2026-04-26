# InvestiQ — AI Investigation Suite

A GenAI-powered investigation report generator for pharmaceutical and general PDF reports.  
Built with Flask + Gemini API. Professional, production-quality UI.

---

## Project Structure

```
pharma-investigation-suite/
├── app.py                  # Flask backend (main entry point)
├── requirements.txt        # Python dependencies
├── README.md               # This file
├── templates/
│   └── index.html          # Main UI template
└── static/
    ├── style.css           # All styles (dark mode, animations, cards)
    └── app.js              # Frontend logic (upload, API call, rendering)
```

---

## Step 1 — Get a Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key (starts with `AIza...`)

---

## Step 2 — Add Your API Key

Open `app.py` and find this line near the top:

```python
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")
```

**Option A (recommended) — Environment variable:**
```bash
# Mac/Linux
export GEMINI_API_KEY="AIzaYourKeyHere"

# Windows CMD
set GEMINI_API_KEY=AIzaYourKeyHere
```

**Option B — Edit directly:**
Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual key string.

---

## Step 3 — Install Dependencies

Make sure Python 3.9+ is installed.

```bash
cd pharma-investigation-suite

# (Optional but recommended) create a virtual environment
python -m venv venv
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows

# Install packages
pip install -r requirements.txt
```

---

## Step 4 — Run the Backend

```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

---

## Step 5 — Open the App

Open your browser and go to:

```
http://localhost:5000
```

Upload any pharmaceutical deviation, audit, or investigation PDF and click **Generate Investigation Report**.

---

## Common Errors & Fixes

| Error | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'pdfplumber'` | Run `pip install -r requirements.txt` |
| `google.api_core.exceptions.PermissionDenied` | Your API key is invalid or not enabled. Generate a new one. |
| `Could not extract text from the PDF` | The PDF is scanned/image-based. Use a text-based PDF. |
| `Port 5000 already in use` | Run `python app.py --port 5001` or kill the existing process. |
| `CORS error in browser` | Make sure you're accessing via `http://localhost:5000`, not via `file://`. |

---

## Features

- Drag-and-drop PDF upload with polished UI
- Gemini 1.5 Flash — fast, free-tier friendly
- Structured JSON output rendered as cards:
  - Problem Summary
  - Root Cause Analysis (inferred)
  - Impact Assessment with severity badge
  - Corrective Actions with owner + timeline
  - Preventive Actions with owner + timeline
  - Conclusion & Next Steps
- Download report as `.txt` file
- Smooth loading animation with step indicators
- Fully responsive (mobile + desktop)

---

## Notes for Interview Demo

- Use a real pharmaceutical deviation report, audit finding, or CAPA document for best results
- The system works on any text-based PDF (quality reports, incident reports, etc.)
- Gemini 1.5 Flash has a generous free quota — no cost for demo use
- The `MAX_CHARS = 8000` limit in `app.py` can be increased for larger documents
