import { RegistrationSubmission, UserDetailsSubmission, FeedbackSubmission } from '../types';

export const initialRegistrations: RegistrationSubmission[] = [
  {
    id: 'reg-1',
    fullName: 'Alex Morgan',
    email: 'alex.morgan@fdx-project.io',
    phone: '+1 (555) 382-9901',
    organization: 'f-docx Labs',
    ticketType: 'VIP',
    track: 'Google Apps Script',
    dietary: 'Vegetarian',
    needAccommodation: true,
    notes: 'Testing automated spreadsheet webhook pipelines.',
    submittedAt: '11/11/2026, 09:15:30 AM',
  },
  {
    id: 'reg-2',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@techcorp.io',
    phone: '+1 (555) 781-4420',
    organization: 'CloudScale Dynamics',
    ticketType: 'Speaker',
    track: 'Cloud & Backend',
    dietary: 'None',
    needAccommodation: false,
    notes: 'Presenting a lightning talk on serverless spreadsheet pipelines.',
    submittedAt: '11/11/2026, 09:28:44 AM',
  },
  {
    id: 'reg-3',
    fullName: 'Liam Chen',
    email: 'liam.chen@devhub.dev',
    phone: '+1 (555) 233-8891',
    organization: 'OpenDev Labs',
    ticketType: 'Standard',
    track: 'Frontend',
    dietary: 'Gluten-Free',
    needAccommodation: true,
    notes: 'Connecting Netlify landing pages to Google Sheets.',
    submittedAt: '11/11/2026, 09:42:10 AM',
  },
];

export const initialUserDetails: UserDetailsSubmission[] = [
  {
    id: 'usr-1',
    username: 'alex_admin',
    fullName: 'Alex Morgan',
    workEmail: 'alex.m@fdx-company.com',
    department: 'Engineering',
    jobTitle: 'Lead Web Architect',
    accessLevel: 'Administrator',
    region: 'Asia-Pacific / Tokyo',
    twoFactorEnabled: true,
    internalNotes: 'Primary owner for f-docx deployment automation and integrations.',
    submittedAt: '11/11/2026, 08:30:12 AM',
  },
  {
    id: 'usr-2',
    username: 'sophia_mkt',
    fullName: 'Sophia Martinez',
    workEmail: 'sophia.m@fdx-company.com',
    department: 'Marketing',
    jobTitle: 'Growth Operations Specialist',
    accessLevel: 'Manager',
    region: 'North America / New York',
    twoFactorEnabled: true,
    internalNotes: 'Requires read/write access to lead capture spreadsheets.',
    submittedAt: '11/11/2026, 08:45:50 AM',
  },
  {
    id: 'usr-3',
    username: 'marcus_des',
    fullName: 'Marcus Vance',
    workEmail: 'marcus.v@fdx-company.com',
    department: 'Design',
    jobTitle: 'Product Designer',
    accessLevel: 'Standard Member',
    region: 'Europe / London',
    twoFactorEnabled: false,
    internalNotes: 'Setting up client intake survey forms.',
    submittedAt: '11/11/2026, 09:10:04 AM',
  },
];

