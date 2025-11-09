/**
 * CTS Awards Frontend JavaScript
 */

// Global pagination state
let currentPage = 1;
let hasNextPage = false;
let isLoading = false;
let apiUrl = null;
let hasForm = false;
let currentFilters = {
	year: "all",
	postId: "",
	category: "",
	search: "",
	perPage: 12,
};

document.addEventListener("DOMContentLoaded", function () {
	// Initialize awards search form functionality
	initAwardsSearchForm();
	// Load initial data
	loadAwardsData();
	// Initialize lazy loading
	initLazyLoading();
});

/**
 * Initialize the awards search form
 */
function initAwardsSearchForm() {
	const yearSelect = document.getElementById("award-year");
	const awardSelect = document.getElementById("award-select");
	const categorySelect = document.getElementById("award-category");
	const searchInput = document.getElementById("award-search");
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

	// Initialize collapsible filters toggle
	initCollapsibleFilters();
}

/**
 * Get current filter parameters from URL or container data
 */
function getCurrentFilters(container) {
	const urlParams = new URLSearchParams(window.location.search);

	return {
		year:
			urlParams.get("year") ||
			(container ? container.dataset.currentYear : null) ||
			"all",
		postId:
			urlParams.get("post_id") ||
			(container ? container.dataset.currentPostId : null) ||
			"",
		category:
			urlParams.get("category") ||
			(container ? container.dataset.currentCategory : null) ||
			"",
		search:
			urlParams.get("search") ||
			(container ? container.dataset.currentSearch : null) ||
			"",
		perPage: parseInt(
			urlParams.get("per_page") ||
				(container ? container.dataset.currentPerPage : null) ||
				"12"
		),
	};
}

/**
 * Update form fields with current filter values
 */
function updateFormFields(filters) {
	const yearSelect = document.getElementById("award-year");
	const awardSelect = document.getElementById("award-select");
	const categorySelect = document.getElementById("award-category");
	const searchInput = document.getElementById("award-search");
	const perPageSelect = document.getElementById("award-per-page");

	if (yearSelect && filters.year !== "all") yearSelect.value = filters.year;
	if (awardSelect && filters.postId) awardSelect.value = filters.postId;
	if (categorySelect && filters.category)
		categorySelect.value = filters.category;
	if (searchInput && filters.search) searchInput.value = filters.search;
	if (perPageSelect && filters.perPage) perPageSelect.value = filters.perPage;
}

/**
 * Load initial awards data
 */
function loadAwardsData() {
	const form = document.getElementById("cts-awards-search");
	const resultsContainer = document.querySelector(".cts-awards-results");

	// Determine if form exists and get API URL
	if (form) {
		hasForm = true;
		apiUrl = form.dataset.apiUrl;
	} else if (resultsContainer) {
		hasForm = false;
		apiUrl = resultsContainer.dataset.apiUrl;
	} else {
		return; // Neither form nor results container found
	}

	if (!apiUrl) return;

	// Get current filter values
	const filters = getCurrentFilters(resultsContainer);

	// Update form fields if form exists
	if (hasForm) {
		updateFormFields(filters);
	}

	// Reset pagination and load data
	currentPage = 1;
	fetchAwardsFromAPI(
		apiUrl,
		filters.year,
		filters.postId,
		filters.category,
		filters.search,
		1,
		filters.perPage,
		false
	);
}

/**
 * Reset all filters to their default values
 */
function resetFilters(apiUrl) {
	// Reset form fields
	const yearSelect = document.getElementById("award-year");
	const awardSelect = document.getElementById("award-select");
	const categorySelect = document.getElementById("award-category");
	const searchInput = document.getElementById("award-search");
	const perPageSelect = document.getElementById("award-per-page");

	if (yearSelect) yearSelect.value = "all";
	if (awardSelect) awardSelect.value = "";
	if (categorySelect) categorySelect.value = "";
	if (searchInput) searchInput.value = "";
	if (perPageSelect) perPageSelect.value = "12";

	// Update URL without parameters
	const currentUrl = new URL(window.location);
	window.history.pushState({}, "", currentUrl.pathname);

	// Reset pagination for reset
	currentPage = 1;

	// Get the per_page value from form or container
	const resultsContainer = document.querySelector(".cts-awards-results");
	const filters = getCurrentFilters(resultsContainer);

	// Fetch all awards (no filters)
	fetchAwardsFromAPI(apiUrl, "all", "", "", "", 1, filters.perPage, false);
}

