// main.js - 게임 초기화 및 상점 시스템 관리

/**
 * 안티치트 시스템 초기화
 */
function initializeAntiCheat() {
    // 매크로 방지 비활성화
    console.log('Anti-cheat system is disabled.');
}

/**
 * 등급별 이미지 미리보기 시스템 초기화
 */
function initGradePreview() {
    const gradeInfoElements = document.querySelectorAll('.grade-info[data-grade]');
    const modal = document.getElementById('imagePreviewModal');
    const modalContent = modal.querySelector('.image-preview-content');
    const closeButton = document.getElementById('closePreviewModal');
    const gradeNameEl = document.getElementById('previewGradeName');
    const grid = document.getElementById('imagePreviewGrid');

    gradeInfoElements.forEach(el => {
        el.addEventListener('click', () => {
            const gradeKey = el.dataset.grade;
            const gradeData = grades[gradeKey];

            if (!gradeData || !gradeData.images || gradeData.images.length === 0) {
                showNotification('이 등급에는 표시할 이미지가 없습니다.', '#e74c3c');
                return;
            }

            // 모달 내용 채우기
            gradeNameEl.textContent = gradeData.name;
            gradeNameEl.style.color = gradeData.color.includes('gradient') ? '#fff' : gradeData.color;
            grid.innerHTML = ''; // 이전 이미지들 제거

            // [수정] 뽑은 재호와 뽑지 않은 재호를 구분하여 표시
            gradeData.images.forEach(imagePath => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'preview-image-container';
                const item = imagePath; // 이제 item은 {path, name} 객체입니다.

                if (stats.collectedItems && stats.collectedItems[item.path]) {
                    // 뽑은 재호: 이미지와 이름 표시
                    const img = document.createElement('img');
                    img.src = item.path;
                    img.alt = item.name;
                    img.onerror = function() {
                        this.src = createFallbackImage(gradeData.color, gradeData.name);
                    };
                    imgContainer.appendChild(img);
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'preview-image-name';
                    nameDiv.textContent = item.name;
                    imgContainer.appendChild(nameDiv);
                } else {
                    // 뽑지 않은 재호: '???' 표시
                    imgContainer.classList.add('uncollected');
                    imgContainer.textContent = '???';
                }
                grid.appendChild(imgContainer);
            });

            // 모달 표시
            modal.classList.add('show');
        });
    });

    // 모달 닫기 이벤트
    const closeModal = () => modal.classList.remove('show');
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

let pendingGachaResult = null; // 획득한 재호 정보를 임시 저장

/**
 * 획득한 재호에 대한 선택 모달을 표시합니다.
 * @param {object} result - 획득한 아이템 정보
 */
function showGachaChoice(result) {
    pendingGachaResult = result;
    const { grade, imagePath, itemName, finalCoins } = result;

    const modal = document.getElementById('choiceModal');
    const choiceImage = document.getElementById('choiceImage');
    const choiceGradeText = document.getElementById('choiceGradeText');
    const choiceItemName = document.getElementById('choiceItemName');
    const keepButton = document.getElementById('keepButton');
    const discardButton = document.getElementById('discardButton');

    choiceImage.src = imagePath;
    choiceImage.style.borderColor = grade.color.includes('gradient') ? '#fff' : grade.color;
    choiceGradeText.textContent = grade.name;
    choiceGradeText.style.color = grade.color.includes('gradient') ? '#fff' : grade.color;
    choiceItemName.textContent = itemName;
    discardButton.innerHTML = `💰 코인으로 바꾸기 (+${finalCoins.toLocaleString()})`;

    // 인벤토리 공간 확인
    if (stats.inventory.length >= stats.inventorySize) {
        keepButton.disabled = true;
        keepButton.textContent = '🎒 인벤토리 가득 참';
    } else {
        keepButton.disabled = false;
        keepButton.textContent = '🎒 인벤토리에 넣기';
    }

    modal.classList.add('show');
}

/**
 * 선택 모달을 닫고 게임 상태를 초기화합니다.
 */
function closeChoiceModal() {
    const modal = document.getElementById('choiceModal');
    modal.classList.remove('show');
    pendingGachaResult = null;

    // 뽑기 버튼 활성화
    const pullButton = document.getElementById('pullButton');
    if (pullButton) {
        pullButton.disabled = false;
        pullButton.textContent = '🎲 가챠 뽑기';
    }
}

/**
 * 아이템을 보관하든 버리든 공통적으로 업데이트되어야 할 통계
 * @param {object} result - 획득한 아이템 정보
 */
function updateCommonStats(result) {
    const { gradeKey, imagePath } = result;

    stats.total++;
    stats[gradeKey]++;

    if (!stats.collectedItems) stats.collectedItems = {};
    stats.collectedItems[imagePath] = true;

    // 우주 등급 획득 시 코즈믹 키 지급
    if (gradeKey === 'cosmic' && !stats.hasCosmicKey) {
        stats.hasCosmicKey = true;
        showNotification('✨ 코즈믹 키를 획득했습니다! 우주 공간이 열립니다!', '#8e44ad');
    }

    // 활성 효과 차감
    if (activeEffects.coinBoost > 0) activeEffects.coinBoost--;
    if (activeEffects.speedBoost > 0) activeEffects.speedBoost--;
    if (activeEffects.guaranteeRare > 0) activeEffects.guaranteeRare--;
    if (activeEffects.ultimateBoost > 0) activeEffects.ultimateBoost--;

    updateStatsDisplay();
    updateActiveEffectsDisplay();
}

/**
 * 인벤토리 UI를 업데이트합니다.
 */
function updateInventoryDisplay() {
    const slotsContainer = document.getElementById('inventorySlots');
    const inventoryTitle = document.getElementById('inventoryTitle');
    const inventory = stats.inventory || [];
    const maxSlots = stats.inventorySize || 5;

    if (!slotsContainer || !inventoryTitle) return;

    slotsContainer.innerHTML = ''; // 슬롯 초기화
    inventoryTitle.textContent = `🎒 인벤토리 (${inventory.length}/${maxSlots})`;

    for (let i = 0; i < maxSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';

        if (i < inventory.length) {
            // 아이템이 있는 슬롯
            const item = inventory[i];
            const itemGradeData = grades[item.gradeKey];
            slot.innerHTML = `
                <img src="${item.imagePath}" alt="${item.itemName}">
                <div class="inventory-item-name">${item.itemName}</div>
                <div class="sell-overlay">판매하기<br>(+${itemGradeData.coins.toLocaleString()} 코인)</div>
            `;
            slot.style.borderColor = item.gradeColor.includes('gradient') ? '#fff' : item.gradeColor;
            slot.dataset.index = i;
            slot.addEventListener('click', () => sellItemFromInventory(i));
        }
        
        slotsContainer.appendChild(slot);
    }

    updateExpandInventoryButton();
}

