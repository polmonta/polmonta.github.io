const initializedDocuments = new WeakSet();

function handleAppStoreClick(event) {
  const link = event.target?.closest?.('[data-app-store-click]');
  if (!link) {
    return;
  }

  const props = {
    page_path: link.dataset.pagePath,
    content_cluster: link.dataset.contentCluster,
    cta_placement: link.dataset.ctaPlacement,
    language: link.dataset.language,
    campaign: link.dataset.campaign
  };

  try {
    window.plausible?.('app_store_click', { props });
  } catch {
    // Analytics failures must never interfere with the link's default action.
  }
}

export function initializeAnalytics() {
  if (typeof document === 'undefined' || initializedDocuments.has(document)) {
    return;
  }

  document.addEventListener('click', handleAppStoreClick);
  initializedDocuments.add(document);
}

if (typeof document !== 'undefined') {
  initializeAnalytics();
}