/**
 * Handle form submission via REST API
 */
function handleFormSubmissionViaAPI(form, apiUrl) {
	const formData = new FormData(form);

	// Get filter values
	const year = formData.get("year") || "all";
	const postId = formData.get("post_id") || "";
	const category = formData.get("category") || "";
	const search = formData.get("search") || "";
	const perPage = parseInt(formData.get("per_page") || "12");

	console.log("Form submission filters:", {
		year,
		postId,
		category,
		search,
		perPage,
	});

	// Update URL for bookmarkability
	const params = new URLSearchParams();
	if (postId) params.append("post_id", postId);
	if (year !== "all") params.append("year", year);
	if (category) params.append("category", category);
	if (search) params.append("search", search);
	if (perPage !== 12) params.append("per_page", perPage);

	const currentUrl = new URL(window.location);
	const newUrl =
		currentUrl.pathname +
		(params.toString() ? "?" + params.toString() : "");
	window.history.pushState({}, "", newUrl);

	// Reset pagination for new search
	currentPage = 1;

	// Fetch filtered data from API
	fetchAwardsFromAPI(
		apiUrl,
		year,
		postId,
		category,
		search,
		1,
		perPage,
		false
	);
}

/**
 * Fetch awards data from REST API
 */
function fetchAwardsFromAPI(
	apiUrl,
	year = "all",
	postId = "",
	category = "",
	search = "",
	page = 1,
	perPage = 12,
	append = false
) {
	// Build API URL with parameters
	const url = new URL(apiUrl);
	if (year !== "all") {
		url.searchParams.append("year", year);
	}
	if (postId) {
		url.searchParams.append("post_id", postId);
	}
	if (category) {
		url.searchParams.append("category", category);
	}
	if (search) {
		url.searchParams.append("search", search);
	}
	url.searchParams.append("page", page);
	url.searchParams.append("per_page", perPage);

	console.log("API URL being called:", url.toString());
	console.log("Filter parameters:", {
		year,
		postId,
		category,
		search,
		page,
		perPage,
	});

	// Show loading state only if not appending
	if (!append) {
		showLoadingState();
	} else {
		showLoadMoreState();
	}

	// Fetch data from API
	fetch(url.toString())
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			console.log("API Response:", data);
			// Update the results display
			displayAwardsResults(
				data,
				year,
				postId,
				category,
				search,
				perPage,
				append
			);
			// Update filter info only for initial load
			if (!append) {
				updateFilterInfo(year, postId, category, search, data);
			}
		})
		.catch((error) => {
			console.error("Error fetching awards:", error);
			if (!append) {
				showErrorState();
			} else {
				hideLoadMoreState();
			}
		});
}

/**
 * Display awards results
 */