/**
 * 인벤토리에서 아이템을 판매합니다.
 * @param {number} index - 판매할 아이템의 인벤토리 인덱스
 */
function sellItemFromInventory(index) {
    const item = stats.inventory[index];
    if (!item) return;

    const itemGrade = grades[item.gradeKey];
    if (!itemGrade) return;

    if (confirm(`'${item.itemName}'을(를) 판매하고 ${itemGrade.coins.toLocaleString()} 코인을 얻으시겠습니까?`)) {
        stats.coins += itemGrade.coins;
        stats.inventory.splice(index, 1); // 인벤토리에서 아이템 제거

        updateInventoryDisplay();
        updateStatsDisplay();
        showNotification(`'${item.itemName}' 판매 완료! +${itemGrade.coins.toLocaleString()} 코인`, '#2ecc71');
    }
}

let allGameItems = []; // 도감에 표시될 모든 아이템 목록

/**
 * 모든 등급의 아이템 목록을 가져와 캐시합니다.
 */
function cacheAllGameItems() {
    allGameItems = [];
    // 도감에 표시될 등급 순서 (우주 등급 포함)
    const gradeOrder = Object.keys(grades);
    const allGradeData = { ...grades, ...cosmicGrades };
    
    gradeOrder.forEach(gradeKey => {
        const grade = allGradeData[gradeKey];
        if (grade && grade.images) {
            grade.images.forEach(item => {
                allGameItems.push({
                    gradeKey: gradeKey,
                    gradeName: grade.name,
                    gradeColor: grade.color,
                    imagePath: item.path,
                    itemName: item.name
                });
            });
        }
    });
}

// --- 인벤토리 확장 ---
function getInventoryExpansionCost() {
    const baseCost = 500;
    const expansions = (stats.inventorySize || 5) - 5;
    return Math.floor(baseCost * Math.pow(1.5, expansions));
}

function updateExpandInventoryButton() {
    const btn = document.getElementById('expandInventoryBtn');
    if (!btn) return;

    const cost = getInventoryExpansionCost();
    btn.textContent = `확장 (${cost.toLocaleString()} 코인)`;
    btn.disabled = stats.coins < cost;
}

function expandInventory() {
    const cost = getInventoryExpansionCost();
    if (stats.coins < cost) {
        showNotification('코인이 부족합니다.', '#e74c3c');
        return;
    }

    if (confirm(`인벤토리를 확장하시겠습니까? (${cost.toLocaleString()} 코인)`)) {
        stats.coins -= cost;
        stats.inventorySize++;
        
        updateStatsDisplay();
        updateInventoryDisplay();
        showNotification('인벤토리가 1칸 늘어났습니다!', '#9b59b6');
    }
}

// --- 재호 합성소 ---
let fusionSelections = []; // { invIndex: number, item: object }

function toggleFusionModal() {
    const modal = document.getElementById('fusionModal');
    const isVisible = modal.classList.contains('show');

    if (isVisible) {
        modal.classList.remove('show');
    } else {
        fusionSelections = []; // 열 때마다 선택 초기화
        renderFusionUI();
        modal.classList.add('show');
    }
}

function renderFusionUI() {
    const inventoryGrid = document.getElementById('fusionInventoryGrid');
    const fusionSlotsContainer = document.getElementById('fusionSlots');
    
    inventoryGrid.innerHTML = '';
    stats.inventory.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'fusion-inventory-item';
        
        const isSelected = fusionSelections.some(sel => sel.invIndex === index);
        if (isSelected) {
            itemDiv.classList.add('selected');
        }

        itemDiv.innerHTML = `<img src="${item.imagePath}" alt="${item.itemName}"><div class="fusion-inventory-item-name">${item.itemName}</div>`;
        itemDiv.style.borderColor = item.gradeColor.includes('gradient') ? '#fff' : item.gradeColor;
        itemDiv.dataset.invIndex = index;
        inventoryGrid.appendChild(itemDiv);
    });

    fusionSlotsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'fusion-slot';
        slotDiv.dataset.slotIndex = i;

        if (fusionSelections[i]) {
            const item = fusionSelections[i].item;
            slotDiv.innerHTML = `<img src="${item.imagePath}" alt="${item.itemName}"><div class="fusion-slot-item-name">${item.itemName}</div>`;
            slotDiv.style.borderColor = item.gradeColor.includes('gradient') ? '#fff' : item.gradeColor;
        }
        fusionSlotsContainer.appendChild(slotDiv);
    }
    
    updateFusionState();
}

function handleFusionInventoryClick(e) {
    const target = e.target.closest('.fusion-inventory-item');
    if (!target || target.classList.contains('selected')) return;

    if (fusionSelections.length >= 3) {
        showNotification('조합 슬롯이 가득 찼습니다.', '#e74c3c');
        return;
    }

    const invIndex = parseInt(target.dataset.invIndex);
    const item = stats.inventory[invIndex];
    fusionSelections.push({ invIndex, item });
    renderFusionUI();
}

function handleFusionSlotClick(e) {
    const target = e.target.closest('.fusion-slot');
    if (!target || !target.dataset.slotIndex) return;

    const slotIndex = parseInt(target.dataset.slotIndex);
    if (fusionSelections[slotIndex]) {
        fusionSelections.splice(slotIndex, 1);
        renderFusionUI();
    }
}

