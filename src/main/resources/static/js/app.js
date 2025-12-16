$(document).ready(function () {
    // State
    let transactions = [];
    let myChart = null;
    let pieChart = null;

    // Filter Constants
    const PERIOD_ALL = 'all';
    const PERIOD_YEAR = 'year';
    const PERIOD_MONTH = 'month';
    const PERIOD_DAY = 'day';

    let currentDashboardPeriod = PERIOD_ALL;
    let currentTransactionPeriod = PERIOD_ALL;

    // Load initial data
    loadTransactions();

    // Initialize Period Selectors
    initPeriodSelectors();

    // Navigation
    $('.nav-links li').click(function () {
        const target = $(this).data('target');

        $('.nav-links li').removeClass('active');
        $(this).addClass('active');

        $('.view').removeClass('active');
        $('#' + target).addClass('active');

        // Removed the icon and brand name text from the header, but kept the title update
        $('#page-title').text($(this).text().trim());

        // Re-render charts when switching to dashboard to fix resizing issues
        if (target === 'dashboard') {
            updateDashboard();
        }
    });

    // --- Direct Input Logic Start ---

    let manualIndex = 1;

    $('#add-manual-row-btn').on('click', function () {
        const uniqueId = `manual-${Date.now()}-${manualIndex++}`;
        const count = $('.manual-item').length + 1;

        const item = $(`
            <div class="manual-item" data-id="${uniqueId}">
                <div class="manual-item-header" style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <h4>거래 ${count}</h4>
                    <button class="remove-manual-btn" data-remove-id="${uniqueId}">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>날짜</label>
                        <input type="date" class="man-date" required />
                    </div>
                    <div class="form-group">
                        <label>장소</label>
                        <input type="text" class="man-place" placeholder="예: 스타벅스" required />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>금액</label>
                        <input type="number" class="man-amount" placeholder="0" required />
                    </div>
                    <div class="form-group">
                        <label>카테고리</label>
                        <select class="man-category">
                            <option value="Food">식비</option>
                            <option value="Transportation">교통</option>
                            <option value="Shopping">쇼핑</option>
                            <option value="Entertainment">문화/여가</option>
                            <option value="Healthcare">의료/건강</option>
                            <option value="Other">기타</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>유형</label>
                        <select class="man-type">
                            <option value="EXPENSE">지출</option>
                            <option value="INCOME">수입</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="grid-column: span 3;">
                        <label>메모</label>
                        <input type="text" class="man-memo" placeholder="메모를 입력하세요" />
                    </div>
                </div>
            </div>
        `);

        // Hide remove button for first item if it's the only one
        if ($('.manual-item').length === 0) {
            item.find('.remove-manual-btn').hide();
        } else {
            $('.manual-item .remove-manual-btn').show(); // Show all remove buttons
        }

        $('#manual-input-list').append(item);

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        item.find('.man-date').val(today);

        // Attach remove handler
        item.find('.remove-manual-btn').on('click', function () {
            const removeId = $(this).data('remove-remove-id'); // Note: previously defined as data-remove-id
            // Better to just traverse up
            $(this).closest('.manual-item').fadeOut(300, function () {
                $(this).remove();
                updateManualItemHeaders();
                if ($('.manual-item').length === 1) {
                    $('.manual-item .remove-manual-btn').hide();
                }
            });
        });
    });

    // Initial remove handler for the first item (though it's hidden initially)
    window.removeManualItem = function (id) {
        $(`.manual-item[data-id="${id}"]`).remove();
        updateManualItemHeaders();
        if ($('.manual-item').length === 1) {
            $('.manual-item .remove-manual-btn').hide();
        }
    };

    function updateManualItemHeaders() {
        $('.manual-item').each(function (index) {
            $(this).find('h4').text(`거래 ${index + 1}`);
        });
        if ($('.manual-item').length <= 1) {
            $('.manual-item .remove-manual-btn').hide();
        } else {
            $('.manual-item .remove-manual-btn').show();
        }
    }

    $('#save-manual-btn').on('click', function () {
        const transactions = [];
        let isValid = true;

        $('.manual-item').each(function () {
            const item = $(this);
            const date = item.find('.man-date').val();
            const place = item.find('.man-place').val();
            const amount = parseFloat(item.find('.man-amount').val());
            const category = item.find('.man-category').val();
            const type = item.find('.man-type').val();
            const memo = item.find('.man-memo').val();

            if (!date || !place || isNaN(amount)) {
                isValid = false;
                item.css('border', '1px solid #e74c3c');
            } else {
                item.css('border', '1px solid rgba(0,0,0,0.08)');
                transactions.push({ date, place, amount, category, type, memo });
            }
        });

        if (!isValid) {
            alert('모든 필수 항목을 입력해주세요.');
            return;
        }

        $('#loading-screen').fadeIn();

        axios.post('/api/transactions/batch', transactions)
            .then(res => {
                $('#loading-screen').fadeOut();
                // alert(`${res.data.length}개의 거래가 저장되었습니다!`); // Removed alert

                // Reset form to one empty row
                $('#manual-input-list').empty();
                // Add one initial row programmatically to keep listeners clean or just reset the HTML
                // For simplicity, let's just trigger the add button logic but reset index
                manualIndex = 1;
                $('#add-manual-row-btn').click();

                // Remove the extra one if we just cleared (since click adds one)
                // Actually, empty() clears everything. click() adds one. Perfect.

                // Reset headers
                updateManualItemHeaders();

            })
            .catch(err => {
                $('#loading-screen').fadeOut();
                alert('저장 중 오류가 발생했습니다.');
            });
    });

    // Set default date for existing static row
    // Wait for document ready
    $(function () {
        const today = new Date().toISOString().split('T')[0];
        $('.man-date').val(today);
    });

    // --- Direct Input Logic End ---





    // --- Filter Logic Start ---

    function initPeriodSelectors() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12
        const today = now.toISOString().split('T')[0];

        // Populate Years (Current +/- 5 years)
        const yearOptions = [];
        for (let y = currentYear + 5; y >= currentYear - 5; y--) {
            yearOptions.push(`<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}년</option>`);
        }
        $('#dashboard-year-select, #trans-year-select').html(yearOptions.join(''));

        // Generate Month Buttons
        const monthButtons = [];
        for (let m = 1; m <= 12; m++) {
            monthButtons.push(`<button class="month-btn ${m === currentMonth ? 'active' : ''}" data-month="${m}">${m}월</button>`);
        }
        $('#dashboard-month-buttons, #trans-month-buttons').html(monthButtons.join(''));

        // Set default date
        $('#dashboard-date-select, #trans-date-select').val(today);

        // Attach Event Listeners for Filters
        attachFilterListeners('dashboard');
        attachFilterListeners('trans'); // using 'trans' as prefix for transactions id
    }

    function attachFilterListeners(prefix) {
        // Tab Clicks
        $(`.${prefix === 'dashboard' ? 'dashboard-filters' : 'transaction-filters'} .filter-tab`).on('click', function () {
            const period = $(this).data('period');

            // UI Update
            $(`.${prefix === 'dashboard' ? 'dashboard-filters' : 'transaction-filters'} .filter-tab`).removeClass('active');
            $(this).addClass('active');

            // Show/Hide Selectors
            const selectorContainer = $(`#period-selector-${prefix === 'dashboard' ? 'dashboard' : 'transactions'}`);
            const yearSelect = $(`#${prefix}-year-select`);
            const monthButtons = $(`#${prefix}-month-buttons`);
            const dateSelect = $(`#${prefix}-date-select`);

            // Reset visibility
            selectorContainer.hide();
            yearSelect.hide();
            monthButtons.hide();
            dateSelect.hide();

            if (period !== PERIOD_ALL) {
                selectorContainer.css('display', 'flex'); // Use flex for gap
                if (period === PERIOD_YEAR) {
                    yearSelect.show();
                } else if (period === PERIOD_MONTH) {
                    yearSelect.show();
                    monthButtons.css('display', 'flex');
                } else if (period === PERIOD_DAY) {
                    dateSelect.show();
                }
            }

            // Update State & Refresh
            if (prefix === 'dashboard') {
                currentDashboardPeriod = period;
                updateDashboard();
            } else {
                currentTransactionPeriod = period;
                renderTable();
            }
        });

        // Selector Config Changes
        $(`#${prefix}-year-select, #${prefix}-date-select`).on('change', function () {
            if (prefix === 'dashboard') {
                updateDashboard();
            } else {
                renderTable();
            }
        });

        // Month Button Clicks
        $(`#${prefix}-month-buttons`).on('click', '.month-btn', function () {
            $(`#${prefix}-month-buttons .month-btn`).removeClass('active');
            $(this).addClass('active');

            if (prefix === 'dashboard') {
                updateDashboard();
            } else {
                renderTable();
            }
        });
    }

    function filterTransactions(txs, period, prefix) {
        if (period === PERIOD_ALL) return txs;

        const year = parseInt($(`#${prefix}-year-select`).val());
        const month = parseInt($(`#${prefix}-month-buttons .month-btn.active`).data('month'));
        const dateVal = $(`#${prefix}-date-select`).val();

        return txs.filter(t => {
            const tDate = new Date(t.date);
            const tYear = tDate.getFullYear();
            const tMonth = tDate.getMonth() + 1;
            const tDateStr = t.date; // assuming YYYY-MM-DD

            if (period === PERIOD_YEAR) {
                return tYear === year;
            } else if (period === PERIOD_MONTH) {
                return tYear === year && tMonth === month;
            } else if (period === PERIOD_DAY) {
                return tDateStr === dateVal;
            }
            return true;
        });
    }

    // --- Filter Logic End ---


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
                    <div class="form-row">
                        <div class="form-group" style="grid-column: span 3;">
                            <label>메모</label>
                            <input type="text" class="ext-memo" placeholder="메모를 입력하세요" value="${transaction.memo || ''}" />
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
            const date = item.find('.ext-date').val();
            const place = item.find('.ext-place').val();
            const amount = parseFloat(item.find('.ext-amount').val());
            const category = item.find('.ext-category').val();
            const type = item.find('.ext-type').val();
            const memo = item.find('.ext-memo').val();

            const transaction = {
                date: date,
                place: place,
                amount: amount,
                category: category,
                type: type,
                memo: memo
            };
            console.log('Transaction to save:', transaction); // Debug log
            transactions.push(transaction);
        });

        // Show loading screen
        $('#loading-screen').fadeIn();

        // Use batch endpoint to save all transactions at once
        axios.post('/api/transactions/batch', transactions)
            .then(response => {
                console.log('Saved transactions:', response.data);
                // Hide loading screen
                $('#loading-screen').fadeOut();

                // alert(`${response.data.length}개의 거래가 저장되었습니다!`); // Removed alert
                $('#extracted-transactions-list').empty();
                $('#preview-container').hide();
                $('#extraction-result').hide();
                $('#save-all-btn').hide();
                $('.upload-split-layout').removeClass('active');
                loadTransactions();
            })
            .catch(err => {
                // Hide loading screen
                $('#loading-screen').fadeOut();

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

        // Show loading screen
        $('#loading-screen').fadeIn();

        axios.post('/api/transactions', transaction)
            .then(res => {
                // Hide loading screen
                $('#loading-screen').fadeOut();

                $('#transaction-form')[0].reset();
                $('#preview-container').hide();
                $('#extraction-result').hide();
                loadTransactions(); // Reload data
            })
            .catch(err => {
                // Hide loading screen
                $('#loading-screen').fadeOut();
                alert('거래 저장 중 오류가 발생했습니다');
            });
    });

    function loadTransactions() {
        axios.get('/api/transactions')
            .then(res => {
                transactions = res.data;
                renderTable();
                updateDashboard();
            });
    }

    let currentSort = {
        column: 'date',
        direction: 'desc'
    };

    // Table Header Click (Sorting)
    $('#transaction-table th.sortable').on('click', function () {
        const column = $(this).data('sort');

        // Cycle: ASC -> DESC -> DEFAULT (null)
        if (currentSort.column === column) {
            if (currentSort.direction === 'asc') {
                currentSort.direction = 'desc';
            } else if (currentSort.direction === 'desc') {
                currentSort.direction = null; // Default state
                currentSort.column = null;
            } else {
                currentSort.direction = 'asc';
            }
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc'; // Start with ASC for new column
        }

        renderTable();
    });

    function renderTable() {
        const tbody = $('#transaction-table tbody');
        tbody.empty();

        // Update Header Icons
        $('#transaction-table th.sortable').removeClass('asc desc');
        $('#transaction-table th.sortable i').attr('class', 'fa-solid fa-sort'); // Reset icons

        if (currentSort.column && currentSort.direction) {
            const activeHeader = $(`#transaction-table th[data-sort="${currentSort.column}"]`);
            activeHeader.addClass(currentSort.direction);
            const icon = activeHeader.find('i');
            icon.removeClass('fa-sort').addClass(currentSort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
        }

        // Filter transactions for Transactions View
        const filtered = filterTransactions(transactions, currentTransactionPeriod, 'trans');

        let sorted = [...filtered];

        // Sort logic
        if (currentSort.column && currentSort.direction) {
            sorted.sort((a, b) => {
                let valA = a[currentSort.column];
                let valB = b[currentSort.column];

                // Handle potential null/undefined
                if (valA === undefined || valA === null) valA = '';
                if (valB === undefined || valB === null) valB = '';

                // Type specific sorting
                if (currentSort.column === 'amount') {
                    valA = parseFloat(valA);
                    valB = parseFloat(valB);
                } else if (currentSort.column === 'date') {
                    valA = new Date(valA);
                    valB = new Date(valB);
                } else {
                    // String comparison
                    valA = valA.toString().toLowerCase();
                    valB = valB.toString().toLowerCase();
                }

                if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default Sort: Date Descending
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // Category Translations
        const categoryTranslations = {
            'Food': '식비',
            'Transportation': '교통',
            'Shopping': '쇼핑',
            'Entertainment': '문화/여가',
            'Healthcare': '의료/건강',
            'Other': '기타'
        };

        sorted.forEach(t => {
            const row = `
                <tr>
                    <td><input type="checkbox" class="row-checkbox" data-id="${t.id}" /></td>
                    <td>${t.date}</td>
                    <td>${categoryTranslations[t.category] || t.category}</td>
                    <td>${t.place}</td>
                    <td>${t.memo || '-'}</td>
                    <td style="color: ${t.type === 'INCOME' ? '#2ecc71' : '#e74c3c'}">${t.type === 'INCOME' ? '수입' : '지출'}</td>
                    <td>₩${t.amount.toLocaleString()}</td>
                    <td><button onclick="deleteTransaction('${t.id}')" style="border:none;background:none;cursor:pointer;color:#e74c3c;"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `;
            tbody.append(row);
        });

        // Update checkbox event listeners
        updateCheckboxListeners();
        // Reset "Select All" since list re-rendered
        $('#select-all-checkbox').prop('checked', false);
        updateDeleteButton();
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
        // Stats logic with filtering
        const filteredTxs = filterTransactions(transactions, currentDashboardPeriod, 'dashboard');

        let income = 0;
        let expense = 0;
        const categoryMap = {};

        filteredTxs.forEach(t => {
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
            renderCharts(filteredTxs, categoryMap);
        }
    }

    function renderCharts(transactions, categoryMap) {
        // Register the plugin (if not already registered globally, though usually safe to do here or check)
        // With CDN UMD, it might be auto-registered, but explicit registration ensures it works if not.
        if (typeof ChartDataLabels !== 'undefined') {
            Chart.register(ChartDataLabels);
        }

        const ctxBar = document.getElementById('expenseChart').getContext('2d');
        const ctxPie = document.getElementById('categoryPieChart').getContext('2d');

        if (myChart) myChart.destroy();
        if (pieChart) pieChart.destroy();

        // Bar Chart: Dynamic Aggregation
        const dateMap = {};
        let barLabel = '일별 지출';

        transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
            let key = t.date; // Default YYYY-MM-DD

            if (currentDashboardPeriod === PERIOD_ALL) {
                key = t.date.substring(0, 4) + '년';
                barLabel = '연도별 지출';
            } else if (currentDashboardPeriod === PERIOD_YEAR) {
                key = t.date.substring(5, 7) + '월';
                barLabel = '월별 지출';
            }
            // For MONTH and DAY, keep YYYY-MM-DD (Daily)

            dateMap[key] = (dateMap[key] || 0) + t.amount;
        });

        const sortedLabels = Object.keys(dateMap).sort();

        // Update Chart Title
        $('#bar-chart-header').text(barLabel);

        myChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: sortedLabels,
                datasets: [{
                    label: barLabel,
                    data: sortedLabels.map(k => dateMap[k]),
                    backgroundColor: '#4facfe',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Hide legend as we use HTML header
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        formatter: function (value) {
                            return '₩' + value.toLocaleString();
                        },
                        font: {
                            weight: 'bold'
                        },
                        color: '#666'
                    }
                },
                layout: {
                    padding: {
                        top: 30, // Space for labels
                        bottom: 10 // Space for x-axis dates
                    }
                }
            }
        });

        // Pie Chart
        const categoryTranslations = {
            'Food': '식비',
            'Transportation': '교통',
            'Shopping': '쇼핑',
            'Entertainment': '문화/여가',
            'Healthcare': '의료/건강',
            'Other': '기타'
        };

        const koreanLabels = Object.keys(categoryMap).map(key => categoryTranslations[key] || key);

        pieChart = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: koreanLabels,
                datasets: [{
                    data: Object.values(categoryMap),
                    backgroundColor: ['#ff9a9e', '#fad0c4', '#a18cd1', '#fbc2eb', '#8fd3f4', '#84fab0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        formatter: function (value, context) {
                            // Display value or percentage if needed. Let's show Amount
                            return '₩' + value.toLocaleString();
                        },
                        color: '#333',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }
});