function displayAwardsResults(
	responseData,
	year,
	postId,
	category,
	search = "",
	perPage = 12,
	append = false
) {
	const parentContainer = document.querySelector(".cts-awards-results");
	if (!parentContainer) {
		console.error("Results container not found");
		return;
	}

	// Update pagination state
	if (responseData.pagination) {
		currentPage = responseData.pagination.current_page;
		hasNextPage = responseData.pagination.has_next_page;
	}

	// Update current filters
	currentFilters = { year, postId, category, search, perPage };
	isLoading = false;

	// Handle loading states
	hideLoadingState();
	hideLoadMoreState();

	if (!append) {
		// Remove all existing content for initial load
		const existingContent = parentContainer.querySelectorAll(
			".cts-awards-grid, .cts-no-awards, .cts-loading, .cts-error, .cts-awards-filters-info, .cts-scroll-indicator"
		);
		existingContent.forEach((el) => el.remove());
	}

	const cards = responseData.cards || [];

	if (!append && cards.length === 0) {
		// Show no results message for initial load
		const noResultsDiv = document.createElement("div");
		noResultsDiv.className = "cts-no-awards";
		noResultsDiv.innerHTML = `<p>${ctsAwardsAjax.strings.noResults}</p>`;
		parentContainer.appendChild(noResultsDiv);
		return;
	}

	// Get or create results grid
	let gridDiv = parentContainer.querySelector(".cts-awards-grid");
	if (!gridDiv && !append) {
		gridDiv = document.createElement("div");
		gridDiv.className = "cts-awards-grid";
		parentContainer.appendChild(gridDiv);
	}

	// Generate HTML for each card
	cards.forEach((cardData) => {
		const cardDiv = document.createElement("div");
		cardDiv.className = "cts-award-card cts-award-year-card";
		cardDiv.innerHTML = generateAwardCardHTML(
			cardData.award,
			cardData.year,
			cardData.recipients
		);
		gridDiv.appendChild(cardDiv);
	});

	// Add scroll indicator if there are more pages
	updateScrollIndicator();
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
				ctsAwardsAjax.strings.recipientPhoto;
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
			html += `<div class="cts-recipient-name"><strong>${
				ctsAwardsAjax.strings.recipient
			}</strong> ${escapeHtml(recipientName)}</div>`;
		}

		// Title
		if (recipient.title) {
			html += `<div class="cts-recipient-title"><strong>${
				ctsAwardsAjax.strings.title
			}</strong> ${escapeHtml(recipient.title)}</div>`;
		}

		// Organization
		if (recipient.organization) {
			html += `<div class="cts-recipient-org"><strong>${
				ctsAwardsAjax.strings.organization
			}</strong> ${escapeHtml(recipient.organization)}</div>`;
		}

		// Abstract Title
		if (recipient.abstract_title) {
			html += `<div class="cts-recipient-abstract"><strong>${
				ctsAwardsAjax.strings.abstractTitle
			}</strong> ${escapeHtml(recipient.abstract_title)}</div>`;
		}

		html += "</div></div>"; // Close recipient-details and recipient
	});

	html += "</div>"; // Close award-recipients

	return html;
}

/**
 * Update filter information display
 */
