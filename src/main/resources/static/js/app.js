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

    // --- Category & Type Management Start ---
    const DEFAULT_CATEGORIES = [
        { id: 'Food', name: '식비', color: '#ff9a9e' },
        { id: 'Transportation', name: '교통', color: '#fad0c4' },
        { id: 'Shopping', name: '쇼핑', color: '#a18cd1' },
        { id: 'Entertainment', name: '문화/여가', color: '#fbc2eb' },
        { id: 'Healthcare', name: '의료/건강', color: '#8fd3f4' },
        { id: 'Other', name: '기타', color: '#84fab0' }
    ];

    const DEFAULT_TYPES = [
        { id: 'EXPENSE', name: '지출', base: 'EXPENSE' },
        { id: 'INCOME', name: '수입', base: 'INCOME' }
    ];

    let categories = JSON.parse(localStorage.getItem('categories')) || DEFAULT_CATEGORIES;
    let types = JSON.parse(localStorage.getItem('types')) || DEFAULT_TYPES;

    function renderCategoryList() {
        const list = $('#category-list');
        list.empty();

        categories.forEach(cat => {
            const item = `
                <div class="category-item">
                    <div class="category-info">
                        <div class="color-dot" style="background-color: ${cat.color}"></div>
                        <span class="category-name">${cat.name}</span>
                    </div>
                    <button class="delete-category-btn" onclick="deleteCategory('${cat.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            list.append(item);
        });
        updateCategorySelects();
    }

    function renderTypeList() {
        const list = $('#type-list');
        list.empty();

        types.forEach(t => {
            let color = '#e74c3c'; // EXPENSE (Red)
            let typeLabel = '지출';

            if (t.base === 'INCOME') {
                color = '#2ecc71'; // Green
                typeLabel = '수입';
            } else if (t.base === 'SAVING') {
                color = '#3498db'; // Blue
                typeLabel = '저축';
            }

            const item = `
                <div class="category-item">
                    <div class="category-info">
                        <span class="category-name" style="color: ${color}">
                            ${t.name} (${typeLabel})
                        </span>
                    </div>
                    <button class="delete-category-btn" onclick="deleteType('${t.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            list.append(item);
        });
        updateTypeSelects();
    }

    function updateCategorySelects() {
        const selects = $('.man-category, .ext-category, #edit-category');
        const optionsHtml = categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        selects.html(optionsHtml);

        // Restore values if possible? (Skip for now as it refreshes on change)
    }

    function updateTypeSelects() {
        const selects = $('.man-type, .ext-type, #edit-type');
        const optionsHtml = types.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        selects.html(optionsHtml);
    }

    // Add Category
    $('#add-category-btn').on('click', function () {
        const name = $('#new-category-name').val().trim();
        const color = $('#new-category-color').val();

        if (!name) {
            alert('카테고리 이름을 입력해주세요.');
            return;
        }

        const id = 'CAT-' + Date.now();

        categories.push({ id, name, color });
        saveCategories();

        $('#new-category-name').val('');
        renderCategoryList();
    });

    // Add Type
    $('#add-type-btn').on('click', function () {
        const name = $('#new-type-name').val().trim();
        const base = $('#new-type-base').val();

        if (!name) {
            alert('유형 이름을 입력해주세요.');
            return;
        }

        const id = 'TYPE-' + Date.now();

        types.push({ id, name, base });
        saveTypes();

        $('#new-type-name').val('');
        renderTypeList();
    });

    window.deleteCategory = function (id) {
        if (!confirm('정말 이 카테고리를 삭제하시겠습니까?')) return;

        categories = categories.filter(c => c.id !== id);
        saveCategories();
        renderCategoryList();
    };

    window.deleteType = function (id) {
        // Protect default types
        if (id === 'EXPENSE' || id === 'INCOME') {
            alert('기본 유형은 삭제할 수 없습니다.');
            return;
        }
        if (!confirm('정말 이 유형을 삭제하시겠습니까?')) return;
        types = types.filter(t => t.id !== id);
        saveTypes();
        renderTypeList();
    };

    function saveCategories() {
        localStorage.setItem('categories', JSON.stringify(categories));
    }

    function saveTypes() {
        localStorage.setItem('types', JSON.stringify(types));
    }

    function getCategoryOptionsHtml(selectedId) {
        return categories.map(cat => `<option value="${cat.id}" ${cat.id === selectedId ? 'selected' : ''}>${cat.name}</option>`).join('');
    }

    function getTypeOptionsHtml(selectedId) {
        return types.map(t => `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${t.name}</option>`).join('');
    }

    function getTypeBase(typeId) {
        const type = types.find(t => t.id === typeId);
        return type ? type.base : 'EXPENSE'; // Default to Expense if unknown
    }

    function getTypeName(typeId) {
        const type = types.find(t => t.id === typeId);
        return type ? type.name : typeId;
    }

    // Initialize
    renderCategoryList();
    renderTypeList();
    // --- Category & Type Management End ---

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

    // Sub-tab switching for Categories/Types
    $('#categories .filter-tab').click(function () {
        const target = $(this).data('sub-target');

        $('#categories .filter-tab').removeClass('active');
        $(this).addClass('active');

        $('#manage-categories, #manage-types').hide();
        $('#' + target).show();
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
                            ${getCategoryOptionsHtml()}
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
    window.removeManualItem = function (uniqueId) {
        $(`.manual-item[data-id="${uniqueId}"]`).slideUp(200, function () {
            $(this).remove();
            if ($('.manual-item').length === 1) {
                $('.manual-item .remove-manual-btn').hide();
            }
        });
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

    // --- Direct Input Logic ---
    // Save Manual Input
    $('#save-manual-btn').on('click', function () {
        const items = $('.manual-item');
        const transactions = [];
        let isValid = true;

        items.each(function () {
            const item = $(this);
            const date = item.find('.man-date').val();
            const place = item.find('.man-place').val();
            const amount = parseFloat(item.find('.man-amount').val());
            const category = item.find('.man-category').val();
            const type = item.find('.man-type').val(); // Correct selector
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
            showToast('모든 필수 항목을 입력해주세요.', 'error');
            return;
        }

        $('#loading-screen').fadeIn();

        axios.post('/api/transactions/batch', transactions)
            .then(res => {
                $('#loading-screen').fadeOut();
                showToast(`${res.data.length}개의 거래가 저장되었습니다!`, 'success');

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
                loadTransactions(); // ADDED: Refresh transactions

            })
            .catch(err => {
                $('#loading-screen').fadeOut();
                showToast('저장 중 오류가 발생했습니다.', 'error');
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
            showToast('텍스트 추출이 완료되었습니다. 내역을 확인하고 저장하세요.', 'success');
        }).catch(err => {
            console.error(err);
            showToast('텍스트 추출에 실패했습니다', 'error');
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
                             ${getCategoryOptionsHtml(transaction.category)}
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

            // Set selected category if it matches
            if (transaction.category) {
                item.find('.ext-category').val(transaction.category);
            }
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

                showToast(`${response.data.length}개의 거래가 저장되었습니다!`, 'success');
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
                showToast('거래 저장에 실패했습니다.', 'error');
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
        const categoryTranslations = {};
        categories.forEach(c => categoryTranslations[c.id] = c.name);

        sorted.forEach(t => {
            const baseType = getTypeBase(t.type);
            let typeColor = '#e74c3c';
            if (baseType === 'INCOME') typeColor = '#2ecc71';
            else if (baseType === 'SAVING') typeColor = '#3498db';

            const row = `
                <tr>
                    <td><input type="checkbox" class="row-checkbox" data-id="${t.id}" /></td>
                    <td>${t.date}</td>
                    <td>${categoryTranslations[t.id] || categoryTranslations[t.category] || t.category}</td>
                    <td>${t.place}</td>
                    <td>${t.memo || '-'}</td>
                    <td style="color: ${typeColor}">${getTypeName(t.type)}</td>
                    <td>₩${t.amount.toLocaleString()}</td>
                    <td>
                        <button onclick="openEditModal('${t.id}')" style="border:none;background:none;cursor:pointer;color:#3498db; margin-right:5px;"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteTransaction('${t.id}')" style="border:none;background:none;cursor:pointer;color:#e74c3c;"><i class="fa-solid fa-trash"></i></button>
                    </td>
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
        let saving = 0;
        const categoryMap = {};

        filteredTxs.forEach(t => {
            const baseType = getTypeBase(t.type);

            if (baseType === 'INCOME') {
                income += t.amount;
            } else if (baseType === 'SAVING') {
                saving += t.amount;
            } else { // EXPENSE
                expense += t.amount;
                // Only track category for Expense (and maybe Saving?)
                categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
            }
        });

        $('#total-income').text(`₩${income.toLocaleString()}`);
        $('#total-expense').text(`₩${expense.toLocaleString()}`);
        $('#total-saving').text(`₩${saving.toLocaleString()}`);
        // Balance = Income - Expense - Saving
        $('#total-balance').text(`₩${(income - expense - saving).toLocaleString()}`);

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

        transactions.filter(t => getTypeBase(t.type) === 'EXPENSE').forEach(t => {
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



        // Pie Chart (Update to use dynamic categories)
        const categoryTranslations = {}; // Map ID to Name
        categories.forEach(c => categoryTranslations[c.id] = c.name);

        const koreanLabels = Object.keys(categoryMap).map(key => categoryTranslations[key] || key);
        // Map colors? 
        // We need a color map ensuring consistent colors
        const colorMap = {};
        categories.forEach(c => colorMap[c.id] = c.color);

        // Use colors from our category definitions if available
        const bgColors = Object.keys(categoryMap).map(key => colorMap[key] || '#cccccc');

        pieChart = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: koreanLabels,
                datasets: [{
                    data: Object.values(categoryMap),
                    backgroundColor: bgColors
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

    // --- Edit Modal Logic ---
    window.openEditModal = function (id) {
        const transaction = transactions.find(t => t.id == id); // Use == for loose equality if ID types differ
        if (!transaction) return;

        $('#edit-id').val(transaction.id);
        $('#edit-date').val(transaction.date);
        $('#edit-place').val(transaction.place);
        $('#edit-amount').val(transaction.amount);
        $('#edit-type').val(transaction.type);
        $('#edit-memo').val(transaction.memo || '');

        // Populate Categories
        const optionsHtml = getCategoryOptionsHtml();
        $('#edit-category').html(optionsHtml);
        $('#edit-category').val(transaction.category);

        $('#edit-modal').css('display', 'flex').fadeIn(200);
    };

    $('.close-modal, #cancel-edit-btn').on('click', function () {
        $('#edit-modal').fadeOut(200);
    });

    // Close modal if clicking outside
    $(window).on('click', function (event) {
        if ($(event.target).is('#edit-modal')) {
            $('#edit-modal').fadeOut(200);
        }
    });

    $('#edit-form').on('submit', function (e) {
        e.preventDefault();

        const id = $('#edit-id').val();
        const updatedData = {
            id: id,
            date: $('#edit-date').val(),
            place: $('#edit-place').val(),
            amount: parseFloat($('#edit-amount').val()),
            category: $('#edit-category').val(),
            type: $('#edit-type').val(),
            memo: $('#edit-memo').val()
        };

        // Optimistic UI Update (optional, but good for speed)
        // const idx = transactions.findIndex(t => t.id == id);
        // if(idx !== -1) transactions[idx] = updatedData;

        axios.put(`/api/transactions/${id}`, updatedData)
            .then(res => {
                showToast('거래 내역이 수정되었습니다.', 'success');
                $('#edit-modal').fadeOut(200);
                loadTransactions(); // Reload to be sure
            })
            .catch(err => {
                console.error(err);
                showToast('수정에 실패했습니다.', 'error');
            });
    });

    // --- Toast Logic ---
    function showToast(message, type = 'success') {
        const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';

        const toast = $(`
            <div class="toast ${type}">
                ${icon}
                <span>${message}</span>
            </div>
        `);

        $('#toast-container').append(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.css('animation', 'fadeOutRight 0.3s ease-in forwards');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
});
