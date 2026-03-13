/* ============================================================
   KGR PROPERTIES – Admin Dashboard Logic (Supabase Edition)
   All property operations are async and use Supabase storage.
   Falls back to localStorage when Supabase is not configured.
   ============================================================ */

// ===== GUARD =====
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAdminAuth()) return;
  initDashboard();
});

// ===== INIT =====
async function initDashboard() {
  // Set admin info
  const info = getAdminInfo();
  const initials = info.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  setText('admin-name', info.name);
  setText('admin-role', formatRole(info.role));
  setText('admin-avatar', initials);
  setText('topbar-avatar', initials);
  setText('topbar-admin-name', info.name);
  setText('welcome-name', info.name);

  // Live clock
  updateClock();
  setInterval(updateClock, 1000);

  // Show Supabase banner if not configured
  showSupabaseBanner();

  // If configured, test connection
  if (SUPABASE_CONFIGURED) {
    const conn = await testSupabaseConnection();
    if (!conn.ok) {
      showToast('error', `Supabase error: ${conn.reason}`);
    } else {
      showToast('success', 'Connected to Supabase ✓');
    }
  }

  // Load initial data
  await loadDashboard();

  // File drag-and-drop
  setupDragDrop('photo-drop', 'ap-photo', 'photo-preview', 'photo-preview-img');
  setupDragDrop('map-drop',   'ap-layout', 'layout-preview', 'layout-preview-img');
  setupDragDrop('edit-photo-drop', 'edit-photo', 'edit-photo-preview', 'edit-photo-preview-img');
}

function formatRole(r) {
  return ({ superadmin: 'Super Admin', manager: 'Property Manager', admin: 'Admin' })[r] || r;
}
function updateClock() {
  const el = document.getElementById('topbar-time');
  if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ===== SIDEBAR / PANEL NAV =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}

async function showPanel(panelId, navEl) {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  const panel = document.getElementById('panel-' + panelId);
  if (panel) panel.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');

  const labels = {
    dashboard: 'Dashboard', 'add-property': 'Add Property',
    'all-properties': 'All Properties', 'manage-locations': 'Manage Locations',
    'upload-images': 'Image Library',
  };
  setText('panel-breadcrumb', labels[panelId] || panelId);

  if (panelId === 'dashboard')        await loadDashboard();
  if (panelId === 'all-properties')   await loadAllPropertiesTable();
  if (panelId === 'manage-locations') await loadManageLocations();
  if (panelId === 'upload-images')    await loadImageLibrary();

  if (window.innerWidth <= 1024) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
  }
  window.scrollTo(0, 0);
}

// ===== LOAD DASHBOARD =====
async function loadDashboard() {
  setLoading('recent-table-body', 6, 'Loading properties...');
  const props = await fetchProperties();
  const featured = props.filter(p => p.featured).length;
  setText('stat-total', props.length);
  setText('stat-featured', featured);
  setText('prop-count-badge', props.length);
  renderRecentTable(props.slice(0, 10));
  renderLocationBreakdown(props);
}

function renderRecentTable(props) {
  const tbody = document.getElementById('recent-table-body');
  if (!tbody) return;
  if (!props.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">No properties yet. <a href="#" onclick="showPanel('add-property',null)">Add one now →</a></td></tr>`;
    return;
  }
  tbody.innerHTML = props.map(p => `
    <tr>
      <td>
        <div style="font-weight:600;font-size:13px;">${escHtml(p.title)}</div>
        <div style="font-size:12px;color:#9ca3af;">${p.area}</div>
      </td>
      <td><span class="type-badge ${badgeClass(p.type)}">${p.type}</span></td>
      <td><i class="fa fa-map-marker-alt" style="color:var(--gold);margin-right:4px;font-size:11px;"></i>${locLabel(p.location)}</td>
      <td style="font-weight:700;color:var(--gold-dark);">${p.price}</td>
      <td><span class="featured-dot ${p.featured ? 'dot-yes' : 'dot-no'}"></span>${p.featured ? 'Yes' : 'No'}</td>
      <td><div class="action-btns">
        <button class="btn-icon btn-edit"   onclick="openEditModal(${p.id})"   title="Edit"><i class="fa fa-edit"></i></button>
        <button class="btn-icon btn-delete" onclick="openDeleteModal(${p.id},'${escHtml(p.title)}')" title="Delete"><i class="fa fa-trash"></i></button>
        <button class="btn-icon btn-view"   onclick="window.open('location-detail.html?loc=${p.location}','_blank')" title="View"><i class="fa fa-eye"></i></button>
      </div></td>
    </tr>`).join('');
}

