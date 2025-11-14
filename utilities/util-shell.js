const toggles = document.querySelectorAll(".utility-toggle");

toggles.forEach((toggle) => {
  const aboutPanel = toggle.closest(".utility-about");
  if (!aboutPanel) return;

  toggle.addEventListener("click", () => {
    const isCollapsed = aboutPanel.classList.toggle("is-collapsed");
    toggle.setAttribute("aria-expanded", (!isCollapsed).toString());
    toggle.textContent = isCollapsed ? "Show panel" : "Hide panel";
  });
});