function updateFusionState() {
    const fuseButton = document.getElementById('fuseButton');
    const resultSlot = document.getElementById('fusionResultSlot');
    resultSlot.innerHTML = '';
    resultSlot.style.borderStyle = 'dashed';
    fuseButton.disabled = true;

    if (fusionSelections.length !== 3) return;

    const firstGrade = fusionSelections[0].item.gradeKey;
    const allSameGrade = fusionSelections.every(sel => sel.item.gradeKey === firstGrade);
    
    const gradeIndex = gradeOrderForFusion.indexOf(firstGrade);
    const isFusable = gradeIndex > -1 && gradeIndex < gradeOrderForFusion.length - 1;

    if (allSameGrade && isFusable) {
        fuseButton.disabled = false;
        
        const nextGradeKey = gradeOrderForFusion[gradeIndex + 1];
        const nextGrade = grades[nextGradeKey];
        resultSlot.innerHTML = `<div style="color: ${nextGrade.color.includes('gradient') ? 'white' : nextGrade.color}; font-weight: bold; font-size: 0.9em; text-align: center;">${nextGrade.name}</div>`;
        resultSlot.style.borderColor = nextGrade.color.includes('gradient') ? '#fff' : nextGrade.color;
        resultSlot.style.borderStyle = 'solid';
    }
}

function executeFusion() {
    const fuseButton = document.getElementById('fuseButton');
    if (fuseButton.disabled) return;

    const indicesToRemove = fusionSelections.map(sel => sel.invIndex).sort((a, b) => b - a);
    indicesToRemove.forEach(index => {
        stats.inventory.splice(index, 1);
    });

    const gradeIndex = gradeOrderForFusion.indexOf(fusionSelections[0].item.gradeKey);
    const nextGradeKey = gradeOrderForFusion[gradeIndex + 1];
    const nextGrade = grades[nextGradeKey];
    const newItemData = getRandomImage(nextGradeKey);
    
    const newItem = { gradeKey: nextGradeKey, imagePath: newItemData.path, itemName: newItemData.name, gradeName: nextGrade.name, gradeColor: nextGrade.color };
    stats.inventory.push(newItem);
    if (!stats.collectedItems) stats.collectedItems = {};
    stats.collectedItems[newItem.imagePath] = true;
    
    toggleFusionModal();
    updateInventoryDisplay();
    showNotification(`합성 성공! '${newItem.itemName}' 획득!`, '#2ecc71');
}

/**
 * 도감 UI를 렌더링합니다.
 * @param {string} [filterGrade='all'] - 필터링할 등급 키
 */
function renderCollection(filterGrade = 'all') {
    const gridEl = document.getElementById('collectionGrid');
    const progressTextEl = document.getElementById('collectionProgressText');
    const progressBarEl = document.getElementById('collectionProgressBar');
    const gridTitleEl = document.getElementById('collectionGridTitle');
    const filterButtons = document.querySelectorAll('.collection-filter-button');
    gridEl.innerHTML = '';

    // 필터 버튼 활성 상태 업데이트
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.grade === filterGrade);
    });
    gridTitleEl.textContent = document.querySelector(`.collection-filter-button[data-grade="${filterGrade}"]`).textContent;

    const itemsToRender = (filterGrade === 'all')
        ? allGameItems
        : allGameItems.filter(item => item.gradeKey === filterGrade);

    itemsToRender.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `collection-item ${item.gradeKey}`;

        const isCollected = stats.collectedItems && stats.collectedItems[item.imagePath];
        if (isCollected) {
            const img = document.createElement('img');
            img.src = item.imagePath;
            img.alt = item.itemName;
            img.onerror = function() {
                this.src = createFallbackImage(item.gradeColor, item.gradeName);
            };
            itemDiv.appendChild(img);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'collection-item-info';
            infoDiv.textContent = item.itemName;
            itemDiv.appendChild(infoDiv);
        } else {
            itemDiv.classList.add('uncollected');
            itemDiv.textContent = '?';
        }
        gridEl.appendChild(itemDiv);
    });

    // 수집 현황 업데이트
    const totalCollected = allGameItems.filter(item => stats.collectedItems && stats.collectedItems[item.imagePath]).length;
    const overallTotal = allGameItems.length;
    const percentage = overallTotal > 0 ? ((totalCollected / overallTotal) * 100).toFixed(2) : "0.00";
    progressTextEl.textContent = `전체 수집률: ${totalCollected} / ${overallTotal} (${percentage}%)`;
    progressBarEl.style.width = `${percentage}%`;
}

/**
 * 도감 모달을 토글합니다.
 */
function toggleCollection() {
    const modal = document.getElementById('collectionModal');
    const isVisible = modal.classList.contains('show');

    if (isVisible) {
        modal.classList.remove('show');
    } else {
        renderCollection('all'); // 열 때 '전체' 뷰로 초기화
        modal.classList.add('show');
    }
}

/**
 * 설정 UI 및 이벤트 리스너 초기화
 */
function initSettings() {
    const musicToggle = document.getElementById('musicToggle');
    const animationToggle = document.getElementById('animationToggle');
    const saveNotificationToggle = document.getElementById('saveNotificationToggle');
    const bgMusic = document.getElementById('bgMusic');

    if (!musicToggle || !animationToggle || !saveNotificationToggle || !bgMusic) return;

    // 초기 상태 설정 (stats.settings 객체가 로드된 후 호출되어야 함)
    const settings = stats.settings || { music: false, animation: true, showSaveNotifications: true };
    musicToggle.checked = settings.music;
    animationToggle.checked = settings.animation;

    // 애니메이션 초기 상태 적용
    if (!settings.animation) {
        document.body.classList.add('animations-disabled');
    }

    saveNotificationToggle.checked = settings.showSaveNotifications;

    // 음악 토글
    musicToggle.addEventListener('change', (e) => {
        stats.settings.music = e.target.checked;
        if (e.target.checked) {
            if (bgMusic.paused) {
                fadeAudio(bgMusic, 'in', 1000);
            }
        } else {
            fadeAudio(bgMusic, 'out', 1000);
        }
    });

    // 애니메이션 토글
    animationToggle.addEventListener('change', (e) => {
        stats.settings.animation = e.target.checked;
        if (e.target.checked) {
            document.body.classList.remove('animations-disabled');
        } else {
            document.body.classList.add('animations-disabled');
        }
    });

    // 저장 알림 토글
    saveNotificationToggle.addEventListener('change', (e) => {
        stats.settings.showSaveNotifications = e.target.checked;
        if (e.target.checked) {
            showNotification('수동 저장 시 알림이 표시됩니다.', '#2ecc71');
        }
    });
}