function renderLocationBreakdown(props) {
  const locs = ['tirupati','srikalahasti','venkatagiri','renigunta','chandragiri','yerpedu'];
  const maxCount = Math.max(...locs.map(l => props.filter(p => p.location === l).length), 1);
  const el = document.getElementById('location-breakdown');
  if (!el) return;
  el.innerHTML = locs.map(loc => {
    const count = props.filter(p => p.location === loc).length;
    const pct   = Math.round((count / maxCount) * 100);
    return `<div class="loc-breakdown-card">
      <div class="loc-bc-name">${locLabel(loc)}</div>
      <div class="loc-bc-count">${count}</div>
      <div class="loc-bc-label">Properties</div>
      <div class="loc-bc-bar"><div class="loc-bc-fill" style="width:${pct}%"></div></div>
      <div class="loc-bc-btn" onclick="window.open('location-detail.html?loc=${loc}','_blank')">
        View page <i class="fa fa-arrow-right"></i>
      </div>
    </div>`;
  }).join('');
}

// ===== ALL PROPERTIES TABLE =====
async function loadAllPropertiesTable() {
  setLoading('all-props-body', 9, 'Loading...');
  const props = await fetchProperties();
  renderAllPropsTable(props);
}

function renderAllPropsTable(props) {
  const tbody = document.getElementById('all-props-body');
  if (!tbody) return;
  if (!props.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-cell">No properties found.</td></tr>`;
    return;
  }
  tbody.innerHTML = props.map((p, i) => `
    <tr>
      <td style="color:#9ca3af;">${i + 1}</td>
      <td>
        <img src="${escHtml(p.image || '')}" class="prop-thumb" alt=""
          onerror="this.src='images/tirupati_hero_1773396591802.png'" />
      </td>
      <td>
        <div style="font-weight:600;font-size:13px;max-width:200px;">${escHtml(p.title)}</div>
        <div style="font-size:11px;color:#9ca3af;">${p.area}</div>
      </td>
      <td><span class="type-badge ${badgeClass(p.type)}">${p.type}</span></td>
      <td>${locLabel(p.location)}</td>
      <td>${p.area}</td>
      <td style="font-weight:700;color:var(--gold-dark);white-space:nowrap;">${p.price}</td>
      <td>
        <span class="featured-dot ${p.featured ? 'dot-yes' : 'dot-no'}"></span>
        ${p.featured
          ? '<span style="color:#059669;font-size:12px;font-weight:600;">Featured</span>'
          : '<span style="color:#9ca3af;font-size:12px;">—</span>'}
      </td>
      <td><div class="action-btns">
        <button class="btn-icon btn-edit"   onclick="openEditModal(${p.id})"   title="Edit"><i class="fa fa-edit"></i></button>
        <button class="btn-icon btn-delete" onclick="openDeleteModal(${p.id},'${escHtml(p.title)}')" title="Delete"><i class="fa fa-trash"></i></button>
        <button class="btn-icon btn-view"   onclick="window.open('location-detail.html?loc=${p.location}','_blank')" title="View"><i class="fa fa-eye"></i></button>
      </div></td>
    </tr>`).join('');
}