function updateFilterInfo(year, postId, category, search, responseData) {
	const filterInfoContainer = document.querySelector(
		".cts-awards-filters-info"
	);

	// Remove existing filter info
	if (filterInfoContainer) {
		filterInfoContainer.remove();
	}

	// Don't display filter info if form is not present
	if (!hasForm) {
		return;
	}

	const filterInfo = [];

	if (postId) {
		// Find award title from results
		const cards = responseData.cards || [];
		const cardWithAward = cards.find(
			(card) => card.award && card.award.id == postId
		);
		if (cardWithAward) {
			filterInfo.push(`Award: ${cardWithAward.award.title}`);
		}
	}

	if (year !== "all") {
		filterInfo.push(`Year: ${year}`);
	}

	if (category) {
		// Find category name from results (if available in award data)
		const categorySelect = document.getElementById("award-category");
		if (categorySelect) {
			const selectedOption = categorySelect.querySelector(
				`option[value="${category}"]`
			);
			if (selectedOption) {
				filterInfo.push(`Category: ${selectedOption.textContent}`);
			}
		}
	}

	if (search) {
		filterInfo.push(`Search: "${search}"`);
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
			loadingDiv.innerHTML = `<p>${ctsAwardsAjax.strings.loading}</p>`;
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
		errorDiv.innerHTML = `<p>${ctsAwardsAjax.strings.error}</p>`;
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

/**
 * Initialize collapsible filters functionality
 */
function initCollapsibleFilters() {
	const toggleButton = document.getElementById("toggle-filters");
	const filtersContainer = document.getElementById("collapsible-filters");
	const toggleText = toggleButton
		? toggleButton.querySelector(".toggle-text")
		: null;

	if (!toggleButton || !filtersContainer || !toggleText) {
		return;
	}

	// Handle toggle button click
	toggleButton.addEventListener("click", function () {
		const isExpanded =
			toggleButton.getAttribute("aria-expanded") === "true";

		if (isExpanded) {
			// Collapse filters
			toggleButton.setAttribute("aria-expanded", "false");
			filtersContainer.style.display = "none";
			filtersContainer.classList.remove("show");
			toggleText.textContent = ctsAwardsAjax.strings.showFilters;
		} else {
			// Expand filters
			toggleButton.setAttribute("aria-expanded", "true");
			filtersContainer.style.display = "block";
			filtersContainer.classList.add("show");
			toggleText.textContent = ctsAwardsAjax.strings.hideFilters;
		}
	});
}

/**
 * Initialize lazy loading functionality
 */
function initLazyLoading() {
	window.addEventListener("scroll", throttle(checkScrollPosition, 200));
}

/**
 * Check scroll position and load more content if needed
 */
function checkScrollPosition() {
	if (isLoading || !hasNextPage) return;

	const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
	const windowHeight = window.innerHeight;
	const documentHeight = document.documentElement.scrollHeight;

	// Load more when user is 300px from bottom
	if (scrollTop + windowHeight >= documentHeight - 300) {
		loadMoreAwards();
	}
}

/**
 * Load more awards for lazy loading
 */

function loadMoreAwards() {
	if (isLoading || !hasNextPage) return;

	// Use global apiUrl variable instead of looking for form
	if (!apiUrl) return;

	isLoading = true;
	const nextPage = currentPage + 1;

	fetchAwardsFromAPI(
		apiUrl,
		currentFilters.year,
		currentFilters.postId,
		currentFilters.category,
		currentFilters.search,
		nextPage,
		currentFilters.perPage,
		true
	);
}

/**
 * Show loading state for more content
 */
function showLoadMoreState() {
	const parentContainer = document.querySelector(".cts-awards-results");
	if (!parentContainer) return;

	// Remove existing load more indicator
	const existing = parentContainer.querySelector(".cts-load-more");
	if (existing) existing.remove();

	const loadMoreDiv = document.createElement("div");
	loadMoreDiv.className = "cts-load-more";
	loadMoreDiv.innerHTML = `<p>${ctsAwardsAjax.strings.loadingMore}</p>`;
	parentContainer.appendChild(loadMoreDiv);
}

/**
 * Hide loading state for more content
 */
function hideLoadMoreState() {
	const loadMoreDiv = document.querySelector(".cts-load-more");
	if (loadMoreDiv) loadMoreDiv.remove();
}

/**
 * Hide main loading state
 */
function hideLoadingState() {
	const loadingDiv = document.querySelector(".cts-loading");
	if (loadingDiv) loadingDiv.remove();
}

/**
 * Update scroll indicator visibility
 */
function updateScrollIndicator() {
	const parentContainer = document.querySelector(".cts-awards-results");
	if (!parentContainer) return;

	// Remove existing indicator
	const existing = parentContainer.querySelector(".cts-scroll-indicator");
	if (existing) existing.remove();

	// Add indicator if there are more pages
	if (hasNextPage) {
		const indicatorDiv = document.createElement("div");
		indicatorDiv.className = "cts-scroll-indicator";
		indicatorDiv.innerHTML = `<p>${ctsAwardsAjax.strings.scrollToLoad}</p>`;
		parentContainer.appendChild(indicatorDiv);
	}
}

/**
 * Throttle function for performance
 */
function throttle(func, limit) {
	let inThrottle;
	return function () {
		const args = arguments;
		const context = this;
		if (!inThrottle) {
			func.apply(context, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}