/**
 * 도감 시스템 초기화
 */
function initCollection() {
    cacheAllGameItems(); // 시작 시 아이템 목록 캐시

    const collectionButton = document.querySelector('.collection-button');
    const modal = document.getElementById('collectionModal');
    const closeButton = document.getElementById('closeCollectionModal');
    const filtersContainer = document.getElementById('collectionFilters');

    if (!collectionButton || !modal || !closeButton || !filtersContainer) return;

    // 필터 버튼 생성
    const filterGrades = [
        'all', ...Object.keys(grades).sort((a, b) => grades[b].probability - grades[a].probability) // 확률 높은 순으로 정렬
    ];
    const allGradeData = { ...grades, ...cosmicGrades };

    filtersContainer.innerHTML = filterGrades.map(gradeKey => {
        const gradeData = allGradeData[gradeKey];
        if (!gradeData && gradeKey !== 'all') return ''; // 데이터에 없는 등급은 필터에서 제외
        const gradeName = gradeKey === 'all' ? '전체' : gradeData.name;
        return `<button class="collection-filter-button" data-grade="${gradeKey}">${gradeName}</button>`;
    }).join('');

    // 이벤트 리스너 연결
    collectionButton.addEventListener('click', toggleCollection);
    closeButton.addEventListener('click', toggleCollection);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) toggleCollection();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            toggleCollection();
        }
    });

    filtersContainer.addEventListener('click', (e) => {
        if (e.target.matches('.collection-filter-button')) {
            const grade = e.target.dataset.grade;
            renderCollection(grade);
        }
    });
}

/**
 * 우주 공간 UI 업데이트
 */
function updateCosmicSpaceUI() {
    const container = document.getElementById('cosmicSpaceContainer');
    const lockIcon = document.getElementById('cosmicLockIcon');
    const label = document.getElementById('cosmicSpaceLabel');
    if (!container || !lockIcon || !label) return;

    if (stats.hasCosmicKey) {
        container.classList.remove('development');
        container.classList.add('unlocked');
        lockIcon.textContent = '🔑';
        label.textContent = '우주 공간 입장';
        container.style.cursor = 'pointer';
    } else {
        container.classList.remove('unlocked');
        container.classList.add('development'); // 잠금 상태일 때 '개발중' 스타일 재사용
        lockIcon.textContent = '🔒';
        label.textContent = '우주 공간';
        container.style.cursor = 'not-allowed';
    }
}

/**
 * 우주 공간 진입
 */
function enterCosmicSpace() {
    const modal = document.getElementById('cosmicGachaModal');
    if (!modal) return;
    resetCosmicMinigameUI(); // 미니게임 UI 초기화
    updatePermanentLuckUI(); // UI 업데이트
    modal.classList.add('show');
    
    // 메인 BGM 페이드 아웃 후, 우주 BGM 페이드 인
    fadeAudio(document.getElementById('bgMusic'), 'out', 4000);
    fadeAudio(document.getElementById('spaceBgm'), 'in', 4000);
}

/**
 * 우주 공간에서 나가기
 */
function exitCosmicSpace() {
    const modal = document.getElementById('cosmicGachaModal');

    if (modal) {
        modal.classList.remove('show');
    }

    // 우주 BGM 페이드 아웃 후, 메인 BGM 페이드 인
    fadeAudio(document.getElementById('spaceBgm'), 'out', 4000);
    fadeAudio(document.getElementById('bgMusic'), 'in', 4000);
}

/**
 * 우주 공간 시스템 초기화
 */
function initCosmicSpace() {
    const container = document.getElementById('cosmicSpaceContainer');
    const exitButton = document.getElementById('exitCosmicSpaceButton');
    if (!container || !exitButton) return;

    container.addEventListener('click', () => {
        if (stats.hasCosmicKey) {
            enterCosmicSpace();
        } else {
            showNotification("'코즈믹 키'를 보유하고 있어야 입장할 수 있습니다.", '#f39c12');
        }
    });

    exitButton.addEventListener('click', exitCosmicSpace);

    initCosmicMinigame(); // 우주 미니게임 초기화
    updateCosmicSpaceUI(); // 초기 상태 설정
}

/**
 * 우주 공간 미니게임 관련 변수
 */
const cosmicGameConfig = {
    winLevel: 5, // 승리 레벨
    sequenceInterval: 600, // 신호 표시 간격 (ms)
    levelSpeedUpFactor: 0.95 // 레벨마다 빨라지는 속도
};
let cosmicGameState = {
    level: 1,
    sequence: [],
    playerSequence: [],
    gameActive: false,
    playerTurn: false,
    currentSpeed: cosmicGameConfig.sequenceInterval
};

/**
 * 우주 공간 미니게임 초기화
 */
function initCosmicMinigame() {
    document.getElementById('startCosmicGameButton').addEventListener('click', startCosmicMinigame);
    document.getElementById('restartCosmicGameButton').addEventListener('click', resetCosmicMinigameUI);
    document.getElementById('cosmicSignalPad').addEventListener('click', handleSignalClick);
}

/**
 * 미니게임 UI를 초기 화면으로 리셋
 */
function resetCosmicMinigameUI() {
    document.getElementById('cosmicGameIntro').style.display = 'block';
    document.getElementById('cosmicGameArea').style.display = 'none';
    document.getElementById('cosmicGameResult').style.display = 'none';
}

/**
 * 미니게임 시작
 */
function startCosmicMinigame() {
    document.getElementById('cosmicGameIntro').style.display = 'none';
    document.getElementById('cosmicGameResult').style.display = 'none';
    document.getElementById('cosmicGameArea').style.display = 'block';

    // 게임 상태 초기화
    cosmicGameState.level = 1;
    cosmicGameState.sequence = [];
    cosmicGameState.playerSequence = [];
    cosmicGameState.gameActive = true;
    cosmicGameState.playerTurn = false;
    cosmicGameState.currentSpeed = cosmicGameConfig.sequenceInterval;

    nextLevel();
}

/**
 * 다음 레벨로 진행
 */
