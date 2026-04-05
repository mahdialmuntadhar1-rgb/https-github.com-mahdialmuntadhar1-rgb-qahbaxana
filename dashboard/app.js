class Dashboard {
    constructor() {
        this.apiBase = '/api';
        this.refreshInterval = 5000; // 5 seconds
        this.selectedGovernorates = new Set();
        this.selectedCategories = new Set();
        
        // Data
        this.governorates = [
            'Baghdad', 'Basra', 'Nineveh', 'Erbil', 'Najaf', 'Karbala', 
            'Sulaymaniyah', 'Kirkuk', 'Anbar', 'Diyala', 'Babil', 'Dhi Qar', 
            'Duhok', 'Maysan', 'Muthanna', 'Qadisiyyah', 'Salah al-Din', 'Wasit'
        ];
        
        this.categories = [
            'Restaurants', 'Cafes', 'Pharmacies', 'Hospitals', 'Clinics', 
            'Hotels', 'Supermarkets', 'Bakeries', 'Electronics', 'Clothing', 
            'Schools', 'Universities', 'Gyms', 'Salons', 'Car Services', 
            'Construction', 'Hardware', 'Jewelry', 'Mobile Phones', 'Furniture'
        ];
        
        this.init();
    }

    init() {
        this.renderGovernorates();
        this.renderCategories();
        this.bindEvents();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    renderGovernorates() {
        const grid = document.getElementById('governorateGrid');
        grid.innerHTML = this.governorates.map(gov => `
            <div class="grid-item" data-governorate="${gov}">
                <input type="checkbox" id="gov-${gov}" class="checkbox-input">
                <label for="gov-${gov}" class="grid-label">
                    ${gov}
                </label>
            </div>
        `).join('');
    }

    renderCategories() {
        const grid = document.getElementById('categoryGrid');
        grid.innerHTML = this.categories.map(category => `
            <div class="grid-item" data-category="${category}">
                <input type="checkbox" id="cat-${category}" class="checkbox-input">
                <label for="cat-${category}" class="grid-label">
                    ${category}
                </label>
            </div>
        `).join('');
    }

    bindEvents() {
        // Governorate selection
        document.getElementById('selectAllGovernorates').addEventListener('click', () => {
            this.selectAllGovernorates();
        });
        
        document.getElementById('deselectAllGovernorates').addEventListener('click', () => {
            this.deselectAllGovernorates();
        });
        
        // Category selection
        document.getElementById('selectAllCategories').addEventListener('click', () => {
            this.selectAllCategories();
        });
        
        document.getElementById('deselectAllCategories').addEventListener('click', () => {
            this.deselectAllCategories();
        });
        
        // Control actions
        document.getElementById('startSelected').addEventListener('click', () => {
            this.startSelected();
        });
        
        document.getElementById('startAll').addEventListener('click', () => {
            this.startAll();
        });
        
        document.getElementById('refresh').addEventListener('click', () => {
            this.loadDashboard();
        });
        
        document.getElementById('retryFailed').addEventListener('click', () => {
            this.retryFailed();
        });
        
        // Checkbox change events
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('checkbox-input')) {
                const gridItem = e.target.closest('.grid-item');
                if (gridItem.dataset.governorate) {
                    this.updateGovernorateSelection();
                } else if (gridItem.dataset.category) {
                    this.updateCategorySelection();
                }
            }
        });
    }

    selectAllGovernorates() {
        this.governorates.forEach(gov => {
            const checkbox = document.getElementById(`gov-${gov}`);
            if (checkbox) checkbox.checked = true;
        });
        this.updateGovernorateSelection();
    }

    deselectAllGovernorates() {
        this.governorates.forEach(gov => {
            const checkbox = document.getElementById(`gov-${gov}`);
            if (checkbox) checkbox.checked = false;
        });
        this.updateGovernorateSelection();
    }

    selectAllCategories() {
        this.categories.forEach(category => {
            const checkbox = document.getElementById(`cat-${category}`);
            if (checkbox) checkbox.checked = true;
        });
        this.updateCategorySelection();
    }

    deselectAllCategories() {
        this.categories.forEach(category => {
            const checkbox = document.getElementById(`cat-${category}`);
            if (checkbox) checkbox.checked = false;
        });
        this.updateCategorySelection();
    }

    updateGovernorateSelection() {
        this.selectedGovernorates.clear();
        this.governorates.forEach(gov => {
            const checkbox = document.getElementById(`gov-${gov}`);
            if (checkbox && checkbox.checked) {
                this.selectedGovernorates.add(gov);
                document.querySelector(`[data-governorate="${gov}"]`).classList.add('selected');
            } else {
                document.querySelector(`[data-governorate="${gov}"]`).classList.remove('selected');
            }
        });
        document.getElementById('governorateCount').textContent = `${this.selectedGovernorates.size} selected`;
    }

    updateCategorySelection() {
        this.selectedCategories.clear();
        this.categories.forEach(category => {
            const checkbox = document.getElementById(`cat-${category}`);
            if (checkbox && checkbox.checked) {
                this.selectedCategories.add(category);
                document.querySelector(`[data-category="${category}"]`).classList.add('selected');
            } else {
                document.querySelector(`[data-category="${category}"]`).classList.remove('selected');
            }
        });
        document.getElementById('categoryCount').textContent = `${this.selectedCategories.size} selected`;
    }

    async startSelected() {
        if (this.selectedGovernorates.size === 0 || this.selectedCategories.size === 0) {
            this.showValidation('Please select at least one governorate and one category');
            return;
        }

        try {
            const response = await fetch(this.apiBase + '/start-selected', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    governorates: Array.from(this.selectedGovernorates),
                    categories: Array.from(this.selectedCategories)
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(`Started collection for ${this.selectedGovernorates.size} governorates and ${this.selectedCategories.size} categories`);
                this.loadDashboard();
            } else {
                this.showError(result.error || 'Failed to start selected collection');
            }
        } catch (error) {
            if (error.message.includes('404')) {
                // Fallback for missing endpoint
                this.showError('Start Selected endpoint not available yet. Please use Start All or individual governorate selection.');
            } else {
                this.showError('Failed to start selected collection');
            }
            console.error('Start selected error:', error);
        }
    }

    async startAll() {
        if (!confirm('This will start collection for all 18 governorates and 20 categories. This will take several hours. Continue?')) {
            return;
        }

        try {
            const response = await fetch(this.apiBase + '/start-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Started collection for all governorates');
                this.loadDashboard();
            } else {
                this.showError(result.error || 'Failed to start all governorates');
            }
        } catch (error) {
            this.showError('Failed to start all governorates');
            console.error('Start all error:', error);
        }
    }

    async retryFailed() {
        try {
            const response = await fetch(this.apiBase + '/retry-failed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(`Retried ${result.retried || 0} failed jobs`);
                this.loadDashboard();
            } else {
                this.showError(result.error || 'Failed to retry jobs');
            }
        } catch (error) {
            if (error.message.includes('404')) {
                this.showError('Retry endpoint not available yet');
            } else {
                this.showError('Failed to retry jobs');
            }
            console.error('Retry failed error:', error);
        }
    }

    async loadDashboard() {
        try {
            const [dashboardData, failuresData, resultsData] = await Promise.all([
                this.fetch('/dashboard'),
                this.fetch('/failures').catch(() => ({ jobs: [] })),
                this.fetch('/results').catch(() => ({ businesses: [] }))
            ]);

            this.updateSummary(dashboardData.stats);
            this.updateProgressTable(dashboardData.jobs);
            this.updateBusinessTable(resultsData.businesses);
            this.updateFailedTable(failuresData.jobs);
        } catch (error) {
            this.showError('Failed to load dashboard data');
            console.error('Dashboard load error:', error);
        }
    }

    async fetch(endpoint) {
        const response = await fetch(this.apiBase + endpoint);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }

    updateSummary(stats) {
        document.getElementById('runningJobs').textContent = stats.runningJobs || 0;
        document.getElementById('pendingJobs').textContent = stats.pendingJobs || 0;
        document.getElementById('completedJobs').textContent = stats.completedJobs || 0;
        document.getElementById('failedJobs').textContent = stats.failedJobs || 0;
        document.getElementById('totalBusinesses').textContent = stats.totalBusinesses || 0;
        document.getElementById('activeGovernorates').textContent = stats.activeGovernorates || 0;
    }

    updateProgressTable(jobs) {
        const tbody = document.getElementById('progressTableBody');
        
        if (!jobs || jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="no-data">No active jobs</td></tr>';
            return;
        }

        tbody.innerHTML = jobs.map(job => `
            <tr class="job-row status-${job.status}">
                <td>${job.governorate}</td>
                <td>${job.city}</td>
                <td>${job.category}</td>
                <td><span class="status-badge status-${job.status}">${job.status}</span></td>
                <td>${job.saved_count || 0}</td>
                <td>${job.target_count || 10}</td>
                <td>
                    <div class="progress-bar-small">
                        <div class="progress-fill" style="width: ${this.calculateProgress(job)}%"></div>
                    </div>
                    <span class="progress-text">${this.calculateProgress(job)}%</span>
                </td>
                <td class="step-text">${job.current_step || 'Unknown'}</td>
                <td class="time-text">${this.formatTime(job.updated_at)}</td>
            </tr>
        `).join('');
    }

    updateBusinessTable(businesses) {
        const tbody = document.getElementById('businessTableBody');
        
        if (!businesses || businesses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No businesses found</td></tr>';
            return;
        }

        tbody.innerHTML = businesses.slice(0, 20).map(business => `
            <tr>
                <td class="business-name">${business.name}</td>
                <td>${business.governorate}</td>
                <td>${business.city}</td>
                <td>${business.category}</td>
                <td>${business.phone || 'N/A'}</td>
                <td><span class="source-badge">${business.source}</span></td>
                <td>${this.formatConfidence(business.confidence)}</td>
                <td class="time-text">${this.formatTime(business.created_at)}</td>
            </tr>
        `).join('');
    }

    updateFailedTable(jobs) {
        const tbody = document.getElementById('failedTableBody');
        
        if (!jobs || jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No failed jobs</td></tr>';
            return;
        }

        tbody.innerHTML = jobs.map(job => `
            <tr class="failed-row">
                <td>${job.governorate}</td>
                <td>${job.city}</td>
                <td>${job.category}</td>
                <td class="error-text">${job.error_message || 'Unknown error'}</td>
                <td>${job.retry_count || 0}</td>
                <td class="time-text">${this.formatTime(job.updated_at)}</td>
                <td>
                    <button class="btn btn-small btn-outline retry-btn" data-job-id="${job.id}">
                        🔁 Retry
                    </button>
                </td>
            </tr>
        `).join('');

        // Bind retry button events
        tbody.querySelectorAll('.retry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.retryJob(e.target.dataset.jobId);
            });
        });
    }

    async retryJob(jobId) {
        try {
            const response = await fetch(this.apiBase + `/retry-job/${jobId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Job retry initiated');
                this.loadDashboard();
            } else {
                this.showError(result.error || 'Failed to retry job');
            }
        } catch (error) {
            this.showError('Failed to retry job');
            console.error('Retry job error:', error);
        }
    }

    calculateProgress(job) {
        const saved = job.saved_count || 0;
        const target = job.target_count || 10;
        return Math.min(100, Math.round((saved / target) * 100));
    }

    formatConfidence(confidence) {
        if (!confidence) return 'N/A';
        return `${Math.round(confidence * 100)}%`;
    }

    formatTime(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    showValidation(message) {
        const element = document.getElementById('validationMessage');
        element.textContent = message;
        element.className = 'validation-message validation-warning';
        setTimeout(() => {
            element.textContent = '';
            element.className = 'validation-message';
        }, 5000);
    }

    showError(message) {
        const element = document.getElementById('validationMessage');
        element.textContent = message;
        element.className = 'validation-message validation-error';
        setTimeout(() => {
            element.textContent = '';
            element.className = 'validation-message';
        }, 5000);
    }

    showSuccess(message) {
        const element = document.getElementById('validationMessage');
        element.textContent = message;
        element.className = 'validation-message validation-success';
        setTimeout(() => {
            element.textContent = '';
            element.className = 'validation-message';
        }, 5000);
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadDashboard();
        }, this.refreshInterval);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});
