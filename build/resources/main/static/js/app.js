$(document).ready(function () {
    // State
    let transactions = [];
    let myChart = null;
    let pieChart = null;

    // Load initial data
    loadTransactions();

    // Navigation
    $('.nav-links li').click(function () {
        const target = $(this).data('target');

        $('.nav-links li').removeClass('active');
        $(this).addClass('active');

        $('.view').removeClass('active');
        $('#' + target).addClass('active');

        $('#page-title').text($(this).text().trim());

        // Re-render charts when switching to dashboard to fix resizing issues
        if (target === 'dashboard') {
            updateDashboard();
        }
    });

    // File Upload (Drag & Drop)
    const dropZone = $('#drop-zone');
    const fileInput = $('#file-input');

    dropZone.click(() => fileInput.click());

    fileInput.change(function (e) {
        handleFile(e.target.files[0]);
    });

    dropZone.on('dragover', function (e) {
        e.preventDefault();
        $(this).css('background', 'rgba(255,255,255,0.8)');
    });

    dropZone.on('dragleave', function (e) {
        e.preventDefault();
        $(this).css('background', 'rgba(255,255,255,0.5)');
    });

    dropZone.on('drop', function (e) {
        e.preventDefault();
        $(this).css('background', 'rgba(255,255,255,0.5)');
        const files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            $('#image-preview').attr('src', e.target.result);
            $('#preview-container').show();
        };
        reader.readAsDataURL(file);

        // Upload & Extract
        const formData = new FormData();
        formData.append('file', file);

        dropZone.find('p').text('Extracting text...');

        axios.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(response => {
            const data = response.data;
            fillForm(data);
            $('#extraction-result').fadeIn();
            dropZone.find('p').text('Drag & Drop Receipt Image or Click to Upload');
        }).catch(err => {
            console.error(err);
            alert('Failed to extract text');
            dropZone.find('p').text('Drag & Drop Receipt Image or Click to Upload');
        });
    }

    function fillForm(data) {
        $('#t-date').val(data.date);
        $('#t-place').val(data.place);
        $('#t-amount').val(data.amount);
        if (data.category) $('#t-category').val(data.category);
        if (data.type) $('#t-type').val(data.type);
    }

    // Submit Transaction
    $('#transaction-form').submit(function (e) {
        e.preventDefault();
        const transaction = {
            date: $('#t-date').val(),
            place: $('#t-place').val(),
            amount: parseFloat($('#t-amount').val()),
            category: $('#t-category').val(),
            type: $('#t-type').val()
        };

        axios.post('/api/transactions', transaction)
            .then(res => {
                alert('Saved successfully!');
                $('#transaction-form')[0].reset();
                $('#preview-container').hide();
                $('#extraction-result').hide();
                loadTransactions(); // Reload data
            })
            .catch(err => alert('Error saving transaction'));
    });

    function loadTransactions() {
        axios.get('/api/transactions')
            .then(res => {
                transactions = res.data;
                renderTable();
                updateDashboard();
            });
    }

    function renderTable() {
        const tbody = $('#transaction-table tbody');
        tbody.empty();
        // Sort by date desc
        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        sorted.forEach(t => {
            const row = `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.category}</td>
                    <td>${t.place}</td>
                    <td style="color: ${t.type === 'INCOME' ? '#2ecc71' : '#e74c3c'}">${t.type}</td>
                    <td>₩${t.amount.toLocaleString()}</td>
                    <td><button onclick="deleteTransaction('${t.id}')" style="border:none;background:none;cursor:pointer;color:#e74c3c;"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    window.deleteTransaction = function (id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            axios.delete(`/api/transactions/${id}`).then(loadTransactions);
        }
    };

    function updateDashboard() {
        // Stats
        let income = 0;
        let expense = 0;
        const categoryMap = {};

        transactions.forEach(t => {
            if (t.type === 'INCOME') income += t.amount;
            else {
                expense += t.amount;
                categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
            }
        });

        $('#total-income').text(`₩${income.toLocaleString()}`);
        $('#total-expense').text(`₩${expense.toLocaleString()}`);
        $('#total-balance').text(`₩${(income - expense).toLocaleString()}`);

        if ($('#dashboard').hasClass('active')) {
            renderCharts(transactions, categoryMap);
        }
    }

    function renderCharts(transactions, categoryMap) {
        const ctxBar = document.getElementById('expenseChart').getContext('2d');
        const ctxPie = document.getElementById('categoryPieChart').getContext('2d');

        if (myChart) myChart.destroy();
        if (pieChart) pieChart.destroy();

        // Bar Chart: Daily Expenses
        const dateMap = {};
        transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
            dateMap[t.date] = (dateMap[t.date] || 0) + t.amount;
        });

        const sortedDates = Object.keys(dateMap).sort();

        myChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Daily Expenses (₩)',
                    data: sortedDates.map(d => dateMap[d]),
                    backgroundColor: '#4facfe',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Pie Chart
        pieChart = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryMap),
                datasets: [{
                    data: Object.values(categoryMap),
                    backgroundColor: ['#ff9a9e', '#fad0c4', '#a18cd1', '#fbc2eb', '#8fd3f4', '#84fab0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
});
