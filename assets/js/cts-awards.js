/**
 * CTS Awards Frontend JavaScript
 */

document.addEventListener("DOMContentLoaded", function () {
	// Initialize awards search form functionality
	initAwardsSearchForm();
	// Load initial data
	loadAwardsData();
});

/**
 * Initialize the awards search form
 */
function initAwardsSearchForm() {
	const yearSelect = document.getElementById("award-year");
	const awardSelect = document.getElementById("award-select");
	const postIdInput = document.getElementById("award-post-id");
	const form = document.getElementById("cts-awards-search");
	const resetButton = document.getElementById("reset-filters");

	// Exit if form doesn't exist
	if (!form) {
		return;
	}

	// Get API URL from data attribute
	const apiUrl = form.dataset.apiUrl;
	if (!apiUrl) {
		console.error("API URL not found in form data");
		return;
	}

	// Handle form submission
	form.addEventListener("submit", function (e) {
		e.preventDefault();
		console.log("Submitting awards search form");
		handleFormSubmissionViaAPI(form, apiUrl);
	});

	// Handle reset button
	if (resetButton) {
		resetButton.addEventListener("click", function (e) {
			e.preventDefault();
			resetFilters(apiUrl);
		});
	}

	// Handle post ID input changes
	if (postIdInput) {
		postIdInput.addEventListener("input", function () {
			// If post ID is entered manually, clear award dropdown
			const hasPostId = this.value.trim() !== "";

			if (awardSelect && hasPostId) {
				awardSelect.value = "";
			}
		});
	}

	// Handle award select changes to clear manual post ID
	if (awardSelect) {
		awardSelect.addEventListener("change", function () {
			if (postIdInput && this.value !== "") {
				postIdInput.value = "";
			}
		});
	}
}

/**
 * Load initial awards data
 */
function loadAwardsData() {
	const form = document.getElementById("cts-awards-search");
	if (!form) return;

	const apiUrl = form.dataset.apiUrl;
	if (!apiUrl) return;

	// Get current filters from URL parameters
	const urlParams = new URLSearchParams(window.location.search);
	const currentYear = urlParams.get("year") || "all";
	const currentPostId = urlParams.get("post_id") || "";

	// Set form values to match URL parameters
	const yearSelect = document.getElementById("award-year");
	const awardSelect = document.getElementById("award-select");

	if (yearSelect && currentYear !== "all") {
		yearSelect.value = currentYear;
	}
	if (awardSelect && currentPostId) {
		awardSelect.value = currentPostId;
	}

	// Load data with current filters
	fetchAwardsFromAPI(apiUrl, currentYear, currentPostId);
}

/**
 * Reset all filters to their default values
 */
function resetFilters(apiUrl) {
	// Reset form fields
	const yearSelect = document.getElementById("award-year");
	const awardSelect = document.getElementById("award-select");

	if (yearSelect) yearSelect.value = "all";
	if (awardSelect) awardSelect.value = "";

	// Update URL without parameters
	const currentUrl = new URL(window.location);
	window.history.pushState({}, "", currentUrl.pathname);

	// Fetch all awards (no filters)
	fetchAwardsFromAPI(apiUrl, "all", "");
}

/**
 * Handle form submission via REST API
 */
function handleFormSubmissionViaAPI(form, apiUrl) {
	const formData = new FormData(form);

	// Get filter values
	const year = formData.get("year") || "all";
	const postId = formData.get("post_id") || "";

	// Update URL for bookmarkability
	const params = new URLSearchParams();
	if (postId) params.append("post_id", postId);
	if (year !== "all") params.append("year", year);

	const currentUrl = new URL(window.location);
	const newUrl =
		currentUrl.pathname +
		(params.toString() ? "?" + params.toString() : "");
	window.history.pushState({}, "", newUrl);

	// Fetch filtered data from API
	fetchAwardsFromAPI(apiUrl, year, postId);
}

/**
 * Fetch awards data from REST API
 */