// Search/filter (re-fetch with filters for Supabase, or client-side for fallback)
async function filterPropertiesTable() {
  const search = (document.getElementById('props-search')?.value || '').toLowerCase();
  const loc    = document.getElementById('props-filter-loc')?.value || '';
  const type   = document.getElementById('props-filter-type')?.value || '';

  let props = await fetchProperties({ location: loc || undefined, type: type || undefined });
  if (search) props = props.filter(p =>
    p.title.toLowerCase().includes(search) ||
    (p.description || '').toLowerCase().includes(search) ||
    locLabel(p.location).toLowerCase().includes(search)
  );
  renderAllPropsTable(props);
}

// ===== MANAGE LOCATIONS =====
const LOC_INFO = {
  tirupati:    { name:'Tirupati',     img:'images/tirupati_city_1773396609510.png',  desc:'Spiritual capital of AP with excellent real estate growth.' },
  srikalahasti:{ name:'Srikalahasti', img:'images/srikalahasti_img_1773396631491.png', desc:'Historic temple town 36km from Tirupati.' },
  venkatagiri: { name:'Venkatagiri',  img:'images/venkatagiri_img_1773396647069.png', desc:'Silk town with emerging residential developments.' },
  renigunta:   { name:'Renigunta',    img:'images/renigunta_img_1773396663155.png',   desc:'Airport town with high commercial value.' },
  chandragiri: { name:'Chandragiri',  img:'images/chandragiri_img_1773396680370.png', desc:'Historic fort town near Tirupati.' },
  yerpedu:     { name:'Yerpedu',      img:'images/yerpedu_img_1773396696716.png',     desc:'Emerging suburb on Tirupati–Chennai highway.' },
};

