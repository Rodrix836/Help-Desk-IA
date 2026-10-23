/* NeuraDesk AI: cliente web con Supabase Auth y PostgreSQL protegido por RLS. */
const config = window.NEURA_CONFIG || {};
let db = null;
let sessionUser = null;
let profile = null;
let tickets = [];

const els = {
  setup: document.getElementById('setupPanel'),
  auth: document.getElementById('authPanel'),
  app: document.getElementById('appContent'),
  notice: document.getElementById('notice'),
  currentUser: document.getElementById('currentUser'),
  signOut: document.getElementById('btnSignOut'),
  newTicket: document.getElementById('btnNewTicket'),
  authForm: document.getElementById('authForm'),
  authName: document.getElementById('authName'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  login: document.getElementById('btnLogin'),
  register: document.getElementById('btnRegister'),
  body: document.getElementById('ticketTableBody'),
  empty: document.getElementById('emptyState'),
  total: document.getElementById('totalTickets'),
  open: document.getElementById('openTickets'),
  progress: document.getElementById('progressTickets'),
  resolved: document.getElementById('resolvedTickets'),
  tableHelp: document.getElementById('tableHelp'),
  search: document.getElementById('searchInput'),
  statusFilter: document.getElementById('statusFilter'),
  priorityFilter: document.getElementById('priorityFilter'),
  dialog: document.getElementById('ticketDialog'),
  form: document.getElementById('ticketForm'),
  requester: document.getElementById('requester'),
  email: document.getElementById('email'),
  subject: document.getElementById('subject'),
  description: document.getElementById('description'),
  category: document.getElementById('category'),
  priority: document.getElementById('priority'),
  suggestion: document.getElementById('suggestionText'),
  save: document.getElementById('btnSaveTicket')
};

function notify(message, kind) {
  els.notice.textContent = message;
  els.notice.classList.remove('hidden', 'notice-error', 'notice-success');
  els.notice.classList.add(kind === 'error' ? 'notice-error' : 'notice-success');
  els.notice.setAttribute('role', kind === 'error' ? 'alert' : 'status');
}

function clearNotice() {
  els.notice.classList.add('hidden');
  els.notice.textContent = '';
}

function showView(view) {
  els.setup.classList.toggle('hidden', view !== 'setup');
  els.auth.classList.toggle('hidden', view !== 'auth');
  els.app.classList.toggle('hidden', view !== 'app');
  els.signOut.classList.toggle('hidden', view !== 'app');
  els.newTicket.classList.toggle('hidden', view !== 'app');
  els.currentUser.classList.toggle('hidden', view !== 'app');
}

function validConfig() {
  try {
    const url = new URL(config.supabaseUrl);
    return url.protocol === 'https:' &&
      !url.hostname.includes('TU-PROYECTO') &&
      typeof config.supabasePublishableKey === 'string' &&
      config.supabasePublishableKey.length > 20 &&
      !config.supabasePublishableKey.includes('TU-CLAVE');
  } catch {
    return false;
  }
}

function errorMessage(error) {
  if (!error) return 'Ocurrió un error desconocido.';
  if (error.message === 'Invalid login credentials') return 'Correo o contraseña incorrectos.';
  if (error.message === 'Email not confirmed') return 'Confirma tu correo antes de iniciar sesión.';
  return error.message || 'Ocurrió un error al consultar Supabase.';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function priorityClass(priority) {
  return priority === 'Alta' ? 'badge-high' : priority === 'Media' ? 'badge-medium' : 'badge-low';
}

function statusClass(status) {
  return status === 'Abierto' ? 'status-open' : status === 'En proceso' ? 'status-progress' : 'status-resolved';
}

function ticketCode(id) {
  return 'HD-' + String(id).slice(0, 8).toUpperCase();
}

function isSupport() {
  return profile && profile.role === 'soporte';
}

function renderStats() {
  els.total.textContent = tickets.length;
  els.open.textContent = tickets.filter(ticket => ticket.status === 'Abierto').length;
  els.progress.textContent = tickets.filter(ticket => ticket.status === 'En proceso').length;
  els.resolved.textContent = tickets.filter(ticket => ticket.status === 'Resuelto').length;
}

function filteredTickets() {
  const query = els.search.value.trim().toLocaleLowerCase('es');
  const status = els.statusFilter.value;
  const priority = els.priorityFilter.value;
  return tickets.filter(ticket => {
    const text = [ticketCode(ticket.id), ticket.subject, ticket.requester_name, ticket.category]
      .join(' ').toLocaleLowerCase('es');
    return (!query || text.includes(query)) &&
      (status === 'Todos' || ticket.status === status) &&
      (priority === 'Todas' || ticket.priority === priority);
  });
}

function renderTable() {
  const filtered = filteredTickets();
  els.body.innerHTML = filtered.map(ticket => {
    const code = ticketCode(ticket.id);
    const statusControl = isSupport()
      ? '<select class="status-select" data-id="' + escapeHtml(ticket.id) +
        '" aria-label="Estado de ' + escapeHtml(code) + '">' +
        ['Abierto', 'En proceso', 'Resuelto'].map(status =>
          '<option value="' + status + '"' + (ticket.status === status ? ' selected' : '') +
          '>' + status + '</option>').join('') + '</select>'
      : '<span class="badge ' + statusClass(ticket.status) + '">' +
        escapeHtml(ticket.status) + '</span>';
    return '<tr>' +
      '<td><strong>' + escapeHtml(code) + '</strong></td>' +
      '<td class="subject-cell"><strong>' + escapeHtml(ticket.subject) +
      '</strong><small title="' + escapeHtml(ticket.description) + '">' +
      escapeHtml(ticket.description) + '</small></td>' +
      '<td>' + escapeHtml(ticket.category) + '</td>' +
      '<td><span class="badge ' + priorityClass(ticket.priority) + '">' +
      escapeHtml(ticket.priority) + '</span></td>' +
      '<td><span class="badge ' + statusClass(ticket.status) + '">' +
      escapeHtml(ticket.status) + '</span></td>' +
      '<td>' + escapeHtml(ticket.requester_name) + '</td>' +
      '<td>' + statusControl + '</td>' +
      '</tr>';
  }).join('');
  els.empty.classList.toggle('hidden', filtered.length > 0);
}

function render() {
  renderStats();
  renderTable();
  els.tableHelp.textContent = isSupport()
    ? 'Puedes consultar todos los tickets y actualizar su estado.'
    : 'Puedes consultar tus tickets. El equipo de soporte actualiza su estado.';
}

async function loadTickets() {
  const all = [];
  const pageSize = 500;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await db.from('tickets')
      .select('id,subject,description,category,priority,status,requester_name,created_at')
      .order('created_at', { ascending: false })
      .range(start, start + pageSize - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < pageSize) break;
  }
  tickets = all;
  render();
}

async function syncSession(session) {
  const user = session && session.user;
  if (!user) {
    sessionUser = null;
    profile = null;
    tickets = [];
    els.currentUser.textContent = '';
    showView('auth');
    render();
    return;
  }
  if (sessionUser && sessionUser.id === user.id && profile) return;
  sessionUser = user;
  try {
    const { data, error } = await db.from('profiles')
      .select('id,full_name,role')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    profile = data;
    els.currentUser.textContent = (profile.full_name || user.email) +
      ' · ' + (isSupport() ? 'Soporte' : 'Solicitante');
    showView('app');
    await loadTickets();
    clearNotice();
  } catch (error) {
    showView('auth');
    notify('No se pudo cargar el perfil o los tickets: ' + errorMessage(error), 'error');
  }
}

function smartSuggestion(text) {
  const value = text.toLocaleLowerCase('es');
  let category = 'Otros';
  let priority = 'Media';
  if (/(modelo|inferencia|predic|entrenamiento|accuracy|precisi[oó]n|\bia\b|\bml\b)/.test(value)) category = 'Modelos IA';
  else if (/(gpu|servidor|ca[ií]da|red|memoria|disco|docker|nube|cloud)/.test(value)) category = 'Infraestructura';
  else if (/(dataset|datos|csv|etl|base de datos|calidad de datos)/.test(value)) category = 'Datos';
  else if (/(acceso|permiso|contrase[nñ]a|login|usuario|credencial)/.test(value)) category = 'Accesos';
  else if (/(python|librer[ií]a|dependencia|software|aplicaci[oó]n|versi[oó]n)/.test(value)) category = 'Software';
  if (/(ca[ií]do|producci[oó]n|bloquea|no responde|cr[ií]tico|urgente|seguridad|p[eé]rdida)/.test(value)) priority = 'Alta';
  else if (/(consulta|mejora|actualizar|solicitud|configurar)/.test(value)) priority = 'Baja';
  return { category, priority };
}

els.authForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!db) return;
  clearNotice();
  els.login.disabled = true;
  els.register.disabled = true;
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  try {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
  } catch (error) {
    notify(errorMessage(error), 'error');
  } finally {
    els.login.disabled = false;
    els.register.disabled = false;
  }
});

