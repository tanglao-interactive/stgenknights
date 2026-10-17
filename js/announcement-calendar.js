(() => {
  const dropdowns = [...document.querySelectorAll('[data-calendar-dropdown]')];
  document.addEventListener('click', event => {
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(event.target)) dropdown.open = false;
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    dropdowns.forEach(dropdown => {
      if (dropdown.open && dropdown.contains(document.activeElement)) {
        dropdown.open = false;
        dropdown.querySelector('summary').focus();
      }
    });
  });
})();
