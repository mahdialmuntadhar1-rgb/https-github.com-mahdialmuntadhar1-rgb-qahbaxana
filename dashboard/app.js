class Dashboard {
    constructor() {
        this.apiBase = '/api';
        this.refreshInterval = 5000; // 5 seconds
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    bindEvents() {
        document.getElementById('startGovernorateBtn').addEventListener('click', () => this.showGovernorateModal());
        document.getElementById('startAllBtn').addEventListener('click', () => this.startAllGovernorates());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadDashboard());
        
        document.getElementById('confirmStartGovernorate').addEventListener('click', () => this.startGovernorate());
        document.getElementById('cancelStartGovernorate').addEventListener('click', () => this.hideGovernorateModal());
    }

    async loadDashboard() {
        try {
            const [dashboardData, summaryData] = await Promise.all([
                this.fetch('/dashboard'),
                this.fetch('/dashboard/summary')
            ]);

            this.updateStats(dashboardData.stats);
            this.updateJobs(dashboardData.jobs);
            this.updateLocations(summaryData.locations);
            this.populateGovernorateSelect(dashboardData.availableGovernorates);
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

    updateStats(stats) {
        document.getElementById('runningJobs').textContent = stats.runningJobs || 0;
        document.getElementById('pendingJobs').textContent = stats.pendingJobs || 0;
        document.getElementById('totalBusinesses').textContent = stats.totalBusinesses || 0;
        document.getElementById('activeLocations').textContent = stats.totalLocations || 0;
    }

    updateJobs(jobs) {
        const jobsList = document.getElementById('jobsList');
        
        if (jobs.length === 0) {
            jobsList.innerHTML = '<p>No active jobs</p>';
            return;
        }

        jobsList.innerHTML = jobs.map(job => `
            <div class="job-item">
                <div class="job-header">
                    <div class="job-title">${job.governorate} - ${job.city} - ${job.category}</div>
                    <div class="job-status status-${job.status}">${job.status}</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${job.progress || 0}%"></div>
                </div>
                <div class="job-details">
                    <div class="job-detail">Target: ${job.target_count}</div>
                    <div class="job-detail">Saved: ${job.saved_count}</div>
                    <div class="job-detail">Progress: ${Math.round((job.saved_count / job.target_count) * 100)}%</div>
                    <div class="job-detail">Step: ${job.current_step || 'Unknown'}</div>
                </div>
                ${job.recentLogs && job.recentLogs.length > 0 ? `
                    <div class="job-logs">
                        <strong>Recent Logs:</strong>
                        ${job.recentLogs.map(log => `
                            <div class="log-item">
                                <span class="log-time">${new Date(log.created_at).toLocaleTimeString()}</span>
                                ${log.message}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    updateLocations(locations) {
        const locationsList = document.getElementById('locationsList');
        
        if (locations.length === 0) {
            locationsList.innerHTML = '<p>No active locations</p>';
            return;
        }

        locationsList.innerHTML = locations.map(location => `
            <div class="location-item">
                <div class="location-header">
                    <div class="location-title">${location.governorate} - ${location.city}</div>
                    <div class="location-progress">${location.totalSaved}/${location.totalTarget} businesses</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(location.totalSaved / location.totalTarget) * 100}%"></div>
                </div>
                <div class="categories-grid">
                    ${Object.entries(location.categories).map(([category, catData]) => `
                        <div class="category-item">
                            <div class="category-name">${category}</div>
                            <div class="category-status status-${catData.status}">
                                ${catData.saved}/${catData.target}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    populateGovernorateSelect(governorates) {
        const select = document.getElementById('governorateSelect');
        select.innerHTML = '<option value="">Choose a governorate...</option>' +
            governorates.map(gov => `<option value="${gov}">${gov}</option>`).join('');
    }

    showGovernorateModal() {
        document.getElementById('governorateModal').style.display = 'flex';
    }

    hideGovernorateModal() {
        document.getElementById('governorateModal').style.display = 'none';
    }

    async startGovernorate() {
        const select = document.getElementById('governorateSelect');
        const governorate = select.value;

        if (!governorate) {
            this.showError('Please select a governorate');
            return;
        }

        try {
            const response = await fetch(this.apiBase + '/start-governorate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ governorate })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(`Started collection for ${governorate}`);
                this.hideGovernorateModal();
                this.loadDashboard();
            } else {
                this.showError(result.error || 'Failed to start governorate');
            }
        } catch (error) {
            this.showError('Failed to start governorate');
            console.error('Start governorate error:', error);
        }
    }

    async startAllGovernorates() {
        if (!confirm('This will start collection for all 18 governorates. This will take several hours. Continue?')) {
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

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existing = document.querySelector('.error, .success');
        if (existing) {
            existing.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        
        document.querySelector('.container').insertBefore(messageDiv, document.querySelector('.stats'));

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
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