els.register.addEventListener('click', async () => {
  if (!db) return;
  const name = els.authName.value.trim();
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  if (!name || !els.authEmail.checkValidity() || password.length < 6) {
    notify('Para crear una cuenta, indica nombre, correo válido y contraseña de al menos 6 caracteres.', 'error');
    return;
  }
  clearNotice();
  els.login.disabled = true;
  els.register.disabled = true;
  try {
    const redirect = window.location.origin + window.location.pathname;
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: redirect }
    });
    if (error) throw error;
    if (!data.session) notify('Cuenta creada. Revisa tu correo y confirma el registro antes de iniciar sesión.', 'success');
  } catch (error) {
    notify(errorMessage(error), 'error');
  } finally {
    els.login.disabled = false;
    els.register.disabled = false;
  }
});

els.signOut.addEventListener('click', async () => {
  const { error } = await db.auth.signOut();
  if (error) notify(errorMessage(error), 'error');
  else clearNotice();
});

els.newTicket.addEventListener('click', () => {
  els.form.reset();
  els.requester.value = profile.full_name || '';
  els.email.value = sessionUser.email || '';
  els.category.value = 'Modelos IA';
  els.priority.value = 'Media';
  els.suggestion.classList.add('hidden');
  els.dialog.showModal();
});
document.getElementById('btnCloseDialog').addEventListener('click', () => els.dialog.close());
document.getElementById('btnCancel').addEventListener('click', () => els.dialog.close());

