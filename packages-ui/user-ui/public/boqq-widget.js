/**
 * Boqq embed-code: кнопка «Чат» + панель с iframe на /embed/b/{slug}.
 * Один экземпляр на страницу. См. документацию в docs/features/business-card-widget-embed-plan.md
 */
(function () {
  'use strict';

  var Z_OVERLAY = 2147483000;
  var Z_BUTTON = 2147483001;

  function findWidgetScript() {
    var scripts = document.getElementsByTagName('script');
    var i;
    var s;
    var src;
    var slug;
    for (i = scripts.length - 1; i >= 0; i--) {
      s = scripts[i];
      src = s.getAttribute('src') || '';
      if (src.indexOf('boqq-widget.js') === -1) {
        continue;
      }
      slug = (s.getAttribute('data-boqq-slug') || '').trim();
      if (!slug) {
        continue;
      }
      try {
        return { origin: new URL(src, document.baseURI).origin, slug: slug };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function normalizeSlug(slug) {
    return String(slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
  }

  var cfg = findWidgetScript();
  if (!cfg) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Boqq] Не найден script с src содержащим boqq-widget.js и атрибутом data-boqq-slug.');
    }
    return;
  }

  var norm = normalizeSlug(cfg.slug);
  if (!norm) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Boqq] Пустой или неверный data-boqq-slug после нормализации.');
    }
    return;
  }

  if (window.__BOQQ_WIDGET_INIT__) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Boqq] Виджет уже инициализирован; второй скрипт на странице пропущен.');
    }
    return;
  }
  window.__BOQQ_WIDGET_INIT__ = true;

  var embedUrl = cfg.origin + '/embed/b/' + encodeURIComponent(norm);

  var panelOpen = false;
  var overlayEl = null;
  var iframeEl = null;
  var launcherBtn = null;

  function syncLauncherExpanded() {
    if (launcherBtn) {
      launcherBtn.setAttribute('aria-expanded', panelOpen ? 'true' : 'false');
    }
  }

  function closePanel() {
    if (!panelOpen) {
      return;
    }
    panelOpen = false;
    if (overlayEl) {
      overlayEl.style.display = 'none';
    }
    document.removeEventListener('keydown', onDocumentKeydown);
    syncLauncherExpanded();
    try {
      if (launcherBtn) {
        launcherBtn.focus();
      }
    } catch (e) {
      /* ignore */
    }
  }

  function openPanel() {
    if (!overlayEl) {
      buildOverlay();
    }
    overlayEl.style.display = 'flex';
    panelOpen = true;
    syncLauncherExpanded();
    document.addEventListener('keydown', onDocumentKeydown);
    if (!iframeEl) {
      iframeEl = document.createElement('iframe');
      iframeEl.setAttribute('src', embedUrl);
      iframeEl.setAttribute('title', 'Чат с бизнесом');
      iframeEl.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframeEl.style.cssText =
        'width:100%;height:100%;border:0;display:block;min-height:0;flex:1;background:#fff;';
      var holder = overlayEl.querySelector('.boqq-embed-frame-wrap');
      if (holder) {
        holder.appendChild(iframeEl);
      }
    }
  }

  function togglePanel() {
    if (panelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function onDocumentKeydown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closePanel();
    }
  }

  function buildOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'Чат');
    overlayEl.style.cssText = [
      'display:none',
      'position:fixed',
      'inset:0',
      'z-index:' + Z_OVERLAY,
      'align-items:center',
      'justify-content:center',
      'padding:1rem',
      'box-sizing:border-box',
      'background:rgba(15,23,42,0.45)',
      'font-family:system-ui,-apple-system,sans-serif'
    ].join(';');

    overlayEl.addEventListener('click', function (e) {
      if (e.target === overlayEl) {
        closePanel();
      }
    });

    var panel = document.createElement('div');
    panel.style.cssText = [
      'position:relative',
      'display:flex',
      'flex-direction:column',
      'width:600px',
      'max-width:min(600px,calc(100vw - 2rem))',
      'height:720px',
      'max-height:min(720px,90vh)',
      'background:#fff',
      'border-radius:12px',
      'overflow:hidden',
      'box-shadow:0 25px 50px -12px rgba(0,0,0,0.35)',
      'box-sizing:border-box'
    ].join(';');
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    var head = document.createElement('div');
    head.style.cssText =
      'flex-shrink:0;display:flex;align-items:center;justify-content:flex-end;padding:6px 8px;border-bottom:1px solid #e8eaef;background:#fafafa;';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText =
      'width:36px;height:36px;border:none;background:transparent;font-size:1.5rem;line-height:1;cursor:pointer;color:#555;border-radius:8px;padding:0;';
    closeBtn.addEventListener('mouseenter', function () {
      closeBtn.style.background = '#eee';
    });
    closeBtn.addEventListener('mouseleave', function () {
      closeBtn.style.background = 'transparent';
    });
    closeBtn.addEventListener('click', closePanel);

    head.appendChild(closeBtn);

    var frameWrap = document.createElement('div');
    frameWrap.className = 'boqq-embed-frame-wrap';
    frameWrap.style.cssText = 'flex:1;min-height:0;display:flex;flex-direction:column;';

    panel.appendChild(head);
    panel.appendChild(frameWrap);
    overlayEl.appendChild(panel);
    document.body.appendChild(overlayEl);
  }

  launcherBtn = document.createElement('button');
  launcherBtn.type = 'button';
  launcherBtn.textContent = 'Чат';
  launcherBtn.setAttribute('aria-label', 'Чат');
  launcherBtn.setAttribute('aria-expanded', 'false');
  launcherBtn.style.cssText = [
    'position:fixed',
    'right:16px',
    'bottom:16px',
    'z-index:' + Z_BUTTON,
    'padding:12px 20px',
    'border:none',
    'border-radius:999px',
    'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
    'color:#fff',
    'font:600 15px system-ui,-apple-system,BlinkMacSystemFont,sans-serif',
    'cursor:pointer',
    'box-shadow:0 4px 14px rgba(0,0,0,0.25)',
    'font-family:system-ui,-apple-system,sans-serif'
  ].join(';');

  launcherBtn.addEventListener('click', function () {
    togglePanel();
  });

  function onDomReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onDomReady(function () {
    document.body.appendChild(launcherBtn);
  });
})();
