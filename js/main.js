// Глобальные переменные
let allIncidents = [];
let filteredIncidents = [];
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;

// Функция для форматирования даты
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Функция для определения класса региона
function getRegionClass(region) {
    if (!region) return "region-other";
    
    if (region.includes("USA") || region === "USA" || region.includes("United States")) return "region-usa";
    if (region.includes("Canada") || region === "Canada") return "region-usa";
    
    const europeRegions = ["Germany", "France", "UK", "Sweden", "Finland", "Europe", "Italy", 
                          "Spain", "Belgium", "Netherlands", "Austria", "Switzerland", "Norway",
                          "Denmark", "Portugal", "Ireland", "Poland", "Lithuania", "Estonia",
                          "Croatia", "Greece", "Bulgaria"];
    if (europeRegions.some(europeRegion => region.includes(europeRegion))) return "region-europe";
    
    const asiaRegions = ["Japan", "Taiwan", "China", "India", "Vietnam", "South Korea"];
    if (asiaRegions.some(asiaRegion => region.includes(asiaRegion))) return "region-asia";
    
    const middleEastRegions = ["Lebanon", "Iran", "Israel", "Turkey", "Saudi Arabia", "UAE", 
                              "Qatar", "Middle East", "Syria", "Jordan", "Azerbaijan"];
    if (middleEastRegions.some(middleEastRegion => region.includes(middleEastRegion))) return "region-middle-east";
    
    return "region-other";
}

// Функция для отображения данных в таблице
function renderTable() {
    const tableBody = document.getElementById('table-body');
    const incidentCount = document.getElementById('incident-count');
    const noResults = document.getElementById('no-results');
    const errorMessage = document.getElementById('error-message');
    const pageInfo = document.getElementById('page-info');
    const pageInfoDetailed = document.getElementById('page-info-detailed');
    
    // Скрываем сообщение об ошибке
    errorMessage.style.display = 'none';
    
    // Рассчитываем пагинацию
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredIncidents.length);
    const currentPageData = filteredIncidents.slice(startIndex, endIndex);
    
    // Обновляем количество инцидентов
    incidentCount.textContent = filteredIncidents.length;
    
    // Обновляем информацию о странице
    pageInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredIncidents.length}`;
    pageInfoDetailed.textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Очищаем таблицу
    tableBody.innerHTML = '';
    
    // Если данных нет, показываем сообщение
    if (filteredIncidents.length === 0) {
        noResults.style.display = 'block';
        return;
    } else {
        noResults.style.display = 'none';
    }
    
    // Добавляем строки для каждого инцидента на текущей странице
    currentPageData.forEach(incident => {
        const row = document.createElement('tr');
        
        // Форматируем дату
        let date = "Unknown";
        if (incident.Date && incident.Date.$date) {
            date = formatDate(incident.Date.$date);
        }
        
        // Берем данные как есть из JSON
        const victim = incident.Victim || "Unknown";
        const region = incident.Region || "Unknown";
        const industry = incident.Industry || "Unknown";
        const threatActor = incident['Threat Actor'] || "Unknown";
        const attackType = incident['OT Attack Type'] || "Unknown";
        const consequences = incident['OT / ICS Physical Consequences'] || "Unknown";
        let summary = incident['Incident Summary'] || "No summary available";
        
        // Получаем References и добавляем их к summary
        const references = incident['References'] || incident['Reference'] || incident['Source'] || "";
        
        // Добавляем References к summary, если они есть
        if (references) {
            // Если references это массив, объединяем в строку
            if (Array.isArray(references)) {
                summary += `<br><br><strong>References:</strong> ${references.join(', ')}`;
            } else {
                summary += `<br><br><strong>References:</strong> ${references}`;
            }
        }
        
        // Определяем класс региона
        const regionClass = getRegionClass(region);
        
        // Определяем, нужен ли специальный класс для длинного текста consequences
        const consequencesClass = consequences.length > 100 ? "consequences-long" : "";
        
        // Создаем HTML для строки
        row.innerHTML = `
            <td>${date}</td>
            <td>${victim}</td>
            <td><span class="region-badge ${regionClass}">${region}</span></td>
            <td><span class="industry-tag">${industry}</span></td>
            <td>${threatActor}</td>
            <td>${attackType}</td>
            <td class="consequences ${consequencesClass}" title="${consequences}">${consequences}</td>
            <td>
                <div class="summary-text">${summary}</div>
                <a href="#" class="more-link" onclick="expandSummary(this); return false;">Read more</a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Обновляем пагинацию
    updatePagination();
}

