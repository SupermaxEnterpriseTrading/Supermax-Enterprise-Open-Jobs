(() => {
  if (!document.getElementById("adminApp")) return;
  const S = window.SMX, $ = id => document.getElementById(id);
  let settings={}, jobs=[], applicants=[], selectedApplicant=null;

  const titles={dashboard:"Dashboard",jobs:"Job Postings",applicants:"Applicants",settings:"Settings"};

  async function loadAll(){
    [settings,jobs,applicants]=await Promise.all([S.getSettings(),S.getJobs(true),S.getApplicants()]);
    applyBrand();renderDashboard();renderJobsTable();setupStatusFilter();renderApplicants();fillSettings();
  }
  function applyBrand(){
    $("adminCompanyName").textContent=settings.companyName;
    [$("adminLogo"),$("loginLogo")].forEach(i=>i.src=settings.logo||"");
  }
  function showView(view){
    document.querySelectorAll(".admin-view").forEach(v=>v.classList.add("hidden"));
    $(`view-${view}`).classList.remove("hidden");
    document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===view));
    $("adminPageTitle").textContent=titles[view];
  }
  function renderDashboard(){
    const counts={
      "Total Applicants":applicants.length,
      "New":applicants.filter(a=>a.status==="New Application").length,
      "For Review":applicants.filter(a=>a.status==="Under Review").length,
      "Interview":applicants.filter(a=>a.status==="For Interview").length,
      "Hired":applicants.filter(a=>a.status==="Hired").length
    };
    $("statsGrid").innerHTML=Object.entries(counts).map(([k,v])=>`<div class="stat-card"><span>${k}</span><strong>${v}</strong></div>`).join("");
    const recent=[...applicants].sort((a,b)=>new Date(b.appliedAt)-new Date(a.appliedAt)).slice(0,6);
    $("recentApplicants").innerHTML=recent.map(a=>`<div class="recent-row"><div class="avatar">${S.escapeHtml(a.fullName.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase())}</div><div><strong>${S.escapeHtml(a.fullName)}</strong><span>${S.escapeHtml(a.jobTitle)} · ${S.formatDate(a.appliedAt,true)}</span></div><span class="status-tag ${S.statusSlug(a.status)}">${S.escapeHtml(a.status)}</span></div>`).join("")||"<p>No applicants yet.</p>";
    const pipeline=S.STATUSES.map(status=>[status,applicants.filter(a=>a.status===status).length]).filter(([,c])=>c>0);
    const max=Math.max(1,...pipeline.map(([,c])=>c));
    $("pipelineChart").innerHTML=pipeline.map(([s,c])=>`<div class="pipeline-row"><div class="pipeline-label"><span>${S.escapeHtml(s)}</span><strong>${c}</strong></div><div class="pipeline-bar"><div class="pipeline-fill" style="width:${(c/max)*100}%"></div></div></div>`).join("")||"<p>No pipeline data yet.</p>";
  }
  function renderJobsTable(){
    $("jobsTableBody").innerHTML=jobs.map(j=>{
      const count=applicants.filter(a=>a.jobId===j.id).length;
      return `<tr><td class="table-primary"><strong>${S.escapeHtml(j.title)}</strong><span>${S.escapeHtml(j.type)}</span></td><td>${S.escapeHtml(j.department)}</td><td>${S.escapeHtml(j.location)}</td><td><span class="status-tag ${S.statusSlug(j.status)}">${S.escapeHtml(j.status)}</span></td><td>${count}</td><td><button class="table-action" data-edit-job="${j.id}">Edit</button> <button class="table-action" data-delete-job="${j.id}">Delete</button></td></tr>`;
    }).join("")||`<tr><td colspan="6">No job postings yet.</td></tr>`;
  }
  function setupStatusFilter(){
    $("applicantStatusFilter").innerHTML=`<option value="">All statuses</option>`+S.STATUSES.map(s=>`<option>${S.escapeHtml(s)}</option>`).join("");
  }
  function renderApplicants(){
    const q=$("applicantSearch").value.trim().toLowerCase(), status=$("applicantStatusFilter").value;
    const list=applicants.filter(a=>(!q||`${a.fullName} ${a.jobTitle} ${a.trackingId} ${a.email}`.toLowerCase().includes(q))&&(!status||a.status===status)).sort((a,b)=>new Date(b.appliedAt)-new Date(a.appliedAt));
    $("applicantsTableBody").innerHTML=list.map(a=>`<tr><td class="table-primary"><strong>${S.escapeHtml(a.fullName)}</strong><span>${S.escapeHtml(a.email)} · ${S.escapeHtml(a.mobile)}</span></td><td>${S.escapeHtml(a.jobTitle)}</td><td>${S.formatDate(a.appliedAt)}</td><td><span class="status-tag ${S.statusSlug(a.status)}">${S.escapeHtml(a.status)}</span></td><td>${S.escapeHtml(a.trackingId)}</td><td><button class="table-action" data-view-applicant="${a.id}">Open</button></td></tr>`).join("")||`<tr><td colspan="6">No applicants found.</td></tr>`;
  }
  function fillSettings(){
    $("settingCompanyName").value=settings.companyName||"";
    $("settingHeroTitle").value=settings.heroTitle||"";
    $("settingHeroSubtitle").value=settings.heroSubtitle||"";
    $("settingAboutTitle").value=settings.aboutTitle||"";
    $("settingDescription").value=settings.description||"";
    $("settingAddress").value=settings.address||"";
    $("settingContact").value=settings.contact||"";
    $("settingHrEmail").value=settings.hrEmail||"";
    $("settingFacebookLink").value=settings.facebookLink||"";
  }

  function openJobEditor(id=""){
    const j=jobs.find(x=>x.id===id);
    $("jobEditorTitle").textContent=j?"Edit Job Posting":"Add Job Posting";
    $("jobEditId").value=j?.id||"";
    $("jobTitle").value=j?.title||"";
    $("jobDepartmentInput").value=j?.department||"";
    $("jobLocation").value=j?.location||settings.address||"";
    $("jobType").value=j?.type||"Full-time";
    $("jobSalary").value=j?.salary||"";
    $("jobStatus").value=j?.status||"active";
    $("jobDescription").value=j?.description||"";
    $("jobQualifications").value=(j?.qualifications||[]).join("\n");
    $("jobResponsibilities").value=(j?.responsibilities||[]).join("\n");
    $("jobEditorModal").classList.remove("hidden");document.body.style.overflow="hidden";
  }
  function closeJobEditor(){$("jobEditorModal").classList.add("hidden");document.body.style.overflow="";}

  async function saveJobForm(e){
    e.preventDefault();
    const id=$("jobEditId").value||S.makeId("job");
    const job={id,title:$("jobTitle").value.trim(),department:$("jobDepartmentInput").value.trim(),location:$("jobLocation").value.trim(),type:$("jobType").value,salary:$("jobSalary").value.trim(),status:$("jobStatus").value,description:$("jobDescription").value.trim(),qualifications:$("jobQualifications").value.split("\n").map(x=>x.trim()).filter(Boolean),responsibilities:$("jobResponsibilities").value.split("\n").map(x=>x.trim()).filter(Boolean)};
    await S.saveJob(job); jobs=await S.getJobs(true);renderJobsTable();closeJobEditor();renderDashboard();
  }

  function openApplicant(id){
    selectedApplicant=applicants.find(a=>a.id===id); if(!selectedApplicant)return;
    const a=selectedApplicant;
    $("applicantDetails").innerHTML=`
      <div class="applicant-head"><div><span class="eyebrow dark">${S.escapeHtml(a.trackingId)}</span><h2>${S.escapeHtml(a.fullName)}</h2><p>${S.escapeHtml(a.jobTitle)} · Applied ${S.formatDate(a.appliedAt,true)}</p></div><span class="status-tag ${S.statusSlug(a.status)}">${S.escapeHtml(a.status)}</span></div>
      <div class="applicant-grid">
        <div>
          <div class="detail-card"><h3>Applicant Information</h3><div class="detail-list">
            <div class="detail-item"><span>Email</span><strong>${S.escapeHtml(a.email)}</strong></div>
            <div class="detail-item"><span>Mobile</span><strong>${S.escapeHtml(a.mobile)}</strong></div>
            <div class="detail-item"><span>Address</span><strong>${S.escapeHtml(a.address)}</strong></div>
            <div class="detail-item"><span>Education</span><strong>${S.escapeHtml(a.education||"—")}</strong></div>
            <div class="detail-item"><span>Experience</span><strong>${S.escapeHtml(a.experience||"—")}</strong></div>
            <div class="detail-item"><span>Expected Salary</span><strong>${S.escapeHtml(a.expectedSalary||"—")}</strong></div>
            <div class="detail-item"><span>Available Start Date</span><strong>${S.escapeHtml(a.startDate||"—")}</strong></div>
          </div></div>
          <div class="detail-card"><h3>Applicant Message</h3><p>${S.escapeHtml(a.message||"No message provided.")}</p></div>
          <div class="detail-card"><h3>Resume</h3>${a.resumeUrl?`<a class="resume-link" href="${S.escapeHtml(a.resumeUrl)}" target="_blank">Open ${S.escapeHtml(a.resumeName)}</a>`:`<div class="resume-link">${S.escapeHtml(a.resumeName||"Resume uploaded in demo mode")}</div>`}</div>
        </div>
        <div>
          <form id="applicantUpdateForm" class="detail-card admin-form-stack">
            <h3>Recruitment Status</h3>
            <label>Status<select class="input" id="modalApplicantStatus">${S.STATUSES.map(s=>`<option ${s===a.status?"selected":""}>${S.escapeHtml(s)}</option>`).join("")}</select></label>
            <label>Private HR Notes<textarea class="input" id="modalHrNotes" rows="5">${S.escapeHtml(a.hrNotes||"")}</textarea></label>
            <div id="interviewFields">
              <label>Interview Date<input class="input" id="modalInterviewDate" type="date" value="${S.escapeHtml(a.interviewDate||"")}" /></label>
              <label>Interview Time<input class="input" id="modalInterviewTime" type="time" value="${S.escapeHtml(a.interviewTime||"")}" /></label>
              <label>Interview Location<textarea class="input" id="modalInterviewLocation" rows="3">${S.escapeHtml(a.interviewLocation||settings.address||"")}</textarea></label>
              <label>Applicant Interview Note<textarea class="input" id="modalInterviewNotes" rows="4">${S.escapeHtml(a.interviewNotes||"")}</textarea></label>
            </div>
            <button class="btn btn-full" type="submit">Save Applicant Update</button>
            <button id="deleteApplicantBtn" class="danger-button" type="button">Delete Applicant</button>
          </form>
        </div>
      </div>`;
    toggleInterviewFields();
    $("modalApplicantStatus").addEventListener("change",toggleInterviewFields);
    $("applicantUpdateForm").addEventListener("submit",saveApplicantUpdate);
    $("deleteApplicantBtn").addEventListener("click",deleteSelectedApplicant);
    $("applicantModal").classList.remove("hidden");document.body.style.overflow="hidden";
  }
  function toggleInterviewFields(){
    const el=$("interviewFields"); if(!el)return;
    el.classList.toggle("hidden",$("modalApplicantStatus").value!=="For Interview");
  }
  async function saveApplicantUpdate(e){
    e.preventDefault();
    selectedApplicant={...selectedApplicant,status:$("modalApplicantStatus").value,hrNotes:$("modalHrNotes").value.trim(),interviewDate:$("modalInterviewDate").value,interviewTime:$("modalInterviewTime").value,interviewLocation:$("modalInterviewLocation").value.trim(),interviewNotes:$("modalInterviewNotes").value.trim()};
    await S.updateApplicant(selectedApplicant);
    applicants=await S.getApplicants();renderApplicants();renderDashboard();$("applicantModal").classList.add("hidden");document.body.style.overflow="";
  }
  async function deleteSelectedApplicant(){
    if(!selectedApplicant||!confirm(`Delete application of ${selectedApplicant.fullName}?`))return;
    await S.deleteApplicant(selectedApplicant.id);applicants=await S.getApplicants();renderApplicants();renderDashboard();$("applicantModal").classList.add("hidden");document.body.style.overflow="";
  }

  async function saveSettingsForm(e){
    e.preventDefault();
    const file=$("settingLogo").files[0];
    let logo=settings.logo||"";
    if(file){ if(file.size>2*1024*1024){alert("Logo must be 2 MB or smaller.");return;} logo=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
    settings={companyName:$("settingCompanyName").value.trim(),logo,heroTitle:$("settingHeroTitle").value.trim(),heroSubtitle:$("settingHeroSubtitle").value.trim(),aboutTitle:$("settingAboutTitle").value.trim(),description:$("settingDescription").value.trim(),address:$("settingAddress").value.trim(),contact:$("settingContact").value.trim(),hrEmail:$("settingHrEmail").value.trim(),facebookLink:$("settingFacebookLink").value.trim()};
    await S.saveSettings(settings);applyBrand();$("settingsSaved").classList.remove("hidden");setTimeout(()=>$("settingsSaved").classList.add("hidden"),1800);
  }

  $("loginForm").addEventListener("submit",async e=>{
    e.preventDefault();
    if($("adminPin").value!==(S.CFG.ADMIN_PIN||"1234")){$("loginError").textContent="Incorrect admin PIN.";$("loginError").classList.remove("hidden");return;}
    sessionStorage.setItem("smx_admin","1");$("loginScreen").classList.add("hidden");$("adminApp").classList.remove("hidden");await loadAll();
  });
  $("logoutBtn").addEventListener("click",()=>{sessionStorage.removeItem("smx_admin");location.reload();});
  document.querySelectorAll(".nav-item").forEach(n=>n.addEventListener("click",()=>showView(n.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(n=>n.addEventListener("click",()=>showView(n.dataset.go)));
  $("addJobBtn").addEventListener("click",()=>openJobEditor());
  $("jobEditorForm").addEventListener("submit",saveJobForm);
  $("applicantSearch").addEventListener("input",renderApplicants);
  $("applicantStatusFilter").addEventListener("change",renderApplicants);
  $("settingsForm").addEventListener("submit",saveSettingsForm);
  document.addEventListener("click",async e=>{
    if(e.target.matches("[data-close-job-editor]"))closeJobEditor();
    if(e.target.matches("[data-close-applicant]")){$("applicantModal").classList.add("hidden");document.body.style.overflow="";}
    const ej=e.target.closest("[data-edit-job]"); if(ej)openJobEditor(ej.dataset.editJob);
    const dj=e.target.closest("[data-delete-job]"); if(dj&&confirm("Delete this job posting?")){await S.deleteJob(dj.dataset.deleteJob);jobs=await S.getJobs(true);renderJobsTable();renderDashboard();}
    const va=e.target.closest("[data-view-applicant]"); if(va)openApplicant(va.dataset.viewApplicant);
  });
  $("adminDate").textContent=new Intl.DateTimeFormat("en-PH",{dateStyle:"full"}).format(new Date());

  if(sessionStorage.getItem("smx_admin")==="1"){$("loginScreen").classList.add("hidden");$("adminApp").classList.remove("hidden");loadAll();}
})();
