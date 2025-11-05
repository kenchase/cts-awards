/**
 * CTS Awards Frontend JavaScript
 */

document.addEventListener("DOMContentLoaded", function () {
	// Initialize awards search form functionality
	initAwardsSearchForm();
});

/**
 * Initialize the awards search form
 */
function initAwardsSearchForm() {
	const yearSelect = document.getElementById("award-year");
	const awardSelect = document.getElementById("award-name");
	const postIdInput = document.getElementById("award-post-id");
	const form = document.getElementById("cts-awards-search");
	const resetButton = document.getElementById("reset-filters");

	// Exit if form doesn't exist
	if (!form) {
		return;
	}

	// Get current values from data attributes
	const currentYear = form.dataset.currentYear;
	const currentAward = form.dataset.currentAward;
	const currentPostId = form.dataset.currentPostId;

	// Handle form submission
	form.addEventListener("submit", function (e) {
		e.preventDefault();
		console.log("Submitting awards search form");
		handleFormSubmission(form);
	});

	// Handle reset button
	if (resetButton) {
		resetButton.addEventListener("click", function (e) {
			e.preventDefault();
			resetFilters();
		});
	}

	// Handle post ID input changes
	if (postIdInput) {
		postIdInput.addEventListener("input", function () {
			// If post ID is entered, disable other filters
			const hasPostId = this.value.trim() !== "";

			if (yearSelect) {
				yearSelect.disabled = hasPostId;
				if (hasPostId) yearSelect.value = "all";
			}

			if (awardSelect) {
				awardSelect.disabled = hasPostId;
				if (hasPostId) awardSelect.value = "";
			}
		});
	}

	// Handle year/award changes to clear post ID
	if (yearSelect) {
		yearSelect.addEventListener("change", function () {
			if (postIdInput && this.value !== "all") {
				postIdInput.value = "";
			}
		});
	}

	if (awardSelect) {
		awardSelect.addEventListener("change", function () {
			if (postIdInput && this.value !== "") {
				postIdInput.value = "";
			}
		});
	}
}

/**
 * Reset all filters to their default values
 */
function resetFilters() {
	// Remove all query parameters and reload
	const currentUrl = new URL(window.location);
	window.location.href = currentUrl.pathname;
}

/**
 * Populate year dropdown with data from API
 */
function populateYearDropdown(yearSelect, data, currentYear) {
	const years = new Set();

	// Extract all years from recipients
	data.forEach((award) => {
		if (award.recipients) {
			award.recipients.forEach((recipient) => {
				if (recipient.year) {
					years.add(recipient.year);
				}
			});
		}
	});

	// Clear existing options and add "All Years"
	yearSelect.innerHTML = '<option value="all">All Years</option>';

	// Add years sorted in descending order
	Array.from(years)
		.sort((a, b) => b - a)
		.forEach((year) => {
			const selected = currentYear === year.toString() ? " selected" : "";
			yearSelect.innerHTML += `<option value="${year}"${selected}>${year}</option>`;
		});
}

/**
 * Populate award dropdown with data from API
 */
function populateAwardDropdown(awardSelect, data, currentAward) {
	// Clear existing options and add "All Awards"
	awardSelect.innerHTML = '<option value="">All Awards</option>';

	// Add award options using post ID as value and title as display text
	data.forEach((award) => {
		if (award.title && award.id) {
			const selected =
				currentAward === award.id.toString() ? " selected" : "";
			awardSelect.innerHTML += `<option value="${award.id}"${selected}>${award.title}</option>`;
		}
	});
}

/**
 * Handle form submission
 */
function handleFormSubmission(form) {
	const formData = new FormData(form);
	const params = new URLSearchParams();

	// Build query parameters
	if (formData.get("post_id") && formData.get("post_id") !== "") {
		params.append("post_id", formData.get("post_id"));
	} else {
		// Only include year and award_name if no post_id is specified
		if (formData.get("year") && formData.get("year") !== "all") {
			params.append("year", formData.get("year"));
		}
		if (formData.get("award_name") && formData.get("award_name") !== "") {
			params.append("award_name", formData.get("award_name"));
		}
	}

	// Reload page with new parameters
	const currentUrl = new URL(window.location);
	const newUrl =
		currentUrl.pathname +
		(params.toString() ? "?" + params.toString() : "");
	window.location.href = newUrl;
}
