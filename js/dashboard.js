// Chart instances
let dateChart = null;
let industryChart = null;
let countryChart = null;

// Function to generate colors for charts
function generateColors(count, alpha = 1) {
    const colors = [
        `rgba(57, 73, 171, ${alpha})`,
        `rgba(76, 175, 80, ${alpha})`,
        `rgba(244, 67, 54, ${alpha})`,
        `rgba(255, 152, 0, ${alpha})`,
        `rgba(103, 58, 183, ${alpha})`,
        `rgba(33, 150, 243, ${alpha})`,
        `rgba(0, 150, 136, ${alpha})`,
        `rgba(233, 30, 99, ${alpha})`,
        `rgba(121, 85, 72, ${alpha})`,
        `rgba(158, 158, 158, ${alpha})`
    ];
    
    // If we need more colors than available, repeat the pattern
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

// Function to prepare data for charts
function prepareChartData(incidents) {
    // Filter by time range if needed
    const timeRange = document.getElementById('timeRange').value;
    let filteredIncidents = [...incidents];
    
    if (timeRange !== 'all') {
        const now = new Date();
        let yearsBack = 0;
        
        switch(timeRange) {
            case '5years': yearsBack = 5; break;
            case '3years': yearsBack = 3; break;
            case '1year': yearsBack = 1; break;
        }
        
        filteredIncidents = incidents.filter(incident => {
            if (!incident.Date || !incident.Date.$date) return false;
            const incidentDate = new Date(incident.Date.$date);
            const cutoffDate = new Date(now.getFullYear() - yearsBack, now.getMonth(), now.getDate());
            return incidentDate >= cutoffDate;
        });
    }
    
    // Prepare data for date chart (group by year-month)
    const dateData = {};
    filteredIncidents.forEach(incident => {
        if (incident.Date && incident.Date.$date) {
            const date = new Date(incident.Date.$date);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            dateData[yearMonth] = (dateData[yearMonth] || 0) + 1;
        }
    });
    
    // Sort dates chronologically
    const sortedDates = Object.keys(dateData).sort();
    const dateLabels = sortedDates.map(d => {
        const [year, month] = d.split('-');
        return `${year}-${month}`;
    });
    const dateValues = sortedDates.map(d => dateData[d]);
    
    // Prepare data for industry chart
    const industryData = {};
    filteredIncidents.forEach(incident => {
        const industry = incident.Industry || 'Unknown';
        industryData[industry] = (industryData[industry] || 0) + 1;
    });
    
    // Get top 10 industries
    const sortedIndustries = Object.entries(industryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const industryLabels = sortedIndustries.map(item => item[0]);
    const industryValues = sortedIndustries.map(item => item[1]);
    const industryColors = generateColors(industryLabels.length, 0.7);
    
    // Prepare data for country chart
    const countryData = {};
    filteredIncidents.forEach(incident => {
        const region = incident.Region || 'Unknown';
        // Split by comma to handle multiple countries
        const countries = region.split(',').map(c => c.trim()).filter(c => c);
        countries.forEach(country => {
            countryData[country] = (countryData[country] || 0) + 1;
        });
    });
    
    // Get top 10 countries
    const sortedCountries = Object.entries(countryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const countryLabels = sortedCountries.map(item => item[0]);
    const countryValues = sortedCountries.map(item => item[1]);
    const countryColors = generateColors(countryLabels.length, 0.7);
    
    return {
        filteredIncidents,
        dateLabels,
        dateValues,
        industryLabels,
        industryValues,
        industryColors,
        countryLabels,
        countryValues,
        countryColors
    };
}

// Function to create or update charts
function updateCharts(incidents) {
    const chartData = prepareChartData(incidents);
    
    // Update stats cards
    document.getElementById('totalIncidents').textContent = chartData.filteredIncidents.length;
    document.getElementById('uniqueCountries').textContent = 
        new Set(chartData.countryLabels).size;
    document.getElementById('uniqueIndustries').textContent = 
        new Set(chartData.industryLabels).size;
    
    // Calculate average per year
    const years = new Set();
    chartData.filteredIncidents.forEach(incident => {
        if (incident.Date && incident.Date.$date) {
            const year = new Date(incident.Date.$date).getFullYear();
            years.add(year);
        }
    });
    const avgPerYear = years.size > 0 ? 
        (chartData.filteredIncidents.length / years.size).toFixed(1) : 0;
    document.getElementById('avgYearIncidents').textContent = avgPerYear;
    
    // Update chart summaries
    document.getElementById('dateChartSummary').textContent = 
        `${chartData.dateValues.length} time periods with ${chartData.filteredIncidents.length} total incidents`;
    
    document.getElementById('industryChartSummary').textContent = 
        `Top ${chartData.industryLabels.length} industries shown. ${chartData.industryValues[0] || 0} incidents in leading industry.`;
    
    document.getElementById('countryChartSummary').textContent = 
        `Top ${chartData.countryLabels.length} countries shown. ${chartData.countryValues[0] || 0} incidents in leading country.`;
    
    // Destroy existing charts if they exist
    if (dateChart) dateChart.destroy();
    if (industryChart) industryChart.destroy();
    if (countryChart) countryChart.destroy();
    
    // Wait for Chart.js to load if needed
    if (typeof Chart === 'undefined') {
        setTimeout(() => updateCharts(incidents), 100);
        return;
    }
    
    // Create Date Chart (Line Chart)
    const dateCtx = document.getElementById('dateChart').getContext('2d');
    dateChart = new Chart(dateCtx, {
        type: 'line',
        data: {
            labels: chartData.dateLabels,
            datasets: [{
                label: 'Incidents',
                data: chartData.dateValues,
                borderColor: 'rgba(57, 73, 171, 1)',
                backgroundColor: 'rgba(57, 73, 171, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Incidents'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time Period'
                    }
                }
            }
        }
    });
    
    // Create Industry Chart (Bar Chart)
    const industryCtx = document.getElementById('industryChart').getContext('2d');
    industryChart = new Chart(industryCtx, {
        type: 'bar',
        data: {
            labels: chartData.industryLabels,
            datasets: [{
                label: 'Incidents',
                data: chartData.industryValues,
                backgroundColor: chartData.industryColors,
                borderColor: chartData.industryColors.map(c => c.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Incidents'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
    
    // Create Country Chart (Horizontal Bar Chart)
    const countryCtx = document.getElementById('countryChart').getContext('2d');
    countryChart = new Chart(countryCtx, {
        type: 'bar',
        data: {
            labels: chartData.countryLabels,
            datasets: [{
                label: 'Incidents',
                data: chartData.countryValues,
                backgroundColor: chartData.countryColors,
                borderColor: chartData.countryColors.map(c => c.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Incidents'
                    }
                }
            }
        }
    });
}

// Function to refresh dashboard
function refreshDashboard() {
    if (allIncidents.length > 0) {
        updateCharts(allIncidents);
    }
}

// Override the filterData function to update charts when filtering
const originalFilterData = filterData;
filterData = function() {
    originalFilterData();
    
    // Update charts with filtered data
    updateCharts(filteredIncidents);
};

// Initialize dashboard after data is loaded
function initDashboard() {
    // Set up dashboard controls
    document.getElementById('refreshDashboard').addEventListener('click', refreshDashboard);
    document.getElementById('timeRange').addEventListener('change', refreshDashboard);
    
    // Initial dashboard render
    setTimeout(() => refreshDashboard(), 500);
}

// Wait for data to load and initialize dashboard
const checkDataLoaded = setInterval(() => {
    if (allIncidents.length > 0) {
        clearInterval(checkDataLoaded);
        initDashboard();
    }
}, 500);
