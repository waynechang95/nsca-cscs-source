/**
 * NSCA-CSCS Week 1-11 Slide Deck Controller & Slide-Aware Notebook System & RAG AI Assistant
 */

document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  let currentSlideIndex = 0;

  // DOM elements
  const currentSlideEl = document.getElementById('current-slide');
  const totalSlidesEl = document.getElementById('total-slides');
  const progressBar = document.getElementById('progress-bar');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnOverview = document.getElementById('btn-overview');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const modalOverview = document.getElementById('modal-overview');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const overviewGrid = document.getElementById('overview-grid');

  // Notebook DOM elements
  const btnNotes = document.getElementById('btn-notes');
  const noteDrawer = document.getElementById('note-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const noteTextarea = document.getElementById('note-textarea');
  const currentSlideBadge = document.getElementById('current-slide-badge');
  const btnQuickClip = document.getElementById('btn-quick-clip');
  const btnMasterNotebook = document.getElementById('btn-master-notebook');
  const modalNotebook = document.getElementById('modal-notebook');
  const btnCloseNotebookModal = document.getElementById('btn-close-notebook-modal');
  const masterNotebookList = document.getElementById('master-notebook-list');
  const notebookSearch = document.getElementById('notebook-search');
  const btnExportNotes = document.getElementById('btn-export-notes');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportNotes = document.getElementById('btn-import-notes');
  const fileImportNotes = document.getElementById('file-import-notes');
  const saveStatusText = document.getElementById('save-status-text');

  // AI Chat Assistant DOM elements
  const btnAiChat = document.getElementById('btn-ai-chat');
  const aiChatDrawer = document.getElementById('ai-chat-drawer');
  const btnCloseAiDrawer = document.getElementById('btn-close-ai-drawer');
  const aiSlideContextBadge = document.getElementById('ai-slide-context-badge');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const btnSendChat = document.getElementById('btn-send-chat');
  const quickPillBtns = document.querySelectorAll('.quick-pill-btn');

  // Dynamic RAG API Server URL Switcher (Local vs Cloud Render)
  const RAG_SERVER_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? 'http://localhost:8000/api/chat'
    : 'https://nsca-cscs-source.onrender.com/api/chat';

  // Week Title Maps
  const weekTitles_en = {
    1: "Exercise Anatomy & Biomechanics",
    2: "Bioenergetics & Endocrine Responses",
    3: "Anaerobic & Aerobic Training Adaptations",
    4: "Populations, Psychology & Rehabilitation",
    5: "Sports Nutrition & Ergogenic Aids",
    6: "Athletic Testing & Evaluation",
    7: "Warm-Up, Flexibility & Technique",
    8: "Resistance & Aerobic Program Design",
    9: "Plyometrics, Speed & Agility",
    10: "Periodization & Recovery Strategies",
    11: "Facility Management & Legal Issues"
  };

  const weekTitles_zh = {
    1: "運動解剖與生物力學",
    2: "生理機制與能量系統訓練",
    3: "抗阻與有氧訓練的適應性",
    4: "評估原則與特殊族群應用",
    5: "運動營養與補給策略",
    6: "體能測驗與項目選擇",
    7: "抗阻與舉重技術實作",
    8: "訓練計畫設計（抗阻＋有氧）",
    9: "增強式與速度敏捷訓練",
    10: "週期化訓練策略",
    11: "場館管理與法律責任"
  };

  // Detect current week from page title or url
  const pagePath = window.location.pathname;
  let currentWeekNum = 1;
  const match = pagePath.match(/week(\d+)_/);
  if (match) {
    currentWeekNum = parseInt(match[1], 10);
  }

  // Initialize Counter
  if (totalSlidesEl) totalSlidesEl.textContent = totalSlides;

  // ----------------------------------------------------
  // Slide Navigation Logic
  // ----------------------------------------------------
  function initOverviewModal() {
    if (!overviewGrid) return;
    overviewGrid.innerHTML = '';
    slides.forEach((slide, idx) => {
      const titleEl = slide.querySelector('.slide-title') || slide.querySelector('h1');
      const titleText = titleEl ? titleEl.textContent : `Slide ${idx + 1}`;
      
      const thumb = document.createElement('div');
      thumb.className = `thumb-card ${idx === currentSlideIndex ? 'active' : ''}`;
      thumb.innerHTML = `
        <div class="thumb-num">SLIDE ${idx + 1} / ${totalSlides}</div>
        <div class="thumb-title">${titleText}</div>
      `;
      thumb.addEventListener('click', () => {
        goToSlide(idx);
        closeOverviewModal();
      });
      overviewGrid.appendChild(thumb);
    });
  }

  function updateOverviewActiveState() {
    const thumbs = document.querySelectorAll('.thumb-card');
    thumbs.forEach((thumb, idx) => {
      if (idx === currentSlideIndex) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  function showOverviewModal() {
    if (modalOverview) {
      modalOverview.classList.add('active');
      updateOverviewActiveState();
    }
  }

  function closeOverviewModal() {
    if (modalOverview) {
      modalOverview.classList.remove('active');
    }
  }

  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    
    slides[currentSlideIndex].classList.remove('active');
    currentSlideIndex = index;
    slides[currentSlideIndex].classList.add('active');

    // Update UI controls
    if (currentSlideEl) currentSlideEl.textContent = currentSlideIndex + 1;
    if (progressBar) {
      const percentage = ((currentSlideIndex + 1) / totalSlides) * 100;
      progressBar.style.width = `${percentage}%`;
    }

    if (btnPrev) btnPrev.disabled = currentSlideIndex === 0;
    if (btnNext) btnNext.disabled = currentSlideIndex === totalSlides - 1;

    updateOverviewActiveState();
    updateNoteForCurrentSlide();
    updateAiContextBadge();
  }

  function nextSlide() {
    if (currentSlideIndex < totalSlides - 1) {
      goToSlide(currentSlideIndex + 1);
    }
  }

  function prevSlide() {
    if (currentSlideIndex > 0) {
      goToSlide(currentSlideIndex - 1);
    }
  }

  // Button Listeners
  if (btnNext) btnNext.addEventListener('click', nextSlide);
  if (btnPrev) btnPrev.addEventListener('click', prevSlide);
  if (btnOverview) btnOverview.addEventListener('click', showOverviewModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeOverviewModal);

  // Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    // Don't trigger if typing in an input/textarea
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'Space':
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(totalSlides - 1);
        break;
      case 'o':
      case 'O':
        e.preventDefault();
        if (modalOverview && modalOverview.classList.contains('active')) {
          closeOverviewModal();
        } else {
          showOverviewModal();
        }
        break;
      case 'n':
      case 'N':
        e.preventDefault();
        toggleNoteDrawer();
        break;
      case 'a':
      case 'A':
        e.preventDefault();
        toggleAiChatDrawer();
        break;
      case 'Escape':
        closeOverviewModal();
        closeNoteDrawer();
        closeAiChatDrawer();
        closeMasterNotebookModal();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  });

  // Fullscreen Handler
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  if (btnFullscreen) btnFullscreen.addEventListener('click', toggleFullscreen);

  // Touch Swipe Support
  let touchStartX = 0;
  let touchEndX = 0;
  document.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, false);
  document.addEventListener('touchend', (e) => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, false);
  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) nextSlide();
    if (touchEndX > touchStartX + swipeThreshold) prevSlide();
  }

  // Answer reveal listener for Practice Questions
  document.querySelectorAll('.reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qCard = btn.closest('.question-card');
      if (qCard) {
        const answerBox = qCard.querySelector('.answer-box');
        if (answerBox) {
          answerBox.classList.toggle('visible');
          btn.textContent = answerBox.classList.contains('visible') ? 'Hide Explanation' : 'Reveal Answer & Explanation';
        }
      }
    });
  });

  // ----------------------------------------------------
  // Slide-Aware Notebook System (localStorage & UI Drawer)
  // ----------------------------------------------------
  const NOTES_KEY = 'nsca_cscs_notes_v1';

  function getSavedNotes() {
    try {
      return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveNotesToStorage(notes) {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Error saving notes:', e);
    }
  }

  function getNoteKey(week, slideIdx) {
    return `w${week}_s${slideIdx + 1}`;
  }

  function updateNoteForCurrentSlide() {
    if (!noteTextarea) return;
    const noteKey = getNoteKey(currentWeekNum, currentSlideIndex);
    const notes = getSavedNotes();
    const currentSlideNote = notes[noteKey] ? notes[noteKey].content : '';
    
    noteTextarea.value = currentSlideNote;
    if (currentSlideBadge) {
      currentSlideBadge.textContent = `Week ${currentWeekNum} • Slide ${currentSlideIndex + 1}`;
    }
    if (saveStatusText) saveStatusText.textContent = 'Auto-saved';
  }

  let saveDebounceTimer = null;
  if (noteTextarea) {
    noteTextarea.addEventListener('input', () => {
      if (saveStatusText) saveStatusText.textContent = 'Saving...';
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = setTimeout(() => {
        const notes = getSavedNotes();
        const noteKey = getNoteKey(currentWeekNum, currentSlideIndex);
        const currentSlide = slides[currentSlideIndex];
        const titleEl = currentSlide ? (currentSlide.querySelector('.slide-title') || currentSlide.querySelector('h1')) : null;
        const slideTitle = titleEl ? titleEl.textContent.trim() : `Slide ${currentSlideIndex + 1}`;

        notes[noteKey] = {
          week: currentWeekNum,
          slide: currentSlideIndex + 1,
          slideTitle: slideTitle,
          content: noteTextarea.value,
          updatedAt: new Date().toISOString()
        };
        saveNotesToStorage(notes);
        if (saveStatusText) saveStatusText.textContent = 'Auto-saved';
      }, 500);
    });
  }

  function toggleNoteDrawer() {
    if (noteDrawer) {
      noteDrawer.classList.toggle('active');
      if (noteDrawer.classList.contains('active')) {
        closeAiChatDrawer();
        updateNoteForCurrentSlide();
        if (noteTextarea) noteTextarea.focus();
      }
    }
  }

  function closeNoteDrawer() {
    if (noteDrawer) noteDrawer.classList.remove('active');
  }

  if (btnNotes) btnNotes.addEventListener('click', toggleNoteDrawer);
  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeNoteDrawer);

  // Quick Clip Slide Text
  if (btnQuickClip) {
    btnQuickClip.addEventListener('click', () => {
      const activeSlide = slides[currentSlideIndex];
      if (!activeSlide) return;
      
      const cards = activeSlide.querySelectorAll('.card, .question-card, .highlight-box');
      let clippedText = '';
      cards.forEach(c => {
        const title = c.querySelector('.card-title, .question-text');
        if (title) clippedText += `📌 ${title.textContent.trim()}\n`;
        const items = c.querySelectorAll('li, p');
        items.forEach(it => {
          clippedText += `  - ${it.textContent.trim()}\n`;
        });
      });

      if (clippedText && noteTextarea) {
        noteTextarea.value += (noteTextarea.value ? '\n\n' : '') + `--- Clipped Content ---\n` + clippedText;
        noteTextarea.dispatchEvent(new Event('input'));
      }
    });
  }

  // Master Notebook Modal Viewer - Grouped By Week
  function renderMasterNotebook(searchFilter = '') {
    if (!masterNotebookList) return;
    masterNotebookList.innerHTML = '';
    const notes = getSavedNotes();
    const isZH = document.documentElement.lang.startsWith('zh');
    const titlesMap = isZH ? weekTitles_zh : weekTitles_en;

    // Group valid notes by week
    const grouped = {};
    const keys = Object.keys(notes).sort((a, b) => notes[a].week - notes[b].week || notes[a].slide - notes[b].slide);

    let matchCount = 0;
    keys.forEach(k => {
      const n = notes[k];
      if (!n.content || !n.content.trim()) return;

      const weekTitle = titlesMap[n.week] || `Week ${n.week}`;
      const searchText = `Week ${n.week} Slide ${n.slide} ${n.slideTitle} ${weekTitle} ${n.content}`.toLowerCase();
      if (searchFilter && !searchText.includes(searchFilter.toLowerCase())) return;

      if (!grouped[n.week]) {
        grouped[n.week] = [];
      }
      grouped[n.week].push(n);
      matchCount++;
    });

    if (matchCount === 0) {
      const emptyMsg = isZH ? 
        '目前尚無符合關鍵字的筆記。<br>可以在任意投影片按下 <strong>\'N\'</strong> 鍵記錄個人筆記與重點！' :
        'No notes found matching your search.<br>Press <strong>\'N\'</strong> on any slide to add personal study notes!';
      masterNotebookList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 20px; line-height: 1.6;">${emptyMsg}</div>`;
      return;
    }

    const weekNums = Object.keys(grouped).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    weekNums.forEach(wNum => {
      const weekNotes = grouped[wNum];
      const weekTitle = titlesMap[wNum] || `Week ${wNum}`;
      
      const groupEl = document.createElement('div');
      groupEl.className = 'week-note-group';
      
      let groupHeaderHTML = `
        <div class="week-note-group-header">
          <div class="week-note-group-title">
            📅 ${isZH ? `第 ${wNum} 週` : `Week ${wNum}`}: ${weekTitle}
          </div>
          <div class="week-note-count">${weekNotes.length} ${isZH ? '則筆記' : 'notes'}</div>
        </div>
      `;

      let notesHTML = '';
      weekNotes.forEach(n => {
        const formattedDate = new Date(n.updatedAt).toLocaleString();
        notesHTML += `
          <div class="note-card-item">
            <div class="note-card-header">
              <div class="note-card-title">${isZH ? `投影片 ${n.slide}` : `Slide ${n.slide}`}: ${n.slideTitle}</div>
              <div class="note-card-time">${formattedDate}</div>
            </div>
            <div class="note-card-content">${n.content}</div>
          </div>
        `;
      });

      groupEl.innerHTML = groupHeaderHTML + `<div style="display: flex; flex-direction: column; gap: 10px;">${notesHTML}</div>`;
      masterNotebookList.appendChild(groupEl);
    });
  }

  function showMasterNotebookModal() {
    if (modalNotebook) {
      modalNotebook.classList.add('active');
      renderMasterNotebook();
    }
  }

  function closeMasterNotebookModal() {
    if (modalNotebook) modalNotebook.classList.remove('active');
  }

  if (btnMasterNotebook) btnMasterNotebook.addEventListener('click', showMasterNotebookModal);
  if (btnCloseNotebookModal) btnCloseNotebookModal.addEventListener('click', closeMasterNotebookModal);
  if (notebookSearch) {
    notebookSearch.addEventListener('input', (e) => {
      renderMasterNotebook(e.target.value);
    });
  }

  // Export Notes to Markdown
  if (btnExportNotes) {
    btnExportNotes.addEventListener('click', () => {
      const notes = getSavedNotes();
      const isZH = document.documentElement.lang.startsWith('zh');
      const titlesMap = isZH ? weekTitles_zh : weekTitles_en;

      let mdContent = `# NSCA-CSCS Personal Study Notes\n\nGenerated on: ${new Date().toLocaleString()}\n\n---\n\n`;
      const keys = Object.keys(notes).sort((a, b) => notes[a].week - notes[b].week || notes[a].slide - notes[b].slide);
      
      let count = 0;
      let lastWeek = null;
      keys.forEach(k => {
        const n = notes[k];
        if (n.content && n.content.trim()) {
          count++;
          if (lastWeek !== n.week) {
            lastWeek = n.week;
            const weekTitle = titlesMap[n.week] || `Week ${n.week}`;
            mdContent += `\n# Week ${n.week}: ${weekTitle}\n\n`;
          }
          mdContent += `## Slide ${n.slide}: ${n.slideTitle}\n*Last updated: ${new Date(n.updatedAt).toLocaleString()}*\n\n${n.content}\n\n---\n\n`;
        }
      });

      if (count === 0) {
        alert('No notes available to export.');
        return;
      }

      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nsca_cscs_notes_${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Export Notes to JSON
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const notes = getSavedNotes();
      const keys = Object.keys(notes).filter(k => notes[k].content && notes[k].content.trim());
      if (keys.length === 0) {
        alert('No notes available to export.');
        return;
      }

      const jsonString = JSON.stringify(notes, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nsca_cscs_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Import Notes from JSON
  if (btnImportNotes && fileImportNotes) {
    btnImportNotes.addEventListener('click', () => fileImportNotes.click());
    fileImportNotes.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported && typeof imported === 'object') {
            const current = getSavedNotes();
            const merged = { ...current, ...imported };
            saveNotesToStorage(merged);
            alert('Notes imported successfully!');
            updateNoteForCurrentSlide();
            renderMasterNotebook();
          } else {
            alert('Invalid JSON file structure.');
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
    });
  }

  // ----------------------------------------------------
  // RAG AI Assistant Chat Controller & Markdown HTML Parser
  // ----------------------------------------------------

  function parseMarkdownTables(text) {
    const tableRegex = /((?:\|[^\n]+\|\r?\n)+)/g;
    
    return text.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) return match;

      let html = '<div class="table-container" style="margin: 14px 0;"><table class="slide-table">';
      
      lines.forEach((line, index) => {
        if (/^\|?\s*:?-+:?\s*(\||\s*:?-+:?\s*)+$/g.test(line)) {
          return;
        }

        const cells = line.split('|').map(c => c.trim());
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();

        if (index === 0) {
          html += '<thead><tr>';
          cells.forEach(cell => {
            html += `<th>${cell}</th>`;
          });
          html += '</tr></thead><tbody>';
        } else {
          html += '<tr>';
          cells.forEach(cell => {
            html += `<td>${cell}</td>`;
          });
          html += '</tr>';
        }
      });

      html += '</tbody></table></div>';
      return html;
    });
  }

  function parseMarkdownToHTML(text) {
    if (!text) return '';

    // First, convert any markdown tables into HTML slide-tables
    let parsed = parseMarkdownTables(text);

    parsed = parsed
      // Clean thinking tags if any
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      // Headers
      .replace(/^### (.*$)/gim, '<h4 style="color: var(--accent-cyan); margin: 12px 0 6px 0; font-weight: 700;">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="color: var(--accent-cyan); margin: 14px 0 8px 0; font-weight: 700; font-size: 1.05rem;">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 style="color: var(--accent-cyan); margin: 16px 0 10px 0; font-weight: 800; font-size: 1.15rem;">$1</h2>')
      
      // Bold & Italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); color: var(--accent-cyan);">$1</code>')
      
      // Bullet lists
      .replace(/^\s*[-•*]\s+(.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>')
      
      // Numbered lists
      .replace(/^\s*\d+\.\s+(.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>');

    // Wrap consecutive <li> into <ul>
    parsed = parsed.replace(/(<li.*<\/li>\n?)+/g, match => `<ul style="padding-left: 18px; margin: 8px 0; line-height: 1.6;">${match}</ul>`);

    // Paragraph breaks (ignoring inside table divs)
    parsed = parsed.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

    return parsed;
  }

  function updateAiContextBadge() {
    if (!aiSlideContextBadge) return;
    const currentSlide = slides[currentSlideIndex];
    const titleEl = currentSlide ? (currentSlide.querySelector('.slide-title') || currentSlide.querySelector('h1')) : null;
    const slideTitle = titleEl ? titleEl.textContent.trim() : `Slide ${currentSlideIndex + 1}`;
    aiSlideContextBadge.textContent = `Week ${currentWeekNum} • Slide ${currentSlideIndex + 1}: ${slideTitle.slice(0, 18)}...`;
  }

  function toggleAiChatDrawer() {
    if (aiChatDrawer) {
      aiChatDrawer.classList.toggle('active');
      if (aiChatDrawer.classList.contains('active')) {
        closeNoteDrawer();
        updateAiContextBadge();
        if (chatInput) chatInput.focus();
      }
    }
  }

  function closeAiChatDrawer() {
    if (aiChatDrawer) aiChatDrawer.classList.remove('active');
  }

  if (btnAiChat) btnAiChat.addEventListener('click', toggleAiChatDrawer);
  if (btnCloseAiDrawer) btnCloseAiDrawer.addEventListener('click', closeAiChatDrawer);

  function appendChatMessage(sender, text, citations = []) {
    if (!chatMessages) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    
    let htmlContent = sender === 'user' ? text.replace(/\n/g, '<br>') : parseMarkdownToHTML(text);

    if (citations && citations.length > 0) {
      citations.forEach(c => {
        htmlContent += `
          <div class="citation-card">
            <div class="citation-header">📖 NSCA Ch ${c.chapter} • Page ${c.page} (${c.chapterTitle})</div>
            <div>${c.snippet}</div>
          </div>
        `;
      });
    }

    bubble.innerHTML = htmlContent;

    // KaTeX Auto Render on AI response
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(bubble, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '\\[', right: '\\]', display: true},
            {left: '\\(', right: '\\)', display: false},
            {left: '$', right: '$', display: false}
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX render warning in chat:', err);
      }
    }

    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleSendChatMessage(customQuery = null) {
    const query = customQuery || (chatInput ? chatInput.value.trim() : '');
    if (!query) return;

    if (!customQuery && chatInput) chatInput.value = '';
    appendChatMessage('user', query);

    // Show typing indicator
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble ai';
    typingBubble.innerHTML = `<em>Thinking & searching NSCA 5th Edition...</em>`;
    chatMessages.appendChild(typingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const currentSlide = slides[currentSlideIndex];
    const titleEl = currentSlide ? (currentSlide.querySelector('.slide-title') || currentSlide.querySelector('h1')) : null;
    const slideTitle = titleEl ? titleEl.textContent.trim() : `Slide ${currentSlideIndex + 1}`;

    try {
      const resp = await fetch(RAG_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          week: currentWeekNum,
          slide: currentSlideIndex + 1,
          slideTitle: slideTitle
        })
      });

      if (!resp.ok) throw new Error('RAG server returned error status.');
      const data = await resp.json();

      chatMessages.removeChild(typingBubble);
      appendChatMessage('ai', data.answer, data.citations);
    } catch (err) {
      chatMessages.removeChild(typingBubble);
      const isZH = document.documentElement.lang.startsWith('zh');
      const fallbackMsg = isZH ?
        `💡 <strong>本地 RAG 回答 (離線模式)</strong>：\n已為您比對本張投影片 (${slideTitle})。若需調閱 1,876 頁完整原書檢索，請確保背景已啟動 <code>rag_server.py</code>。` :
        `💡 <strong>Local Offline Answer</strong>:\nReferenced for active slide context (${slideTitle}). Ensure <code>rag_server.py</code> is running on port 8000 for full textbook RAG search.`;
      
      appendChatMessage('ai', fallbackMsg);
    }
  }

  if (btnSendChat) {
    btnSendChat.addEventListener('click', () => handleSendChatMessage());
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSendChatMessage();
      }
    });
  }

  quickPillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const promptText = btn.dataset.prompt;
      if (promptText) {
        handleSendChatMessage(promptText);
      }
    });
  });

  // Interactive Lever Simulator Widget Logic
  const leverButtons = document.querySelectorAll('.lever-btn');
  const leverDescription = document.getElementById('lever-description');
  const leverMA = document.getElementById('lever-ma');
  const leverFulcrum = document.querySelector('.lever-fulcrum');
  const isZH = document.documentElement.lang.startsWith('zh');

  if (leverButtons.length > 0) {
    leverButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        leverButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.lever;

        if (type === '1') {
          if (leverDescription) {
            leverDescription.innerHTML = isZH ?
              "<strong>一級槓桿 (First Class Lever)：</strong> 支點 (Fulcrum) 部位於肌力 ($F_m$) 與阻力 ($F_r$) 之間。<br><em>解剖範例：</em> 肘關節三頭肌伸展、頸部伸展動作。<br><em>機械利得：</em> 可小於、等於或大於 1.0。" :
              "<strong>1st Class Lever:</strong> Fulcrum is located between Muscle Force ($F_m$) and Resistance Force ($F_r$).<br><em>Examples:</em> Extension of the elbow (Triceps), Neck extension.<br><em>Mechanical Advantage:</em> Can be &lt; 1, = 1, or &gt; 1 depending on moment arm lengths.";
          }
          if (leverMA) leverMA.textContent = isZH ? "MA = 可變 (1.0)" : "MA = Variable (1.0)";
          if (leverFulcrum) leverFulcrum.style.left = "50%";
        } else if (type === '2') {
          if (leverDescription) {
            leverDescription.innerHTML = isZH ?
              "<strong>二級槓桿 (Second Class Lever)：</strong> 阻力 ($F_r$) 位於支點與肌力 ($F_m$) 之間。<br><em>解剖範例：</em> 站姿提踵 (Plantar flexion)。<br><em>機械利得：</em> 恆大於 1.0 (肌力臂長於阻力臂)。極度省力！" :
              "<strong>2nd Class Lever:</strong> Resistance Force ($F_r$) is between Fulcrum and Resistance Force ($F_m$).<br><em>Examples:</em> Standing heel raise (Plantar flexion).<br><em>Mechanical Advantage:</em> Always &gt; 1.0 (Muscle force arm is longer than resistance arm). Requires LESS force to lift load!";
          }
          if (leverMA) leverMA.textContent = isZH ? "MA > 1.0 (高省力利得)" : "MA > 1.0 (High Force Advantage)";
          if (leverFulcrum) leverFulcrum.style.left = "15%";
        } else if (type === '3') {
          if (leverDescription) {
            leverDescription.innerHTML = isZH ?
              "<strong>三級槓桿 (Third Class Lever)：</strong> 肌力 ($F_m$) 位於支點與阻力 ($F_r$) 之間。<br><em>解剖範例：</em> 二頭肌彎舉 (Biceps Curl)。<br><em>機械利得：</em> 恆小於 1.0 (肌力臂短於阻力臂)。需要較大肌力，但能獲得極高肢體速度與廣闊動作範圍！" :
              "<strong>3rd Class Lever:</strong> Muscle Force ($F_m$) is between Fulcrum and Resistance Force ($F_r$).<br><em>Examples:</em> Biceps Curl, Elbow Flexion.<br><em>Mechanical Advantage:</em> Always &lt; 1.0 (Muscle force arm is SHORTER than resistance arm). Requires MORE muscle force than load, BUT allows high speed and large range of motion!";
          }
          if (leverMA) leverMA.textContent = isZH ? "MA < 1.0 (速度與活動度利得)" : "MA < 1.0 (Speed & ROM Advantage)";
          if (leverFulcrum) leverFulcrum.style.left = "15%";
        }
        if (window.renderMathInElement && leverDescription) {
          window.renderMathInElement(leverDescription);
        }
      });
    });
  }

  // Init
  initOverviewModal();
  goToSlide(0);
});
