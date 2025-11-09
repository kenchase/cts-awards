/**
 * CTS Awards Frontend JavaScript - Production Ready
 * Optimized version with error handling, performance improvements, and accessibility
 */

(function () {
	"use strict";

	// Module state - private scope
	let state = {
		currentPage: 1,
		hasNextPage: false,
		isLoading: false,
		apiUrl: null,
		hasForm: false,
		currentFilters: {
			year: "all",
			postId: "",
			category: "",
			search: "",
			perPage: 12,
			numberposts: -1,
		},
	};

	// Debounced search function
	let searchTimeout = null;

	// Performance optimizations
	const DOM_CACHE = new Map();

	// Cache DOM elements for better performance
	function getCachedElement(selector) {
		if (!DOM_CACHE.has(selector)) {
			DOM_CACHE.set(selector, document.querySelector(selector));
		}
		return DOM_CACHE.get(selector);
	}

	// Clear DOM cache when needed
	function clearDOMCache() {
		DOM_CACHE.clear();
	}

	// Error handling utility
	function handleError(error, context = "Unknown") {
		console.error(`CTS Awards Error [${context}]:`, error);

		// Could extend to send error to backend for logging in production
		if (window.wp && window.wp.apiFetch) {
			// Future: Send error reports to admin
		}
	}

	// Safe element selection with validation
	function safeGetElement(selector, required = false) {
		try {
			const element = getCachedElement(selector);
			if (required && !element) {
				throw new Error(`Required element not found: ${selector}`);
			}
			return element;
		} catch (error) {
			handleError(error, "DOM Selection");
			return null;
		}
	}

	// Input validation utilities
	function isValidYear(year) {
		return (
			year === "all" ||
			(/^\d{4}$/.test(year) &&
				parseInt(year) >= 1900 &&
				parseInt(year) <= new Date().getFullYear() + 10)
		);
	}

	function isValidPostId(postId) {
		return (
			postId === "" ||
			postId === "0" ||
			(/^\d+$/.test(postId) && parseInt(postId) > 0)
		);
	}

	function isValidPerPage(perPage) {
		const num = parseInt(perPage);
		return num >= 1 && num <= 100;
	}

	function isValidUrl(url) {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	// Sanitization utilities
	function sanitizeText(text) {
		if (typeof text !== "string") return "";
		return text.trim().replace(/<[^>]*>/g, "");
	}

	function escapeHtml(text) {
		const div = document.createElement("div");
		div.textContent = text || "";
		return div.innerHTML;
	}

	function stripHtml(html) {
		const div = document.createElement("div");
		div.innerHTML = html || "";
		return div.textContent || div.innerText || "";
	}

	function truncateWords(text, wordLimit) {
		if (!text || typeof text !== "string") return "";
		const words = text.split(/\s+/);
		if (words.length <= wordLimit) return text;
		return words.slice(0, wordLimit).join(" ") + "...";
	}

	// Throttle function for performance
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

	// Debounce function for search
	function debounce(func, delay) {
		return function () {
			const args = arguments;
			const context = this;
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => func.apply(context, args), delay);
		};
	}

	// Initialize the awards system
	function initAwardsSearchForm() {
		try {
			const form = safeGetElement("#cts-awards-search");
			if (!form) {
				return; // Form not present, skip initialization
			}

			// Validate and set API URL
			const formApiUrl = form.dataset.apiUrl;
			if (!formApiUrl || !isValidUrl(formApiUrl)) {
				handleError(
					new Error("Invalid or missing API URL in form data"),
					"Form Initialization"
				);
				return;
			}

			state.apiUrl = formApiUrl;
			state.hasForm = true;

			// Setup form event listeners
			setupFormEventListeners(form);

			// Setup accessibility features
			setupAccessibility(form);
		} catch (error) {
			handleError(error, "Form Initialization");
		}
	}

	// Setup form event listeners
	function setupFormEventListeners(form) {
		// Form submission
		form.addEventListener("submit", function (e) {
			e.preventDefault();
			handleFormSubmission(form);
		});

		// Reset button
		const resetButton = safeGetElement("#reset-filters");
		if (resetButton) {
			resetButton.addEventListener("click", function (e) {
				e.preventDefault();
				resetFilters();
			});
		}

		// Smart search with debouncing
		const searchInput = safeGetElement("#award-search");
		if (searchInput) {
			const debouncedSearch = debounce(() => {
				if (
					searchInput.value.length >= 2 ||
					searchInput.value.length === 0
				) {
					handleFormSubmission(form);
				}
			}, 500);

			searchInput.addEventListener("input", debouncedSearch);
		}

		// Post ID and Award select mutual exclusion
		setupMutualExclusiveInputs();

		// Initialize collapsible filters
		initCollapsibleFilters();
	}

	// Setup accessibility features
	function setupAccessibility(form) {
		// Add ARIA labels and roles
		const filterContainer = safeGetElement("#collapsible-filters");
		if (filterContainer) {
			filterContainer.setAttribute("role", "group");
			filterContainer.setAttribute("aria-label", "Award filters");
		}

		// Add live region for search results
		let liveRegion = safeGetElement("#cts-awards-live-region");
		if (!liveRegion) {
			liveRegion = document.createElement("div");
			liveRegion.id = "cts-awards-live-region";
			liveRegion.setAttribute("aria-live", "polite");
			liveRegion.setAttribute("aria-atomic", "true");
			liveRegion.className = "cts-awards-visually-hidden";
			form.appendChild(liveRegion);
		}

		// Add keyboard navigation for filter toggle
		const toggleButton = safeGetElement("#toggle-filters");
		if (toggleButton) {
			toggleButton.addEventListener("keydown", function (e) {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					this.click();
				}
			});
		}
	}

	// Setup mutual exclusive inputs
	function setupMutualExclusiveInputs() {
		const postIdInput = safeGetElement("#award-post-id");
		const awardSelect = safeGetElement("#award-select");

		if (postIdInput && awardSelect) {
			postIdInput.addEventListener("input", function () {
				if (this.value.trim() !== "") {
					awardSelect.value = "";
				}
			});

			awardSelect.addEventListener("change", function () {
				if (this.value !== "") {
					postIdInput.value = "";
				}
			});
		}
	}

	// Get current filter values with validation
	function getCurrentFilters(container) {
		try {
			const urlParams = new URLSearchParams(window.location.search);

			const filters = {
				year:
					urlParams.get("year") ||
					container?.dataset?.currentYear ||
					"all",
				postId:
					urlParams.get("post_id") ||
					container?.dataset?.currentPostId ||
					"",
				category:
					urlParams.get("category") ||
					container?.dataset?.currentCategory ||
					"",
				search:
					urlParams.get("search") ||
					container?.dataset?.currentSearch ||
					"",
				perPage: parseInt(
					urlParams.get("per_page") ||
						container?.dataset?.currentPerPage ||
						"12"
				),
				numberposts: parseInt(
					urlParams.get("numberposts") ||
						container?.dataset?.currentNumberposts ||
						"-1"
				),
			};

			// Validate and sanitize filters
			filters.year = isValidYear(filters.year) ? filters.year : "all";
			filters.postId = isValidPostId(filters.postId)
				? filters.postId
				: "";
			filters.perPage = isValidPerPage(filters.perPage)
				? filters.perPage
				: 12;
			filters.search = sanitizeText(filters.search);
			filters.category = sanitizeText(filters.category);

			return filters;
		} catch (error) {
			handleError(error, "Filter Parsing");
			// Return safe defaults
			return {
				year: "all",
				postId: "",
				category: "",
				search: "",
				perPage: 12,
				numberposts: -1,
			};
		}
	}

	// Update form fields with current values
	function updateFormFields(filters) {
		if (!filters || !state.hasForm) return;

		const updates = [
			{
				selector: "#award-year",
				value: filters.year !== "all" ? filters.year : "",
			},
			{ selector: "#award-select", value: filters.postId },
			{ selector: "#award-category", value: filters.category },
			{ selector: "#award-search", value: filters.search },
			{ selector: "#award-per-page", value: filters.perPage },
		];

		updates.forEach(({ selector, value }) => {
			const element = safeGetElement(selector);
			if (element && value) {
				element.value = value;
			}
		});
	}

	// Load initial data
	function loadAwardsData() {
		try {
			const form = safeGetElement("#cts-awards-search");
			const resultsContainer = safeGetElement(".cts-awards-results");

			if (form) {
				state.hasForm = true;
				state.apiUrl = form.dataset.apiUrl;
			} else if (resultsContainer) {
				state.hasForm = false;
				state.apiUrl = resultsContainer.dataset.apiUrl;
			} else {
				return;
			}

			if (!state.apiUrl || !isValidUrl(state.apiUrl)) {
				handleError(new Error("Invalid API URL"), "Initial Load");
				return;
			}

			const filters = getCurrentFilters(resultsContainer);

			if (state.hasForm) {
				updateFormFields(filters);
			}

			state.currentPage = 1;
			fetchAwards(filters, false);
		} catch (error) {
			handleError(error, "Initial Load");
		}
	}

	// Handle form submission
	function handleFormSubmission(form) {
		try {
			const formData = new FormData(form);

			// Get and validate filter values
			const filters = {
				year: sanitizeText(formData.get("year") || "all"),
				postId: sanitizeText(formData.get("post_id") || ""),
				category: sanitizeText(formData.get("category") || ""),
				search: sanitizeText(formData.get("search") || ""),
				perPage: parseInt(formData.get("per_page") || "12"),
				numberposts: parseInt(form.dataset.currentNumberposts || "-1"),
			};

			// Validate filters
			if (!isValidYear(filters.year)) filters.year = "all";
			if (!isValidPostId(filters.postId)) filters.postId = "";
			if (!isValidPerPage(filters.perPage)) filters.perPage = 12;

			// Update URL for bookmarkability
			updateURLWithFilters(filters);

			// Reset pagination and fetch data
			state.currentPage = 1;
			fetchAwards(filters, false);
		} catch (error) {
			handleError(error, "Form Submission");
		}
	}

	// Update URL with current filters
	function updateURLWithFilters(filters) {
		try {
			const params = new URLSearchParams();

			if (filters.postId) params.append("post_id", filters.postId);
			if (filters.year !== "all") params.append("year", filters.year);
			if (filters.category) params.append("category", filters.category);
			if (filters.search) params.append("search", filters.search);
			if (filters.perPage !== 12)
				params.append("per_page", filters.perPage);

			const currentUrl = new URL(window.location);
			const newUrl =
				currentUrl.pathname +
				(params.toString() ? "?" + params.toString() : "");

			window.history.pushState({}, "", newUrl);
		} catch (error) {
			handleError(error, "URL Update");
		}
	}

	// Reset filters
	function resetFilters() {
		try {
			// Reset form fields
			const resetElements = [
				"#award-year",
				"#award-select",
				"#award-category",
				"#award-search",
				"#award-per-page",
			];

			resetElements.forEach((selector) => {
				const element = safeGetElement(selector);
				if (element) {
					element.value =
						selector === "#award-per-page"
							? "12"
							: selector === "#award-year"
							? "all"
							: "";
				}
			});

			// Update URL
			const currentUrl = new URL(window.location);
			window.history.pushState({}, "", currentUrl.pathname);

			// Reset state and fetch all awards
			state.currentPage = 1;

			const resultsContainer = safeGetElement(".cts-awards-results");
			const filters = getCurrentFilters(resultsContainer);

			fetchAwards(
				{
					year: "all",
					postId: "",
					category: "",
					search: "",
					perPage: filters.perPage,
					numberposts: filters.numberposts,
				},
				false
			);
		} catch (error) {
			handleError(error, "Reset Filters");
		}
	}

	// Fetch awards from API
	function fetchAwards(filters, append = false) {
		if (!state.apiUrl || !isValidUrl(state.apiUrl)) {
			handleError(new Error("Invalid API URL"), "API Fetch");
			if (!append) showErrorState();
			return;
		}

		// Prevent concurrent requests
		if (state.isLoading && !append) {
			return;
		}

		try {
			const url = new URL(state.apiUrl);

			// Add parameters
			if (filters.year !== "all")
				url.searchParams.append("year", filters.year);
			if (filters.postId)
				url.searchParams.append("post_id", filters.postId);
			if (filters.category)
				url.searchParams.append("category", filters.category);
			if (filters.search)
				url.searchParams.append("search", filters.search);

			url.searchParams.append("page", append ? state.currentPage + 1 : 1);
			url.searchParams.append("per_page", filters.perPage);

			if (filters.numberposts !== -1) {
				url.searchParams.append("numberposts", filters.numberposts);
			}

			// Show loading state
			if (!append) {
				showLoadingState();
			}
			// Don't show loading state for append operations to avoid
			// showing "Loading more..." when there are no more results			state.isLoading = true;

			// Fetch with timeout and abort capability
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000);

			fetch(url.toString(), {
				signal: controller.signal,
				headers: {
					"Content-Type": "application/json",
				},
			})
				.then((response) => {
					clearTimeout(timeoutId);
					if (!response.ok) {
						throw new Error(
							`HTTP error! status: ${response.status}`
						);
					}
					return response.json();
				})
				.then((data) => {
					if (!data || typeof data !== "object") {
						throw new Error("Invalid response format");
					}

					displayResults(data, filters, append);

					if (!append) {
						updateFilterInfo(filters, data);
						announceResults(data);
					}
				})
				.catch((error) => {
					clearTimeout(timeoutId);
					state.isLoading = false;
					if (error.name === "AbortError") {
						handleError(new Error("Request timeout"), "API Fetch");
					} else {
						handleError(error, "API Fetch");
					}

					if (!append) {
						showErrorState();
					} else {
						hideLoadMoreState();
					}
				});
		} catch (error) {
			state.isLoading = false;
			handleError(error, "API Request Setup");
			if (!append) {
				showErrorState();
			} else {
				hideLoadMoreState();
			}
		}
	}

	// Display awards results
	function displayResults(data, filters, append = false) {
		try {
			const parentContainer = safeGetElement(".cts-awards-results", true);
			if (!parentContainer) {
				throw new Error("Results container not found");
			}

			// Update state
			if (data.pagination) {
				state.currentPage =
					parseInt(data.pagination.current_page) || state.currentPage;
				state.hasNextPage = Boolean(data.pagination.has_next_page);
			} else {
				state.hasNextPage = false;
			}

			state.currentFilters = filters;
			state.isLoading = false;

			// Clear loading states
			hideLoadingState();
			hideLoadMoreState();

			if (!append) {
				// Clear existing content
				const existingContent = parentContainer.querySelectorAll(
					".cts-awards-grid, .cts-no-awards, .cts-loading, .cts-error, .cts-awards-filters-info, .cts-scroll-indicator"
				);
				existingContent.forEach((el) => el.remove());

				// Clear DOM cache
				clearDOMCache();
			}

			const cards = Array.isArray(data.cards) ? data.cards : [];

			if (!append && cards.length === 0) {
				showNoResults();
				return;
			}

			// Get or create grid
			let grid = parentContainer.querySelector(".cts-awards-grid");
			if (!grid) {
				grid = document.createElement("div");
				grid.className = "cts-awards-grid";
				grid.setAttribute("role", "list");
				grid.setAttribute("aria-label", "Awards list");
				parentContainer.appendChild(grid);
			}

			// Generate and append cards
			const fragment = document.createDocumentFragment();
			cards.forEach((cardData) => {
				const cardElement = createAwardCard(cardData);
				if (cardElement) {
					fragment.appendChild(cardElement);
				}
			});

			grid.appendChild(fragment);

			// Update scroll indicator
			updateScrollIndicator();
		} catch (error) {
			state.isLoading = false;
			handleError(error, "Display Results");
			if (!append) {
				showErrorState();
			} else {
				hideLoadMoreState();
			}
		}
	}

	// Create award card element
	function createAwardCard(cardData) {
		try {
			if (!cardData?.award?.title) {
				return null;
			}

			const cardDiv = document.createElement("div");
			cardDiv.className = "cts-award-card cts-award-year-card";
			cardDiv.setAttribute("role", "listitem");

			const cardContent = generateAwardCardHTML(
				cardData.award,
				cardData.year,
				cardData.recipients || []
			);

			if (cardContent) {
				cardDiv.innerHTML = cardContent;
				return cardDiv;
			}

			return null;
		} catch (error) {
			handleError(error, "Card Creation");
			return null;
		}
	}

	// Generate HTML for award card
	function generateAwardCardHTML(award, year, recipients) {
		try {
			if (!award?.title) {
				return null;
			}

			let html = `<h3 class="cts-award-title">${escapeHtml(
				award.title
			)} <span class="cts-award-year-badge">(${year})</span></h3>`;

			// Award description
			if (award.content) {
				const truncatedContent = truncateWords(
					stripHtml(award.content),
					25
				);
				html += `<div class="cts-award-description">${escapeHtml(
					truncatedContent
				)}</div>`;
			}

			html += '<div class="cts-award-recipients">';

			if (Array.isArray(recipients)) {
				recipients.forEach((recipient) => {
					html += generateRecipientHTML(recipient);
				});
			}

			html += "</div>";

			return html;
		} catch (error) {
			handleError(error, "Card HTML Generation");
			return '<div class="cts-award-card-error">Error loading award details</div>';
		}
	}

	// Generate recipient HTML
	function generateRecipientHTML(recipient) {
		if (!recipient) return "";

		let html = '<div class="cts-recipient">';

		// Photo
		html += '<div class="cts-recipient-photo">';
		if (recipient.photo) {
			const recipientName = [recipient.fname, recipient.lname]
				.filter(Boolean)
				.join(" ");
			const altText =
				recipientName ||
				window.ctsAwardsAjax?.strings?.recipientPhoto ||
				"Recipient photo";
			html += `<img src="${escapeHtml(
				recipient.photo
			)}" alt="${escapeHtml(altText)}" loading="lazy">`;
		} else {
			html +=
				'<span class="dashicons dashicons-admin-users" aria-hidden="true"></span>';
		}
		html += "</div>";

		html += '<div class="cts-recipient-details">';

		// Name
		const recipientName = [recipient.fname, recipient.lname]
			.filter(Boolean)
			.join(" ");
		if (recipientName) {
			const recipientLabel =
				window.ctsAwardsAjax?.strings?.recipient || "Recipient:";
			html += `<div class="cts-recipient-name"><strong>${recipientLabel}</strong> ${escapeHtml(
				recipientName
			)}</div>`;
		}

		// Title
		if (recipient.title) {
			const titleLabel = window.ctsAwardsAjax?.strings?.title || "Title:";
			html += `<div class="cts-recipient-title"><strong>${titleLabel}</strong> ${escapeHtml(
				recipient.title
			)}</div>`;
		}

		// Organization
		if (recipient.organization) {
			const orgLabel =
				window.ctsAwardsAjax?.strings?.organization || "Organization:";
			html += `<div class="cts-recipient-org"><strong>${orgLabel}</strong> ${escapeHtml(
				recipient.organization
			)}</div>`;
		}

		// Abstract Title
		if (recipient.abstract_title) {
			const abstractLabel =
				window.ctsAwardsAjax?.strings?.abstractTitle ||
				"Abstract Title:";
			html += `<div class="cts-recipient-abstract"><strong>${abstractLabel}</strong> ${escapeHtml(
				recipient.abstract_title
			)}</div>`;
		}

		html += "</div></div>";

		return html;
	}

	// Update filter information display
	function updateFilterInfo(filters, data) {
		if (!state.hasForm) return;

		try {
			// Remove existing filter info
			const existingInfo = safeGetElement(".cts-awards-filters-info");
			if (existingInfo) {
				existingInfo.remove();
			}

			const filterInfo = [];

			// Build filter info
			if (filters.postId && data.cards?.length) {
				const cardWithAward = data.cards.find(
					(card) => card.award?.id == filters.postId
				);
				if (cardWithAward) {
					filterInfo.push(`Award: ${cardWithAward.award.title}`);
				}
			}

			if (filters.year !== "all") {
				filterInfo.push(`Year: ${filters.year}`);
			}

			if (filters.category) {
				filterInfo.push(`Category: ${filters.category}`);
			}

			if (filters.search) {
				filterInfo.push(`Search: "${filters.search}"`);
			}

			if (filterInfo.length > 0) {
				const parentContainer = safeGetElement(".cts-awards-results");
				if (parentContainer) {
					const filterDiv = document.createElement("div");
					filterDiv.className = "cts-awards-filters-info";
					filterDiv.innerHTML = `<p><strong>Filtered by:</strong> ${filterInfo.join(
						" | "
					)}</p>`;
					parentContainer.insertBefore(
						filterDiv,
						parentContainer.firstChild
					);
				}
			}
		} catch (error) {
			handleError(error, "Filter Info Update");
		}
	}

	// Announce results for screen readers
	function announceResults(data) {
		try {
			const liveRegion = safeGetElement("#cts-awards-live-region");
			if (!liveRegion) return;

			const count = data.cards ? data.cards.length : 0;
			const total = data.pagination?.total || count;

			const message =
				count === 0
					? window.ctsAwardsAjax?.strings?.noResults ||
					  "No awards found"
					: `Found ${total} award${
							total !== 1 ? "s" : ""
					  }, showing ${count} result${count !== 1 ? "s" : ""}`;

			liveRegion.textContent = message;

			// Clear message after announcement
			setTimeout(() => {
				liveRegion.textContent = "";
			}, 1000);
		} catch (error) {
			handleError(error, "Results Announcement");
		}
	}

	// UI State functions
	function showLoadingState() {
		const container = safeGetElement(".cts-awards-results");
		if (!container) return;

		// Remove existing content
		const existingContent = container.querySelectorAll(
			".cts-awards-grid, .cts-no-awards, .cts-awards-filters-info, .cts-loading, .cts-error"
		);
		existingContent.forEach((el) => el.remove());

		const loadingDiv = document.createElement("div");
		loadingDiv.className = "cts-loading";
		loadingDiv.setAttribute("role", "status");
		loadingDiv.setAttribute("aria-live", "polite");
		loadingDiv.innerHTML = `<p>${
			window.ctsAwardsAjax?.strings?.loading || "Loading awards..."
		}</p>`;
		container.appendChild(loadingDiv);
	}

	function showErrorState() {
		const container = safeGetElement(".cts-awards-results");
		if (!container) return;

		// Remove existing content
		const existingContent = container.querySelectorAll(
			".cts-awards-grid, .cts-no-awards, .cts-loading, .cts-awards-filters-info"
		);
		existingContent.forEach((el) => el.remove());

		const errorDiv = document.createElement("div");
		errorDiv.className = "cts-error";
		errorDiv.setAttribute("role", "alert");
		errorDiv.innerHTML = `<p>${
			window.ctsAwardsAjax?.strings?.error ||
			"Error loading awards. Please try again."
		}</p>`;
		container.appendChild(errorDiv);
	}

	function showNoResults() {
		const container = safeGetElement(".cts-awards-results");
		if (!container) return;

		const noResultsDiv = document.createElement("div");
		noResultsDiv.className = "cts-no-awards";
		noResultsDiv.setAttribute("role", "status");
		noResultsDiv.innerHTML = `<p>${
			window.ctsAwardsAjax?.strings?.noResults ||
			"No awards found matching your criteria."
		}</p>`;
		container.appendChild(noResultsDiv);
	}

	function showLoadMoreState() {
		const container = safeGetElement(".cts-awards-results");
		if (!container || !state.hasNextPage) return;

		// Remove existing load more indicator
		const existing = container.querySelector(".cts-load-more");
		if (existing) existing.remove();

		const loadMoreDiv = document.createElement("div");
		loadMoreDiv.className = "cts-load-more";
		loadMoreDiv.setAttribute("role", "status");
		loadMoreDiv.setAttribute("aria-live", "polite");
		loadMoreDiv.innerHTML = `<p>${
			window.ctsAwardsAjax?.strings?.loadingMore ||
			"Loading more awards..."
		}</p>`;
		container.appendChild(loadMoreDiv);
	}

	function hideLoadMoreState() {
		const loadMoreDiv = safeGetElement(".cts-load-more");
		if (loadMoreDiv) loadMoreDiv.remove();
	}

	function hideLoadingState() {
		const loadingDiv = safeGetElement(".cts-loading");
		if (loadingDiv) loadingDiv.remove();
	}

	function updateScrollIndicator() {
		const container = safeGetElement(".cts-awards-results");
		if (!container) return;

		// Remove existing indicator
		const existing = container.querySelector(".cts-scroll-indicator");
		if (existing) existing.remove();

		// Add indicator if there are more pages
		if (state.hasNextPage) {
			const indicatorDiv = document.createElement("div");
			indicatorDiv.className = "cts-scroll-indicator";
			indicatorDiv.setAttribute("role", "status");
			indicatorDiv.innerHTML = `<p>${
				window.ctsAwardsAjax?.strings?.scrollToLoad ||
				"Scroll down to load more awards..."
			}</p>`;
			container.appendChild(indicatorDiv);
		}
	}

	// Collapsible filters functionality
	function initCollapsibleFilters() {
		const toggleButton = safeGetElement("#toggle-filters");
		const filtersContainer = safeGetElement("#collapsible-filters");

		if (!toggleButton || !filtersContainer) return;

		const toggleText = toggleButton.querySelector(".toggle-text");
		if (!toggleText) return;

		toggleButton.addEventListener("click", function () {
			const isExpanded =
				toggleButton.getAttribute("aria-expanded") === "true";

			toggleButton.setAttribute("aria-expanded", !isExpanded);
			filtersContainer.style.display = isExpanded ? "none" : "block";
			filtersContainer.classList.toggle("show", !isExpanded);

			const showText =
				window.ctsAwardsAjax?.strings?.showFilters || "Show Filters";
			const hideText =
				window.ctsAwardsAjax?.strings?.hideFilters || "Hide Filters";
			toggleText.textContent = isExpanded ? showText : hideText;
		});
	}

	// Lazy loading functionality
	function initLazyLoading() {
		const throttledScrollCheck = throttle(checkScrollPosition, 200);
		window.addEventListener("scroll", throttledScrollCheck);
	}
	function checkScrollPosition() {
		if (state.isLoading || !state.hasNextPage) return;

		const scrollTop =
			window.pageYOffset || document.documentElement.scrollTop;
		const windowHeight = window.innerHeight;
		const documentHeight = document.documentElement.scrollHeight;

		// Load more when user is 300px from bottom
		if (scrollTop + windowHeight >= documentHeight - 300) {
			loadMoreAwards();
		}
	}

	function loadMoreAwards() {
		if (state.isLoading || !state.hasNextPage || !state.apiUrl) return;

		fetchAwards(state.currentFilters, true);
	}

	// Initialize when DOM is ready
	function init() {
		try {
			initAwardsSearchForm();
			loadAwardsData();
			initLazyLoading();
		} catch (error) {
			handleError(error, "Initialization");
		}
	}

	// Public API (minimal exposure)
	window.ctsAwards = {
		init: init,
		search: function (filters) {
			try {
				state.currentPage = 1;
				fetchAwards(filters, false);
			} catch (error) {
				handleError(error, "Public Search API");
			}
		},
	};

	// Initialize when DOM is ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
