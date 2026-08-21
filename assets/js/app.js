(function () {
	'use strict';

	const STORAGE_KEY = 'codecrafthub.courses.v1';
	const THEME_KEY = 'codecrafthub.theme';
	const STATUSES = ['Non commencé', 'En cours', 'Terminé'];

	const SEED_COURSES = [
		{
			id: 1,
			name: 'JavaScript moderne (ES2023)',
			description: "Closures, promesses, modules et bonnes pratiques pour écrire du JS robuste.",
			status: 'En cours',
			target_date: addDays(14),
			created_at: nowIso(),
		},
		{
			id: 2,
			name: 'Fondamentaux de Python',
			description: "Bases du langage, structures de données et premiers scripts automatisés.",
			status: 'Terminé',
			target_date: addDays(-5),
			created_at: nowIso(),
		},
		{
			id: 3,
			name: 'API REST avec Flask',
			description: "Construire une API REST propre : routes, validation, gestion d'erreurs.",
			status: 'Non commencé',
			target_date: addDays(30),
			created_at: nowIso(),
		},
	];

	function nowIso() {
		return new Date().toISOString();
	}
	function addDays(n) {
		const d = new Date();
		d.setDate(d.getDate() + n);
		return d.toISOString().slice(0, 10);
	}

	// ---------- Stockage ----------
	function loadCourses() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) {
				saveCourses(SEED_COURSES);
				return [...SEED_COURSES];
			}
			return JSON.parse(raw);
		} catch {
			return [];
		}
	}

	function saveCourses(courses) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
		} catch {
			// Stockage indisponible (navigation privée, quota) — l'app reste utilisable en mémoire.
		}
	}

	let courses = loadCourses();
	let activeFilter = 'Tous';
	let searchTerm = '';
	let editingId = null;

	// ---------- Éléments DOM ----------
	const courseList = document.getElementById('courseList');
	const searchInput = document.getElementById('searchInput');
	const filterTabs = document.querySelectorAll('.filter-tab');
	const modalOverlay = document.getElementById('modalOverlay');
	const modalTitle = document.getElementById('modalTitle');
	const courseForm = document.getElementById('courseForm');
	const submitForm = document.getElementById('submitForm');
	const toastStack = document.getElementById('toastStack');

	// ---------- Thème ----------
	const themeToggle = document.getElementById('themeToggle');
	const themeIconDark = document.getElementById('themeIconDark');
	const themeIconLight = document.getElementById('themeIconLight');

	function applyTheme(theme) {
		if (theme) {
			document.documentElement.setAttribute('data-theme', theme);
		} else {
			document.documentElement.removeAttribute('data-theme');
		}
		const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
		themeIconDark.style.display = isDark ? 'none' : 'block';
		themeIconLight.style.display = isDark ? 'block' : 'none';
	}

	function initTheme() {
		try {
			const saved = localStorage.getItem(THEME_KEY);
			applyTheme(saved || null);
		} catch {
			applyTheme(null);
		}
	}

	themeToggle.addEventListener('click', () => {
		const current = document.documentElement.getAttribute('data-theme');
		const isDark = current === 'dark' || (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
		const next = isDark ? 'light' : 'dark';
		try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
		applyTheme(next);
	});

	initTheme();

	// ---------- Utilitaires ----------
	function escapeHtml(str) {
		const div = document.createElement('div');
		div.textContent = str ?? '';
		return div.innerHTML;
	}

	function statusClass(status) {
		if (status === 'Non commencé') return 'status-pill--notstarted';
		if (status === 'En cours') return 'status-pill--progress';
		if (status === 'Terminé') return 'status-pill--done';
		return '';
	}

	function formatDate(dateStr) {
		if (!dateStr) return 'N/A';
		try {
			const d = new Date(dateStr);
			return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
		} catch {
			return dateStr;
		}
	}

	function daysUntil(dateStr) {
		if (!dateStr) return null;
		const target = new Date(dateStr);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return Math.round((target - today) / 86400000);
	}

	function showToast(message, type = 'success') {
		const toast = document.createElement('div');
		toast.className = `toast toast--${type}`;
		toast.textContent = message;
		toastStack.appendChild(toast);
		setTimeout(() => {
			toast.style.transition = 'opacity 0.25s ease';
			toast.style.opacity = '0';
			setTimeout(() => toast.remove(), 250);
		}, 2800);
	}

	// ---------- Rendu ----------
	function renderStats() {
		const total = courses.length;
		const notStarted = courses.filter((c) => c.status === 'Non commencé').length;
		const inProgress = courses.filter((c) => c.status === 'En cours').length;
		const done = courses.filter((c) => c.status === 'Terminé').length;
		const pct = total > 0 ? Math.round((done / total) * 100) : 0;

		document.getElementById('statTotal').textContent = total;
		document.getElementById('statNotStarted').textContent = notStarted;
		document.getElementById('statInProgress').textContent = inProgress;
		document.getElementById('statDone').textContent = done;
		document.getElementById('ringLabel').textContent = `${pct}% terminé`;

		const circumference = 150.8;
		const offset = circumference - (pct / 100) * circumference;
		document.getElementById('ringValue').style.strokeDashoffset = offset;
	}

	function getFilteredCourses() {
		return courses.filter((c) => {
			const matchStatus = activeFilter === 'Tous' || c.status === activeFilter;
			const matchSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
			return matchStatus && matchSearch;
		});
	}

	function renderCourses() {
		const filtered = getFilteredCourses();

		if (filtered.length === 0) {
			courseList.innerHTML = `
				<div class="empty-state">
					<div class="empty-state__icon">🔍</div>
					<h3>Aucun cours ici</h3>
					<p>${courses.length === 0 ? "Ajoutez votre premier cours pour démarrer votre suivi." : "Essayez un autre filtre ou une autre recherche."}</p>
				</div>`;
			return;
		}

		courseList.innerHTML = filtered
			.slice()
			.sort((a, b) => new Date(a.target_date || 0) - new Date(b.target_date || 0))
			.map((c) => {
				const remaining = daysUntil(c.target_date);
				let remainingLabel = '';
				if (remaining !== null && c.status !== 'Terminé') {
					remainingLabel = remaining >= 0
						? `<span>⏳ ${remaining} j restants</span>`
						: `<span>⚠️ En retard de ${Math.abs(remaining)} j</span>`;
				}
				return `
				<article class="course-card" data-id="${c.id}">
					<div>
						<div class="course-card__name">${escapeHtml(c.name)}</div>
						<div class="course-card__desc">${escapeHtml(c.description)}</div>
						<div class="course-card__meta">
							<span class="status-pill ${statusClass(c.status)}">${escapeHtml(c.status)}</span>
							<span>🎯 ${formatDate(c.target_date)}</span>
							${remainingLabel}
						</div>
					</div>
					<div class="course-card__actions">
						<button class="btn btn--ghost btn--sm" data-action="edit" data-id="${c.id}">Modifier</button>
						<button class="btn btn--danger-ghost btn--sm" data-action="delete" data-id="${c.id}">Supprimer</button>
					</div>
				</article>`;
			})
			.join('');
	}

	function render() {
		renderStats();
		renderCourses();
	}

	// ---------- Filtres & recherche ----------
	filterTabs.forEach((tab) => {
		tab.addEventListener('click', () => {
			filterTabs.forEach((t) => {
				t.classList.remove('is-active');
				t.setAttribute('aria-selected', 'false');
			});
			tab.classList.add('is-active');
			tab.setAttribute('aria-selected', 'true');
			activeFilter = tab.dataset.filter;
			renderCourses();
		});
	});

	searchInput.addEventListener('input', (e) => {
		searchTerm = e.target.value;
		renderCourses();
	});

	// ---------- Modale ----------
	function openModal(course) {
		editingId = course ? course.id : null;
		modalTitle.textContent = course ? 'Modifier le cours' : 'Ajouter un cours';
		submitForm.textContent = course ? 'Enregistrer' : 'Ajouter le cours';

		document.getElementById('courseId').value = course ? course.id : '';
		document.getElementById('courseName').value = course ? course.name : '';
		document.getElementById('courseDescription').value = course ? course.description : '';
		document.getElementById('courseStatus').value = course ? course.status : '';
		document.getElementById('courseDate').value = course ? course.target_date : '';

		clearErrors();
		modalOverlay.classList.add('is-active');
		document.getElementById('courseName').focus();
	}

	function closeModal() {
		modalOverlay.classList.remove('is-active');
		courseForm.reset();
		clearErrors();
		editingId = null;
	}

	function clearErrors() {
		courseForm.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));
		courseForm.querySelectorAll('.field__error').forEach((e) => (e.textContent = ''));
	}

	document.getElementById('openAddModal').addEventListener('click', () => openModal(null));
	document.getElementById('closeModal').addEventListener('click', closeModal);
	document.getElementById('cancelForm').addEventListener('click', closeModal);
	modalOverlay.addEventListener('click', (e) => {
		if (e.target === modalOverlay) closeModal();
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && modalOverlay.classList.contains('is-active')) closeModal();
	});

	// ---------- Validation & soumission ----------
	function validate() {
		clearErrors();
		let valid = true;
		const fields = [
			['courseName', 'Le nom du cours est requis.'],
			['courseDescription', 'La description est requise.'],
			['courseStatus', 'Choisissez un statut.'],
			['courseDate', 'La date cible est requise.'],
		];
		fields.forEach(([id, message]) => {
			const el = document.getElementById(id);
			if (!el.value.trim()) {
				valid = false;
				el.closest('.field').classList.add('has-error');
				el.closest('.field').querySelector('.field__error').textContent = message;
			}
		});
		return valid;
	}

	courseForm.addEventListener('submit', (e) => {
		e.preventDefault();
		if (!validate()) return;

		const data = {
			name: document.getElementById('courseName').value.trim(),
			description: document.getElementById('courseDescription').value.trim(),
			status: document.getElementById('courseStatus').value,
			target_date: document.getElementById('courseDate').value,
		};

		if (editingId) {
			courses = courses.map((c) => (c.id === editingId ? { ...c, ...data } : c));
			showToast('Cours mis à jour avec succès.');
		} else {
			const nextId = courses.reduce((max, c) => Math.max(max, c.id), 0) + 1;
			courses.push({ id: nextId, ...data, created_at: nowIso() });
			showToast('Cours ajouté avec succès.');
		}

		saveCourses(courses);
		render();
		closeModal();
	});

	// ---------- Actions liste (édition / suppression) ----------
	courseList.addEventListener('click', (e) => {
		const btn = e.target.closest('button[data-action]');
		if (!btn) return;
		const id = Number(btn.dataset.id);
		const course = courses.find((c) => c.id === id);
		if (!course) return;

		if (btn.dataset.action === 'edit') {
			openModal(course);
		} else if (btn.dataset.action === 'delete') {
			if (!confirm(`Supprimer « ${course.name} » ?`)) return;
			courses = courses.filter((c) => c.id !== id);
			saveCourses(courses);
			render();
			showToast('Cours supprimé.', 'error');
		}
	});

	render();
})();
