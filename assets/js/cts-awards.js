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
	const form = document.getElementById("cts-awards-search");

	// Exit if form elements don't exist
	if (!yearSelect || !awardSelect || !form) {
		return;
	}

	// Get API URL and current values from data attributes
	const apiUrl = form.dataset.apiUrl;
	const currentYear = form.dataset.currentYear;
	const currentAward = form.dataset.currentAward;

	if (!apiUrl) {
		console.error("CTS Awards: API URL not found");
		return;
	}

	// Fetch awards data from REST API
	fetch(apiUrl)
		.then((response) => response.json())
		.then((data) => {
			populateYearDropdown(yearSelect, data, currentYear);
			populateAwardDropdown(awardSelect, data, currentAward);
		})
		.catch((error) => {
			console.error("Error fetching awards data:", error);
			// Reset dropdowns to defaults on error
			yearSelect.innerHTML = '<option value="all">All Years</option>';
			awardSelect.innerHTML = '<option value="">All Awards</option>';
		});

	// Handle form submission
	form.addEventListener("submit", function (e) {
		e.preventDefault();
		handleFormSubmission(form);
	});
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
	if (formData.get("year") && formData.get("year") !== "all") {
		params.append("year", formData.get("year"));
	}
	if (formData.get("award_name")) {
		params.append("award_name", formData.get("award_name"));
	}

	// Reload page with new parameters
	const currentUrl = new URL(window.location);
	const newUrl =
		currentUrl.pathname +
		(params.toString() ? "?" + params.toString() : "");
	window.location.href = newUrl;
}