function fetchAwardsFromAPI(apiUrl, year = "all", postId = "") {
	// Build API URL with parameters
	const url = new URL(apiUrl);
	if (year !== "all") {
		url.searchParams.append("year", year);
	}
	if (postId) {
		url.searchParams.append("post_id", postId);
	}

	// Show loading state
	showLoadingState();

	// Fetch data from API
	fetch(url.toString())
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			// Update the results display
			displayAwardsResults(data, year, postId);
			// Update filter info
			updateFilterInfo(year, postId, data);
		})
		.catch((error) => {
			console.error("Error fetching awards:", error);
			showErrorState();
		});
}

/**
 * Display awards results
 */
function displayAwardsResults(awards, year, postId) {
	const parentContainer = document.querySelector(".cts-awards-results");
	if (!parentContainer) {
		console.error("Results container not found");
		return;
	}

	// Remove all existing content including loading states
	const existingContent = parentContainer.querySelectorAll(
		".cts-awards-grid, .cts-no-awards, .cts-loading, .cts-error, .cts-awards-filters-info"
	);
	existingContent.forEach((el) => el.remove());

	if (!awards || awards.length === 0) {
		// Show no results message
		const noResultsDiv = document.createElement("div");
		noResultsDiv.className = "cts-no-awards";
		noResultsDiv.innerHTML =
			"<p>No awards found matching your criteria.</p>";
		parentContainer.appendChild(noResultsDiv);
		return;
	}

	// Create results grid
	const gridDiv = document.createElement("div");
	gridDiv.className = "cts-awards-grid";

	// Process awards data to create year-based cards (similar to PHP logic)
	const awardYearCards = [];

	awards.forEach((award) => {
		if (award.recipients && award.recipients.length > 0) {
			// Group recipients by year
			const recipientsByYear = {};

			award.recipients.forEach((recipient) => {
				const recipientYear = recipient.year;
				if (recipientYear) {
					if (!recipientsByYear[recipientYear]) {
						recipientsByYear[recipientYear] = [];
					}
					recipientsByYear[recipientYear].push(recipient);
				}
			});

			// Create cards for each year
			Object.keys(recipientsByYear).forEach((awardYear) => {
				awardYearCards.push({
					award: award,
					year: parseInt(awardYear),
					recipients: recipientsByYear[awardYear],
				});
			});
		}
	});

	// Sort cards by year (descending) then by award title
	awardYearCards.sort((a, b) => {
		const yearComparison = b.year - a.year;
		if (yearComparison !== 0) return yearComparison;
		return a.award.title.localeCompare(b.award.title);
	});

	// Generate HTML for each card
	awardYearCards.forEach((cardData) => {
		const cardDiv = document.createElement("div");
		cardDiv.className = "cts-award-card cts-award-year-card";
		cardDiv.innerHTML = generateAwardCardHTML(
			cardData.award,
			cardData.year,
			cardData.recipients
		);
		gridDiv.appendChild(cardDiv);
	});

	parentContainer.appendChild(gridDiv);
}

/**
 * Generate HTML for a single award card
 */
