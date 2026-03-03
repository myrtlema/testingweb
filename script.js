/**
 * Chinese to English Translator
 * 使用 MyMemory Translation API 進行翻譯
 */

// DOM Elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const inputCount = document.getElementById('inputCount');
const outputCount = document.getElementById('outputCount');
const translateBtn = document.getElementById('translateBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const swapBtn = document.getElementById('swapBtn');
const statusMessage = document.getElementById('statusMessage');
const loadingOverlay = document.getElementById('loadingOverlay');

// Constants
const MAX_CHARS = 5000;
const API_URL = 'https://api.mymemory.translated.net/get';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCharCount();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Input text change - update character count
    inputText.addEventListener('input', updateCharCount);
    
    // Translate button
    translateBtn.addEventListener('click', handleTranslate);
    
    // Clear button
    clearBtn.addEventListener('click', handleClear);
    
    // Copy button
    copyBtn.addEventListener('click', handleCopy);
    
    // Swap button
    swapBtn.addEventListener('click', handleSwap);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Update character count
function updateCharCount() {
    const inputLength = inputText.value.length;
    const outputLength = outputText.value.length;
    
    inputCount.textContent = inputLength;
    outputCount.textContent = outputLength;
    
    // Visual feedback when approaching limit
    if (inputLength > MAX_CHARS * 0.9) {
        inputCount.style.color = 'var(--accent-color)';
    } else {
        inputCount.style.color = '';
    }
}

// Handle translation
async function handleTranslate() {
    const text = inputText.value.trim();
    
    // Validate input
    if (!text) {
        showStatus('請輸入要翻譯的中文文字', 'error');
        inputText.focus();
        return;
    }
    
    if (text.length > MAX_CHARS) {
        showStatus(`輸入文字超過 ${MAX_CHARS} 字元限制`, 'error');
        return;
    }
    
    // Show loading
    showLoading(true);
    hideStatus();
    
    try {
        const translatedText = await translateText(text);
        outputText.value = translatedText;
        updateCharCount();
        showStatus('翻譯成功！', 'success');
    } catch (error) {
        console.error('Translation error:', error);
        
        let errorMessage = '翻譯失敗，請稍後再試';
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = '網路錯誤，請檢查您的網路連線';
        } else if (error.message.includes('429')) {
            errorMessage = '请求过多，请稍后再试';
        }
        
        showStatus(errorMessage, 'error');
    } finally {
        showLoading(false);
    }
}

// Translate text using MyMemory API
async function translateText(text) {
    const langPair = 'zh-TW|en';
    const url = `${API_URL}?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.responseStatus !== 200) {
        throw new Error(data.responseDetails || 'Translation failed');
    }
    
    return data.responseData.translatedText;
}

// Handle clear
function handleClear() {
    inputText.value = '';
    outputText.value = '';
    updateCharCount();
    hideStatus();
    inputText.focus();
}

// Handle copy
async function handleCopy() {
    const text = outputText.value;
    
    if (!text) {
        showStatus('沒有可複製的文字', 'info');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        showStatus('已複製到剪貼簿！', 'success');
    } catch (error) {
        console.error('Copy error:', error);
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showStatus('已複製到剪貼簿！', 'success');
        } catch (err) {
            showStatus('複製失敗，請手動複製', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

// Handle swap
function handleSwap() {
    const inputValue = inputText.value;
    const outputValue = outputText.value;
    
    // Only swap if there's content in output
    if (!outputValue && !inputValue) {
        showStatus('請先輸入要翻譯的文字', 'info');
        return;
    }
    
    // Swap the values
    inputText.value = outputValue;
    outputText.value = inputValue;
    
    updateCharCount();
    hideStatus();
    
    // Show feedback
    if (outputValue) {
        showStatus('已交換輸入和輸出', 'success');
    }
}

// Keyboard shortcuts
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Enter: Translate
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleTranslate();
    }
    
    // Ctrl/Cmd + Shift + C: Copy output
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        handleCopy();
    }
    
    // Escape: Clear or close status
    if (event.key === 'Escape') {
        if (!statusMessage.classList.contains('hidden')) {
            hideStatus();
        } else if (inputText.value || outputText.value) {
            handleClear();
        }
    }
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

// Hide status message
function hideStatus() {
    statusMessage.className = 'status-message hidden';
}

// Show/hide loading
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}
