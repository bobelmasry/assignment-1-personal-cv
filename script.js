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

  // ---- GitHub activity heatmap ----
  const GITHUB_USER = "bobelmasry";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const heatmap = document.querySelector("#heatmap");
  const heatmapMonths = document.querySelector("#heatmap-months");
  const heatmapFooter = document.querySelector("#heatmap-footer");
  const heatmapDetail = document.querySelector("#heatmap-detail");
  const activityStatus = document.querySelector("#activity-status");
  const githubStats = document.querySelector("#github-stats");

  async function loadActivity() {
    activityStatus.textContent = "Loading activity…";
    activityStatus.classList.remove("is-error");
    heatmap.innerHTML = "";
    heatmapMonths.innerHTML = "";
    githubStats.innerHTML = "";
    heatmapFooter.classList.add("is-hidden");

    try {
      // GitHub's REST API gives the profile numbers, but the contribution calendar is
      // only available through GraphQL with a token, so it comes from a public mirror API.
      const [profileResponse, calendarResponse] = await Promise.all([
        fetch(`https://api.github.com/users/${GITHUB_USER}`),
        fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`),
      ]);

      if (!calendarResponse.ok) {
        throw new Error(`Could not load contributions (status ${calendarResponse.status}).`);
      }

      const calendar = await calendarResponse.json();

      // The profile stats are a nice extra, so the heatmap still shows if they fail.
      const profile = profileResponse.ok ? await profileResponse.json() : null;

      activityStatus.textContent = "";
      renderStats(profile, calendar);
      renderHeatmap(calendar.contributions);
      heatmapFooter.classList.remove("is-hidden");
    } catch (error) {
      showError(error.message || "Something went wrong while loading GitHub activity.");
    }
  }

  function showError(message) {
    activityStatus.classList.add("is-error");
    activityStatus.textContent = message + " ";

    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "retry-button";
    retryButton.textContent = "Try again";
    retryButton.addEventListener("click", loadActivity);
    activityStatus.append(retryButton);
  }

  function renderStats(profile, calendar) {
    const days = calendar.contributions;
    const activeDays = days.filter((day) => day.count > 0).length;
    const bestDay = days.reduce((best, day) => (day.count > best.count ? day : best), days[0]);

    const stats = [
      [calendar.total.lastYear, "contributions in the last year"],
      [activeDays, "active days"],
      [bestDay.count, `most in one day (${formatDate(bestDay.date)})`],
    ];

    if (profile) {
      stats.push([profile.public_repos, "public repositories"]);
    }

    stats.forEach(([value, label]) => {
      const stat = document.createElement("div");
      stat.className = "github-stat";
      stat.innerHTML = "<strong></strong><span></span>";
      stat.querySelector("strong").textContent = value;
      stat.querySelector("span").textContent = label;
      githubStats.append(stat);
    });
  }

  function renderHeatmap(days) {
    // Rows are weekdays (Sunday first), so pad the first column until the first real day.
    const firstWeekday = new Date(days[0].date).getUTCDay();
    for (let i = 0; i < firstWeekday; i++) {
      const empty = document.createElement("span");
      empty.className = "heatmap-day is-empty";
      heatmap.append(empty);
    }

    let lastMonth = null;
    let lastLabelColumn = -3;

    days.forEach((day, index) => {
      const cell = document.createElement("span");
      cell.className = "heatmap-day";
      cell.dataset.level = day.level;

      const label = `${day.count} contribution${day.count === 1 ? "" : "s"} on ${formatDate(day.date)}`;
      cell.title = label;
      cell.setAttribute("aria-label", label);
      cell.addEventListener("mouseenter", () => {
        heatmapDetail.textContent = label;
      });
      heatmap.append(cell);

      // Add a month label above the column where each new month starts,
      // skipping it if it would sit on top of the previous label.
      const month = new Date(day.date).getUTCMonth();
      const column = Math.floor((index + firstWeekday) / 7);
      if (month !== lastMonth && column - lastLabelColumn >= 3) {
        const monthLabel = document.createElement("span");
        monthLabel.textContent = MONTHS[month];
        monthLabel.style.gridColumnStart = column + 1;
        heatmapMonths.append(monthLabel);
        lastLabelColumn = column;
      }
      lastMonth = month;
    });

    // Scroll to the most recent weeks on small screens.
    const scroller = heatmap.parentElement;
    scroller.scrollLeft = scroller.scrollWidth;
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  loadActivity();

  // ---- Projects (GitHub API) ----
  const PAGE_SIZE = 6;

  const projectGrid = document.querySelector("#project-grid");
  const projectStatus = document.querySelector("#project-status");
  const projectFilters = document.querySelector("#project-filters");
  const loadMoreButton = document.querySelector("#load-more");

  let allRepos = [];
  let activeLanguage = "All";
  let visibleCount = PAGE_SIZE;

  async function loadRepos() {
    projectStatus.textContent = "Loading projects…";
    projectStatus.classList.remove("is-error");
    projectGrid.innerHTML = "";
    projectFilters.innerHTML = "";
    loadMoreButton.classList.add("is-hidden");

    try {
      const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`);

      if (!response.ok) {
        // GitHub returns 403 when the hourly limit for unauthenticated requests is used up.
        if (response.status === 403) {
          throw new Error("GitHub's rate limit was reached. Please try again in a few minutes.");
        }
        throw new Error(`GitHub responded with status ${response.status}.`);
      }

      const repos = await response.json();

      // Skip forks and the profile README repo, they are not really my projects.
      allRepos = repos.filter((repo) => !repo.fork && repo.name !== GITHUB_USER);

      if (allRepos.length === 0) {
        projectStatus.textContent = "No public projects to show yet.";
        return;
      }

      projectStatus.textContent = "";
      renderFilters();
      renderRepos();
    } catch (error) {
      showProjectsError(error.message || "Something went wrong while loading projects.");
    }
  }

  function showProjectsError(message) {
    projectStatus.classList.add("is-error");
    projectStatus.textContent = message + " ";

    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "retry-button";
    retryButton.textContent = "Try again";
    retryButton.addEventListener("click", loadRepos);
    projectStatus.append(retryButton);
  }

  // Build one filter button for each language found in the repos.
  function renderFilters() {
    const languages = new Set(allRepos.map((repo) => repo.language).filter(Boolean));
    const options = ["All", ...[...languages].sort()];

    options.forEach((language) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter-button";
      button.textContent = language;
      button.setAttribute("aria-pressed", String(language === activeLanguage));

      button.addEventListener("click", () => {
        activeLanguage = language;
        visibleCount = PAGE_SIZE;
        projectFilters.querySelectorAll(".filter-button").forEach((btn) => {
          btn.setAttribute("aria-pressed", String(btn === button));
        });
        renderRepos();
      });

      projectFilters.append(button);
    });
  }

  function renderRepos() {
    const filtered = activeLanguage === "All"
      ? allRepos
      : allRepos.filter((repo) => repo.language === activeLanguage);

    projectGrid.innerHTML = "";
    filtered.slice(0, visibleCount).forEach((repo) => {
      projectGrid.append(createRepoCard(repo));
    });

    loadMoreButton.classList.toggle("is-hidden", visibleCount >= filtered.length);
  }

  function createRepoCard(repo) {
    const card = document.createElement("article");
    card.className = "project-card";

    const updated = new Date(repo.pushed_at).toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });

    // Repo names often use dashes or underscores, so make them easier to read.
    const title = repo.name.replace(/[-_]/g, " ");

    card.innerHTML = `
      <p class="project-updated">Updated ${updated}</p>
      <h3><a target="_blank" rel="noopener noreferrer"></a></h3>
      <p class="project-description"></p>
      <div class="project-meta">
        <span class="project-language"></span>
        <span class="project-stars" title="Stars">★ ${repo.stargazers_count}</span>
      </div>
    `;

    // Use textContent for data coming from the API so nothing gets injected as HTML.
    const link = card.querySelector("h3 a");
    link.href = repo.html_url;
    link.textContent = title;
    card.querySelector(".project-description").textContent = repo.description || "No description added yet.";
    card.querySelector(".project-language").textContent = repo.language || "Other";

    return card;
  }

  loadMoreButton.addEventListener("click", () => {
    visibleCount += PAGE_SIZE;
    renderRepos();
  });

  loadRepos();

  // ---- Cairo weather (Open-Meteo, no API key needed) ----
  const weatherCard = document.querySelector("#weather-card");

  // Open-Meteo returns WMO weather codes, so map each group to a label and an icon.
  const WEATHER_CODES = [
    { codes: [0], label: "Clear sky", day: "☀️", night: "🌙" },
    { codes: [1, 2], label: "Partly cloudy", day: "🌤️", night: "☁️" },
    { codes: [3], label: "Overcast", day: "☁️", night: "☁️" },
    { codes: [45, 48], label: "Foggy", day: "🌫️", night: "🌫️" },
    { codes: [51, 53, 55, 56, 57], label: "Drizzle", day: "🌦️", night: "🌧️" },
    { codes: [61, 63, 65, 66, 67, 80, 81, 82], label: "Rain", day: "🌧️", night: "🌧️" },
    { codes: [71, 73, 75, 77, 85, 86], label: "Snow", day: "❄️", night: "❄️" },
    { codes: [95, 96, 99], label: "Thunderstorm", day: "⛈️", night: "⛈️" },
  ];

  async function loadWeather() {
    weatherCard.innerHTML = '<p class="weather-status">Loading Cairo weather…</p>';

    try {
      const url = "https://api.open-meteo.com/v1/forecast?latitude=30.0444&longitude=31.2357"
        + "&current=temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,relative_humidity_2m"
        + "&timezone=Africa%2FCairo";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather request failed (status ${response.status}).`);
      }

      const data = await response.json();
      renderWeather(data.current);
    } catch (error) {
      weatherCard.innerHTML = '<p class="weather-status is-error">Couldn\'t load the weather right now. <button class="retry-button" type="button">Retry</button></p>';
      weatherCard.querySelector(".retry-button").addEventListener("click", loadWeather);
    }
  }

  function renderWeather(current) {
    const match = WEATHER_CODES.find((group) => group.codes.includes(current.weather_code))
      || { label: "Unknown", day: "🌡️", night: "🌡️" };
    const icon = current.is_day ? match.day : match.night;

    weatherCard.innerHTML = `
      <span class="weather-icon" role="img" aria-label="${match.label}">${icon}</span>
      <div>
        <p class="weather-temp">${Math.round(current.temperature_2m)}°C <span>${match.label}</span></p>
        <p class="weather-extra">Feels like ${Math.round(current.apparent_temperature)}°C · Humidity ${current.relative_humidity_2m}% · Wind ${Math.round(current.wind_speed_10m)} km/h</p>
      </div>
    `;
  }

  loadWeather();
});
