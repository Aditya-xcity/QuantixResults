/*
  script.js
  - Dynamic subject fields
  - Result calculation
  - PDF generation using jsPDF + autoTable
*/
(function(){
  const numSubjectsInput = document.getElementById('numSubjects');
  const subjectsContainer = document.getElementById('subjectsContainer');
  const generateBtn = document.getElementById('generateBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const printBtn = document.getElementById('printBtn');
  const resultCard = document.getElementById('resultCard');
  const resultPreview = document.getElementById('resultPreview');
  const photoInput = document.getElementById('photoInput');
  const darkModeToggle = document.getElementById('darkModeToggle');

  let currentPhotoDataUrl = null;
  let lastPdfBlobUrl = null;

  // Create initial subject fields
  function createSubjectFields(n){
    subjectsContainer.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'subjects-list';

    for(let i=0;i<n;i++){
      const row = document.createElement('div');
      row.className = 'subject-row';

      const sName = document.createElement('input');
      sName.type = 'text';
      sName.placeholder = `Subject ${i+1} name`;
      sName.className = 'subject-name';
      sName.required = true;

      const sMarks = document.createElement('input');
      sMarks.type = 'number';
      sMarks.min = 0;
      sMarks.max = 100;
      sMarks.value = 0;
      sMarks.className = 'subject-marks';
      sMarks.required = true;

      row.appendChild(sName);
      row.appendChild(sMarks);
      wrapper.appendChild(row);
    }

    subjectsContainer.appendChild(wrapper);
  }

  // Utility: compute grade from percentage (simple mapping)
  function getGrade(percent){
    if(percent >= 85) return 'A';
    if(percent >= 70) return 'B';
    if(percent >= 55) return 'C';
    if(percent >= 40) return 'D';
    return 'F';
  }

  // Calculate results from form data
  function calculateResult(){
    const studentName = document.getElementById('studentName').value.trim();
    const fatherName = document.getElementById('fatherName').value.trim();
    const rollNumber = document.getElementById('rollNumber').value.trim();
    const collegeName = document.getElementById('collegeName').value.trim();

    const subjectNames = Array.from(document.querySelectorAll('.subject-name')).map(i=>i.value.trim());
    const marks = Array.from(document.querySelectorAll('.subject-marks')).map(i=>parseFloat(i.value || 0));

    // Build subject objects array
    const subjects = subjectNames.map((name, idx)=>({
      name: name || `Subject ${idx+1}`,
      marks: isNaN(marks[idx]) ? 0 : marks[idx]
    }));

    // Total and percentage
    const totalMarks = subjects.reduce((s,x)=>s + x.marks, 0);
    const maxTotal = subjects.length * 100;
    const percent = (totalMarks / maxTotal) * 100;

    // Pass condition: every subject >= 40
    const passedAll = subjects.every(s => s.marks >= 40);
    const status = passedAll ? 'PASS' : 'FAIL';

    // Attach grades per subject
    subjects.forEach(s => s.grade = getGrade(s.marks));

    return {
      studentName, fatherName, rollNumber, collegeName,
      subjects, totalMarks, maxTotal, percent: +percent.toFixed(2), status
    };
  }

  // Render preview HTML
  function renderPreview(data){
    resultPreview.innerHTML = '';
    const ms = document.createElement('div');
    ms.className = 'marksheet';

    ms.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2>${data.collegeName || 'University / School Name'}</h2>
          <div>Official Marksheet</div>
        </div>
        <div style="text-align:right">
          <div><strong>Roll:</strong> ${data.rollNumber}</div>
        </div>
      </div>
      <div class="ms-details">
        <div>
          <div><strong>Name:</strong> ${data.studentName}</div>
          <div><strong>Father's Name:</strong> ${data.fatherName}</div>
        </div>
        <div>
          ${currentPhotoDataUrl ? `<img src="${currentPhotoDataUrl}" alt="photo" style="width:96px;height:96px;object-fit:cover;border:1px solid #ddd"/>` : ''}
        </div>
      </div>
      <table class="ms-table">
        <thead><tr><th>Subject</th><th>Marks (out of 100)</th><th>Grade</th></tr></thead>
        <tbody>
          ${data.subjects.map(s => `<tr><td>${s.name}</td><td>${s.marks}</td><td>${s.grade}</td></tr>`).join('')}
        </tbody>
      </table>
      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
        <div><strong>Total:</strong> ${data.totalMarks} / ${data.maxTotal}</div>
        <div><strong>Percentage:</strong> ${data.percent}%</div>
        <div><strong>Result:</strong> <span class="${data.status==='PASS'?'status-pass':'status-fail'}">${data.status}</span></div>
      </div>
    `;

    resultPreview.appendChild(ms);
    resultCard.classList.remove('hidden');
  }

  // Generate PDF using jsPDF and autoTable
  async function generatePDF(data){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(16);
    doc.text(data.collegeName || 'University / School Name', pageWidth/2, 40, {align: 'center'});
    doc.setFontSize(12);
    doc.text('Official Marksheet', pageWidth/2, 60, {align: 'center'});

    let y = 90;

    // Student details and photo
    doc.setFontSize(10);
    doc.text(`Name: ${data.studentName}`, 40, y);
    doc.text(`Father's Name: ${data.fatherName}`, 40, y+16);
    doc.text(`Roll Number: ${data.rollNumber}`, 40, y+32);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 140, y);

    if(currentPhotoDataUrl){
      // Add photo (scaled)
      // convert dataURL to image and add
      try{
        doc.addImage(currentPhotoDataUrl, 'JPEG', pageWidth-140, y, 96, 96);
      }catch(e){/*ignore*/}
    }

    y += 60;

    // Table: subject-wise marks
    const tableColumns = [
      { header: 'Subject', dataKey: 'subject' },
      { header: 'Marks', dataKey: 'marks' },
      { header: 'Grade', dataKey: 'grade' }
    ];
    const tableRows = data.subjects.map(s => ({ subject: s.name, marks: s.marks.toString(), grade: s.grade }));

    doc.autoTable({
      startY: y,
      head: [tableColumns.map(c => c.header)],
      body: tableRows.map(r => [r.subject, r.marks, r.grade]),
      styles: { fontSize: 10 },
      theme: 'striped'
    });

    const finalY = doc.lastAutoTable.finalY + 10 || y + 120;

    // Totals and status
    doc.text(`Total Marks: ${data.totalMarks} / ${data.maxTotal}`, 40, finalY + 20);
    doc.text(`Percentage: ${data.percent}%`, 220, finalY + 20);
    doc.text(`Result: ${data.status}`, 380, finalY + 20);

    // Signature section
    doc.text('_______________________', pageWidth - 220, finalY + 80);
    doc.text('Controller of Examinations', pageWidth - 220, finalY + 98);

    // Add exact instructions block at bottom
    const instructions = [
      'This is internet generated document and cannot be used for any legal purpose.',
      'Original Marks Sheet will be issued only once.For issue of Duplicate marks sheet, the University office may be contacted.',
      'The Candidate will be declared pass by securing at least 40 % marks by taking into account Mid Term Exam along with Sessional & End Term Marks in aggregate of each theory paper.However in practical, it is mandatory to obtain at least 40 % marks in Mid Term & End Term exam separately.',
      'Candidate will be declared pass in a semester if he / she passes in all theory and practical subjects.',
      '(i) A candidate may be awarded grace marks upto a maximum of 10 marks without any restriction in the theory subjects. No grace marks will be applied in practical subjects.',
      '(ii) Grace marks will be applicable only to the candidates who can be declared pass in a semester after the award of the grace marks.',
      'For 2019 batch onwards mandatory to obtain 30 % marks in end term theory subjects, and 40 % in mid & end sem Practical subjects separately.',
      'Grace marks will be applicable only in theory subjects if the student pass in end semester exam.',
      'NC = Non Credit'
    ];

    // Print instructions (wrap if needed)
    doc.setFontSize(8);
    let insY = doc.internal.pageSize.getHeight() - 140;
    doc.text('Instructions:', 40, insY);
    insY += 12;
    instructions.forEach(line => {
      const splitted = doc.splitTextToSize(line, pageWidth - 80);
      doc.text(splitted, 40, insY);
      insY += (splitted.length * 10);
    });

    // Return blob for download/print
    const blob = doc.output('blob');
    return blob;
  }

  // Button handlers
  generateBtn.addEventListener('click', async ()=>{
    // Validate form
    const form = document.getElementById('resultForm');
    if(!form.reportValidity()) return;
    const data = calculateResult();
    renderPreview(data);

    // Create PDF blob and enable download/print
    downloadPdfBtn.disabled = true;
    printBtn.disabled = true;
    try{
      const blob = await generatePDF(data);
      if(lastPdfBlobUrl) URL.revokeObjectURL(lastPdfBlobUrl);
      lastPdfBlobUrl = URL.createObjectURL(blob);
      downloadPdfBtn.href = lastPdfBlobUrl; // assign for convenience
      downloadPdfBtn.download = `${data.studentName || 'marksheet'}_${data.rollNumber||'000'}.pdf`;
      downloadPdfBtn.disabled = false;
      printBtn.disabled = false;
      // Attach click to download using anchor fallback
      downloadPdfBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = lastPdfBlobUrl;
        a.download = downloadPdfBtn.download;
        document.body.appendChild(a);
        a.click();
        a.remove();
      };

      printBtn.onclick = () => {
        // Open in new window and trigger print
        const w = window.open(lastPdfBlobUrl);
        if(!w) return alert('Popup blocked. Allow popups to print.');
        w.addEventListener('load', ()=>w.print());
      };

    }catch(err){
      console.error(err);
      alert('Error generating PDF. See console for details.');
    }
  });

  // Update subject fields when number changes
  numSubjectsInput.addEventListener('change', ()=>{
    const n = Math.max(1, Math.min(20, parseInt(numSubjectsInput.value || 1)));
    createSubjectFields(n);
  });

  // Photo preview as data URL
  photoInput.addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) { currentPhotoDataUrl = null; return; }
    const reader = new FileReader();
    reader.onload = function(ev){ currentPhotoDataUrl = ev.target.result; };
    reader.readAsDataURL(f);
  });

  // Dark mode
  darkModeToggle.addEventListener('change',(e)=>{
    if(e.target.checked) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  });

  // Initialize
  createSubjectFields(parseInt(numSubjectsInput.value || 3));

})();
