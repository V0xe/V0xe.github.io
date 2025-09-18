// 유틸리티 함수 모듈

/**
 * 오디오를 페이드 인/아웃 시킵니다.
 * @param {HTMLAudioElement} audio - 오디오 요소
 * @param {'in' | 'out'} type - 'in' 또는 'out'
 * @param {number} duration - 페이드 지속 시간 (ms)
 * @param {number} [maxVolume=0.5] - 최대 볼륨 (0.0 ~ 1.0)
 * @param {function} [callback] - 페이드 완료 후 실행될 콜백 함수
 */
function fadeAudio(audio, type, duration, maxVolume = 0.5, callback) {
    if (!audio) {
        if (callback) callback();
        return;
    }

    const interval = 50;
    const steps = duration / interval;

    if (type === 'in') {
        audio.volume = 0;
        if (audio.paused) {
            audio.play().catch(e => console.log(`${audio.id} 재생 실패:`, e));
        }
        const volumeStep = maxVolume / steps;
        
        const fade = setInterval(() => {
            audio.volume = Math.min(maxVolume, audio.volume + volumeStep);
            if (audio.volume >= maxVolume) {
                clearInterval(fade);
                if (callback) callback();
            }
        }, interval);
    } else if (type === 'out') {
        const startVolume = audio.volume;
        const volumeStep = startVolume / steps;

        const fade = setInterval(() => {
            audio.volume = Math.max(0, audio.volume - volumeStep);
            if (audio.volume <= 0) {
                audio.pause();
                audio.currentTime = 0;
                clearInterval(fade);
                if (callback) callback();
            }
        }, interval);
    }
}

/**
 * 복사 완료 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {string} color - 메시지 색상
 */
function showCopyMessage(message, color) {
    const button = event.target;
    const originalText = button.textContent;
    const originalBackground = button.style.background;
    
    button.textContent = message;
    button.style.background = `linear-gradient(45deg, ${color}, ${color})`;
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = originalBackground;
    }, 2000);
}

/**
 * 사용자가 수동으로 게임 데이터를 저장합니다.
 */
function manualSave() {
    saveGameData(true); // 항상 알림을 표시하도록 강제
}

/**
 * 마지막 저장 시간을 화면에 업데이트합니다.
 * @param {string | undefined} isoString - ISO 8601 형식의 날짜 문자열
 */
function updateLastSavedTime(isoString) {
    const timeEl = document.getElementById('lastSavedTime');
    if (!timeEl) return;

    if (!isoString) {
        timeEl.textContent = '저장 기록 없음';
        return;
    }

    try {
        const date = new Date(isoString);
        const formattedTime = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        timeEl.textContent = `마지막 저장: ${formattedTime}`;
    } catch (e) {
        timeEl.textContent = '시간 표시 오류';
    }
}

// 상점 관련 유틸리티 함수들 (utils.js 파일 끝에 추가)

/**
 * 향상된 코인 표시 업데이트 (부스트 효과 포함)
 */
function updateCoinsDisplayEnhanced(newAmount, isBoost = false) {
    const coinAmount = document.getElementById('coinAmount');
    if (!coinAmount) return;
    
    const currentAmount = parseInt(coinAmount.textContent.replace(/,/g, '')) || 0;
    if (newAmount === currentAmount) return;
    
    const difference = newAmount - currentAmount;

    // 숫자 카운트업 애니메이션
    const duration = Math.min(1500, Math.abs(difference) * 3);
    const steps = 60;
    const stepAmount = difference / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
        currentStep++;
        const currentValue = Math.round(currentAmount + (stepAmount * currentStep));
        coinAmount.textContent = currentValue.toLocaleString();
        
        if (currentStep >= steps) {
            clearInterval(interval);
            coinAmount.textContent = newAmount.toLocaleString();
        }
    }, duration / steps);
    
    // 부스트 효과일 때 특별한 색상
    if (isBoost && difference > 0) {
        coinAmount.style.color = '#f39c12';
        coinAmount.style.textShadow = '0 0 10px #f39c12';
        setTimeout(() => {
            coinAmount.style.color = '#ffd700';
            coinAmount.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        }, 1000);
    } else if (difference > 0) {
        coinAmount.style.color = '#00ff00';
        setTimeout(() => {
            coinAmount.style.color = '#ffd700';
        }, 500);
    }
}

