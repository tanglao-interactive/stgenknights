(() => {
  const panel = document.querySelector('[data-announcement-sharing]');
  if (!panel) return;
  const status = panel.querySelector('[data-share-status]');
  const copyButton = panel.querySelector('[data-copy-link]');
  const linkButton = panel.querySelector('[data-share-link]');
  const flyerButton = panel.querySelector('[data-share-flyer]');
  const manual = panel.querySelector('[data-manual-copy]');
  const input = manual.querySelector('input');
  const title = document.querySelector('h1').textContent;
  const url = new URL(window.location.pathname, window.location.origin).href;
  const download = panel.querySelector('[data-flyer-download]');
  const flyerUrl = new URL(download.href);
  download.download = flyerUrl.pathname.split('/').pop();
  input.value = url;
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      manual.hidden = true;
      status.textContent = 'Announcement link copied. Paste it into a message or email.';
    } catch {
      manual.hidden = false;
      input.focus();
      input.select();
      status.textContent = 'Select and copy the link below to share this announcement.';
    }
  });
  if (!navigator.share) return;
  linkButton.hidden = false;
  const share = async (data) => {
    try {
      await navigator.share(data);
      status.textContent = 'Shared successfully.';
    } catch (error) {
      if (error.name !== 'AbortError') {
        status.textContent = 'Sharing is unavailable. Download the flyer or copy the announcement link instead.';
      }
    }
  };
  linkButton.addEventListener('click', () => share({ title, url }));
  // Prepare the actual poster ahead of time so sharing retains click activation.
  if (!navigator.canShare) return;
  fetch(flyerUrl.href)
    .then((response) => {
      if (!response.ok) throw new Error('Flyer unavailable');
      return response.blob();
    })
    .then((blob) => {
      if (!blob.type.startsWith('image/')) return;
      const file = new File([blob], download.download, { type: blob.type });
      if (!navigator.canShare({ files: [file] })) return;
      flyerButton.hidden = false;
      flyerButton.addEventListener('click', () => share({ title, files: [file] }));
    })
    .catch(() => { /* Download and link sharing remain available. */ });
})();