async function loadManageLocations() {
  const props = await fetchProperties();
  const locs  = Object.keys(LOC_INFO);

  // Cards
  const grid = document.getElementById('loc-admin-grid');
  if (grid) {
    grid.innerHTML = locs.map(loc => {
      const info  = LOC_INFO[loc];
      const count = props.filter(p => p.location === loc).length;
      return `<div class="loc-admin-card">
        <div class="loc-admin-img"><img src="${info.img}" alt="${info.name}"/></div>
        <div class="loc-admin-body">
          <h3>${info.name} <span style="font-size:13px;color:var(--gold-dark);font-weight:800;">(${count})</span></h3>
          <p>${info.desc}</p>
          <div class="loc-admin-actions">
            <div class="btn-loc-view" onclick="window.open('location-detail.html?loc=${loc}','_blank')"><i class="fa fa-eye"></i> View Page</div>
            <div class="btn-loc-view" onclick="filterAndViewProps('${loc}')"><i class="fa fa-list"></i> Manage Props</div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // Stats table
  const tbody = document.getElementById('loc-stats-body');
  if (tbody) {
    tbody.innerHTML = locs.map(loc => {
      const info     = LOC_INFO[loc];
      const locProps = props.filter(p => p.location === loc);
      const counts   = { Land:0, House:0, Building:0, Commercial:0 };
      locProps.forEach(p => { if (counts[p.type] !== undefined) counts[p.type]++; });
      return `<tr>
        <td style="font-weight:700;">${info.name}</td>
        <td><strong>${locProps.length}</strong></td>
        <td>${counts.Land}</td><td>${counts.House}</td>
        <td>${counts.Building}</td><td>${counts.Commercial}</td>
        <td><div class="action-btns">
          <button class="btn-icon btn-view"  onclick="window.open('location-detail.html?loc=${loc}','_blank')" title="View"><i class="fa fa-eye"></i></button>
          <button class="btn-icon btn-edit"  onclick="addPropertyAtLoc('${loc}')" title="Add property"><i class="fa fa-plus"></i></button>
        </div></td>
      </tr>`;
    }).join('');
  }
}

async function filterAndViewProps(loc) {
  await showPanel('all-properties', document.querySelector('[data-panel=all-properties]'));
  const sel = document.getElementById('props-filter-loc');
  if (sel) { sel.value = loc; await filterPropertiesTable(); }
}

function addPropertyAtLoc(loc) {
  showPanel('add-property', document.querySelector('[data-panel=add-property]'));
  setTimeout(() => {
    const sel = document.getElementById('ap-location');
    if (sel) sel.value = loc;
  }, 100);
}

// ===== IMAGE LIBRARY =====
async function loadImageLibrary() {
  const existingGrid = document.getElementById('lib-existing-grid');
  if (!existingGrid) return;

  existingGrid.innerHTML = '<p style="color:var(--gray);font-size:14px;"><i class="fa fa-spinner fa-spin"></i> Loading images...</p>';

  if (SUPABASE_CONFIGURED) {
    // Load from Supabase Storage
    const [propFiles, layoutFiles] = await Promise.all([
      listStorageFiles(BUCKET_PROPERTIES),
      listStorageFiles(BUCKET_LAYOUTS),
    ]);
    const allFiles = [...propFiles, ...layoutFiles].filter(f => f.url);

    if (!allFiles.length) {
      existingGrid.innerHTML = '<p style="color:var(--gray);font-size:14px;">No images uploaded yet. Use the form above to upload images.</p>';
      return;
    }
    existingGrid.innerHTML = allFiles.map(f => `
      <div class="lib-img-card">
        <img src="${escHtml(f.url)}" alt="${escHtml(f.name)}"
          onerror="this.parentElement.style.display='none'"/>
        <div class="lib-img-overlay">
          <button class="btn-icon btn-view" style="background:rgba(255,255,255,0.9)"
            onclick="window.open('${escHtml(f.url)}','_blank')" title="View"><i class="fa fa-expand"></i></button>
        </div>
        <div class="lib-img-label">${escHtml(f.name)}</div>
      </div>`).join('');
  } else {
    // Fallback: show images from localStorage properties
    const props = await fetchProperties();
    const images = [...new Set(props.map(p => p.image))].filter(Boolean);
    if (!images.length) {
      existingGrid.innerHTML = '<p style="color:var(--gray);font-size:14px;">No property images uploaded yet. <em>Connect Supabase for full image library.</em></p>';
      return;
    }
    existingGrid.innerHTML = images.map((img, i) => `
      <div class="lib-img-card">
        <img src="${escHtml(img)}" alt="Property ${i+1}" onerror="this.parentElement.style.display='none'"/>
        <div class="lib-img-label">Property Image ${i+1}</div>
      </div>`).join('');
  }
}

function handleLibraryUpload(input) {
  const previewGrid = document.getElementById('lib-preview-grid');
  if (!previewGrid) return;
  [...input.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const card = document.createElement('div');
      card.className = 'lib-img-card';
      card.innerHTML = `<img src="${e.target.result}" alt="${file.name}"/>
        <div class="lib-img-label">${file.name}</div>`;
      previewGrid.appendChild(card);
    };
    reader.readAsDataURL(file);
  });
  showToast('success', `${input.files.length} image(s) ready. They will be saved when you add a property.`);
}

// ===== ADD PROPERTY FORM =====
let _newPhotoFile   = null;
let _newLayoutFile  = null;
let _lastAddedPropId = null;

function onPhotoFileChange(input) {
  _newPhotoFile = input.files[0] || null;
  handleFilePreview(input, 'photo-preview', 'photo-preview-img', 'photo-drop');
}
function onLayoutFileChange(input) {
  _newLayoutFile = input.files[0] || null;
  handleFilePreview(input, 'layout-preview', 'layout-preview-img', 'map-drop');
}

async function submitAddProperty(e) {
  e.preventDefault();
  const title       = getVal('ap-title');
  const type        = getVal('ap-type');
  const location    = getVal('ap-location');
  const area        = getVal('ap-area');
  const price       = getVal('ap-price');
  const priceNum    = parseFloat(document.getElementById('ap-price-num').value) || 0;
  const description = getVal('ap-description');
  const contact     = getVal('ap-contact');
  const mapLink     = getVal('ap-map');
  const featured    = document.getElementById('ap-featured').checked;

  if (!title || !type || !location || !area || !price || !description || !contact) {
    showToast('error', 'Please fill all required fields.'); return;
  }

  const btn = document.getElementById('ap-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Uploading & Publishing...';

  try {
    const newProp = await insertProperty(
      { title, type, location, area, price, priceNum, description, contact, mapLink, featured,
        image: getDefaultImage(type) },
      _newPhotoFile,
      _newLayoutFile
    );
    _lastAddedPropId = newProp.id;
    setText('ap-success-loc', locLabel(location));
    document.getElementById('ap-success').classList.remove('hidden');
    document.getElementById('ap-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('success', `"${title}" published to ${locLabel(location)}!`);
    await refreshBadge();
    _newPhotoFile   = null;
    _newLayoutFile  = null;
  } catch (err) {
    showToast('error', 'Failed to save: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-upload"></i> Publish Property';
  }
}

function viewPublishedProp() {
  if (!_lastAddedPropId) return;
  fetchProperties().then(props => {
    const p = props.find(x => String(x.id) === String(_lastAddedPropId));
    if (p) window.open(`location-detail.html?loc=${p.location}`, '_blank');
  });
}

function resetAddForm() {
  document.getElementById('add-property-form').reset();
  document.getElementById('ap-success').classList.add('hidden');
  document.getElementById('photo-preview').style.display  = 'none';
  document.getElementById('layout-preview').style.display = 'none';
  _newPhotoFile = null; _newLayoutFile = null;
}

// ===== EDIT MODAL =====
let _editPhotoFile = null;
let _editPropId    = null;

async function openEditModal(id) {
  const props = await fetchProperties();
  const p = props.find(x => String(x.id) === String(id));
  if (!p) return;
  _editPropId    = id;
  _editPhotoFile = null;
  document.getElementById('edit-id').value           = id;
  document.getElementById('edit-title').value        = p.title;
  document.getElementById('edit-type').value         = p.type;
  document.getElementById('edit-location').value     = p.location;
  document.getElementById('edit-area').value         = p.area;
  document.getElementById('edit-price').value        = p.price;
  document.getElementById('edit-price-num').value    = p.priceNum;
  document.getElementById('edit-description').value  = p.description;
  document.getElementById('edit-contact').value      = p.contact;
  document.getElementById('edit-map').value          = p.mapLink || '';
  document.getElementById('edit-featured').checked   = !!p.featured;

  // Show current image
  const prevWrap = document.getElementById('edit-photo-preview');
  const prevImg  = document.getElementById('edit-photo-preview-img');
  if (p.image && prevImg) { prevImg.src = p.image; prevWrap.style.display = 'block'; }
  else if (prevWrap) prevWrap.style.display = 'none';

  document.getElementById('edit-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  document.body.style.overflow = '';
  _editPhotoFile = null;
}

function onEditPhotoChange(input) {
  _editPhotoFile = input.files[0] || null;
  handleFilePreview(input, 'edit-photo-preview', 'edit-photo-preview-img', 'edit-photo-drop');
}

async function submitEditProperty(e) {
  e.preventDefault();
  if (!_editPropId) return;
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';

  try {
    await updateProperty(
      _editPropId,
      {
        title:       getVal('edit-title'),
        type:        getVal('edit-type'),
        location:    getVal('edit-location'),
        area:        getVal('edit-area'),
        price:       getVal('edit-price'),
        priceNum:    parseFloat(document.getElementById('edit-price-num').value) || 0,
        description: getVal('edit-description'),
        contact:     getVal('edit-contact'),
        mapLink:     getVal('edit-map'),
        featured:    document.getElementById('edit-featured').checked,
      },
      _editPhotoFile
    );
    closeEditModal();
    showToast('success', 'Property updated successfully!');
    await loadDashboard();
    if (!document.getElementById('panel-all-properties').classList.contains('hidden')) {
      await loadAllPropertiesTable();
    }
  } catch (err) {
    showToast('error', 'Update failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-save"></i> Save Changes';
  }
}

// ===== DELETE MODAL =====
let _deleteTargetId    = null;
let _deleteTargetTitle = '';

function openDeleteModal(id, title) {
  _deleteTargetId    = id;
  _deleteTargetTitle = title;
  document.getElementById('delete-modal-msg').textContent = `"${title}" will be permanently removed.`;
  document.getElementById('delete-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.add('hidden');
  document.body.style.overflow = '';
  _deleteTargetId = null;
}

async function confirmDelete() {
  if (!_deleteTargetId) return;
  const btn = document.getElementById('confirm-delete-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Deleting...';
  try {
    await deleteProperty(_deleteTargetId);
    closeDeleteModal();
    showToast('warning', `"${_deleteTargetTitle}" has been deleted.`);
    await loadDashboard();
    if (!document.getElementById('panel-all-properties').classList.contains('hidden')) {
      await loadAllPropertiesTable();
    }
    await refreshBadge();
  } catch (err) {
    showToast('error', 'Delete failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-trash"></i> Delete';
  }
}

// ===== FILE HANDLING =====
function handleFilePreview(input, previewId, imgId, dropId) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { showToast('error', 'File too large. Max 10MB allowed.'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const prev = document.getElementById(previewId);
    const img  = document.getElementById(imgId);
    if (img)  img.src = e.target.result;
    if (prev) prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearFile(inputId, previewId) {
  const inp = document.getElementById(inputId);
  if (inp) inp.value = '';
  const prev = document.getElementById(previewId);
  if (prev) prev.style.display = 'none';
  if (inputId === 'ap-photo')  _newPhotoFile  = null;
  if (inputId === 'ap-layout') _newLayoutFile = null;
}

function setupDragDrop(dropZoneId, inputId, previewId, imgId) {
  const zone = document.getElementById(dropZoneId);
  if (!zone) return;
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--gold)'; });
  zone.addEventListener('dragleave', ()  => { zone.style.borderColor = ''; });
  zone.addEventListener('drop', (e) => {
    e.preventDefault(); zone.style.borderColor = '';
    const input = document.getElementById(inputId);
    if (input && e.dataTransfer.files.length) {
      // Assign file and run preview handler
      const file  = e.dataTransfer.files[0];
      const dt    = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    }
  });
}

// ===== HELPERS =====
async function refreshBadge() {
  const props = await fetchProperties();
  setText('prop-count-badge', props.length);
  setText('stat-total', props.length);
  setText('stat-featured', props.filter(p => p.featured).length);
}

function setLoading(tbodyId, cols, msg = 'Loading...') {
  const el = document.getElementById(tbodyId);
  if (el) el.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;color:#9ca3af;padding:32px;"><i class="fa fa-spinner fa-spin" style="margin-right:8px;"></i>${msg}</td></tr>`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function getVal(id) {
  return (document.getElementById(id)?.value || '').trim();
}

function locLabel(loc) {
  return ({ tirupati:'Tirupati', srikalahasti:'Srikalahasti', venkatagiri:'Venkatagiri',
            renigunta:'Renigunta', chandragiri:'Chandragiri', yerpedu:'Yerpedu' })[loc] || loc;
}

function badgeClass(type) {
  return ({ Land:'badge-land', House:'badge-house', Building:'badge-building', Commercial:'badge-commercial' })[type] || 'badge-land';
}

function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'": '&#39;' }[c])
  );
}

function getDefaultImage(type) {
  return ({
    Land:       'images/property_land1_1773396717189.png',
    House:      'images/property_house1_1773396735129.png',
    Building:   'images/property_building1_1773396752928.png',
    Commercial: 'images/property_building1_1773396752928.png',
  })[type] || 'images/tirupati_hero_1773396591802.png';
}

// ===== TOAST NOTIFICATIONS =====
let _toastTimer;
function showToast(type, msg) {
  const toast   = document.getElementById('toast');
  const iconEl  = document.getElementById('toast-icon');
  const msgEl   = document.getElementById('toast-msg');
  if (!toast)   return;
  const icons   = { success:'fa-check-circle', error:'fa-exclamation-circle', warning:'fa-exclamation-triangle' };
  iconEl.className = `fa ${icons[type] || 'fa-info-circle'}`;
  msgEl.textContent = msg;
  toast.className   = `toast ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}
