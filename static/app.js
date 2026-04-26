const dropZone      = document.getElementById('dropZone');
const fileInput     = document.getElementById('fileInput');
const browseBtn     = document.getElementById('browseBtn');
const clearBtn      = document.getElementById('clearBtn');
const fileInfo      = document.getElementById('fileInfo');
const fileNameEl    = document.getElementById('fileName');
const analyzeBtn    = document.getElementById('analyzeBtn');
const loader        = document.getElementById('loader');
const loaderText    = document.getElementById('loaderText');
const loaderSteps   = document.getElementById('loaderSteps');
const reportSection = document.getElementById('reportSection');
const downloadBtn   = document.getElementById('downloadBtn');
const newReportBtn  = document.getElementById('newReportBtn');

let selectedFile = null;
let currentReport = null;
reportSection.hidden = true;

browseBtn.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('click', (e) => {
  if (e.target !== browseBtn && e.target !== clearBtn) fileInput.click();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
['dragleave', 'dragend'].forEach(evt =>
  dropZone.addEventListener(evt, () => dropZone.classList.remove('drag-over'))
);
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if (f && f.type === 'application/pdf') setFile(f);
});

function setFile(f) {
  selectedFile = f;
  fileNameEl.textContent = f.name;
  fileInfo.hidden = false;
  browseBtn.hidden = true;
  analyzeBtn.disabled = false;
  reportSection.hidden = true;
}

clearBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resetUpload();
});

function resetUpload() {
  selectedFile = null;
  fileInput.value = '';
  fileInfo.hidden = true;
  browseBtn.hidden = false;
  analyzeBtn.disabled = true;
  reportSection.hidden = true;
}

analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  await runAnalysis();
});

async function runAnalysis() {
  reportSection.hidden = true;
  loader.hidden = false;
  analyzeBtn.disabled = true;
  animateLoaderSteps();

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const response = await fetch('/analyze', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      alert(data.error || 'Server error. Please try again.');
      return;
    }
    currentReport = data.report;
    renderReport(data.report);
  } catch (err) {
    alert(err.message);
  } finally {
    loader.hidden = true;
    analyzeBtn.disabled = false;
  }
}

function animateLoaderSteps() {
  const steps = loaderSteps.querySelectorAll('.step');
  const messages = [
    'Extracting document content...',
    'Reasoning with Groq AI...',
    'Structuring investigation report...'
  ];
  let i = 0;
  steps.forEach(s => { s.classList.remove('active', 'done'); });
  steps[0].classList.add('active');
  loaderText.textContent = messages[0];

  const interval = setInterval(() => {
    if (loader.hidden) { clearInterval(interval); return; }
    if (i < steps.length - 1) {
      steps[i].classList.remove('active');
      steps[i].classList.add('done');
      i++;
      steps[i].classList.add('active');
      loaderText.textContent = messages[i] || '';
    } else {
      clearInterval(interval);
    }
  }, 2200);
}

function renderReport(r) {
  document.getElementById('reportTitle').textContent = r.document_title || 'Investigation Report';
  document.getElementById('reportMeta').textContent = r.report_date ? `Report Date: ${r.report_date}` : '';

  document.getElementById('problemHeadline').textContent = r.problem_summary?.headline || '';
  document.getElementById('problemDetails').textContent  = r.problem_summary?.details  || '';

  document.getElementById('rcaPrimary').textContent   = r.root_cause_analysis?.primary_cause || '';
  document.getElementById('rcaNarrative').textContent = r.root_cause_analysis?.analysis_narrative || '';

  const factorsList = document.getElementById('rcaFactors');
  factorsList.innerHTML = '';
  (r.root_cause_analysis?.contributing_factors || []).forEach(f => {
    const li = document.createElement('li');
    li.textContent = f;
    factorsList.appendChild(li);
  });

  const sev = (r.impact_assessment?.severity || 'Medium').toLowerCase();
  const badge = document.getElementById('severityBadge');
  badge.textContent = r.impact_assessment?.severity || 'Medium';
  badge.className = `severity-badge severity-${sev}`;

  document.getElementById('patientRisk').textContent    = r.impact_assessment?.patient_safety_risk || '';
  document.getElementById('regulatoryRisk').textContent = r.impact_assessment?.regulatory_risk    || '';
  document.getElementById('financialRisk').textContent  = r.impact_assessment?.financial_risk     || '';

  const areasEl = document.getElementById('affectedAreas');
  areasEl.innerHTML = '';
  (r.impact_assessment?.affected_areas || []).forEach(a => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = a;
    areasEl.appendChild(chip);
  });

  renderActions('correctiveActions', r.corrective_actions || []);
  renderActions('preventiveActions', r.preventive_actions || []);

  document.getElementById('conclusionText').textContent = r.conclusion || '';

  reportSection.hidden = false;
  setTimeout(() => {
    reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  const cards = reportSection.querySelectorAll('.reveal');
  cards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 80}ms`;
    setTimeout(() => card.classList.add('visible'), 50 + i * 80);
  });
}

function renderActions(containerId, actions) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  if (!actions.length) {
    el.innerHTML = '<p style="color:var(--ink-3);font-size:13px;">No actions specified.</p>';
    return;
  }
  actions.forEach((a) => {
    const div = document.createElement('div');
    div.className = 'action-item';
    div.innerHTML = `
      <p class="action-text">${escHtml(a.action || '')}</p>
      <div class="action-meta">
        ${a.owner    ? `<span class="action-tag">Owner: ${escHtml(a.owner)}</span>`       : ''}
        ${a.timeline ? `<span class="action-tag">Timeline: ${escHtml(a.timeline)}</span>` : ''}
      </div>`;
    el.appendChild(div);
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

downloadBtn.addEventListener('click', () => {
  if (!currentReport) return;
  const r = currentReport;
  const lines = [
    `INVESTIQ — INVESTIGATION REPORT`,
    `${'='.repeat(60)}`,
    `Document: ${r.document_title || 'Unknown'}`,
    `Date:     ${r.report_date    || 'N/A'}`,
    ``,
    `01. PROBLEM SUMMARY`,
    r.problem_summary?.headline || '',
    r.problem_summary?.details  || '',
    ``,
    `02. ROOT CAUSE ANALYSIS`,
    `Primary Cause: ${r.root_cause_analysis?.primary_cause || ''}`,
    `Contributing Factors:`,
    ...(r.root_cause_analysis?.contributing_factors || []).map(f => `  - ${f}`),
    r.root_cause_analysis?.analysis_narrative || '',
    ``,
    `03. IMPACT ASSESSMENT`,
    `Severity: ${r.impact_assessment?.severity || 'N/A'}`,
    `Patient Safety: ${r.impact_assessment?.patient_safety_risk || ''}`,
    `Regulatory Risk: ${r.impact_assessment?.regulatory_risk || ''}`,
    `Financial Risk: ${r.impact_assessment?.financial_risk || ''}`,
    ``,
    `04. CORRECTIVE ACTIONS`,
    ...(r.corrective_actions || []).flatMap((a, i) => [`${i+1}. ${a.action}`, `   Owner: ${a.owner} | Timeline: ${a.timeline}`, ``]),
    `05. PREVENTIVE ACTIONS`,
    ...(r.preventive_actions || []).flatMap((a, i) => [`${i+1}. ${a.action}`, `   Owner: ${a.owner} | Timeline: ${a.timeline}`, ``]),
    `06. CONCLUSION`,
    r.conclusion || '',
    `${'='.repeat(60)}`,
    `Generated by InvestiQ AI Investigation Suite`,
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `investigation-report-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

newReportBtn.addEventListener('click', () => {
  resetUpload();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});