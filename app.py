import os
import json
import re
import traceback
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from groq import Groq
import pdfplumber

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
MAX_CHARS = 6000

client = Groq(api_key=GROQ_API_KEY)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded."}), 400

        file = request.files["file"]
        if file.filename == "" or not file.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Please upload a valid PDF file."}), 400

        try:
            with pdfplumber.open(file) as pdf:
                raw_text = ""
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        raw_text += text + "\n"
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": f"Failed to read PDF: {str(e)}"}), 500

        if not raw_text.strip():
            return jsonify({"error": "Could not extract text. PDF may be image-based."}), 400

        document_text = raw_text[:MAX_CHARS]

        prompt = f"""You are a senior pharmaceutical quality assurance expert and investigation analyst.

Analyze the following document and generate a STRUCTURED INVESTIGATION REPORT.
Return ONLY valid JSON — no markdown fences, no explanation outside the JSON.

The JSON must follow this exact schema:
{{
  "document_title": "inferred title of the document",
  "report_date": "today's date or inferred date",
  "problem_summary": {{
    "headline": "one concise sentence describing the core issue",
    "details": "2-4 sentences expanding on what happened, when, and where"
  }},
  "root_cause_analysis": {{
    "primary_cause": "the single most likely root cause (inferred, not just extracted)",
    "contributing_factors": ["factor 1", "factor 2", "factor 3"],
    "analysis_narrative": "2-3 sentences explaining the causal chain"
  }},
  "impact_assessment": {{
    "severity": "Critical | High | Medium | Low",
    "affected_areas": ["area 1", "area 2"],
    "patient_safety_risk": "describe risk to patients or end-users",
    "regulatory_risk": "describe potential regulatory/compliance implications",
    "financial_risk": "estimate potential business/financial impact"
  }},
  "corrective_actions": [
    {{
      "action": "description of immediate corrective action",
      "owner": "suggested responsible team or role",
      "timeline": "suggested completion timeline"
    }}
  ],
  "preventive_actions": [
    {{
      "action": "description of long-term preventive measure",
      "owner": "suggested responsible team or role",
      "timeline": "suggested implementation timeline"
    }}
  ],
  "conclusion": "2-3 sentence summary of findings and recommended next steps"
}}

Document Content:
---
{document_text}
---"""

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000,
            )
            raw_response = response.choices[0].message.content.strip()
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": f"Groq API error: {str(e)}"}), 500

        try:
            cleaned = re.sub(r"^```json\s*|^```\s*|```$", "", raw_response, flags=re.MULTILINE).strip()
            report = json.loads(cleaned)
        except json.JSONDecodeError:
            traceback.print_exc()
            return jsonify({"error": f"JSON parse failed. Raw: {raw_response[:300]}"}), 422

        return jsonify({"success": True, "report": report})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))