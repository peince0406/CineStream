// CineStream - Admin Dashboard Management Logic

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('cinestream_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // DOM Elements
  const currentAdminName = document.getElementById('currentAdminName');
  const logoutBtn = document.getElementById('logoutBtn');
  const moviesTableBody = document.getElementById('moviesTableBody');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminStatusFilter = document.getElementById('adminStatusFilter');
  const openAddModalBtn = document.getElementById('openAddModalBtn');

  // Stats Elements
  const statTotal = document.getElementById('statTotal');
  const statPublished = document.getElementById('statPublished');
  const statDrafts = document.getElementById('statDrafts');
  const statViews = document.getElementById('statViews');

  // Modal Elements
  const movieModal = document.getElementById('movieModal');
  const modalTitle = document.getElementById('modalTitle');
  const movieForm = document.getElementById('movieForm');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const saveMovieBtn = document.getElementById('saveMovieBtn');

  // Form Fields
  const movieIdField = document.getElementById('movieIdField');
  const formTitle = document.getElementById('formTitle');
  const formDesc = document.getElementById('formDesc');
  const formGenres = document.getElementById('formGenres');
  const formYear = document.getElementById('formYear');
  const formDuration = document.getElementById('formDuration');
  const formRating = document.getElementById('formRating');
  const formPosterUrl = document.getElementById('formPosterUrl');
  const posterFileInput = document.getElementById('posterFileInput');
  const posterFileLabel = document.getElementById('posterFileLabel');
  const posterPreviewImg = document.getElementById('posterPreviewImg');
  const formVideoUrl = document.getElementById('formVideoUrl');
  const videoFileInput = document.getElementById('videoFileInput');
  const videoFileLabel = document.getElementById('videoFileLabel');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const uploadProgressFill = document.getElementById('uploadProgressFill');
  const formSubLabel = document.getElementById('formSubLabel');
  const formSubSrc = document.getElementById('formSubSrc');
  const formPublished = document.getElementById('formPublished');
  const formFeatured = document.getElementById('formFeatured');

  // Delete Modal
  const deleteModal = document.getElementById('deleteModal');
  const deleteMovieTitle = document.getElementById('deleteMovieTitle');
  const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // Toast
  const adminToast = document.getElementById('adminToast');

  let moviesList = [];
  let pendingDeleteId = null;

  // Verify Admin Session
  async function verifyAdmin() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.admin) {
        currentAdminName.textContent = `Logged in as ${data.admin.username}`;
      } else {
        localStorage.removeItem('cinestream_token');
        window.location.href = 'login.html';
      }
    } catch (err) {
      console.error('Session verify failed:', err);
      localStorage.removeItem('cinestream_token');
      window.location.href = 'login.html';
    }
  }

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('cinestream_token');
    localStorage.removeItem('cinestream_admin');
    window.location.href = 'login.html';
  });

  // Fetch all movies (including drafts)
  async function loadAdminMovies() {
    try {
      moviesTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: var(--admin-text-dim);">
            Loading catalog...
          </td>
        </tr>
      `;

      const res = await fetch('/api/movies?published=all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.movies)) {
        moviesList = data.movies;
        updateStats(moviesList);
        filterAndRenderTable();
      } else {
        showToast(data.message || 'Error loading movies', true);
      }
    } catch (err) {
      console.error('Failed to load movies:', err);
      showToast('Network error loading movies catalog', true);
    }
  }

  // Calculate & Update Stats
  function updateStats(movies) {
    const total = movies.length;
    const published = movies.filter(m => m.published).length;
    const drafts = total - published;
    const views = movies.reduce((sum, m) => sum + (m.views || 0), 0);

    statTotal.textContent = total;
    statPublished.textContent = published;
    statDrafts.textContent = drafts;
    statViews.textContent = views.toLocaleString();
  }

  // Filter and Render Table
  function filterAndRenderTable() {
    const search = adminSearchInput.value.toLowerCase().trim();
    const status = adminStatusFilter.value;

    const filtered = moviesList.filter(movie => {
      // Status filter
      if (status === 'published' && !movie.published) return false;
      if (status === 'draft' && movie.published) return false;

      // Search filter
      if (search) {
        const titleMatch = (movie.title || '').toLowerCase().includes(search);
        const descMatch = (movie.description || '').toLowerCase().includes(search);
        const genreMatch = (movie.genre || []).some(g => g.toLowerCase().includes(search));
        if (!titleMatch && !descMatch && !genreMatch) return false;
      }
      return true;
    });

    renderTable(filtered);
  }

  // Render Table
  function renderTable(movies) {
    if (movies.length === 0) {
      moviesTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: var(--admin-text-dim);">
            No movies match the current search or filters.
          </td>
        </tr>
      `;
      return;
    }

    moviesTableBody.innerHTML = movies.map(movie => {
      const genresStr = Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre;
      const statusBadge = movie.published
        ? `<span class="status-badge published">● Published</span>`
        : `<span class="status-badge draft">○ Draft</span>`;

      return `
        <tr data-id="${movie._id}">
          <td>
            <div class="table-movie-cell">
              <img src="${escapeHtml(movie.posterUrl)}" class="table-poster" alt="poster" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=100&q=80'" />
              <div>
                <div class="table-movie-title">${escapeHtml(movie.title)} ${movie.featured ? '<span style="color:var(--admin-warning); font-size:0.75rem;">★ Featured</span>' : ''}</div>
                <div class="table-movie-desc">${escapeHtml(movie.description)}</div>
              </div>
            </div>
          </td>
          <td>${escapeHtml(genresStr)}</td>
          <td>${movie.year}</td>
          <td>${escapeHtml(movie.duration)}</td>
          <td>${movie.views || 0}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div class="table-actions" style="justify-content: flex-end;">
              <button class="btn-action-icon toggle-pub" title="${movie.published ? 'Unpublish' : 'Publish'}" onclick="window.adminActions.togglePublish('${movie._id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button class="btn-action-icon" title="Edit Movie" onclick="window.adminActions.openEditModal('${movie._id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-action-icon delete" title="Delete Movie" onclick="window.adminActions.openDeleteModal('${movie._id}', '${escapeHtml(movie.title)}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Filter Listeners
  adminSearchInput.addEventListener('input', filterAndRenderTable);
  adminStatusFilter.addEventListener('change', filterAndRenderTable);

  // Source Tabs (URL vs Upload)
  document.querySelectorAll('.source-tabs').forEach(tabGroup => {
    tabGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;

      tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.dataset.tab;
      const parent = tabGroup.closest('.form-group');
      parent.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${targetTab}`);
      });
    });
  });

  // Poster File Selection & Instant Preview
  posterFileInput.addEventListener('change', () => {
    const file = posterFileInput.files[0];
    if (file) {
      posterFileLabel.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      const reader = new FileReader();
      reader.onload = (e) => {
        posterPreviewImg.src = e.target.result;
        posterPreviewImg.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  // Video File Selection
  videoFileInput.addEventListener('change', () => {
    const file = videoFileInput.files[0];
    if (file) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      const sizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
      const displaySize = file.size >= 1024 * 1024 * 1024 ? `${sizeGB} GB` : `${sizeMB} MB`;
      videoFileLabel.textContent = `Selected: ${file.name} (${displaySize})`;

      if (file.size > 20 * 1024 * 1024 * 1024) {
        showToast('Selected file exceeds maximum allowed limit (20 GB).', true);
      }
    }
  });

  // Modal Open for Add
  openAddModalBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Add New Movie';
    movieForm.reset();
    movieIdField.value = '';
    posterPreviewImg.style.display = 'none';
    posterFileLabel.textContent = 'Click or drag image file here (JPG, PNG, WEBP)';
    videoFileLabel.textContent = 'Click to select video file (MP4, WEBM, MKV - Up to 20 GB)';
    uploadProgressBar.style.display = 'none';
    formPublished.checked = true;
    formFeatured.checked = false;
    movieModal.classList.add('open');
  });

  // Modal Close
  function closeModal() {
    movieModal.classList.remove('open');
  }
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  // Form Submission (Add or Edit)
  movieForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveMovieBtn.disabled = true;
    saveMovieBtn.textContent = 'Saving...';

    try {
      let finalPosterUrl = formPosterUrl.value.trim();
      let finalVideoUrl = formVideoUrl.value.trim();

      // 1. Upload Poster File if chosen
      if (posterFileInput.files.length > 0) {
        saveMovieBtn.textContent = 'Uploading poster...';
        const posterFormData = new FormData();
        posterFormData.append('poster', posterFileInput.files[0]);

        const posterRes = await fetch('/api/upload/poster', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: posterFormData
        });
        const posterData = await posterRes.json();
        if (posterData.success) {
          finalPosterUrl = posterData.url;
        } else {
          throw new Error(posterData.message || 'Poster upload failed');
        }
      }

      // 2. Upload Video File if chosen
      if (videoFileInput.files.length > 0) {
        uploadProgressBar.style.display = 'block';
        saveMovieBtn.textContent = 'Uploading video...';

        finalVideoUrl = await new Promise((resolve, reject) => {
          const videoFormData = new FormData();
          videoFormData.append('video', videoFileInput.files[0]);

          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload/video', true);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          xhr.upload.onprogress = (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              uploadProgressFill.style.width = `${percent}%`;
              saveMovieBtn.textContent = `Uploading video (${percent}%)...`;
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              const res = JSON.parse(xhr.responseText);
              resolve(res.url);
            } else {
              let errorMsg = 'Video upload failed';
              try {
                const parsed = JSON.parse(xhr.responseText);
                errorMsg = parsed.message || errorMsg;
              } catch (e) {
                errorMsg = xhr.responseText || xhr.statusText || errorMsg;
              }
              reject(new Error(errorMsg));
            }
          };

          xhr.onerror = () => reject(new Error('Video upload network error'));
          xhr.send(videoFormData);
        });
      }

      if (!finalPosterUrl) {
        throw new Error('Please specify a poster image URL or upload a file.');
      }
      if (!finalVideoUrl) {
        throw new Error('Please specify a video stream URL or upload a video file.');
      }

      // Subtitles payload
      const subtitles = [];
      if (formSubSrc.value.trim()) {
        subtitles.push({
          label: formSubLabel.value.trim() || 'English',
          src: formSubSrc.value.trim(),
          srclang: 'en',
          default: true
        });
      }

      const moviePayload = {
        title: formTitle.value.trim(),
        description: formDesc.value.trim(),
        genre: formGenres.value.split(',').map(g => g.trim()).filter(Boolean),
        year: parseInt(formYear.value, 10),
        duration: formDuration.value.trim(),
        rating: formRating.value.trim() || 'PG-13',
        posterUrl: finalPosterUrl,
        videoUrl: finalVideoUrl,
        subtitles,
        published: formPublished.checked,
        featured: formFeatured.checked
      };

      const editId = movieIdField.value;
      const endpoint = editId ? `/api/movies/${editId}` : '/api/movies';
      const method = editId ? 'PUT' : 'POST';

      const saveRes = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(moviePayload)
      });

      const saveData = await saveRes.json();
      if (saveData.success) {
        showToast(editId ? 'Movie updated successfully' : 'Movie added successfully');
        closeModal();
        loadAdminMovies();
      } else {
        throw new Error(saveData.message || 'Error saving movie');
      }

    } catch (err) {
      console.error(err);
      showToast(err.message, true);
    } finally {
      saveMovieBtn.disabled = false;
      saveMovieBtn.textContent = 'Save Movie';
      uploadProgressBar.style.display = 'none';
    }
  });

  // Global Actions namespace for HTML onclick handlers
  window.adminActions = {
    // Open Edit Modal
    openEditModal: (id) => {
      const movie = moviesList.find(m => m._id === id);
      if (!movie) return;

      modalTitle.textContent = 'Edit Movie';
      movieIdField.value = movie._id;
      formTitle.value = movie.title;
      formDesc.value = movie.description;
      formGenres.value = Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre;
      formYear.value = movie.year;
      formDuration.value = movie.duration;
      formRating.value = movie.rating || 'PG-13';
      formPosterUrl.value = movie.posterUrl;
      formVideoUrl.value = movie.videoUrl;
      formPublished.checked = Boolean(movie.published);
      formFeatured.checked = Boolean(movie.featured);

      // Subtitles
      if (Array.isArray(movie.subtitles) && movie.subtitles.length > 0) {
        formSubLabel.value = movie.subtitles[0].label || 'English';
        formSubSrc.value = movie.subtitles[0].src || '';
      } else {
        formSubLabel.value = 'English';
        formSubSrc.value = '';
      }

      posterPreviewImg.src = movie.posterUrl;
      posterPreviewImg.style.display = 'block';

      movieModal.classList.add('open');
    },

    // Toggle Published Status
    togglePublish: async (id) => {
      try {
        const res = await fetch(`/api/movies/${id}/publish`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message);
          loadAdminMovies();
        } else {
          showToast(data.message, true);
        }
      } catch (err) {
        showToast('Error updating publish state', true);
      }
    },

    // Open Delete Modal
    openDeleteModal: (id, title) => {
      pendingDeleteId = id;
      deleteMovieTitle.textContent = `"${title}"`;
      deleteModal.classList.add('open');
    }
  };

  // Close Delete Modal
  function closeDeleteModal() {
    deleteModal.classList.remove('open');
    pendingDeleteId = null;
  }
  closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  // Confirm Delete
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) return;

    try {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = 'Deleting...';

      const res = await fetch(`/api/movies/${pendingDeleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        showToast('Movie deleted successfully');
        closeDeleteModal();
        loadAdminMovies();
      } else {
        showToast(data.message || 'Error deleting movie', true);
      }
    } catch (err) {
      showToast('Network error deleting movie', true);
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Delete Permanently';
    }
  });

  // Toast Notification
  let toastTimeout = null;
  function showToast(msg, isError = false) {
    adminToast.textContent = msg;
    adminToast.style.borderColor = isError ? '#ef4444' : '#10b981';
    adminToast.style.display = 'block';

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      adminToast.style.display = 'none';
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Boot
  verifyAdmin();
  loadAdminMovies();
});