function nextLevel() {
    cosmicGameState.playerSequence = [];
    cosmicGameState.playerTurn = false;
    cosmicGameState.currentSpeed *= cosmicGameConfig.levelSpeedUpFactor;

    document.getElementById('cosmicGameLevel').textContent = cosmicGameState.level;
    document.getElementById('cosmicGameStatus').textContent = '신호를 기억하세요...';

    // 새로운 신호 추가
    cosmicGameState.sequence.push(Math.floor(Math.random() * 4));

    playSequence();
}

/**
 * 저장된 순서대로 신호를 보여줌
 */
function playSequence() {
    let i = 0;
    const interval = setInterval(() => {
        if (i >= cosmicGameState.sequence.length) {
            clearInterval(interval);
            cosmicGameState.playerTurn = true;
            document.getElementById('cosmicGameStatus').textContent = '따라 입력하세요!';
            return;
        }
        
        const buttonId = cosmicGameState.sequence[i];
        const button = document.querySelector(`.signal-button[data-id="${buttonId}"]`);
        
        // 신호 활성화
        button.classList.add('active');
        setTimeout(() => {
            button.classList.remove('active');
        }, cosmicGameState.currentSpeed / 2);

        i++;
    }, cosmicGameState.currentSpeed);
}

/**
 * 플레이어의 신호 버튼 클릭 처리
 */
function handleSignalClick(e) {
    if (!cosmicGameState.playerTurn || !e.target.matches('.signal-button')) return;

    const clickedId = parseInt(e.target.dataset.id);
    
    // 플레이어 클릭 시각적 효과
    e.target.classList.add('player-active');
    setTimeout(() => e.target.classList.remove('player-active'), 150);

    cosmicGameState.playerSequence.push(clickedId);
    const currentIndex = cosmicGameState.playerSequence.length - 1;

    // 입력이 틀렸을 경우
    if (cosmicGameState.playerSequence[currentIndex] !== cosmicGameState.sequence[currentIndex]) {
        endCosmicMinigame(false);
        return;
    }
    // 현재 레벨의 순서를 모두 맞췄을 경우
    if (cosmicGameState.playerSequence.length === cosmicGameState.sequence.length) {
        if (cosmicGameState.level >= cosmicGameConfig.winLevel) {
            endCosmicMinigame(true); // 최종 승리
        } else {
            cosmicGameState.level++;
            setTimeout(nextLevel, 1000); // 1초 후 다음 레벨
        }
    }
}

/**
 * 게임 종료 처리
 * @param {boolean} isSuccess - 성공 여부
 */
function endCosmicMinigame(isSuccess) {
    cosmicGameState.gameActive = false;
    cosmicGameState.playerTurn = false;

    document.getElementById('cosmicGameArea').style.display = 'none';
    document.getElementById('cosmicGameResult').style.display = 'block';

    const title = document.getElementById('cosmicGameResultTitle');
    const message = document.getElementById('cosmicGameResultMessage');

    if (isSuccess) {
        const reward = Math.floor(Math.random() * 6) + 5; // 5 ~ 10 코즈믹 파편
        stats.cosmicFragments = (stats.cosmicFragments || 0) + reward;
        updatePermanentLuckUI(); // 파편 획득 후 UI 업데이트
        title.textContent = '🎉 성공! 🎉';
        message.textContent = `코즈믹 시그널 해독 완료! 보상으로 코즈믹 파편 ${reward}개를 획득했습니다!`;
        showNotification(`+${reward} 코즈믹 파편 획득!`, '#3498db');
    } else {
        title.textContent = '💥 실패 💥';
        message.textContent = `아쉽지만, 레벨 ${cosmicGameState.level}에서 신호 순서가 틀렸습니다. 다시 도전해보세요!`;
    }
}

/**
 * 영구 행운 강화 비용을 계산합니다.
 * @returns {number}
 */
function getLuckUpgradeCost() {
    const luckLevel = stats.permanentLuck || 0;
    if (luckLevel >= PERMANENT_LUCK_CONFIG.MAX_LEVEL) {
        return Infinity; // Max level reached
    }
    return PERMANENT_LUCK_CONFIG.COSTS[luckLevel];
}

/**
 * 영구 행운 강화 UI를 업데이트합니다.
 */
function updatePermanentLuckUI() {
    if (!document.getElementById('cosmicGachaModal').classList.contains('show')) return;

    const fragmentsAmountEl = document.getElementById('cosmicFragmentsAmount');
    const luckLevelEl = document.getElementById('permanentLuckLevel');
    const upgradeCostEl = document.getElementById('luckUpgradeCost');
    const upgradeButton = document.getElementById('upgradeLuckButton');

    if (!fragmentsAmountEl || !luckLevelEl || !upgradeCostEl || !upgradeButton) return;

    const cost = getLuckUpgradeCost();
    const luckLevel = stats.permanentLuck || 0;

    fragmentsAmountEl.textContent = (stats.cosmicFragments || 0).toLocaleString();
    luckLevelEl.textContent = `${luckLevel} / ${PERMANENT_LUCK_CONFIG.MAX_LEVEL}`;
    
    if (cost === Infinity) {
        // '강화 (비용: 1,000💠)' 형태의 버튼 텍스트를 '최대 레벨 달성!'으로 변경
        upgradeButton.textContent = '최대 레벨 달성!';
        upgradeButton.disabled = true;
    } else {
        upgradeButton.innerHTML = `강화 (비용: <span id="luckUpgradeCost">${cost.toLocaleString()}</span>💠)`;
        upgradeButton.disabled = (stats.cosmicFragments || 0) < cost;
    }
}

/**
 * 영구 행운을 강화합니다.
 */
function upgradePermanentLuck() {
    const luckLevel = stats.permanentLuck || 0;
    if (luckLevel >= PERMANENT_LUCK_CONFIG.MAX_LEVEL) {
        showNotification('이미 최대 레벨입니다.', '#f39c12');
        return;
    }

    const cost = getLuckUpgradeCost();
    if ((stats.cosmicFragments || 0) < cost) {
        showNotification('코즈믹 파편이 부족합니다.', '#e74c3c');
        return;
    }

    stats.cosmicFragments -= cost;
    stats.permanentLuck = (stats.permanentLuck || 0) + 1;

    showNotification(`✨ 영구 행운 레벨이 ${stats.permanentLuck}(으)로 올랐습니다!`, '#f1c40f');
    
    updatePermanentLuckUI();
    updateProbabilityDisplay(); // 확률 표시 즉시 업데이트
}