function generateAwardCardHTML(award, year, recipients) {
	let html = `<h3 class="cts-award-title">${escapeHtml(
		award.title
	)} <span class="cts-award-year-badge">(${year})</span></h3>`;

	// Award description
	if (award.content) {
		const truncatedContent = truncateWords(stripHtml(award.content), 25);
		html += `<div class="cts-award-description">${escapeHtml(
			truncatedContent
		)}</div>`;
	}

	html += '<div class="cts-award-recipients">';

	recipients.forEach((recipient) => {
		html += '<div class="cts-recipient">';

		// Photo
		html += '<div class="cts-recipient-photo">';
		if (recipient.photo) {
			const altText =
				[recipient.fname, recipient.lname].filter(Boolean).join(" ") ||
				"Recipient photo";
			html += `<img src="${escapeHtml(
				recipient.photo
			)}" alt="${escapeHtml(altText)}">`;
		} else {
			html += '<span class="dashicons dashicons-admin-users"></span>';
		}
		html += "</div>";

		html += '<div class="cts-recipient-details">';

		// Name
		const recipientName = [recipient.fname, recipient.lname]
			.filter(Boolean)
			.join(" ");
		if (recipientName) {
			html += `<div class="cts-recipient-name"><strong>Recipient:</strong> ${escapeHtml(
				recipientName
			)}</div>`;
		}

		// Title
		if (recipient.title) {
			html += `<div class="cts-recipient-title"><strong>Title:</strong> ${escapeHtml(
				recipient.title
			)}</div>`;
		}

		// Organization
		if (recipient.organization) {
			html += `<div class="cts-recipient-org"><strong>Organization:</strong> ${escapeHtml(
				recipient.organization
			)}</div>`;
		}

		// Abstract
		if (recipient.abstract_title) {
			html += `<div class="cts-recipient-abstract"><strong>Abstract:</strong> ${escapeHtml(
				recipient.abstract_title
			)}</div>`;
		}

		html += "</div></div>"; // Close recipient-details and recipient
	});

	html += "</div>"; // Close award-recipients

	return html;
}

/**
 * Update filter information display
 */
function updateFilterInfo(year, postId, awards) {
	const filterInfoContainer = document.querySelector(
		".cts-awards-filters-info"
	);

	// Remove existing filter info
	if (filterInfoContainer) {
		filterInfoContainer.remove();
	}

	const filterInfo = [];

	if (postId) {
		// Find award title from results
		const award = awards.find((a) => a.id == postId);
		if (award) {
			filterInfo.push(`Award: ${award.title}`);
		}
	}

	if (year !== "all") {
		filterInfo.push(`Year: ${year}`);
	}

	if (filterInfo.length > 0) {
		const parentContainer = document.querySelector(".cts-awards-results");
		const filterDiv = document.createElement("div");
		filterDiv.className = "cts-awards-filters-info";
		filterDiv.innerHTML = `<p><strong>Filtered by:</strong> ${filterInfo.join(
			" | "
		)}</p>`;
		parentContainer.insertBefore(filterDiv, parentContainer.firstChild);
	}
}

/**
 * Show loading state
 */
function showLoadingState() {
	const resultsContainer = document.querySelector(".cts-awards-results");
	if (resultsContainer) {
		// Remove existing content including any existing loading messages
		const existingContent = resultsContainer.querySelectorAll(
			".cts-awards-grid, .cts-no-awards, .cts-awards-filters-info, .cts-loading, .cts-error"
		);
		existingContent.forEach((el) => el.remove());

		// Add loading message only if one doesn't already exist
		if (!resultsContainer.querySelector(".cts-loading")) {
			const loadingDiv = document.createElement("div");
			loadingDiv.className = "cts-loading";
			loadingDiv.innerHTML = "<p>Loading awards...</p>";
			resultsContainer.appendChild(loadingDiv);
		}
	}
}

/**
 * Show error state
 */
function showErrorState() {
	const resultsContainer = document.querySelector(".cts-awards-results");
	if (resultsContainer) {
		// Remove existing content
		const existingContent = resultsContainer.querySelectorAll(
			".cts-awards-grid, .cts-no-awards, .cts-loading, .cts-awards-filters-info"
		);
		existingContent.forEach((el) => el.remove());

		// Add error message
		const errorDiv = document.createElement("div");
		errorDiv.className = "cts-error";
		errorDiv.innerHTML = "<p>Error loading awards. Please try again.</p>";
		resultsContainer.appendChild(errorDiv);
	}
}

/**
 * Utility functions
 */
function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

function stripHtml(html) {
	const div = document.createElement("div");
	div.innerHTML = html;
	return div.textContent || div.innerText || "";
}

function truncateWords(text, wordLimit) {
	const words = text.split(/\s+/);
	if (words.length <= wordLimit) return text;
	return words.slice(0, wordLimit).join(" ") + "...";
}
