const STORAGE_KEY = 'neuradesk_tickets_v1';

const seedTickets = [
  {
    id: 'HD-1001',
    subject: 'Modelo de clasificación no responde',
    description: 'El servicio de inferencia devuelve timeout al procesar imágenes.',
    category: 'Modelos IA',
    priority: 'Alta',
    status: 'Abierto',
    requester: 'Lucía Gómez',
    email: 'lucia@neuratech.ai',
    createdAt: new Date().toISOString()
  },
  {
    id: 'HD-1002',
    subject: 'Acceso denegado al repositorio de datasets',
    description: 'El analista nuevo no puede abrir el bucket de datos de entrenamiento.',
    category: 'Accesos',
    priority: 'Media',
    status: 'En proceso',
    requester: 'Mario Ríos',
    email: 'mario@neuratech.ai',
    createdAt: new Date().toISOString()
  },
  {
    id: 'HD-1003',
    subject: 'Actualizar librería de Python',
    description: 'Se solicita actualizar una dependencia del entorno de pruebas.',
    category: 'Software',
    priority: 'Baja',
    status: 'Resuelto',
    requester: 'Carla Vega',
    email: 'carla@neuratech.ai',
    createdAt: new Date().toISOString()
  }
];

let tickets = loadTickets();

const els = {
  body: document.getElementById('ticketTableBody'),
  empty: document.getElementById('emptyState'),
  total: document.getElementById('totalTickets'),
  open: document.getElementById('openTickets'),
  progress: document.getElementById('progressTickets'),
  resolved: document.getElementById('resolvedTickets'),
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
  suggestion: document.getElementById('suggestionText')
};

function loadTickets() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTickets));
    return [...seedTickets];
  }
  try { return JSON.parse(saved); } catch { return [...seedTickets]; }
}

function saveTickets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function nextId() {
  const max = tickets.reduce((acc, ticket) => {
    const n = Number(ticket.id.replace('HD-', '')) || 1000;
    return Math.max(acc, n);
  }, 1000);
  return `HD-${max + 1}`;
}

function priorityClass(priority) {
  return priority === 'Alta' ? 'badge-high' : priority === 'Media' ? 'badge-medium' : 'badge-low';
}

function statusClass(status) {
  if (status === 'Abierto') return 'status-open';
  if (status === 'En proceso') return 'status-progress';
  return 'status-resolved';
}

function cycleStatus(id) {
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return;
  const order = ['Abierto', 'En proceso', 'Resuelto'];
  ticket.status = order[(order.indexOf(ticket.status) + 1) % order.length];
  saveTickets();
  render();
}

function renderStats() {
  els.total.textContent = tickets.length;
  els.open.textContent = tickets.filter(t => t.status === 'Abierto').length;
  els.progress.textContent = tickets.filter(t => t.status === 'En proceso').length;
  els.resolved.textContent = tickets.filter(t => t.status === 'Resuelto').length;
}

function getFilteredTickets() {
  const q = els.search.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const priority = els.priorityFilter.value;

  return tickets.filter(ticket => {
    const matchesText = !q || [ticket.id, ticket.subject, ticket.requester, ticket.category]
      .join(' ')
      .toLowerCase()
      .includes(q);
    const matchesStatus = status === 'Todos' || ticket.status === status;
    const matchesPriority = priority === 'Todas' || ticket.priority === priority;
    return matchesText && matchesStatus && matchesPriority;
  });
}

function renderTable() {
  const filtered = getFilteredTickets();
  els.body.innerHTML = filtered.map(ticket => `
    <tr>
      <td><strong>${escapeHtml(ticket.id)}</strong></td>
      <td class="subject-cell">
        <strong>${escapeHtml(ticket.subject)}</strong>
        <small title="${escapeHtml(ticket.description)}">${escapeHtml(ticket.description)}</small>
      </td>
      <td>${escapeHtml(ticket.category)}</td>
      <td><span class="badge ${priorityClass(ticket.priority)}">${escapeHtml(ticket.priority)}</span></td>
      <td><span class="badge ${statusClass(ticket.status)}">${escapeHtml(ticket.status)}</span></td>
      <td>${escapeHtml(ticket.requester)}</td>
      <td><button class="btn btn-sm" data-action="status" data-id="${ticket.id}">Cambiar estado</button></td>
    </tr>
  `).join('');

  els.empty.classList.toggle('hidden', filtered.length > 0);
}

function render() {
  renderStats();
  renderTable();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function smartSuggestion(text) {
  const value = text.toLowerCase();
  let category = 'Otros';
  let priority = 'Media';

  if (/(modelo|inferencia|predic|entrenamiento|accuracy|precisi[oó]n|ia|ml)/.test(value)) category = 'Modelos IA';
  else if (/(gpu|servidor|ca[ií]da|red|memoria|disco|docker|nube|cloud)/.test(value)) category = 'Infraestructura';
  else if (/(dataset|datos|csv|etl|base de datos|calidad de datos)/.test(value)) category = 'Datos';
  else if (/(acceso|permiso|contrase[nñ]a|login|usuario|credencial)/.test(value)) category = 'Accesos';
  else if (/(python|librer[ií]a|dependencia|software|aplicaci[oó]n|versi[oó]n)/.test(value)) category = 'Software';

  if (/(ca[ií]do|producci[oó]n|bloquea|no responde|cr[ií]tico|urgente|seguridad|p[eé]rdida)/.test(value)) priority = 'Alta';
  else if (/(consulta|mejora|actualizar|solicitud|configurar)/.test(value)) priority = 'Baja';

  return { category, priority };
}

document.getElementById('btnNewTicket').addEventListener('click', () => els.dialog.showModal());
document.getElementById('btnCloseDialog').addEventListener('click', () => els.dialog.close());
document.getElementById('btnCancel').addEventListener('click', () => els.dialog.close());

document.getElementById('btnSuggest').addEventListener('click', () => {
  const text = `${els.subject.value} ${els.description.value}`.trim();
  if (!text) {
    els.suggestion.textContent = 'Escribe primero el asunto o la descripción para poder analizar el ticket.';
    els.suggestion.classList.remove('hidden');
    return;
  }
  const result = smartSuggestion(text);
  els.category.value = result.category;
  els.priority.value = result.priority;
  els.suggestion.textContent = `Sugerencia: categoría “${result.category}” y prioridad “${result.priority}”. Puedes modificarla antes de guardar.`;
  els.suggestion.classList.remove('hidden');
});

els.form.addEventListener('submit', event => {
  event.preventDefault();
  const ticket = {
    id: nextId(),
    requester: els.requester.value.trim(),
    email: els.email.value.trim(),
    subject: els.subject.value.trim(),
    description: els.description.value.trim(),
    category: els.category.value,
    priority: els.priority.value,
    status: 'Abierto',
    createdAt: new Date().toISOString()
  };

  tickets.unshift(ticket);
  saveTickets();
  els.form.reset();
  els.category.value = 'Modelos IA';
  els.priority.value = 'Media';
  els.suggestion.classList.add('hidden');
  els.dialog.close();
  render();
});

els.body.addEventListener('click', event => {
  const button = event.target.closest('[data-action="status"]');
  if (button) cycleStatus(button.dataset.id);
});

[els.search, els.statusFilter, els.priorityFilter].forEach(el => el.addEventListener('input', renderTable));

render();