/**
 * 상점 시스템 초기화
 */
function initShopSystem() {
    // 상점 데이터 로드
    // 데이터 로드는 firebase.js의 onAuthStateChanged에서 처리하므로 여기서는 호출하지 않습니다.
    
    // 상점 UI 업데이트
    updateActiveEffectsDisplay();
    updateShopButtons();
    const shopModal = document.getElementById('shopModal');

    // 모달 외부 클릭시 닫기
    shopModal.addEventListener('click', function(e) {
        if (e.target === shopModal) {
            toggleShop();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && shopModal.classList.contains('show')) {
            toggleShop();
        }
    });

    // 상점 아이템 호버 효과 초기화
    initShopHoverEffects();
}

/**
 * 영구 행운 강화 시스템 초기화
 */
function initPermanentLuckSystem() {
    const upgradeButton = document.getElementById('upgradeLuckButton');
    if (upgradeButton) {
        upgradeButton.addEventListener('click', upgradePermanentLuck);
    }
}

/**
 * 행운의 덕담 로테이션 시스템을 초기화합니다.
 */
function initFortuneTeller() {
    const container = document.getElementById('fortuneContainer');
    if (!container || !fortuneMessages || fortuneMessages.length === 0) return;

    // 덕담에 사용할 빛나는 색상 목록
    const fortuneColors = [
        '#ff9a9e', '#fecfef', '#8fd3f4', '#a8e063', '#fddb92', '#fff1eb'
    ];
    let lastColor = null;

    let availableMessages = [...fortuneMessages];

    function showNextMessage() {
        // 이전 메시지 숨기기
        const oldMessage = container.querySelector('.fortune-message');
        if (oldMessage) {
            oldMessage.classList.remove('visible');
            oldMessage.classList.add('hidden');
            // 애니메이션이 끝난 후 DOM에서 제거
            setTimeout(() => {
                oldMessage.remove();
            }, 500); // CSS 애니메이션 시간과 동일하게 설정
        }

        // 사용 가능한 메시지가 없으면 초기화
        if (availableMessages.length === 0) {
            availableMessages = [...fortuneMessages];
        }

        // 다음 메시지 선택 및 표시
        const randomIndex = Math.floor(Math.random() * availableMessages.length);
        const nextMessage = availableMessages.splice(randomIndex, 1)[0]; // 선택된 메시지를 배열에서 제거

        // 새로운 메시지 요소 생성
        const newMessage = document.createElement('p');
        newMessage.className = 'fortune-message visible';
        newMessage.textContent = nextMessage;

        // 이전과 다른 랜덤 색상 선택
        let newColor;
        do {
            newColor = fortuneColors[Math.floor(Math.random() * fortuneColors.length)];
        } while (fortuneColors.length > 1 && newColor === lastColor);
        lastColor = newColor;

        // 선택된 색상으로 빛나는 효과 적용
        newMessage.style.color = newColor;
        newMessage.style.textShadow = `0 0 8px ${newColor}, 0 0 15px rgba(255, 255, 255, 0.5)`;

        container.appendChild(newMessage);
    }

    showNextMessage(); // 첫 메시지 즉시 표시
    setInterval(showNextMessage, 3000); // 3초마다 반복
}
/**
 * 봇 방지 퀴즈 시스템 초기화
 */
function initQuizSystem() {
    // 매크로 방지 비활성화
    console.log('Quiz system is disabled.');
}

/**
 * 선택 모달의 이벤트 리스너를 초기화합니다.
 */
function initChoiceModalListeners() {
    const keepButton = document.getElementById('keepButton');
    const discardButton = document.getElementById('discardButton');

    if (!keepButton || !discardButton) return;

    keepButton.addEventListener('click', () => {
        if (!pendingGachaResult) return;
        if (stats.inventory.length >= stats.inventorySize) {
            showNotification('인벤토리가 가득 차서 보관할 수 없습니다.', '#e74c3c');
            return;
        }

        const { gradeKey, imagePath, itemName, grade } = pendingGachaResult;
        
        stats.inventory.push({ gradeKey, imagePath, itemName, gradeName: grade.name, gradeColor: grade.color });
        updateCommonStats(pendingGachaResult);
        updateInventoryDisplay();
        showNotification(`'${itemName}'을(를) 인벤토리에 보관했습니다.`, '#3498db');
        closeChoiceModal();
    });

    discardButton.addEventListener('click', () => {
        if (!pendingGachaResult) return;
        const { finalCoins, baseCoins } = pendingGachaResult;
        stats.coins += finalCoins;
        animateCoinsGained(finalCoins, finalCoins > baseCoins); // 향상된 애니메이션 호출
        updateCommonStats(pendingGachaResult);
        closeChoiceModal();
    });
}

/**
 * 기존 함수들을 상점 시스템과 연동하도록 오버라이드
 */
function overrideFunctionsForShop() {
    // pullGacha 함수를 상점 효과가 적용된 버전으로 교체
    window.pullGacha = pullGachaWithEffects;
    
    // updateStatsDisplay 함수를 향상된 버전으로 교체  
    window.updateStatsDisplay = updateStatsDisplayEnhanced;
    
    // 코인 애니메이션 함수 교체
    window.animateCoinsGained = animateCoinsGainedEnhanced;
    
    // 리셋 함수 교체
    window.resetGame = resetGameWithShop;
}

/**
 * 코인 아이콘 클릭 이벤트 초기화
 */