// Функция для фильтрации данных
function filterData() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const regionFilter = document.getElementById('region-filter').value;
    const industryFilter = document.getElementById('industry-filter').value;
    
    filteredIncidents = allIncidents.filter(incident => {
        // Берем данные как есть из JSON для поиска
        const victim = incident.Victim || "";
        const region = incident.Region || "";
        const industry = incident.Industry || "";
        const threatActor = incident['Threat Actor'] || "";
        const attackType = incident['OT Attack Type'] || "";
        const consequences = incident['OT / ICS Physical Consequences'] || "";
        let summary = incident['Incident Summary'] || "";
        
        // Получаем References для поиска
        const references = incident['References'] || incident['Reference'] || incident['Source'] || "";
        
        // Добавляем References к summary для поиска
        if (references) {
            const referencesText = Array.isArray(references) ? references.join(' ') : references;
            summary += " References: " + referencesText;
        }
        
        // Поиск по всем текстовым полям, включая References
        const searchFields = [
            victim,
            region,
            industry,
            threatActor,
            attackType,
            consequences,
            summary
        ].join(' ').toLowerCase();
        
        const matchesSearch = searchInput === '' || searchFields.includes(searchInput);
        const matchesRegion = regionFilter === '' || region.includes(regionFilter);
        const matchesIndustry = industryFilter === '' || industry.includes(industryFilter);
        
        return matchesSearch && matchesRegion && matchesIndustry;
    });
    
    // Сбрасываем на первую страницу при фильтрации
    currentPage = 1;
    updateTotalPages();
    renderTable();
}

// Функция для разворачивания/сворачивания текста
function expandSummary(link) {
    const summaryDiv = link.previousElementSibling;
    
    if (summaryDiv.style.maxHeight && summaryDiv.style.maxHeight !== '40px') {
        summaryDiv.style.maxHeight = '40px';
        summaryDiv.style.webkitLineClamp = '2';
        link.textContent = 'Read more';
    } else {
        summaryDiv.style.maxHeight = 'none';
        summaryDiv.style.webkitLineClamp = 'unset';
        link.textContent = 'Show less';
    }
}

// Функция для обновления общего количества страниц
function updateTotalPages() {
    totalPages = Math.ceil(filteredIncidents.length / pageSize);
}

// Функция для обновления пагинации
function updatePagination() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');
    
    // Обновляем состояние кнопок
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    // Обновляем номера страниц
    pageNumbers.innerHTML = '';
    
    // Показываем максимум 5 страниц
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Корректируем, если мы в начале
    if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
    }
    
    // Корректируем, если мы в конце
    if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageNumber = document.createElement('span');
        pageNumber.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageNumber.textContent = i;
        pageNumber.onclick = () => {
            currentPage = i;
            renderTable();
        };
        pageNumbers.appendChild(pageNumber);
    }
}

// Функция для загрузки данных из JSON файла
async function loadJSONData() {
    const loadingText = document.getElementById('loading-text');
    const errorMessage = document.getElementById('error-message');
    
    try {
        // Пытаемся загрузить данные из JSON файла
        loadingText.textContent = 'Loading data from JSON file...';
        
        // Укажите правильный путь к вашему JSON файлу
        const response = await fetch('local.CyberIncidentsDB.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Проверяем, что данные загружены
        if (data && Array.isArray(data)) {
            allIncidents = data;
            filteredIncidents = [...allIncidents];
            loadingText.textContent = `Loaded ${data.length} incidents`;
            
            // Обновляем количество страниц
            updateTotalPages();
            
            // Ждем немного перед рендерингом, чтобы пользователь увидел сообщение
            setTimeout(() => {
                renderTable();
            }, 500);
        } else {
            throw new Error('Invalid JSON format or empty data');
        }
        
    } catch (error) {
        console.error('Error loading JSON data:', error);
        loadingText.textContent = 'Error loading data';
        errorMessage.style.display = 'block';
        errorMessage.innerHTML = `Error loading data: ${error.message}<br>Make sure the file 'local.CyberIncidentsDB.json' is in the same directory as this HTML file.`;
    }
}

// Функция для извлечения уникальных регионов и отраслей для фильтров
function populateFilterOptions() {
    const regionFilter = document.getElementById('region-filter');
    const industryFilter = document.getElementById('industry-filter');
    
    // Если данных еще нет, выходим
    if (allIncidents.length === 0) return;
    
    // Извлекаем уникальные регионы
    const regions = new Set();
    allIncidents.forEach(incident => {
        const region = incident.Region || "Unknown";
        if (region && region !== "Unknown") {
            // Разделяем регионы, если их несколько (например, "Finland, Sweden, Norway, Germany")
            const regionParts = region.split(',').map(r => r.trim());
            regionParts.forEach(part => {
                if (part) regions.add(part);
            });
        }
    });
    
    // Сортируем и добавляем в фильтр
    const sortedRegions = Array.from(regions).sort();
    sortedRegions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionFilter.appendChild(option);
    });
    
    // Извлекаем уникальные отрасли
    const industries = new Set();
    allIncidents.forEach(incident => {
        const industry = incident.Industry;
        if (industry && industry !== "Unknown") {
            industries.add(industry);
        }
    });
    
    // Сортируем и добавляем в фильтр
    const sortedIndustries = Array.from(industries).sort();
    sortedIndustries.forEach(industry => {
        const option = document.createElement('option');
        option.value = industry;
        option.textContent = industry;
        industryFilter.appendChild(option);
    });
}