document.getElementById('btnSuggest').addEventListener('click', () => {
  const text = (els.subject.value + ' ' + els.description.value).trim();
  if (!text) {
    els.suggestion.textContent = 'Escribe primero el asunto o la descripción.';
    els.suggestion.classList.remove('hidden');
    return;
  }
  const result = smartSuggestion(text);
  els.category.value = result.category;
  els.priority.value = result.priority;
  els.suggestion.textContent = 'Sugerencia: categoría "' + result.category +
    '" y prioridad "' + result.priority + '". Puedes modificarlas antes de guardar.';
  els.suggestion.classList.remove('hidden');
});

els.form.addEventListener('submit', async event => {
  event.preventDefault();
  const payload = {
    requester_name: els.requester.value.trim(),
    subject: els.subject.value.trim(),
    description: els.description.value.trim(),
    category: els.category.value,
    priority: els.priority.value
  };
  if (!payload.requester_name || !payload.subject || !payload.description) {
    notify('Completa los campos del ticket con texto válido.', 'error');
    return;
  }
  els.save.disabled = true;
  try {
    const { error } = await db.from('tickets').insert(payload);
    if (error) throw error;
    els.dialog.close();
    await loadTickets();
    notify('Ticket registrado. Ya aparece en el seguimiento.', 'success');
  } catch (error) {
    notify('No se pudo guardar el ticket: ' + errorMessage(error), 'error');
  } finally {
    els.save.disabled = false;
  }
});

els.body.addEventListener('change', async event => {
  const select = event.target.closest('select[data-id]');
  if (!select || !isSupport()) return;
  select.disabled = true;
  try {
    const { error } = await db.from('tickets')
      .update({ status: select.value })
      .eq('id', select.dataset.id);
    if (error) throw error;
    await loadTickets();
    notify('Estado actualizado.', 'success');
  } catch (error) {
    renderTable();
    notify('No se pudo actualizar el estado: ' + errorMessage(error), 'error');
  }
});

[els.search, els.statusFilter, els.priorityFilter].forEach(element =>
  element.addEventListener('input', renderTable));

async function init() {
  if (!validConfig() || !window.supabase) {
    showView('setup');
    return;
  }
  db = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey);
  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
      setTimeout(() => syncSession(session), 0);
    }
  });
  try {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;
    await syncSession(data.session);
  } catch (error) {
    showView('auth');
    notify(errorMessage(error), 'error');
  }
}

init();

