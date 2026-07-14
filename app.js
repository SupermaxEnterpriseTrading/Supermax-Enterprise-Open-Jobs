(() => {
  const CFG = window.SUPERMAX_CONFIG || {};
  const LS = {
    settings: "smx_careers_settings",
    jobs: "smx_careers_jobs",
    applicants: "smx_careers_applicants"
  };

  const STATUSES = [
    "New Application","Under Review","Shortlisted","For Interview",
    "Interview Completed","Final Review","Hired","Not Selected"
  ];

  const PIPELINE = [
    "Application Received","Under Review","Shortlisted","For Interview",
    "Interview Completed","Final Review","Hired"
  ];

  const DEFAULT_SETTINGS = {
    companyName: "Supermax Enterprise Trading Corp.",
    logo: "",
    heroTitle: "Build your career with us.",
    heroSubtitle: "Join a growing team helping power businesses and communities through dependable solar products, logistics, and service.",
    aboutTitle: "Grow with a team that gets things done.",
    description: "Supermax Enterprise Trading Corp. supports the solar industry through product distribution, operations, training, and customer service. We value reliable people, continuous learning, and teamwork.",
    address: "25 F. Alarcon St., Maysan, Valenzuela City",
    contact: "09069484229",
    hrEmail: "",
    facebookLink: ""
  };

  const DEFAULT_JOBS = [
    {
      id:"job-picker", title:"Warehouse Picker", department:"Warehouse", location:"Maysan, Valenzuela City",
      type:"Full-time", salary:"", status:"active",
      description:"Prepare customer orders accurately and efficiently based on approved order documents. Work closely with warehouse and dispatch personnel to ensure items are ready for checking and release.",
      qualifications:["At least high school or senior high school graduate","Physically fit and able to handle warehouse tasks","Detail-oriented and able to follow picking instructions","Warehouse experience is an advantage"],
      responsibilities:["Prepare and pick solar products based on order documents","Verify model and quantity before turnover to checking","Maintain organized picking areas","Coordinate with warehouse and dispatch teams"]
    },
    {
      id:"job-checker", title:"Warehouse Checker", department:"Warehouse", location:"Maysan, Valenzuela City",
      type:"Full-time", salary:"", status:"active",
      description:"Check the model, item description, and quantity of products prepared for dispatch. Help prevent loading and delivery errors before release.",
      qualifications:["At least senior high school graduate","Strong attention to detail","Can compare documents with actual products accurately","Warehouse or dispatch experience is an advantage"],
      responsibilities:["Check picked items against sales or dispatch documents","Verify product model and quantity","Report discrepancies before loading","Coordinate with dispatch and delivery personnel"]
    },
    {
      id:"job-ree", title:"Registered Electrical Engineer (REE)", department:"Engineering", location:"Valenzuela City / Field Visits",
      type:"Full-time", salary:"", status:"active",
      description:"Support technical activities related to solar PV products and projects, including technical review, field visits, troubleshooting, and coordination.",
      qualifications:["Licensed Registered Electrical Engineer (REE)","Knowledge or experience in solar PV systems is an advantage","Strong technical and problem-solving skills","Willing to work on-site and conduct field visits when needed"],
      responsibilities:["Provide technical support for solar PV systems","Assist in technical evaluation and troubleshooting","Conduct field visits when required","Coordinate with internal teams and clients on technical concerns"]
    }
  ];

  const DEFAULT_APPLICANTS = [
    {
      id:"app-demo-1", trackingId:"SMX-2026-000101", jobId:"job-picker", jobTitle:"Warehouse Picker",
      fullName:"Juan Dela Cruz", email:"juan@example.com", mobile:"09171234567", address:"Valenzuela City",
      education:"Senior High School", experience:"2 years", expectedSalary:"", startDate:"",
      message:"I have warehouse picking and inventory experience.", resumeName:"Juan_Dela_Cruz_Resume.pdf", resumeUrl:"",
      status:"Under Review", appliedAt:"2026-07-13T09:15:00+08:00", hrNotes:"Has warehouse experience. For supervisor review.",
      interviewDate:"", interviewTime:"", interviewLocation:"", interviewNotes:""
    },
    {
      id:"app-demo-2", trackingId:"SMX-2026-000102", jobId:"job-checker", jobTitle:"Warehouse Checker",
      fullName:"Maria Santos", email:"maria@example.com", mobile:"09181234567", address:"Caloocan City",
      education:"College Undergraduate", experience:"1 year", expectedSalary:"", startDate:"",
      message:"Interested in the checker position.", resumeName:"Maria_Santos_CV.pdf", resumeUrl:"",
      status:"For Interview", appliedAt:"2026-07-14T08:30:00+08:00", hrNotes:"Good attention to detail based on initial screening.",
      interviewDate:"2026-07-20", interviewTime:"10:00", interviewLocation:"Supermax Enterprise Trading Corp., 25 F. Alarcon St., Maysan, Valenzuela City", interviewNotes:"Please bring one valid ID and a printed copy of your resume."
    }
  ];

  function seed() {
    if (!localStorage.getItem(LS.settings)) localStorage.setItem(LS.settings, JSON.stringify(DEFAULT_SETTINGS));
    if (!localStorage.getItem(LS.jobs)) localStorage.setItem(LS.jobs, JSON.stringify(DEFAULT_JOBS));
    if (!localStorage.getItem(LS.applicants)) localStorage.setItem(LS.applicants, JSON.stringify(DEFAULT_APPLICANTS));
  }

  function readLocal(key, fallback=[]) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function writeLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  async function api(action, payload={}) {
    if (!CFG.API_URL || CFG.DEMO_MODE) return null;
    const res = await fetch(CFG.API_URL, {
      method:"POST",
      body:JSON.stringify({action, ...payload})
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function getSettings() {
    const remote = await api("getSettings");
    return remote ? remote.settings : readLocal(LS.settings, DEFAULT_SETTINGS);
  }
  async function saveSettings(settings) {
    const remote = await api("saveSettings", {settings});
    if (!remote) writeLocal(LS.settings, settings);
    return settings;
  }
  async function getJobs(includeAll=false) {
    const remote = await api("getJobs", {includeAll});
    const jobs = remote ? remote.jobs : readLocal(LS.jobs, DEFAULT_JOBS);
    return includeAll ? jobs : jobs.filter(j => j.status === "active");
  }
  async function saveJob(job) {
    const remote = await api("saveJob", {job});
    if (remote) return remote.job;
    const jobs = readLocal(LS.jobs, []);
    const idx = jobs.findIndex(j => j.id === job.id);
    if (idx >= 0) jobs[idx] = job; else jobs.unshift(job);
    writeLocal(LS.jobs, jobs);
    return job;
  }
  async function deleteJob(id) {
    const remote = await api("deleteJob", {id});
    if (!remote) writeLocal(LS.jobs, readLocal(LS.jobs, []).filter(j => j.id !== id));
  }
  async function getApplicants() {
    const remote = await api("getApplicants");
    return remote ? remote.applicants : readLocal(LS.applicants, DEFAULT_APPLICANTS);
  }
  async function saveApplicant(applicant, resumeFile) {
    if (CFG.API_URL && !CFG.DEMO_MODE) {
      const resume = resumeFile ? await fileToPayload(resumeFile) : null;
      const remote = await api("submitApplication", {applicant, resume});
      return remote.applicant;
    }
    const applicants = readLocal(LS.applicants, []);
    applicants.unshift(applicant);
    writeLocal(LS.applicants, applicants);
    return applicant;
  }
  async function updateApplicant(applicant) {
    const remote = await api("updateApplicant", {applicant});
    if (remote) return remote.applicant;
    const applicants = readLocal(LS.applicants, []);
    const idx = applicants.findIndex(a => a.id === applicant.id);
    if (idx >= 0) applicants[idx] = applicant;
    writeLocal(LS.applicants, applicants);
    return applicant;
  }
  async function deleteApplicant(id) {
    const remote = await api("deleteApplicant", {id});
    if (!remote) writeLocal(LS.applicants, readLocal(LS.applicants, []).filter(a => a.id !== id));
  }
  async function trackApplication(trackingId) {
    const remote = await api("trackApplication", {trackingId});
    if (remote) return remote.applicant;
    return readLocal(LS.applicants, []).find(a => a.trackingId.toUpperCase() === trackingId.toUpperCase()) || null;
  }

  function fileToPayload(file) {
    return new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Unable to read resume file."));
      reader.onload = () => resolve({name:file.name,type:file.type,data:String(reader.result).split(",")[1]});
      reader.readAsDataURL(file);
    });
  }

  function makeId(prefix="id") { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
  function makeTrackingId(existing=[]) {
    const y = new Date().getFullYear();
    let n;
    do { n = Math.floor(100000 + Math.random()*900000); } while (existing.includes(`SMX-${y}-${n}`));
    return `SMX-${y}-${n}`;
  }
  function statusSlug(s="") { return s.toLowerCase().replace(/\s+/g,"-"); }
  function formatDate(v, withTime=false) {
    if (!v) return "—";
    const d = new Date(v);
    return new Intl.DateTimeFormat("en-PH", withTime ? {dateStyle:"medium",timeStyle:"short"} : {dateStyle:"medium"}).format(d);
  }
  function escapeHtml(value="") {
    return String(value).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  window.SMX = {
    CFG, LS, STATUSES, PIPELINE, seed, readLocal, writeLocal, api,
    getSettings, saveSettings, getJobs, saveJob, deleteJob, getApplicants,
    saveApplicant, updateApplicant, deleteApplicant, trackApplication,
    makeId, makeTrackingId, statusSlug, formatDate, escapeHtml
  };

  seed();

  if (!document.getElementById("jobsGrid")) return;

  let settings, jobs = [];

  const $ = id => document.getElementById(id);
  const modal = $("jobModal"), applyModal = $("applyModal");

  async function initPublic() {
    [settings, jobs] = await Promise.all([getSettings(), getJobs(false)]);
    applySettings();
    renderJobs();
    populateDepartments();
    renderHeroJobs();
    $("year").textContent = new Date().getFullYear();
  }

  function applySettings() {
    $("brandName").textContent = settings.companyName;
    $("footerCompanyName").textContent = settings.companyName;
    $("footerCompanyInline").textContent = settings.companyName;
    $("heroTitle").textContent = settings.heroTitle;
    $("heroSubtitle").textContent = settings.heroSubtitle;
    $("aboutTitle").textContent = settings.aboutTitle;
    $("companyDescription").textContent = settings.description;
    $("companyAddress").textContent = settings.address;
    $("companyContact").textContent = settings.contact;
    [$("brandLogo"), $("footerLogo")].forEach(img => img.src = settings.logo || "");
    const chat = $("messengerChatButton");
    if (chat && settings.facebookLink) {
      chat.href = settings.facebookLink;
      chat.classList.remove("hidden");
    } else if (chat) {
      chat.classList.add("hidden");
    }
  }

  function renderHeroJobs() {
    $("heroJobList").innerHTML = jobs.slice(0,3).map(j => `
      <div class="hero-job"><strong>${escapeHtml(j.title)}</strong><span>${escapeHtml(j.department)} · ${escapeHtml(j.location)}</span></div>
    `).join("") || `<div class="hero-job"><strong>No active openings</strong><span>Please check back soon.</span></div>`;
  }

  function populateDepartments() {
    const depts = [...new Set(jobs.map(j => j.department))].sort();
    $("jobDepartment").innerHTML = `<option value="">All departments</option>` + depts.map(d => `<option>${escapeHtml(d)}</option>`).join("");
  }

  function filteredJobs() {
    const q = $("jobSearch").value.trim().toLowerCase();
    const dept = $("jobDepartment").value;
    return jobs.filter(j => (!q || `${j.title} ${j.department} ${j.location}`.toLowerCase().includes(q)) && (!dept || j.department === dept));
  }

  function renderJobs() {
    const list = filteredJobs();
    $("jobsGrid").innerHTML = list.map(j => `
      <article class="job-card">
        <span class="job-badge">${escapeHtml(j.department)}</span>
        <h3>${escapeHtml(j.title)}</h3>
        <div class="job-meta"><span>⌖ ${escapeHtml(j.location)}</span><span>◷ ${escapeHtml(j.type)}</span></div>
        <p>${escapeHtml(j.description).slice(0,170)}${j.description.length>170?"…":""}</p>
        <div class="card-actions">
          <button class="outline-button" data-view-job="${j.id}">View Details</button>
          <button class="btn" data-apply-job="${j.id}">Apply Now</button>
        </div>
      </article>`).join("");
    $("jobsEmpty").classList.toggle("hidden", list.length !== 0);
  }

  function openJob(id) {
    const j = jobs.find(x => x.id === id); if (!j) return;
    $("jobModalContent").innerHTML = `
      <span class="eyebrow dark">${escapeHtml(j.department)}</span>
      <h2 id="jobModalTitle">${escapeHtml(j.title)}</h2>
      <div class="job-detail-meta">
        <span class="meta-chip">⌖ ${escapeHtml(j.location)}</span><span class="meta-chip">◷ ${escapeHtml(j.type)}</span>
        ${j.salary ? `<span class="meta-chip">₱ ${escapeHtml(j.salary)}</span>` : ""}
      </div>
      <div class="job-section"><h3>About the role</h3><p>${escapeHtml(j.description)}</p></div>
      <div class="job-section"><h3>Qualifications</h3><ul>${(j.qualifications||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
      ${(j.responsibilities||[]).length ? `<div class="job-section"><h3>Responsibilities</h3><ul>${j.responsibilities.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>` : ""}
      <button class="btn btn-full" data-apply-job="${j.id}">Apply for this position</button>`;
    modal.classList.remove("hidden"); document.body.style.overflow="hidden";
  }

  function openApply(id) {
    const j = jobs.find(x => x.id === id); if (!j) return;
    modal.classList.add("hidden");
    $("applyJobId").value = j.id; $("applyJobName").textContent = j.title;
    applyModal.classList.remove("hidden"); document.body.style.overflow="hidden";
  }
  function closeModals() { [modal,applyModal].forEach(m=>m.classList.add("hidden")); document.body.style.overflow=""; }

  async function submitApplication(e) {
    e.preventDefault();
    const error = $("applicationError"); error.classList.add("hidden");
    const file = $("resume").files[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { error.textContent="Resume must be 5 MB or smaller."; error.classList.remove("hidden"); return; }

    const button = $("submitApplicationBtn"); button.disabled=true; button.textContent="Submitting...";
    try {
      const all = await getApplicants();
      const job = jobs.find(j=>j.id===$("applyJobId").value);
      const applicant = {
        id:makeId("app"), trackingId:makeTrackingId(all.map(a=>a.trackingId)), jobId:job.id, jobTitle:job.title,
        fullName:$("fullName").value.trim(), email:$("email").value.trim(), mobile:$("mobile").value.trim(),
        address:$("address").value.trim(), education:$("education").value, experience:$("experience").value.trim(),
        expectedSalary:$("expectedSalary").value.trim(), startDate:$("startDate").value, message:$("message").value.trim(),
        resumeName:file.name, resumeUrl:"", status:"New Application", appliedAt:new Date().toISOString(),
        hrNotes:"", interviewDate:"", interviewTime:"", interviewLocation:"", interviewNotes:""
      };
      const saved = await saveApplicant(applicant, file);
      $("applicationForm").reset(); closeModals();
      $("successTrackingId").textContent = saved.trackingId;
      const emailNote = $("successEmailNote");
      if (emailNote) {
        if (CFG.API_URL && !CFG.DEMO_MODE) {
          emailNote.textContent = saved.emailNotificationSent
            ? "A confirmation email has also been sent to your email address."
            : "Your application is saved. Email delivery was not confirmed, so please keep your tracking ID.";
        } else {
          emailNote.textContent = "Demo mode: email sending is disabled until the Google Apps Script backend is connected.";
        }
      }
      $("successModal").classList.remove("hidden"); document.body.style.overflow="hidden";
    } catch(err) {
      error.textContent = err.message || "Unable to submit application. Please try again."; error.classList.remove("hidden");
    } finally { button.disabled=false; button.textContent="Submit Application"; }
  }

  function renderTracked(a) {
    if (!a) {
      $("trackResult").className="track-card";
      $("trackResult").innerHTML=`<div class="track-icon">!</div><h3>Application not found</h3><p>Please check your tracking ID and try again.</p>`;
      return;
    }
    const currentStatus = a.status === "New Application" ? "Application Received" : a.status;
    let currentIndex = PIPELINE.indexOf(currentStatus);
    if (a.status === "Not Selected") currentIndex = Math.max(1, PIPELINE.indexOf("Under Review"));
    $("trackResult").className="track-card";
    $("trackResult").innerHTML=`
      <div class="status-head">
        <div><span class="eyebrow dark">${escapeHtml(a.trackingId)}</span><h3>${escapeHtml(a.jobTitle)}</h3><p class="status-meta">Application submitted ${formatDate(a.appliedAt)}</p></div>
        <span class="status-pill">${escapeHtml(a.status)}</span>
      </div>
      ${a.status==="Not Selected" ? `<div class="interview-box"><h4>Application Update</h4><p>Thank you for your interest in joining ${escapeHtml(settings.companyName)}. After careful consideration, we have decided to move forward with other candidates for this position.</p></div>` : `
      <div class="timeline">${PIPELINE.map((s,i)=>{
        const cls = i<currentIndex?"done":i===currentIndex?"current":"";
        return `<div class="timeline-item ${cls}"><div class="timeline-dot">${i<=currentIndex?"✓":i+1}</div><div class="timeline-content"><strong>${s}</strong><p>${i===currentIndex?"Current application status":i<currentIndex?"Completed":"Pending"}</p></div></div>`;
      }).join("")}</div>`}
      ${a.status==="For Interview" && a.interviewDate ? `<div class="interview-box"><h4>Interview Schedule</h4><p><strong>Date:</strong> ${formatDate(a.interviewDate+"T00:00:00")}</p><p><strong>Time:</strong> ${escapeHtml(a.interviewTime||"To be confirmed")}</p><p><strong>Location:</strong> ${escapeHtml(a.interviewLocation||settings.address)}</p>${a.interviewNotes?`<p><strong>Note:</strong> ${escapeHtml(a.interviewNotes)}</p>`:""}</div>`:""}`;
  }

  $("jobSearch").addEventListener("input",renderJobs);
  $("jobDepartment").addEventListener("change",renderJobs);
  document.addEventListener("click",e=>{
    const v=e.target.closest("[data-view-job]"), a=e.target.closest("[data-apply-job]");
    if(v) openJob(v.dataset.viewJob); if(a) openApply(a.dataset.applyJob);
    if(e.target.matches("[data-close-modal],[data-close-apply]")) closeModals();
  });
  $("applicationForm").addEventListener("submit",submitApplication);
  $("trackBtn").addEventListener("click",async()=>{
    const id=$("trackingIdInput").value.trim(); if(!id)return;
    $("trackResult").innerHTML="<p>Checking application...</p>";
    try{renderTracked(await trackApplication(id));}catch(err){renderTracked(null);}
  });
  $("trackingIdInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("trackBtn").click();});
  $("copyTrackingBtn").addEventListener("click",async()=>{await navigator.clipboard.writeText($("successTrackingId").textContent);$("copyTrackingBtn").textContent="Copied!";setTimeout(()=>$("copyTrackingBtn").textContent="Copy Tracking ID",1200);});
  $("closeSuccessBtn").addEventListener("click",()=>{$("successModal").classList.add("hidden");document.body.style.overflow="";location.hash="#track";$("trackingIdInput").value=$("successTrackingId").textContent;});
  initPublic().catch(console.error);
})();
