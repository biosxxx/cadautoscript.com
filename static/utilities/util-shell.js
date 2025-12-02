const stages = document.querySelectorAll(".utility-stage");

stages.forEach((stage) => {
  const toggle = stage.querySelector(".utility-toggle");
  const aboutPanel = stage.querySelector(".utility-about");
  if (!toggle || !aboutPanel) return;

  // collapse panels by default for desktop view
  stage.classList.add("is-about-collapsed");
  aboutPanel.classList.add("is-collapsed");
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "Show panel";

  toggle.addEventListener("click", () => {
    const isCollapsed = aboutPanel.classList.toggle("is-collapsed");
    stage.classList.toggle("is-about-collapsed", isCollapsed);
    toggle.setAttribute("aria-expanded", (!isCollapsed).toString());
    toggle.textContent = isCollapsed ? "Show panel" : "Hide panel";
  });
});