/**
 * 향상된 코인 획득 애니메이션 (부스트 표시)
 */
function animateCoinsGainedEnhanced(coins, isBoost = false) {
    const coinsDisplay = document.getElementById('coinsDisplay');
    const coinAnimation = document.createElement('div');
    
    const displayText = isBoost ? `+${coins} 코인 (2x 부스트!)` : `+${coins} 코인`;
    const color = isBoost ? '#f39c12' : '#ffd700';
    
    coinAnimation.textContent = displayText;
    coinAnimation.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: ${color};
        font-size: ${isBoost ? '1.8em' : '1.5em'};
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        z-index: 100;
        pointer-events: none;
        animation: ${isBoost ? 'coinBoostBounce' : 'coinBounce'} 2s ease-out forwards;
        ${isBoost ? 'text-decoration: underline;' : ''}
    `;
    
    // 부스트용 CSS 애니메이션 추가
    if (isBoost && !document.getElementById('coinBoostAnimationCSS')) {
        const style = document.createElement('style');
        style.id = 'coinBoostAnimationCSS';
        style.textContent = `
            @keyframes coinBoostBounce {
                0% {
                    transform: translate(-50%, -50%) scale(0) rotate(0deg);
                    opacity: 1;
                }
                25% {
                    transform: translate(-50%, -80px) scale(1.2) rotate(90deg);
                    opacity: 1;
                    color: #f39c12;
                }
                50% {
                    transform: translate(-50%, -100px) scale(1.8) rotate(180deg);
                    opacity: 1;
                    color: #e67e22;
                }
                75% {
                    transform: translate(-50%, -120px) scale(1.5) rotate(270deg);
                    opacity: 0.8;
                }
                100% {
                    transform: translate(-50%, -150px) scale(0.8) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.querySelector('.game-container').appendChild(coinAnimation);
    
    setTimeout(() => {
        coinAnimation.remove();
    }, 2000);
}

/**
 * 알림 메시지를 화면에 표시합니다.
 * @param {string} message - 표시할 메시지
 * @param {string} [color='#2ecc71'] - 알림창 배경색
 */
function showNotification(message, color = '#2ecc71') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out, slideOutRight 0.3s ease-out 2.7s;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;

    // 애니메이션을 위한 CSS를 동적으로 추가합니다.
    if (!document.getElementById('notificationCSS')) {
        const style = document.createElement('style');
        style.id = 'notificationCSS';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

/**
 * 효과 이름 반환
 */
function getEffectName(effectKey) {
    const names = {
        'speedBoost': '신속 부스트',
        'coinBoost': '코인 부스트',
        'guaranteeRare': '레어 보장',
        'ultimateBoost': '얼티밋 찬스'
    };
    return names[effectKey] || effectKey;
}

/**
 * 활성 효과 표시 업데이트
 */
function updateActiveEffectsDisplay() {
    const effectsList = document.getElementById('effectsList');
    if (!effectsList) return;

    const activeList = Object.entries(activeEffects)
        .filter(([key, value]) => value > 0)
        .map(([key, value]) => {
            // shopItems에서 effect 키를 기준으로 해당 아이템 찾기
            const itemKey = Object.keys(shopItems).find(id => shopItems[id].effect === key);
            const item = shopItems[itemKey];
            return `
            <div class="effect-tag">
                <span>${item?.icon || '✨'}</span>
                <span>${getEffectName(key)} (${value})</span>
            </div>
        `})
        .join('');

    if (activeList.length === 0) {
        effectsList.innerHTML = '<p class="no-effects">활성 효과가 없습니다</p>';
    } else {
        effectsList.innerHTML = activeList;
    }
}

/**
 * 상점 버튼 상태 업데이트
 */
function updateShopButtons() {
    Object.keys(shopItems).forEach(itemId => {
        const button = document.querySelector(`[data-item="${itemId}"] .buy-button`);
        if (button) {
            const item = shopItems[itemId];
            button.disabled = stats.coins < item.price;
        }
    });
}

/**
 * 게임 데이터(통계, 효과)를 localStorage에 저장합니다.
 */
async function saveGameData(forceNotification = false) {
    if (currentUser) {
        // 로그인 상태: Firestore에 저장
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const dataToSave = {
            stats: stats,
            activeEffects: activeEffects,
            lastSaved: new Date().toISOString(), // 저장 시간 기록
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };
        // set({ merge: true }) 대신 update를 사용하여, stats와 activeEffects 객체 전체를 덮어씁니다.
        // 이렇게 하면 서버에만 존재하는 불필요한 하위 필드들이 확실하게 제거됩니다.
        try {
            await userDocRef.update(dataToSave);
            if (forceNotification || (stats.settings?.showSaveNotifications ?? true)) {
                showNotification('☁️ 데이터가 저장되었습니다.', '#3498db');
            }
            updateLastSavedTime(dataToSave.lastSaved);
        } catch (error) {
            console.error("Firestore 업데이트 실패:", error);
            showNotification('데이터 저장에 실패했습니다. 새로고침 후 다시 시도해주세요.', '#e74c3c');
        }
    } else {
        // 비로그인 상태: 아무것도 저장하지 않음 (또는 임시 세션 저장)
        console.log("비로그인 상태이므로 데이터를 저장하지 않습니다.");
    }
}

/**
 * 게임 데이터(통계, 효과)를 로드합니다.
 * @deprecated 이제 이 기능은 firebase.js의 onSnapshot 리스너에서 직접 처리됩니다.
 */
async function loadGameData() {
    console.warn("loadGameData() is deprecated. Data loading is now handled by a real-time listener in firebase.js.");
    // 이 함수는 더 이상 사용되지 않으므로 비워둡니다.
    // 모든 로직은 firebase.js의 onSnapshot 콜백으로 이동되었습니다.
}

/**
 * 게임 전체를 초기화합니다 (통계, 효과, 수집 기록, 페널티 등).
 */
function resetGameWithShop(showConfirm = true) {
    const performReset = () => {
        stats = {
            total: 0,
            ancient: 0,
            'ultimate-jaeho': 0,
            divine: 0,
            mythic: 0,
            legendary: 0,
            epic: 0,
            rare: 0,
            uncommon: 0,
            common: 0,
            coins: 0,
            inventory: [],
            itemsPurchased: 0,
            coinsSpent: 0,
            collectedItems: {},
            hasCosmicKey: false,
            inventorySize: 5,
            cosmicFragments: 0,
            permanentLuck: 0,
            settings: {
                showSaveNotifications: true
            }
        };
        
        activeEffects = {
            speedBoost: 0,
            coinBoost: 0
        };
        
        // 페널티 상태 초기화
        penaltyState = { unlockTime: 0, detectionCount: 0, lastDetectionTime: 0, luckDebuff: { active: false, expiryTime: 0 } };
        
        document.getElementById('resultContainer').classList.remove('show');
        
        updateStatsDisplayEnhanced(); // 향상된 함수 호출
        updateActiveEffectsDisplay(); // 활성화된 효과 UI 초기화
        updateShopButtons();
        updateProbabilityDisplay(); // 행운 감소 등 UI 초기화
        updateInventoryDisplay();
        updateCosmicSpaceUI();

        // UI 업데이트
        const saveNotificationToggle = document.getElementById('saveNotificationToggle');
        if (saveNotificationToggle) {
            saveNotificationToggle.checked = true;
        }
        if (showConfirm) showNotification('게임이 초기화되었습니다!', '#e74c3c');
    };

    if (showConfirm) {
        if (confirm('정말로 모든 게임 데이터(통계, 아이템, 수집 기록)를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            performReset();
            saveGameData(false); // 초기화된 데이터를 알림 없이 Firestore에 덮어쓰기
        }
    } else {
        performReset();
    }
}

/**
 * 향상된 통계 표시 업데이트 (상점 정보 포함)
 */
function updateStatsDisplayEnhanced() {
    // 기본 통계 업데이트
    document.getElementById('totalSpins').textContent = stats.total;
    document.getElementById('ancientCount').textContent = stats.ancient;
    document.getElementById('ultimateJaehoCount').textContent = stats['ultimate-jaeho'];
    document.getElementById('divineCount').textContent = stats.divine;
    document.getElementById('mythicCount').textContent = stats.mythic;
    document.getElementById('legendaryCount').textContent = stats.legendary;
    document.getElementById('epicCount').textContent = stats.epic;
    document.getElementById('rareCount').textContent = stats.rare;
    
    // 코인 표시 업데이트
    updateCoinsDisplayEnhanced(stats.coins || 0);
    
    // 상점 통계가 있다면 표시 (옵션)
    const shopStats = document.getElementById('shopStats');
    if (shopStats) {
        shopStats.innerHTML = `
            <div class="shop-stat">구매한 아이템: ${stats.itemsPurchased || 0}개</div>
            <div class="shop-stat">사용한 코인: ${(stats.coinsSpent || 0).toLocaleString()}개</div>
        `;
    }
}

/**
 * 행운 감소 디버프 상태에 따라 확률 표시를 업데이트합니다.
 */
function updateProbabilityDisplay() {
    const debuffed = isLuckDebuffed(); // This returns false, so debuff logic is skipped.
    const highTierKeys = ['rare', 'epic', 'legendary', 'mythic', 'cosmic', 'divine', 'ultimate-jaeho', 'ancient', 'transcendence'];

    let displayGrades = JSON.parse(JSON.stringify(grades));

    // 영구 행운 적용
    const luckLevel = stats.permanentLuck || 0;
    if (luckLevel > 0) {
        // 레벨에 따른 총 보너스 확률을 가져옴
        const totalBonus = PERMANENT_LUCK_CONFIG.BONUSES[luckLevel - 1];
        if (!totalBonus) {
            console.error(`Invalid luck level or bonus not defined for UI: ${luckLevel}`);
        }
        
        const lowTierKeys = ['common', 'uncommon'];
        let totalLowTierProb = lowTierKeys.reduce((sum, key) => sum + displayGrades[key].probability, 0);

        const totalDeduction = Math.min(totalBonus, totalLowTierProb * 0.5); // 하위 등급 확률의 50%까지만 뺌

        if (totalLowTierProb > 0) {
            lowTierKeys.forEach(key => {
                const deduction = (displayGrades[key].probability / totalLowTierProb) * totalDeduction;
                displayGrades[key].probability -= deduction;
            });
        }

        const totalHighTierProb = highTierKeys.reduce((sum, key) => sum + displayGrades[key].probability, 0);
        if (totalHighTierProb > 0) {
            highTierKeys.forEach(key => {
                const addition = (displayGrades[key].probability / totalHighTierProb) * totalDeduction;
                displayGrades[key].probability += addition;
            });
        }
    }

    for (const key in grades) {
        const displayElement = document.getElementById(`prob-display-${key}`);
        if (displayElement) {
            const originalGrade = grades[key];
            const newProbability = displayGrades[key].probability;
            const probText = `${newProbability.toFixed(4)}%`;
            let displayText = `${originalGrade.probability}% | ${originalGrade.coins.toLocaleString()}코인`;

            const isBoostedByLuck = luckLevel > 0 && newProbability > originalGrade.probability;
            
            if (debuffed && highTierKeys.includes(key)) {
                displayElement.innerHTML = `<span style="color: #e74c3c;">${probText} (↓)</span> | ${originalGrade.coins.toLocaleString()}코인`;
            } else if (debuffed && (key === 'common' || key === 'uncommon')) {
                 displayElement.innerHTML = `<span style="color: #2ecc71;">${probText} (↑)</span> | ${originalGrade.coins.toLocaleString()}코인`;
            } else if (isBoostedByLuck) {
                displayText = `<span style="color: #2ecc71;">${probText} (↑)</span> | ${originalGrade.coins.toLocaleString()}코인`;
            } else {
                // 변경 없거나, 행운으로 인해 감소한 경우
                displayText = `${newProbability.toFixed(4)}% | ${originalGrade.coins.toLocaleString()}코인`;
                if (Math.abs(newProbability - originalGrade.probability) < 0.0001) {
                    displayText = `${originalGrade.probability}% | ${originalGrade.coins.toLocaleString()}코인`;
                }
            }
            displayElement.innerHTML = displayText;
        }
    }
}