// ============ ФУНКЦИИ ДЛЯ МОДАЛЬНОГО ОКНА ============

// Открыть модальное окно
function openIncidentModal() {
    document.getElementById('incidentModal').style.display = 'block';
    // Устанавливаем сегодняшнюю дату по умолчанию
    document.getElementById('incidentDate').valueAsDate = new Date();
    // Скрываем сообщения
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessageModal').style.display = 'none';
}

// Закрыть модальное окно
function closeIncidentModal() {
    document.getElementById('incidentModal').style.display = 'none';
    // Сбросить форму
    document.getElementById('incidentForm').reset();
}

// Отправить форму
function submitIncidentForm(event) {
    event.preventDefault();
    
    // Собираем данные из формы
    const formData = {
        date: document.getElementById('incidentDate').value,
        victim: document.getElementById('victim').value,
        region: document.getElementById('region').value,
        industry: document.getElementById('industry').value,
        threatActor: document.getElementById('threatActor').value,
        attackType: document.getElementById('attackType').value,
        physicalConsequences: document.getElementById('physicalConsequences').value,
        incidentSummary: document.getElementById('incidentSummary').value,
        references: document.getElementById('references').value,
        contactName: document.getElementById('contactName').value,
        contactEmail: document.getElementById('contactEmail').value,
        submissionDate: new Date().toISOString()
    };
    
    // Проверяем обязательные поля
    if (!formData.date || !formData.victim || !formData.region || !formData.industry || 
        !formData.threatActor || !formData.attackType || !formData.incidentSummary || 
        !formData.contactName || !formData.contactEmail) {
        document.getElementById('errorMessageModal').style.display = 'block';
        document.getElementById('successMessage').style.display = 'none';
        return;
    }
    
    // Формируем тему письма
    const subject = `New Cyber Incident Report: ${formData.victim} - ${formData.date}`;
    
    // Формируем тело письма
    let body = `NEW CYBER INCIDENT REPORT\n`;
    body += `========================================\n\n`;
    body += `INCIDENT DETAILS:\n`;
    body += `Date: ${formData.date}\n`;
    body += `Victim/Organization: ${formData.victim}\n`;
    body += `Region/Country: ${formData.region}\n`;
    body += `Industry: ${formData.industry}\n`;
    body += `Threat Actor: ${formData.threatActor}\n`;
    body += `OT Attack Type: ${formData.attackType}\n`;
    body += `Physical Consequences: ${formData.physicalConsequences || 'Not specified'}\n`;
    body += `\nINCIDENT SUMMARY:\n${formData.incidentSummary}\n`;
    body += `\nREFERENCES/SOURCES:\n${formData.references || 'Not provided'}\n`;
    body += `\n========================================\n`;
    body += `SUBMITTER INFORMATION:\n`;
    body += `Name: ${formData.contactName}\n`;
    body += `Email: ${formData.contactEmail}\n`;
    body += `Submission Date: ${new Date(formData.submissionDate).toLocaleString()}\n`;
    body += `\n========================================\n`;
    body += `This report was submitted via the Cyber Incidents Database form.`;
    
    // Кодируем для URL
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    // Создаем mailto ссылку
    const mailtoLink = `mailto:dorimedont.epifanovich@yandex.ru?subject=${encodedSubject}&body=${encodedBody}`;
    
    // Открываем почтовый клиент
    window.open(mailtoLink, '_blank');
    
    // Показываем сообщение об успехе
    document.getElementById('successMessage').style.display = 'block';
    document.getElementById('errorMessageModal').style.display = 'none';
    
    // Сбрасываем форму
    document.getElementById('incidentForm').reset();
    
    // Закрываем окно через 3 секунды
    setTimeout(() => {
        closeIncidentModal();
    }, 3000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Загружаем данные из JSON файла
    await loadJSONData();
    
    // После загрузки данных заполняем фильтры
    populateFilterOptions();
    
    // Добавляем обработчики событий для фильтров
    document.getElementById('search-input').addEventListener('input', filterData);
    document.getElementById('region-filter').addEventListener('change', filterData);
    document.getElementById('industry-filter').addEventListener('change', filterData);
    
    // Добавляем обработчики для пагинации
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
    
    // Добавляем обработчик для изменения размера страницы
    document.getElementById('page-size').addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        updateTotalPages();
        renderTable();
    });
    
    // ============ ОБРАБОТЧИКИ ДЛЯ МОДАЛЬНОГО ОКНА ============
    
    // Кнопка для открытия модального окна
    document.getElementById('addIncidentBtn').addEventListener('click', openIncidentModal);
    
    // Кнопка закрытия модального окна
    document.querySelector('.close-modal').addEventListener('click', closeIncidentModal);
    document.querySelector('.cancel-btn').addEventListener('click', closeIncidentModal);
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('incidentModal');
        if (event.target === modal) {
            closeIncidentModal();
        }
    });
    
    // Обработка отправки формы
    document.getElementById('incidentForm').addEventListener('submit', submitIncidentForm);
});
