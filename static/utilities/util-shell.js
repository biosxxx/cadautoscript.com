const stages = document.querySelectorAll(".utility-stage");

const syncFullscreenState = () => {
  const hasActive = document.querySelector(".utility-stage.is-fullscreen");
  document.body.classList.toggle("utility-shell--fullscreen", Boolean(hasActive));
};

stages.forEach((stage) => {
  const toggle = stage.querySelector(".utility-toggle");
  const aboutPanel = stage.querySelector(".utility-about");
  if (!toggle || !aboutPanel) return;

  // collapse info panel for desktop
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

  // fullscreen toggle
  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.type = "button";
  fullscreenBtn.className = "utility-fullscreen";
  fullscreenBtn.textContent = "Full screen";
  fullscreenBtn.setAttribute("aria-pressed", "false");
  stage.insertBefore(fullscreenBtn, toggle.nextSibling);

  const exitFullscreen = (targetStage, btn) => {
    targetStage.classList.remove("is-fullscreen");
    if (btn) {
      btn.textContent = "Full screen";
      btn.setAttribute("aria-pressed", "false");
    }
    syncFullscreenState();
  };

  fullscreenBtn.addEventListener("click", () => {
    const active = stage.classList.contains("is-fullscreen");
    if (active) {
      exitFullscreen(stage, fullscreenBtn);
      stage.scrollIntoView({behavior: "smooth", block: "start"});
      return;
    }

    // collapse any other fullscreen stage
    document.querySelectorAll(".utility-stage.is-fullscreen").forEach((otherStage) => {
      const otherBtn = otherStage.querySelector(".utility-fullscreen");
      exitFullscreen(otherStage, otherBtn);
    });

    stage.classList.add("is-fullscreen");
    fullscreenBtn.textContent = "Exit full screen";
    fullscreenBtn.setAttribute("aria-pressed", "true");
    syncFullscreenState();
  });
});
