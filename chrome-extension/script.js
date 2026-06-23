// === TIME & DATE ===

function updateTime() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("time").textContent = `${hours}:${minutes}`;

  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  document.getElementById("date").textContent = now.toLocaleDateString(
    "en-US",
    options
  );
}

updateTime();
setInterval(updateTime, 1000);

// === GITHUB PRs ===

async function fetchPRs() {
  const prList = document.getElementById("pr-list");

  try {
    const response = await fetch(
      "https://api.github.com/repos/CodingChallengesFYI/SharedSolutions/pulls",
      {
        headers: { Accept: "application/vnd.github.v3+json" },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const pulls = await response.json();

    if (pulls.length === 0) {
      prList.innerHTML = "<li>No open PRs right now.</li>";
      return;
    }

    prList.innerHTML = pulls
      .slice(0, 10)
      .map(
        (pr) =>
          `<li>
            <a href="${pr.html_url}" target="_blank">${escapeHtml(pr.title)}</a>
            <span class="pr-author">by ${escapeHtml(pr.user.login)}</span>
          </li>`
      )
      .join("");
  } catch (err) {
    prList.innerHTML = `<li>Failed to load PRs: ${escapeHtml(err.message)}</li>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

fetchPRs();
