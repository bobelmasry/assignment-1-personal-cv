document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const themeToggle = document.querySelector("#theme-toggle");
  const skillList = document.querySelector("#skill-list");
  const skillForm = document.querySelector("#skill-form");
  const skillInput = document.querySelector("#new-skill");
  const skillMessage = document.querySelector("#skill-message");

  // Create a dismissible welcome message after the page has loaded.
  const welcomeMessage = document.createElement("aside");
  welcomeMessage.className = "welcome-message";
  welcomeMessage.setAttribute("role", "status");
  welcomeMessage.innerHTML = "<p>Welcome to Aly's portfolio page!</p><button class=\"welcome-close\" type=\"button\" aria-label=\"Close welcome message\">&times;</button>";
  document.querySelector(".page-shell").prepend(welcomeMessage);

  welcomeMessage.querySelector(".welcome-close").addEventListener("click", () => {
    welcomeMessage.remove();
  });

  // Switch the page theme and keep the button state accessible to screen readers.
  themeToggle.addEventListener("click", () => {
    const isDarkMode = body.classList.toggle("dark-mode");
    themeToggle.textContent = isDarkMode ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-pressed", String(isDarkMode));
  });

  // Use each button's data-target value to show or hide its matching section.
  document.querySelectorAll(".section-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const sectionContent = document.querySelector(`#${toggle.dataset.target}`);
      const isHidden = sectionContent.classList.toggle("is-hidden");
      toggle.textContent = isHidden ? "Show" : "Hide";
      toggle.setAttribute("aria-expanded", String(!isHidden));
    });
  });

  // Add a new skill to the list without reloading the page.
  skillForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const skillName = skillInput.value.trim();

    // Do not add empty skills and guide the user back to the input.
    if (!skillName) {
      skillMessage.textContent = "Please enter a skill first.";
      skillInput.focus();
      return;
    }

    const skill = document.createElement("span");
    skill.setAttribute("role", "listitem");
    skill.textContent = skillName;
    skillList.append(skill);
    skillInput.value = "";
    skillMessage.textContent = `${skillName} was added to the skills list.`;
  });
});