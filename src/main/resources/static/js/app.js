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

        dropZone.find('p').text('텍스트 추출 중...');

        axios.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(response => {
            const extractedTransactions = response.data; // Now an array
            displayExtractedTransactions(extractedTransactions);
            $('.upload-split-layout').addClass('active');
            $('#extraction-result').fadeIn();
            dropZone.find('p').text('영수증 이미지를 드래그하거나 클릭하여 업로드하세요');
        }).catch(err => {
            console.error(err);
            alert('텍스트 추출에 실패했습니다');
            dropZone.find('p').text('영수증 이미지를 드래그하거나 클릭하여 업로드하세요');
        });
    }

    function displayExtractedTransactions(extractedTransactions) {
        const container = $('#extracted-transactions-list');
        container.empty();

        extractedTransactions.forEach((transaction, index) => {
            const uniqueId = `item-${Date.now()}-${index}`; // Generate unique ID
            const item = $(`
                <div class="extracted-item" data-id="${uniqueId}">
                    <div class="extracted-item-header">
                        <h4>거래 ${index + 1}</h4>
                        <button class="remove-btn" data-remove-id="${uniqueId}">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>날짜</label>
                            <input type="date" class="ext-date" value="${transaction.date}" />
                        </div>
                        <div class="form-group">
                            <label>장소</label>
                            <input type="text" class="ext-place" value="${transaction.place}" />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>금액</label>
                            <input type="number" class="ext-amount" value="${transaction.amount}" />
                        </div>
                        <div class="form-group">
                            <label>카테고리</label>
                            <select class="ext-category">
                                <option value="Food" ${transaction.category === 'Food' ? 'selected' : ''}>음식</option>
                                <option value="Transportation" ${transaction.category === 'Transportation' ? 'selected' : ''}>교통</option>
                                <option value="Shopping" ${transaction.category === 'Shopping' ? 'selected' : ''}>쇼핑</option>
                                <option value="Entertainment" ${transaction.category === 'Entertainment' ? 'selected' : ''}>여가</option>
                                <option value="Healthcare" ${transaction.category === 'Healthcare' ? 'selected' : ''}>의료</option>
                                <option value="Other" ${transaction.category === 'Other' ? 'selected' : ''}>기타</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>유형</label>
                            <select class="ext-type">
                                <option value="EXPENSE" ${transaction.type === 'EXPENSE' ? 'selected' : ''}>지출</option>
                                <option value="INCOME" ${transaction.type === 'INCOME' ? 'selected' : ''}>수입</option>
                            </select>
                        </div>
                    </div>
                </div>
            `);
            container.append(item);
        });

        // Attach remove button handlers
        $('.remove-btn').off('click').on('click', function () {
            const removeId = $(this).data('remove-id');
            $(`.extracted-item[data-id="${removeId}"]`).fadeOut(300, function () {
                $(this).remove();
                if ($('.extracted-item').length === 0) {
                    $('#save-all-btn').hide();
                    $('#extraction-result').hide();
                    $('.upload-split-layout').removeClass('active');
                }
            });
        });

        // Show save all button
        $('#save-all-btn').show();
    }

    window.removeExtractedItem = function (index) {
        $(`.extracted-item[data-index="${index}"]`).remove();
        if ($('.extracted-item').length === 0) {
            $('#save-all-btn').hide();
        }
    };

    // Save all extracted transactions
    $('#save-all-btn').off('click').on('click', function () {
        const items = $('.extracted-item');
        const transactions = [];

        console.log(`Preparing to save ${items.length} transactions...`); // Debug log

        items.each(function () {
            const item = $(this);
            const transaction = {
                date: item.find('.ext-date').val(),
                place: item.find('.ext-place').val(),
                amount: parseFloat(item.find('.ext-amount').val()),
                category: item.find('.ext-category').val(),
                type: item.find('.ext-type').val()
            };
            console.log('Transaction to save:', transaction); // Debug log
            transactions.push(transaction);
        });

        // Use batch endpoint to save all transactions at once
        axios.post('/api/transactions/batch', transactions)
            .then(response => {
                console.log('Saved transactions:', response.data);
                alert(`${response.data.length}개의 거래가 저장되었습니다!`);
                $('#extracted-transactions-list').empty();
                $('#preview-container').hide();
                $('#extraction-result').hide();
                $('#save-all-btn').hide();
                $('.upload-split-layout').removeClass('active');
                loadTransactions();
            })
            .catch(err => {
                console.error('Error saving transactions:', err);
                alert('거래 저장에 실패했습니다.');
            });
    });

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
                alert('저장되었습니다!');
                $('#transaction-form')[0].reset();
                $('#preview-container').hide();
                $('#extraction-result').hide();
                loadTransactions(); // Reload data
            })
            .catch(err => alert('거래 저장 중 오류가 발생했습니다'));
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
                    <td><input type="checkbox" class="row-checkbox" data-id="${t.id}" /></td>
                    <td>${t.date}</td>
                    <td>${t.category}</td>
                    <td>${t.place}</td>
                    <td style="color: ${t.type === 'INCOME' ? '#2ecc71' : '#e74c3c'}">${t.type === 'INCOME' ? '수입' : '지출'}</td>
                    <td>₩${t.amount.toLocaleString()}</td>
                    <td><button onclick="deleteTransaction('${t.id}')" style="border:none;background:none;cursor:pointer;color:#e74c3c;"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
            tbody.append(row);
        });

        // Update checkbox event listeners
        updateCheckboxListeners();
    }

    function updateCheckboxListeners() {
        // Row checkboxes
        $('.row-checkbox').off('change').on('change', function () {
            updateDeleteButton();
            updateSelectAllCheckbox();
        });

        // Select all checkbox
        $('#select-all-checkbox').off('change').on('change', function () {
            const isChecked = $(this).prop('checked');
            $('.row-checkbox').prop('checked', isChecked);
            updateDeleteButton();
        });
    }

    function updateSelectAllCheckbox() {
        const totalCheckboxes = $('.row-checkbox').length;
        const checkedCheckboxes = $('.row-checkbox:checked').length;
        $('#select-all-checkbox').prop('checked', totalCheckboxes > 0 && totalCheckboxes === checkedCheckboxes);
    }

    function updateDeleteButton() {
        const checkedCount = $('.row-checkbox:checked').length;
        if (checkedCount > 0) {
            $('#delete-selected-btn').show();
        } else {
            $('#delete-selected-btn').hide();
        }
    }

    // Delete selected transactions
    $('#delete-selected-btn').on('click', function () {
        const selectedIds = [];
        $('.row-checkbox:checked').each(function () {
            selectedIds.push($(this).data('id'));
        });

        if (selectedIds.length === 0) return;

        if (confirm(`선택한 ${selectedIds.length}개의 거래를 삭제하시겠습니까?`)) {
            axios.post('/api/transactions/delete-batch', selectedIds)
                .then(() => {
                    alert('선택한 거래가 삭제되었습니다.');
                    loadTransactions();
                })
                .catch(err => {
                    console.error(err);
                    alert('거래 삭제에 실패했습니다.');
                });
        }
    });

    window.deleteTransaction = function (id) {
        if (confirm('정말 이 거래를 삭제하시겠습니까?')) {
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
                    label: '일별 지출 (₩)',
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