function initCoinClickSound() {
    const coinIcon = document.querySelector('.coin-icon');
    const coinSound = document.getElementById('coinClickSound');

    if (coinIcon && coinSound) {
        coinIcon.addEventListener('click', () => {
            coinSound.currentTime = 0; // 소리를 처음부터 다시 재생
            coinSound.play().catch(e => console.log("사운드 재생 실패:", e));
        });
    }
}
/**
 * 페이지 로드 완료시 상점 시스템 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
    // 기존 시스템이 로드된 후 상점 시스템 초기화
    setTimeout(() => {
        try {
            initializeAntiCheat(); // 안티치트 시스템 초기화
            initShopSystem();
            overrideFunctionsForShop();
            initQuizSystem(); // 퀴즈 시스템 초기화
            initGradePreview(); // 등급별 이미지 미리보기 초기화
            initCollection(); // 도감 시스템 초기화
            initCosmicSpace(); // 우주 공간 시스템 초기화
            initCosmicMinigame(); // 우주 미니게임 이벤트 리스너 초기화
            initPermanentLuckSystem(); // 영구 행운 시스템 초기화
            initCoinClickSound(); // 코인 클릭 사운드 초기화
            initFirebaseAuth(); // Firebase 인증 시스템 초기화
            initFortuneTeller(); // 행운의 덕담 시스템 초기화
            // initSettings()는 onAuthStateChanged에서 데이터 로드 후 호출됩니다.

            // 인벤토리 확장 및 합성소 시스템 초기화
            const expandInventoryBtn = document.getElementById('expandInventoryBtn');
            if (expandInventoryBtn) expandInventoryBtn.addEventListener('click', expandInventory);
            
            const fusionModal = document.getElementById('fusionModal');
            if (fusionModal) {
                document.getElementById('fusionInventoryGrid').addEventListener('click', handleFusionInventoryClick);
                document.getElementById('fusionSlots').addEventListener('click', handleFusionSlotClick);
                document.getElementById('fuseButton').addEventListener('click', executeFusion);
            }

            initChoiceModalListeners(); // 선택 모달 리스너 초기화

            // 상점 탭 기능 초기화
            const shopTabs = document.querySelector('.shop-tabs');
            if (shopTabs) {
                shopTabs.addEventListener('click', (e) => {
                    if (e.target.matches('.shop-tab')) {
                        const category = e.target.dataset.category;
                        document.querySelectorAll('.shop-tab').forEach(tab => tab.classList.remove('active'));
                        e.target.classList.add('active');

                        document.querySelectorAll('.shop-item').forEach(item => {
                            if (category === 'all' || item.dataset.category === category) {
                                item.style.display = 'flex';
                            } else {
                                item.style.display = 'none';
                            }
                        });
                    }
                });
            }

            // 프로필 클릭 시 닉네임 수정 모달 열기
            const userProfileDiv = document.getElementById('userProfile');
            if (userProfileDiv) {
                userProfileDiv.addEventListener('click', async () => {
                    if (currentUser) {
                        try {
                            const userDocRef = db.collection('users').doc(currentUser.uid);
                            const doc = await userDocRef.get();
                            const currentNickname = doc.exists ? doc.data().profile?.nickname || '' : '';
                            showNicknameModal(currentNickname);
                        } catch (error) {
                            console.error("닉네임 정보를 불러오는 데 실패했습니다:", error);
                        }
                    }
                });
            }

            // 닉네임 저장 버튼 이벤트 리스너
            document.getElementById('saveNicknameButton')?.addEventListener('click', saveNickname);
            
            // 개발자 패널 초기화
            initDevPanel();


            console.log('게임 시스템이 성공적으로 초기화되었습니다.');

            // 데이터 로드는 initFirebaseAuth의 onAuthStateChanged에서 처리합니다.
        } catch (error) {
            console.error('상점 시스템 초기화 실패:', error);
        }
    }, 100);
});

/**
 * 개발자용 디버깅 함수들 (콘솔에서 사용 가능)
 */
if (typeof window !== 'undefined') {
    window.debugShop = {
        // 코인 추가
        addCoins: function(amount) {
            stats.coins += amount;
            updateStatsDisplay();
            showNotification(`${amount} 코인이 추가되었습니다!`, '#ffd700');
        },
        
        // 효과 추가
        addEffect: function(effectName, duration) {
            if (activeEffects.hasOwnProperty(effectName)) {
                activeEffects[effectName] += duration;
                updateActiveEffectsDisplay();
                showNotification(`${getEffectName(effectName)} ${duration}회 추가!`, '#9b59b6');
            }
        },
        
        // 모든 효과 클리어
        clearEffects: function() {
            Object.keys(activeEffects).forEach(key => {
                activeEffects[key] = 0;
            });
            updateActiveEffectsDisplay();
            showNotification('모든 효과가 클리어되었습니다!', '#e74c3c');
        },
        
        // 현재 상태 출력
        showStatus: function() {
            console.log('=== 현재 상점 시스템 상태 ===');
            console.log('코인:', stats.coins);
            console.log('활성 효과:', activeEffects);
            console.log('구매한 아이템:', stats.itemsPurchased || 0);
            console.log('사용한 코인:', stats.coinsSpent || 0);
        }
    };
}

/**
 * 개발자 패널 관련 기능
 */
function toggleDevPanel() {
    const devPage = document.getElementById('devPanelPage');
    const gameContainer = document.getElementById('gameContainer');
    const floatingButtons = document.querySelector('.floating-buttons-container');

    if (devPage.style.display === 'none') {
        devPage.style.display = 'flex';
        gameContainer.style.display = 'none';
        floatingButtons.style.display = 'none';
        populateUserList(); // 패널을 열 때마다 유저 목록을 새로고침
    } else {
        devPage.style.display = 'none';
        gameContainer.style.display = 'block';
        floatingButtons.style.display = 'flex';
    }
}

function initDevPanel() {
    const itemSelect = document.getElementById('giftItemSelect');
    if (!itemSelect) return;

    // 모든 아이템을 select에 추가
    allGameItems.forEach(item => {
        const option = document.createElement('option');
        option.value = JSON.stringify(item);
        option.textContent = `[${item.gradeName}] ${item.itemName}`;
        itemSelect.appendChild(option);
    });

    // 이벤트 리스너 연결
    document.getElementById('sendItemGiftButton')?.addEventListener('click', sendItemGift);
    document.getElementById('sendCoinGiftButton')?.addEventListener('click', () => sendCurrencyGift('coins'));
    document.getElementById('sendFragmentGiftButton')?.addEventListener('click', () => sendCurrencyGift('cosmicFragments'));
    document.getElementById('closeDevPanelButton')?.addEventListener('click', toggleDevPanel);
}

/**
 * Firestore에서 모든 유저 목록을 가져와 개발자 패널의 드롭다운을 채웁니다.
 */
