/**
 * LRC Studio for WatchLyrics - Main Application Logic
 * Mobile-First, Offline-Ready, Fluent/Material UI
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 状態管理 ---
  const state = {
    step: 'setup', // 'setup' | 'record' | 'result'
    mode: 'external', // 'external' | 'local'
    title: '',
    artist: '',
    rawLines: [],
    currentIndex: 0,
    records: [], // { text: string, timeMs: number }
    // タイマー関連 (external mode)
    timerRunning: false,
    timerStartTimestamp: 0,
    timerAccumulatedMs: 0,
    timerRafId: null,
    // オーディオ関連 (local mode)
    audioFile: null,
    audioDuration: 0,
    // オフセット
    globalOffsetMs: 0
  };

  // --- DOM要素の参照 ---
  // Steps
  const stepSetup = document.getElementById('step-setup');
  const stepRecord = document.getElementById('step-record');
  const stepResult = document.getElementById('step-result');

  // Step 1: Setup
  const inputTitle = document.getElementById('input-title');
  const inputArtist = document.getElementById('input-artist');
  const tabExternal = document.getElementById('tab-external');
  const tabLocal = document.getElementById('tab-local');
  const externalGuide = document.getElementById('external-guide');
  const localAudioBox = document.getElementById('local-audio-box');
  const audioFileInput = document.getElementById('audio-file-input');
  const fileLabelText = document.getElementById('file-label-text');
  const audioPlayer = document.getElementById('audio-player');
  const lyricsInput = document.getElementById('lyrics-input');
  const btnCleanEmpty = document.getElementById('btn-clean-empty');
  const btnClearLyrics = document.getElementById('btn-clear-lyrics');
  const btnStartRecord = document.getElementById('btn-start-record');

  // Step 2: Record
  const recordingSongName = document.getElementById('recording-song-name');
  const timerDisplay = document.getElementById('timer-display');
  const btnTimerPlay = document.getElementById('btn-timer-play');
  const playBtnIcon = document.getElementById('play-btn-icon');
  const playBtnText = document.getElementById('play-btn-text');
  const btnRewind3s = document.getElementById('btn-rewind-3s');
  const btnForward3s = document.getElementById('btn-forward-3s');
  const audioSeekbarWrap = document.getElementById('audio-seekbar-wrap');
  const audioSeekbar = document.getElementById('audio-seekbar');
  const audioCurrentTime = document.getElementById('audio-current-time');
  const audioDurationTime = document.getElementById('audio-duration-time');

  const lyricPast = document.getElementById('lyric-past');
  const pastText = document.getElementById('past-text');
  const lyricCurrent = document.getElementById('lyric-current');
  const currentText = document.getElementById('current-text');
  const lineCounter = document.getElementById('line-counter');
  const lyricFuture = document.getElementById('lyric-future');
  const futureText = document.getElementById('future-text');

  const btnTap = document.getElementById('btn-tap');
  const btnUndo = document.getElementById('btn-undo');
  const btnInterlude = document.getElementById('btn-interlude');
  const btnSkip = document.getElementById('btn-skip');
  const btnFinishEarly = document.getElementById('btn-finish-early');

  // Step 3: Result
  const btnCopyLrc = document.getElementById('btn-copy-lrc');
  const btnDownloadLrc = document.getElementById('btn-download-lrc');
  const globalOffsetVal = document.getElementById('global-offset-val');
  const btnResetOffset = document.getElementById('btn-reset-offset');
  const offsetBtns = document.querySelectorAll('.btn-pill[data-delta]');
  const totalLinesBadge = document.getElementById('total-lines-badge');
  const lrcLinesContainer = document.getElementById('lrc-lines-container');
  const rawLrcOutput = document.getElementById('raw-lrc-output');
  const btnRestart = document.getElementById('btn-restart');
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');

  // =========================================================================
  // 画面遷移
  // =========================================================================
  function switchStep(stepName) {
    state.step = stepName;
    stepSetup.classList.remove('active');
    stepRecord.classList.remove('active');
    stepResult.classList.remove('active');

    if (stepName === 'setup') {
      stepSetup.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (stepName === 'record') {
      stepRecord.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      initRecordingView();
    } else if (stepName === 'result') {
      stepResult.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      initResultView();
    }
  }

  // =========================================================================
  // モード切替（外部プレイヤー vs 音楽ファイル）
  // =========================================================================
  tabExternal.addEventListener('click', () => {
    state.mode = 'external';
    tabExternal.classList.add('active');
    tabLocal.classList.remove('active');
    externalGuide.classList.remove('hidden');
    localAudioBox.classList.add('hidden');
    audioSeekbarWrap.classList.add('hidden');
  });

  tabLocal.addEventListener('click', () => {
    state.mode = 'local';
    tabLocal.classList.add('active');
    tabExternal.classList.remove('active');
    externalGuide.classList.add('hidden');
    localAudioBox.classList.remove('hidden');
    audioSeekbarWrap.classList.remove('hidden');
  });

  audioFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      state.audioFile = file;
      fileLabelText.innerHTML = `
        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <span>${file.name}</span>
      `;
      const url = URL.createObjectURL(file);
      audioPlayer.src = url;
      audioPlayer.load();
      audioPlayer.onloadedmetadata = () => {
        state.audioDuration = audioPlayer.duration;
        audioDurationTime.textContent = formatMmSs(audioPlayer.duration * 1000);
      };
    }
  });

  // 貼り付け & 空行削除 & クリア
  const btnPasteLyrics = document.getElementById('btn-paste-lyrics');
  if (btnPasteLyrics) {
    btnPasteLyrics.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          lyricsInput.value = text;
          showToast('クリップボードから貼り付けました');
        } else {
          showToast('クリップボードにテキストがありません');
        }
      } catch (err) {
        showToast('貼り付けを許可してください、または手動で貼り付けてください');
      }
    });
  }

  btnCleanEmpty.addEventListener('click', () => {
    const lines = lyricsInput.value.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    lyricsInput.value = lines.join('\n');
    showToast('空行を整理しました');
  });

  btnClearLyrics.addEventListener('click', () => {
    if (confirm('歌詞入力をクリアしますか？')) {
      lyricsInput.value = '';
    }
  });

  // =========================================================================
  // 記録開始 (Step 1 -> Step 2)
  // =========================================================================
  btnStartRecord.addEventListener('click', () => {
    const text = lyricsInput.value.trim();
    if (!text) {
      alert('歌詞テキストを入力してください。');
      lyricsInput.focus();
      return;
    }

    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      alert('有効な歌詞行がありません。');
      return;
    }

    state.title = inputTitle.value.trim();
    state.artist = inputArtist.value.trim();
    state.rawLines = lines;
    state.currentIndex = 0;
    state.records = [];
    state.globalOffsetMs = 0;

    // タイトル表示
    if (state.title) {
      recordingSongName.textContent = state.title + (state.artist ? ' - ' + state.artist : '');
    } else {
      recordingSongName.textContent = 'タイトル未設定';
    }

    // タイマーリセット
    resetTimer();

    switchStep('record');
  });

  // =========================================================================
  // タイマー＆プレイヤー操作 (Step 2)
  // =========================================================================
  function getNowMs() {
    if (state.mode === 'local') {
      return (audioPlayer.currentTime || 0) * 1000;
    } else {
      if (state.timerRunning) {
        return state.timerAccumulatedMs + (performance.now() - state.timerStartTimestamp);
      } else {
        return state.timerAccumulatedMs;
      }
    }
  }

  function formatTimerString(ms) {
    const safeMs = Math.max(0, Math.floor(ms));
    const totalSec = Math.floor(safeMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const cs = Math.floor((safeMs % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  function formatMmSs(ms) {
    const totalSec = Math.floor(Math.max(0, ms) / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function startTimer() {
    if (state.mode === 'local') {
      if (audioPlayer.src) {
        audioPlayer.play();
        state.timerRunning = true;
        updatePlayBtnUI(true);
        startTimerLoop();
      } else {
        alert('音楽ファイルが選択されていません。');
      }
    } else {
      if (!state.timerRunning) {
        state.timerRunning = true;
        state.timerStartTimestamp = performance.now();
        updatePlayBtnUI(true);
        startTimerLoop();
      }
    }
  }

  function pauseTimer() {
    if (state.mode === 'local') {
      audioPlayer.pause();
      state.timerRunning = false;
      updatePlayBtnUI(false);
    } else {
      if (state.timerRunning) {
        state.timerAccumulatedMs += performance.now() - state.timerStartTimestamp;
        state.timerRunning = false;
        updatePlayBtnUI(false);
      }
    }
    cancelAnimationFrame(state.timerRafId);
    timerDisplay.textContent = formatTimerString(getNowMs());
  }

  function toggleTimer() {
    if (state.timerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function resetTimer() {
    pauseTimer();
    state.timerAccumulatedMs = 0;
    if (state.mode === 'local') {
      audioPlayer.currentTime = 0;
    }
    timerDisplay.textContent = "00:00.00";
  }

  function updatePlayBtnUI(running) {
    if (running) {
      btnTimerPlay.classList.add('running');
      playBtnIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      playBtnText.textContent = '一時停止';
    } else {
      btnTimerPlay.classList.remove('running');
      playBtnIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
      playBtnText.textContent = (getNowMs() > 0) ? '再開' : '再生 / 計測';
    }
  }

  function startTimerLoop() {
    const loop = () => {
      const nowMs = getNowMs();
      timerDisplay.textContent = formatTimerString(nowMs);

      if (state.mode === 'local' && state.audioDuration > 0) {
        audioSeekbar.value = (audioPlayer.currentTime / state.audioDuration) * 100;
        audioCurrentTime.textContent = formatMmSs(nowMs);
      }

      if (state.timerRunning) {
        state.timerRafId = requestAnimationFrame(loop);
      }
    };
    state.timerRafId = requestAnimationFrame(loop);
  }

  btnTimerPlay.addEventListener('click', toggleTimer);

  // 3秒巻き戻し / 早送り
  btnRewind3s.addEventListener('click', () => {
    shiftPlayback(-3000);
  });

  btnForward3s.addEventListener('click', () => {
    shiftPlayback(3000);
  });

  function shiftPlayback(deltaMs) {
    if (state.mode === 'local') {
      audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime + (deltaMs / 1000));
    } else {
      if (state.timerRunning) {
        state.timerAccumulatedMs = Math.max(0, state.timerAccumulatedMs + deltaMs);
        state.timerStartTimestamp = performance.now();
      } else {
        state.timerAccumulatedMs = Math.max(0, state.timerAccumulatedMs + deltaMs);
      }
    }
    timerDisplay.textContent = formatTimerString(getNowMs());
  }

  // ローカルシークバー
  audioSeekbar.addEventListener('input', (e) => {
    if (state.audioDuration > 0) {
      const targetSec = (e.target.value / 100) * state.audioDuration;
      audioPlayer.currentTime = targetSec;
      timerDisplay.textContent = formatTimerString(targetSec * 1000);
      audioCurrentTime.textContent = formatMmSs(targetSec * 1000);
    }
  });

  // =========================================================================
  // リアルタイム歌詞同期（TAP & UNDO & SKIP）
  // =========================================================================
  function initRecordingView() {
    updateLyricsCards();
    updatePlayBtnUI(false);
    timerDisplay.textContent = "00:00.00";
  }

  function updateLyricsCards() {
    const total = state.rawLines.length;
    const curIdx = state.currentIndex;

    // 上段: いま流れている歌詞（直近の記録があれば表示、なければ案内）
    lyricPast.style.visibility = 'visible';
    if (state.records.length > 0) {
      const lastRec = state.records[state.records.length - 1];
      pastText.textContent = lastRec.text;
    } else {
      pastText.textContent = '（歌い出しをお待ちください）';
    }

    // 中段: 歌い出しでタップするターゲット歌詞
    if (curIdx < total) {
      currentText.textContent = state.rawLines[curIdx];
      lineCounter.textContent = `行 ${curIdx + 1} / ${total}`;
      lyricCurrent.style.display = 'flex';
      btnTap.disabled = false;
    } else {
      // 全行記録完了
      currentText.textContent = 'すべての行を記録しました';
      lineCounter.textContent = `完了 (${total}行)`;
      btnTap.disabled = true;
      pauseTimer();
      setTimeout(() => {
        switchStep('result');
      }, 600);
      return;
    }

    // 下段: その次の歌詞
    lyricFuture.style.visibility = 'visible';
    if (curIdx + 1 < total) {
      futureText.textContent = state.rawLines[curIdx + 1];
    } else {
      futureText.textContent = '（この行で最後です）';
    }
  }

  function handleTapSync() {
    if (state.currentIndex >= state.rawLines.length) return;

    if (!state.timerRunning) {
      startTimer();
    }

    if ('vibrate' in navigator) {
      try { navigator.vibrate(20); } catch (_) {}
    }

    const tapTimeMs = getNowMs();
    const lineText = state.rawLines[state.currentIndex];

    state.records.push({
      text: lineText,
      timeMs: tapTimeMs
    });

    state.currentIndex++;
    updateLyricsCards();
  }

  btnTap.addEventListener('click', handleTapSync);

  // 間奏ボタン（現在の行は進めず「♪」音符マーカーを記録）
  if (btnInterlude) {
    btnInterlude.addEventListener('click', () => {
      if (!state.timerRunning) {
        startTimer();
      }

      if ('vibrate' in navigator) {
        try { navigator.vibrate(20); } catch (_) {}
      }

      const tapTimeMs = getNowMs();
      state.records.push({
        text: '♪',
        timeMs: tapTimeMs
      });

      updateLyricsCards();
      showToast('間奏（♪）を記録しました');
    });
  }

  // 1行戻す (Undo)
  btnUndo.addEventListener('click', () => {
    if (state.records.length > 0) {
      const removed = state.records.pop();
      // 間奏マーカー（♪）だった場合は currentIndex は戻さない
      if (removed.text !== '♪' && state.currentIndex > 0) {
        state.currentIndex--;
      }
      updateLyricsCards();
      showToast('1つ前の記録を取り消しました');
    }
  });

  // スキップ
  btnSkip.addEventListener('click', () => {
    if (state.currentIndex < state.rawLines.length) {
      state.currentIndex++;
      updateLyricsCards();
      showToast('この行をスキップしました');
    }
  });

  // 早めに記録完了
  btnFinishEarly.addEventListener('click', () => {
    if (state.records.length === 0) {
      alert('まだ1行も時刻が記録されていません。');
      return;
    }
    if (confirm('記録を終了して出力画面へ進みますか？')) {
      pauseTimer();
      switchStep('result');
    }
  });

  // =========================================================================
  // 微調整＆出力画面 (Step 3)
  // =========================================================================
  function initResultView() {
    state.globalOffsetMs = 0;
    globalOffsetVal.textContent = "±0.0秒";
    renderResultList();
    updateRawLrcOutput();
  }

  function formatLrcTime(ms) {
    const safeMs = Math.max(0, Math.floor(ms));
    const totalSec = Math.floor(safeMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const cs = Math.floor((safeMs % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  function renderResultList() {
    lrcLinesContainer.innerHTML = '';
    totalLinesBadge.textContent = `${state.records.length}行`;

    state.records.forEach((rec, idx) => {
      const row = document.createElement('div');
      row.className = 'lrc-line-row';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'lrc-line-time';
      timeSpan.textContent = `[${formatLrcTime(rec.timeMs + state.globalOffsetMs)}]`;

      const textSpan = document.createElement('span');
      textSpan.className = 'lrc-line-text';
      textSpan.textContent = rec.text;

      const btnsDiv = document.createElement('div');
      btnsDiv.className = 'lrc-line-btns';

      const btnMinus = document.createElement('button');
      btnMinus.className = 'btn-line-adj';
      btnMinus.textContent = '-0.2s';
      btnMinus.addEventListener('click', () => {
        rec.timeMs = Math.max(0, rec.timeMs - 200);
        timeSpan.textContent = `[${formatLrcTime(rec.timeMs + state.globalOffsetMs)}]`;
        updateRawLrcOutput();
      });

      const btnPlus = document.createElement('button');
      btnPlus.className = 'btn-line-adj';
      btnPlus.textContent = '+0.2s';
      btnPlus.addEventListener('click', () => {
        rec.timeMs += 200;
        timeSpan.textContent = `[${formatLrcTime(rec.timeMs + state.globalOffsetMs)}]`;
        updateRawLrcOutput();
      });

      btnsDiv.appendChild(btnMinus);
      btnsDiv.appendChild(btnPlus);

      row.appendChild(timeSpan);
      row.appendChild(textSpan);
      row.appendChild(btnsDiv);

      lrcLinesContainer.appendChild(row);
    });
  }

  function generateFullLrcText() {
    const lines = [];
    if (state.title) lines.push(`[ti:${state.title}]`);
    if (state.artist) lines.push(`[ar:${state.artist}]`);
    lines.push(`[by:WatchLyrics LRC Studio]`);

    state.records.forEach(rec => {
      const timeStr = formatLrcTime(rec.timeMs + state.globalOffsetMs);
      lines.push(`[${timeStr}]${rec.text}`);
    });

    return lines.join('\n');
  }

  function updateRawLrcOutput() {
    rawLrcOutput.value = generateFullLrcText();
  }

  // 一括オフセット
  offsetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseFloat(btn.dataset.delta);
      state.globalOffsetMs += Math.round(delta * 1000);
      updateOffsetUI();
    });
  });

  btnResetOffset.addEventListener('click', () => {
    state.globalOffsetMs = 0;
    updateOffsetUI();
  });

  function updateOffsetUI() {
    const sec = state.globalOffsetMs / 1000;
    const formatted = (sec > 0 ? `+${sec.toFixed(1)}` : sec < 0 ? sec.toFixed(1) : '±0.0') + '秒';
    globalOffsetVal.textContent = formatted;
    renderResultList();
    updateRawLrcOutput();
  }

  // クリップボードへコピー
  btnCopyLrc.addEventListener('click', () => {
    const text = rawLrcOutput.value;
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('LRC をコピーしました（WatchLyricsへ貼り付け可能）');
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  });

  function fallbackCopyText(text) {
    rawLrcOutput.select();
    document.execCommand('copy');
    showToast('LRC をコピーしました');
  }

  // .lrc ファイルダウンロード
  btnDownloadLrc.addEventListener('click', () => {
    const text = rawLrcOutput.value;
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const filename = (state.title ? `${state.title}${state.artist ? ' - ' + state.artist : ''}` : 'lyrics') + '.lrc';
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`${filename} をダウンロードしました`);
  });

  // 最初からやり直す
  btnRestart.addEventListener('click', () => {
    if (confirm('入力画面に戻りますか？')) {
      switchStep('setup');
    }
  });

  // Toast表示関数
  function showToast(message) {
    toastText.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }
});