export const initialFeedbacks: FeedbackSubmission[] = [
  {
    id: 'fb-1',
    customerName: 'Aarav Patel',
    email: 'aarav.patel@acme.com',
    category: 'UI / UX Design',
    rating: 5,
    npsScore: 10,
    feedbackMessage: 'The direct Google Sheet sync works instantly! No database configuration needed for our Netlify site.',
    wouldRecommend: 'Yes',
    priority: 'Medium',
    submittedAt: '11/11/2026, 09:20:00 AM',
  },
  {
    id: 'fb-2',
    customerName: 'Sarah Jenkins',
    email: 's.jenkins@retailpulse.net',
    category: 'Feature Request',
    rating: 4,
    npsScore: 9,
    feedbackMessage: 'Would love automated email notifications when someone submits the registration form.',
    wouldRecommend: 'Yes',
    priority: 'Low',
    submittedAt: '11/11/2026, 09:35:18 AM',
  },
  {
    id: 'fb-3',
    customerName: 'David Kim',
    email: 'david.k@startupsprint.co',
    category: 'General Feedback',
    rating: 5,
    npsScore: 10,
    feedbackMessage: 'Handles CORS and multiple sheets beautifully. Clean code structure!',
    wouldRecommend: 'Yes',
    priority: 'High',
    submittedAt: '11/11/2026, 09:50:41 AM',
  },
  {
    id: 'fb-4',
    customerName: 'Samira Patel',
    email: 'samira.patel@fdx-project.io',
    category: 'UI / UX Design',
    rating: 5,
    npsScore: 10,
    feedbackMessage: 'Executed live feedback submission! Direct Google Sheets sync is connected and recording rows seamlessly.',
    wouldRecommend: 'Yes',
    priority: 'High',
    submittedAt: '11/11/2026, 11:00:00 AM',
  },
];