async function populateUserList() {
    const selectEl = document.getElementById('targetUserSelect');
    const messageEl = document.getElementById('devPanelMessage');
    if (!selectEl) return;

    selectEl.innerHTML = '<option>유저 목록을 불러오는 중...</option>';
    selectEl.disabled = true;
    messageEl.textContent = '';

    try {
        const usersSnapshot = await db.collection('users').get();
        selectEl.innerHTML = '<option value="">유저를 선택하세요...</option>';
        
        const users = [];
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            // 닉네임이 없는 경우를 대비하여 displayName이나 UID로 대체
            const nickname = data.profile?.nickname || data.profile?.displayName || `UID: ${doc.id.substring(0, 8)}`;
            users.push({ uid: doc.id, nickname: nickname });
        });

        // 닉네임으로 유저 목록 정렬
        users.sort((a, b) => a.nickname.localeCompare(b.nickname, 'ko'));

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.uid;
            option.textContent = `${user.nickname} (${user.uid.substring(0, 6)}...)`;
            selectEl.appendChild(option);
        });

    } catch (error) {
        console.error("Error fetching user list:", error);
        selectEl.innerHTML = '<option value="">유저 목록 로드 실패</option>';
        messageEl.textContent = '유저 목록 로드에 실패했습니다.';
        messageEl.style.color = '#e74c3c';
    } finally {
        selectEl.disabled = false;
    }
}

async function sendItemGift() {
    const uid = document.getElementById('targetUserSelect').value;
    const itemSelect = document.getElementById('giftItemSelect');
    const messageEl = document.getElementById('devPanelMessage');

    if (!uid) {
        messageEl.textContent = '선물할 유저를 선택하세요.';
        messageEl.style.color = '#e74c3c';
        return;
    }

    try {
        const itemData = JSON.parse(itemSelect.value);
        const userDocRef = db.collection('users').doc(uid);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                throw new Error("해당 유저를 찾을 수 없습니다.");
            }
            
            const newInventory = userDoc.data().stats.inventory || [];
            newInventory.push({
                gradeKey: itemData.gradeKey,
                imagePath: itemData.imagePath,
                itemName: itemData.itemName,
                gradeName: itemData.gradeName,
                gradeColor: itemData.gradeColor
            });

            transaction.update(userDocRef, { "stats.inventory": newInventory });
        });

        messageEl.textContent = `'${itemData.itemName}'을(를) 성공적으로 보냈습니다.`;
        messageEl.style.color = '#2ecc71';

    } catch (error) {
        console.error("아이템 선물 보내기 실패:", error);
        messageEl.textContent = `선물 보내기 실패: ${error.message}`;
        messageEl.style.color = '#e74c3c';
    }
}

async function sendCurrencyGift(currencyType) {
    const uid = document.getElementById('targetUserSelect').value;
    const amount = parseInt(document.getElementById('giftAmount').value);
    const messageEl = document.getElementById('devPanelMessage');

    if (!uid) {
        messageEl.textContent = '선물할 유저를 선택하세요.';
        messageEl.style.color = '#e74c3c';
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        messageEl.textContent = '올바른 수량을 입력하세요.';
        messageEl.style.color = '#e74c3c';
        return;
    }

    try {
        const userDocRef = db.collection('users').doc(uid);
        const fieldToUpdate = `stats.${currencyType}`;
        await userDocRef.update({
            [fieldToUpdate]: firebase.firestore.FieldValue.increment(amount)
        });
        messageEl.textContent = `${currencyType === 'coins' ? '코인' : '파편'} ${amount.toLocaleString()}개를 성공적으로 보냈습니다.`;
        messageEl.style.color = '#2ecc71';
    } catch (error) {
        console.error("재화 선물 보내기 실패:", error);
        messageEl.textContent = `선물 보내기 실패: ${error.message}`;
        messageEl.style.color = '#e74c3c';
    }
}

/**
 * 닉네임이 없으면 모달을 표시하고, 있으면 UI를 업데이트합니다.
 * @param {object} profile - 사용자 프로필 객체
 */
function handleNickname(profile) {
    if (!profile || !profile.nickname) {
        showNicknameModal();
    } else {
        updateUserProfileDisplay(profile.nickname, currentUser.photoURL);
    }
}

/**
 * 닉네임 입력 모달을 표시합니다.
 * @param {string} [currentNickname=''] - 현재 닉네임 (수정 시 사용)
 */
function showNicknameModal(currentNickname = '') {
    const modal = document.getElementById('nicknameModal');
    const nicknameInput = document.getElementById('nicknameInput');
    const errorEl = document.getElementById('nicknameError');
    const titleEl = modal.querySelector('h2');

    if (currentNickname) {
        titleEl.textContent = '닉네임 변경';
        nicknameInput.value = currentNickname;
    }
    
    errorEl.textContent = ''; // 이전 오류 메시지 초기화
    modal.classList.add('show');
}

/**
 * 닉네임 입력 모달을 닫습니다.
 */
function closeNicknameModal() {
    document.getElementById('nicknameModal').classList.remove('show');
}

/**
 * 사용자 프로필 UI를 업데이트합니다.
 * @param {string} nickname - 표시할 닉네임
 * @param {string} photoURL - 프로필 사진 URL
 */
function updateUserProfileDisplay(nickname, photoURL) {
    const userProfile = document.getElementById('userProfile');
    userProfile.innerHTML = `
        <img src="${photoURL}" alt="프로필 사진">
        <span>${nickname}</span>
    `;
}

/**
 * 닉네임을 Firestore에 저장합니다.
 */
async function saveNickname() {
    const nicknameInput = document.getElementById('nicknameInput');
    const errorEl = document.getElementById('nicknameError');
    const nickname = nicknameInput.value.trim();

    if (nickname.length < 2 || nickname.length > 10) {
        errorEl.textContent = '닉네임은 2자 이상 10자 이하로 입력해주세요.';
        return;
    }
    errorEl.textContent = '';

    if (currentUser) {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        try {
            await userDocRef.set({
                profile: { nickname: nickname }
            }, { merge: true });

            closeNicknameModal();
            updateUserProfileDisplay(nickname, currentUser.photoURL);
            showNotification('닉네임이 저장되었습니다!', '#2ecc71');
        } catch (error) {
            console.error("닉네임 저장 실패:", error);
            showNotification('닉네임 저장에 실패했습니다.', '#e74c3c');
        }
    }
}