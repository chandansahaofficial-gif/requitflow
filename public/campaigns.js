// Campaigns Logic

let campaigns = [];
let currentCampaignId = null;

async function loadCampaigns() {
  const token = sessionStorage.getItem('lr_auth_token') || 'temp';
  try {
    const res = await fetch('/api/campaigns', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      campaigns = data;
      renderCampaignsList();
    }
  } catch (error) {
    console.error('Failed to load campaigns:', error);
  }
}

function renderCampaignsList() {
  const list = document.getElementById('campaigns-list');
  const select = document.getElementById('addToCampaignSelect');
  if (!list) return;

  if (campaigns.length === 0) {
    list.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;text-align:center;padding:16px;">No campaigns yet.</div>';
    if(select) select.innerHTML = '<option value="">No campaigns available</option>';
    return;
  }

  list.innerHTML = '';
  if(select) select.innerHTML = '';

  campaigns.forEach(c => {
    // Select option
    if(select) {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
    }

    // List item
    const el = document.createElement('div');
    el.className = 'dash-card';
    el.style.padding = '12px';
    el.style.cursor = 'pointer';
    el.style.marginBottom = '8px';
    el.innerHTML = `
      <div style="font-weight:600;font-size:0.9rem;">${c.name}</div>
      <div style="font-size:0.75rem;color:var(--muted);margin-top:4px;">${c._count.leads} Leads</div>
    `;
    el.onclick = () => {
      document.querySelectorAll('#campaigns-list .dash-card').forEach(n => n.style.borderColor = 'var(--border)');
      el.style.borderColor = 'var(--accent)';
      loadCampaignDetails(c.id);
    };
    list.appendChild(el);
  });
}

function openCreateCampaignModal() {
  document.getElementById('createCampaignModal').classList.remove('hidden');
}

async function confirmCreateCampaign() {
  const name = document.getElementById('newCampaignName').value;
  const goal = document.getElementById('newCampaignGoal').value;
  if (!name) return alert('Campaign name is required');

  const token = sessionStorage.getItem('lr_auth_token') || 'temp';
  try {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name, goal })
    });
    if (res.ok) {
      document.getElementById('createCampaignModal').classList.add('hidden');
      document.getElementById('newCampaignName').value = '';
      document.getElementById('newCampaignGoal').value = '';
      showToast('✅ Campaign created!');
      loadCampaigns();
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch (e) {
    console.error(e);
  }
}

// Checkboxes for Adding to Campaign
function updateAddToCampaignBtn() {
  const btn = document.getElementById('addToCampaignBtn');
  const checked = document.querySelectorAll('.lead-cb:checked');
  if (checked.length > 0) {
    btn.style.display = 'inline-block';
    btn.textContent = `Add ${checked.length} to Campaign`;
  } else {
    btn.style.display = 'none';
  }
}

function openAddToCampaignModal() {
  const checked = document.querySelectorAll('.lead-cb:checked');
  if (checked.length === 0) return;
  document.getElementById('addCampaignCount').textContent = checked.length;
  document.getElementById('addToCampaignModal').classList.remove('hidden');
  loadCampaigns(); // Ensure campaigns are loaded in the select
}

async function confirmAddToCampaign() {
  const campaignId = document.getElementById('addToCampaignSelect').value;
  if (!campaignId) return alert('Select a campaign first');

  const checked = document.querySelectorAll('.lead-cb:checked');
  const leadIds = Array.from(checked).map(cb => cb.dataset.id);

  const token = sessionStorage.getItem('lr_auth_token') || 'temp';
  try {
    const res = await fetch(`/api/campaigns/${campaignId}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ leadIds })
    });
    if (res.ok) {
      document.getElementById('addToCampaignModal').classList.add('hidden');
      showToast(`✅ Added ${leadIds.length} leads to campaign and started AI generation.`);
      // Uncheck
      checked.forEach(cb => cb.checked = false);
      updateAddToCampaignBtn();
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadCampaignDetails(id) {
  currentCampaignId = id;
  const area = document.getElementById('campaign-details-area');
  area.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">Loading details...</div>';

  const token = sessionStorage.getItem('lr_auth_token') || 'temp';
  try {
    const res = await fetch(`/api/campaigns/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-size:1.1rem;font-weight:700;">${data.name}</div>
        <button class="btn btn-outline" onclick="loadCampaignDetails('${id}')">Refresh</button>
      </div>
      <table class="leads-table">
        <thead>
          <tr>
            <th>Lead Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    if (data.leads.length === 0) {
      html += `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted);">No leads in this campaign yet.</td></tr>`;
    } else {
      data.leads.forEach(cl => {
        const hasEmail = cl.generatedBody ? true : false;
        html += `
          <tr>
            <td>${cl.lead.name}</td>
            <td>${cl.lead.email || '-'}</td>
            <td>
              <span class="status-pill ${cl.status === 'sent' ? 'bg-green' : ''}">${cl.status}</span>
            </td>
            <td>
              <button class="tag" onclick='previewEmail(${JSON.stringify(cl).replace(/'/g, "&apos;")})'>Preview</button>
              ${cl.status !== 'sent' ? `<button class="tag bg-blue" onclick="sendCampaignEmail('${cl.id}')">Send</button>` : ''}
            </td>
          </tr>
        `;
      });
    }

    html += `</tbody></table>`;
    area.innerHTML = html;

  } catch (e) {
    console.error(e);
    area.innerHTML = `<div style="text-align:center;padding:40px;color:#f87171;">Error loading details</div>`;
  }
}

function previewEmail(campaignLead) {
  if (!campaignLead.generatedSubject && !campaignLead.generatedBody) {
    return alert('Email has not been generated yet. Please wait a moment and refresh.');
  }
  document.getElementById('previewSubject').value = campaignLead.generatedSubject || '';
  document.getElementById('previewBody').value = campaignLead.generatedBody || '';
  document.getElementById('emailPreviewModal').classList.remove('hidden');

  document.getElementById('saveEmailBtn').onclick = async () => {
    const sub = document.getElementById('previewSubject').value;
    const bod = document.getElementById('previewBody').value;
    const token = sessionStorage.getItem('lr_auth_token') || 'temp';
    
    const res = await fetch(`/api/campaigns/${currentCampaignId}/leads/${campaignLead.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ generatedSubject: sub, generatedBody: bod })
    });
    if (res.ok) {
      document.getElementById('emailPreviewModal').classList.add('hidden');
      showToast('✅ Saved changes');
      loadCampaignDetails(currentCampaignId);
    }
  };
}

async function sendCampaignEmail(campaignLeadId) {
  const token = sessionStorage.getItem('lr_auth_token') || 'temp';
  try {
    const res = await fetch(`/api/campaigns/${currentCampaignId}/leads/${campaignLeadId}/send`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('⏳ Queued for sending...');
      loadCampaignDetails(currentCampaignId);
    } else {
      const data = await res.json();
      alert('Error: ' + data.error);
    }
  } catch (e) {
    console.error(e);
  }
}

// Hook into navigation
const originalShowSection = window.showSection;
window.showSection = function(id) {
  if(originalShowSection) originalShowSection(id);
  else {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const sec = document.getElementById(id);
    if(sec) sec.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const btnId = 'nav-' + id.replace('-section', '');
    const btn = document.getElementById(btnId);
    if(btn) btn.classList.add('active');
  }

  if (id === 'campaigns-section') {
    loadCampaigns();
  }
};

// Bind checkbox changes in Leads Table
document.addEventListener('change', (e) => {
  if (e.target.classList.contains('lead-cb')) {
    updateAddToCampaignBtn();
  }
});