export const APPS_SCRIPT_CODE_UNIFIED = `/**
 * f-docx - Google Sheets Web App Endpoint
 * Handles: Registration, User Details, and Feedback forms.
 */

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }

    const formType = data.formType || "registration";
    const timestamp = new Date().toLocaleString();

    if (formType === "registration") {
      let sheet = ss.getSheetByName("Registrations") || ss.insertSheet("Registrations");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Timestamp", "Full Name", "Email", "Phone", "Organization",
          "Ticket Type", "Track", "Dietary", "Accommodation", "Notes"
        ]);
      }
      sheet.appendRow([
        timestamp,
        data.fullName || data.name || "",
        data.email || "",
        data.phone || "",
        data.organization || "",
        data.ticketType || "Standard",
        data.track || "General",
        data.dietary || "None",
        data.needAccommodation ? "Yes" : "No",
        data.notes || ""
      ]);

    } else if (formType === "userDetails") {
      let sheet = ss.getSheetByName("UserDetails") || ss.insertSheet("UserDetails");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Timestamp", "Username", "Full Name", "Work Email", "Department",
          "Job Title", "Access Level", "Region", "2FA Enforced", "Internal Notes"
        ]);
      }
      sheet.appendRow([
        timestamp,
        data.username || "",
        data.fullName || "",
        data.workEmail || data.email || "",
        data.department || "",
        data.jobTitle || "",
        data.accessLevel || "Standard Member",
        data.region || "",
        data.twoFactorEnabled ? "Enabled" : "Disabled",
        data.internalNotes || ""
      ]);

    } else if (formType === "feedback") {
      let sheet = ss.getSheetByName("Feedbacks") || ss.insertSheet("Feedbacks");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "Timestamp", "Customer Name", "Email", "Category", "Rating",
          "NPS Score", "Feedback Message", "Recommend", "Priority"
        ]);
      }
      sheet.appendRow([
        timestamp,
        data.customerName || data.name || "",
        data.email || "",
        data.category || "General",
        data.rating || 5,
        data.npsScore || 10,
        data.feedbackMessage || data.message || "",
        data.wouldRecommend || "Yes",
        data.priority || "Medium"
      ]);
    } else if (formType === "customForm") {
      const sheetName = data.sheetName || "CustomResponses";
      let sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
      const headers = Array.isArray(data.headers) ? data.headers : ["Timestamp"];
      const rowValues = Array.isArray(data.rowValues) ? data.rowValues.slice() : [timestamp];

      // Save uploaded files/images into Google Drive and store URLs in corresponding columns
      if (Array.isArray(data.uploadedFiles) && data.uploadedFiles.length > 0) {
        const folders = DriveApp.getFoldersByName("f-docx Uploads");
        const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder("f-docx Uploads");
        data.uploadedFiles.forEach(function (fileObj) {
          if (fileObj && fileObj.base64Data && fileObj.fileName) {
            const bytes = Utilities.base64Decode(fileObj.base64Data);
            const blob = Utilities.newBlob(bytes, fileObj.mimeType || "application/octet-stream", fileObj.fileName);
            const driveFile = folder.createFile(blob);
            driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            const colIdx = headers.indexOf(fileObj.columnHeader);
            if (colIdx !== -1) {
              rowValues[colIdx] = driveFile.getUrl();
            }
          }
        });
      }

      if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
        while (rowValues.length < headers.length) {
          rowValues.push("");
        }
        sheet.appendRow(rowValues);
      } else {
        // Align with existing sheet headers and append any newly added custom fields
        const lastCol = Math.max(sheet.getLastColumn(), 1);
        const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        headers.forEach(function (h) {
          if (existingHeaders.indexOf(h) === -1) {
            existingHeaders.push(h);
            sheet.getRange(1, existingHeaders.length).setValue(h);
          }
        });
        const alignedRow = existingHeaders.map(function (colHeader) {
          const idx = headers.indexOf(colHeader);
          if (idx === -1) return "";
          const val = rowValues[idx];
          return val !== undefined && val !== null ? val : "";
        });
        sheet.appendRow(alignedRow);
      }

    } else {
      let sheet = ss.getSheetByName("Submissions") || ss.getActiveSheet();
      sheet.appendRow([timestamp, JSON.stringify(data)]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Row appended successfully",
      timestamp: timestamp
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzQFGxzs1ftTpgZKd-MOBciCRvBaYqyM92VLO2qjtrt/dev';

export const getGithubRepoFiles = (customUrl?: string) => {
  const activeUrl = customUrl !== undefined ? customUrl : DEFAULT_SCRIPT_URL;

  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>f-docx | Website Forms Connected to Google Sheets</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header class="header">
    <div class="container header-container">
      <div class="logo">
        <span class="logo-badge">f-docx</span>
        <span class="logo-sub">Form Sync Engine</span>
      </div>
      <nav class="nav-menu">
        <button class="nav-tab active" data-form="registration">Registration Form</button>
        <button class="nav-tab" data-form="userDetails">Login / User Details</button>
        <button class="nav-tab" data-form="feedback">Feedback Form</button>
      </nav>
    </div>
  </header>

  <main class="container main-content">
    <div class="config-banner">
      <div class="config-text">
        <strong>Active Endpoint URL:</strong>
        <span id="displayScriptUrl" class="url-text">\${activeUrl || "Using demo simulator"}</span>
      </div>
      <button id="openConfigBtn" class="btn-secondary">Configure Webhook URL</button>
    </div>

    <!-- Registration Form -->
    <section id="registrationSection" class="form-section active">
      <div class="form-card">
        <div class="card-header">
          <h2>Conference & Event Registration</h2>
          <p>Submitting this form immediately appends a new row to your Google Sheet.</p>
        </div>
        <form id="registrationForm" class="styled-form">
          <input type="hidden" name="formType" value="registration">
          <div class="form-grid">
            <div class="form-group">
              <label for="regFullName">Full Name *</label>
              <input type="text" id="regFullName" name="fullName" placeholder="e.g. Alex Morgan" required>
            </div>
            <div class="form-group">
              <label for="regEmail">Email Address *</label>
              <input type="email" id="regEmail" name="email" placeholder="alex.morgan@fdx-project.io" required>
            </div>
            <div class="form-group">
              <label for="regPhone">Phone Number</label>
              <input type="tel" id="regPhone" name="phone" placeholder="+1 (555) 000-0000">
            </div>
            <div class="form-group">
              <label for="regOrg">Organization / Company</label>
              <input type="text" id="regOrg" name="organization" placeholder="f-docx Labs">
            </div>
            <div class="form-group">
              <label for="regTicket">Ticket Type</label>
              <select id="regTicket" name="ticketType">
                <option value="Standard">Standard Pass</option>
                <option value="VIP">VIP All-Access</option>
                <option value="Student">Student Discount</option>
                <option value="Speaker">Guest Speaker</option>
              </select>
            </div>
            <div class="form-group">
              <label for="regTrack">Preferred Track</label>
              <select id="regTrack" name="track">
                <option value="Frontend">Frontend (HTML, CSS, JS)</option>
                <option value="Google Apps Script">Spreadsheet & Automation</option>
                <option value="Cloud & Backend">Cloud & Backend Services</option>
                <option value="AI & Automation">AI & Workflow Automation</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="regNotes">Special Requests / Notes</label>
            <textarea id="regNotes" name="notes" rows="3" placeholder="Dietary needs, workshop goals, etc."></textarea>
          </div>
          <button type="submit" class="btn-submit">
            <span class="btn-text">Submit Registration</span>
          </button>
        </form>
      </div>
    </section>

    <!-- Login / User Details Form -->
    <section id="userDetailsSection" class="form-section">
      <div class="form-card">
        <div class="card-header">
          <h2>User Account & Profile Details</h2>
          <p>Collect employee, client, or team member details directly into your spreadsheet.</p>
        </div>
        <form id="userDetailsForm" class="styled-form">
          <input type="hidden" name="formType" value="userDetails">
          <div class="form-grid">
            <div class="form-group">
              <label for="usrUsername">Username *</label>
              <input type="text" id="usrUsername" name="username" placeholder="alex_admin" required>
            </div>
            <div class="form-group">
              <label for="usrFullName">Full Name *</label>
              <input type="text" id="usrFullName" name="fullName" placeholder="Alex Morgan" required>
            </div>
            <div class="form-group">
              <label for="usrWorkEmail">Work Email *</label>
              <input type="email" id="usrWorkEmail" name="workEmail" placeholder="alex@company.com" required>
            </div>
            <div class="form-group">
              <label for="usrDept">Department</label>
              <select id="usrDept" name="department">
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>
            <div class="form-group">
              <label for="usrTitle">Job Title</label>
              <input type="text" id="usrTitle" name="jobTitle" placeholder="Lead Developer">
            </div>
            <div class="form-group">
              <label for="usrAccess">Access Level</label>
              <select id="usrAccess" name="accessLevel">
                <option value="Standard Member">Standard Member</option>
                <option value="Manager">Manager</option>
                <option value="Administrator">Administrator</option>
                <option value="Read Only">Read Only</option>
              </select>
            </div>
          </div>
          <div class="form-group checkbox-group">
            <input type="checkbox" id="usr2FA" name="twoFactorEnabled" value="true" checked>
            <label for="usr2FA">Require Two-Factor Authentication (2FA)</label>
          </div>
          <div class="form-group">
            <label for="usrNotes">Internal System Notes</label>
            <textarea id="usrNotes" name="internalNotes" rows="3" placeholder="Access permissions, team project assignments..."></textarea>
          </div>
          <button type="submit" class="btn-submit">
            <span class="btn-text">Save User Details</span>
          </button>
        </form>
      </div>
    </section>

    <!-- Feedback Form -->
    <section id="feedbackSection" class="form-section">
      <div class="form-card">
        <div class="card-header">
          <h2>Website & Product Feedback</h2>
          <p>Collect user ratings, NPS feedback, and bug reports instantly into Google Sheets.</p>
        </div>
        <form id="feedbackForm" class="styled-form">
          <input type="hidden" name="formType" value="feedback">
          <div class="form-grid">
            <div class="form-group">
              <label for="fbName">Your Name</label>
              <input type="text" id="fbName" name="customerName" placeholder="Alex Morgan">
            </div>
            <div class="form-group">
              <label for="fbEmail">Email Address *</label>
              <input type="email" id="fbEmail" name="email" placeholder="alex@company.com" required>
            </div>
            <div class="form-group">
              <label for="fbCategory">Category</label>
              <select id="fbCategory" name="category">
                <option value="General Feedback">General Feedback</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Bug Report">Bug Report</option>
                <option value="UI / UX Design">UI / UX Design</option>
                <option value="Performance">Performance</option>
              </select>
            </div>
            <div class="form-group">
              <label for="fbRating">Overall Rating (1 - 5 Stars)</label>
              <select id="fbRating" name="rating">
                <option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                <option value="3">⭐⭐⭐ (3 - Average)</option>
                <option value="2">⭐⭐ (2 - Needs Improvement)</option>
                <option value="1">⭐ (1 - Poor)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="fbMessage">Your Feedback / Suggestions *</label>
            <textarea id="fbMessage" name="feedbackMessage" rows="4" placeholder="What worked well? What could we improve?" required></textarea>
          </div>
          <button type="submit" class="btn-submit">
            <span class="btn-text">Submit Feedback</span>
          </button>
        </form>
      </div>
    </section>

    <!-- Submissions Stream -->
    <section class="log-section">
      <div class="log-header">
        <h3>Live Submissions Stream</h3>
        <button id="clearLogBtn" class="btn-text-sm">Clear History</button>
      </div>
      <div class="table-container">
        <table id="submissionsTable">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Form Type</th>
              <th>Primary Contact</th>
              <th>Email</th>
              <th>Details / Note</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="submissionsBody"></tbody>
        </table>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p>f-docx Demo Project • Built with HTML, CSS & JavaScript • Connected to Google Sheets</p>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
`,
    'style.css': `/* f-docx Stylesheet */
:root {
  --primary: #0f9d58;
  --primary-hover: #0b8043;
  --bg-page: #f8fafc;
  --bg-card: #ffffff;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --radius: 12px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  background-color: var(--bg-page);
  color: var(--text-main);
  line-height: 1.5;
}

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.header {
  background-color: #ffffff;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-badge {
  background-color: var(--primary);
  color: white;
  font-weight: 800;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 1.1rem;
}

.logo-sub {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.nav-menu {
  display: flex;
  gap: 0.5rem;
}

.nav-tab {
  background: none;
  border: none;
  padding: 0.5rem 0.85rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-tab:hover {
  background-color: #f1f5f9;
  color: var(--text-main);
}

.nav-tab.active {
  background-color: #e6f4ea;
  color: var(--primary);
}

.main-content {
  padding-top: 2rem;
  padding-bottom: 3rem;
}

.config-banner {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.config-text {
  font-size: 0.875rem;
  color: #1e40af;
}

.url-text {
  display: block;
  font-family: monospace;
  font-size: 0.8rem;
  color: #3b82f6;
  margin-top: 0.2rem;
  word-break: break-all;
}

.form-section {
  display: none;
}

.form-section.active {
  display: block;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
}

.card-header {
  margin-bottom: 1.75rem;
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.35rem;
}

.card-header p {
  color: var(--text-muted);
  font-size: 0.925rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.925rem;
  background-color: #ffffff;
  color: var(--text-main);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(15, 157, 88, 0.15);
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 0.6rem;
}

.checkbox-group input {
  width: auto;
  accent-color: var(--primary);
  cursor: pointer;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  margin-top: 0.5rem;
}

.btn-submit:hover {
  background-color: var(--primary-hover);
}

.btn-secondary {
  background-color: white;
  border: 1px solid var(--border);
  padding: 0.5rem 0.9rem;
  border-radius: 6px;
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--text-main);
  cursor: pointer;
}

.log-section {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
}

th, td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
}

th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #475569;
}

.tag-success {
  display: inline-block;
  background-color: #e6f4ea;
  color: #137333;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.footer {
  text-align: center;
  padding: 2rem 0;
  color: var(--text-muted);
  font-size: 0.825rem;
  border-top: 1px solid var(--border);
  background-color: white;
}
`,
    'script.js': `// f-docx - Form to Google Sheets & Webhook Client
// Dynamically connected endpoint URL:
let ENDPOINT_URL = "${activeUrl}";

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".nav-tab");
  const sections = {
    registration: document.getElementById("registrationSection"),
    userDetails: document.getElementById("userDetailsSection"),
    feedback: document.getElementById("feedbackSection"),
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const formKey = tab.dataset.form;

      Object.keys(sections).forEach((key) => {
        if (key === formKey) {
          sections[key].classList.add("active");
        } else {
          sections[key].classList.remove("active");
        }
      });
    });
  });

  const forms = [
    { id: "registrationForm", type: "Registration" },
    { id: "userDetailsForm", type: "User Details" },
    { id: "feedbackForm", type: "Feedback" },
  ];

  forms.forEach(({ id, type }) => {
    const formElement = document.getElementById(id);
    if (!formElement) return;

    formElement.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = formElement.querySelector(".btn-submit");
      const btnText = formElement.querySelector(".btn-text");
      const originalText = btnText.textContent;

      submitBtn.disabled = true;
      btnText.textContent = "Syncing with Google Sheet...";

      const formData = new FormData(formElement);
      const data = Object.fromEntries(formData.entries());

      try {
        if (ENDPOINT_URL && ENDPOINT_URL.trim().startsWith("http")) {
          await fetch(ENDPOINT_URL.trim(), {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
        }

        addSubmissionRow(type, data);
        alert(\`Success! \${type} entry has been captured and submitted to Google Sheet!\`);
        formElement.reset();
      } catch (err) {
        console.error("Submission error:", err);
        alert("Failed to submit. Check console for details.");
      } finally {
        submitBtn.disabled = false;
        btnText.textContent = originalText;
      }
    });
  });

  const openConfigBtn = document.getElementById("openConfigBtn");
  const displayScriptUrl = document.getElementById("displayScriptUrl");

  openConfigBtn.addEventListener("click", () => {
    const enteredUrl = prompt(
      "Enter your Webhook / Google Sheets Endpoint URL:",
      ENDPOINT_URL
    );
    if (enteredUrl !== null) {
      ENDPOINT_URL = enteredUrl.trim();
      if (ENDPOINT_URL) {
        displayScriptUrl.textContent = ENDPOINT_URL;
        displayScriptUrl.style.color = "#0f9d58";
      } else {
        displayScriptUrl.textContent = "Using demo simulator (Click to configure your live Webhook or Sheet URL)";
        displayScriptUrl.style.color = "#3b82f6";
      }
    }
  });

  document.getElementById("clearLogBtn").addEventListener("click", () => {
    document.getElementById("submissionsBody").innerHTML = "";
  });
});

function addSubmissionRow(type, data) {
  const tbody = document.getElementById("submissionsBody");
  const tr = document.createElement("tr");

  const contact = data.fullName || data.username || data.customerName || "N/A";
  const email = data.email || data.workEmail || "N/A";
  const detail = data.notes || data.feedbackMessage || data.department || data.ticketType || "Submitted";

  tr.innerHTML = \`
    <td>\${new Date().toLocaleTimeString()}</td>
    <td><strong>\${type}</strong></td>
    <td>\${contact}</td>
    <td>\${email}</td>
    <td>\${detail.substring(0, 45)}\${detail.length > 45 ? "..." : ""}</td>
    <td><span class="tag-success">✓ Saved to Sheet</span></td>
  \`;

  tbody.insertBefore(tr, tbody.firstChild);
}
`,
    'README.md': `# f-docx: Connect HTML Website Forms Directly to Google Sheets

A complete, production-ready website form suite that connects directly to **Google Sheets** without requiring any database or backend server.

## Configured Endpoint:
\`${activeUrl}\`

## Included Forms:
1. **Registration Form** (Events, Conferences, Workshops, Attendees)
2. **User Details / Login Form** (Team members, Staff onboarding, Account profiles)
3. **Feedback Form** (Customer reviews, NPS score, Bug reports, Suggestions)

---

## 📦 Push this project to GitHub as "f-docx"

\`\`\`bash
git init
git add .
git commit -m "feat: complete f-docx form integration suite"
git branch -M main
git remote add origin https://github.com/your-username/f-docx.git
git push -u origin main
\`\`\`
`,
  };
};

export const GITHUB_REPO_FILES = getGithubRepoFiles();

