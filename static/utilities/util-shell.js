const containers = document.querySelectorAll(".utility-shell");

const syncFullscreenState = () => {
  const hasActive = document.querySelector(".utility-stage.is-fullscreen");
  containers.forEach((container) => {
    container.classList.toggle("utility-shell--fullscreen", Boolean(hasActive));
  });
};

containers.forEach((container) => {
  const stage = container.querySelector(".utility-stage");
  const infoPanel = container.querySelector(".utility-info");
  const toggle = container.querySelector(".utility-toggle");
  const fullscreenBtn = container.querySelector(".utility-fullscreen");
  const exitZone = container.querySelector(".utility-fullscreen-exit-zone");
  if (!stage) {
    return;
  }

  if (toggle && infoPanel) {
    const setCollapsed = (collapsed) => {
      infoPanel.classList.toggle("is-collapsed", collapsed);
      toggle.setAttribute("aria-expanded", (!collapsed).toString());
      toggle.textContent = collapsed ? "Show info" : "Hide info";
    };

    setCollapsed(false);

    toggle.addEventListener("click", () => {
      const nextState = !infoPanel.classList.contains("is-collapsed");
      setCollapsed(nextState);
    });
  }

  if (fullscreenBtn) {
    const exitFullscreen = (targetStage, btn) => {
      targetStage.classList.remove("is-fullscreen");
      if (btn) {
        btn.textContent = "Full screen";
        btn.setAttribute("aria-pressed", "false");
      }
      syncFullscreenState();
    };

    const handleExit = () => {
      const active = stage.classList.contains("is-fullscreen");
      if (active) {
        exitFullscreen(stage, fullscreenBtn);
        stage.scrollIntoView({behavior: "smooth", block: "start"});
        return;
      }

      document.querySelectorAll(".utility-stage.is-fullscreen").forEach((otherStage) => {
        const otherBtn = otherStage.closest(".utility-shell")?.querySelector(".utility-fullscreen");
        exitFullscreen(otherStage, otherBtn);
      });

      stage.classList.add("is-fullscreen");
      fullscreenBtn.textContent = "Exit full screen";
      fullscreenBtn.setAttribute("aria-pressed", "true");
      syncFullscreenState();
    };

    fullscreenBtn.addEventListener("click", handleExit);
    if (exitZone) {
      exitZone.addEventListener("click", (event) => {
        if (event.target.closest(".utility-fullscreen-exit-button")) {
          handleExit();
        }
      });
    }
  }
});
