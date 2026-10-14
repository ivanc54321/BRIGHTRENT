// ==========================================================================
// BrightRent - Thanet Cheap Rent & Property Aggregator Logic
// With Interactive Leaflet Map, LHA Allowance Filter & Alerts Modal
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let allListings = [];
  let filterState = {
    searchQuery: '',
    town: 'All Thanet',
    propertyType: 'All Types',
    maxPrice: 99999,
    source: 'ALL',
    onlyLha: false,
    onlyBillsIncluded: false,
    sortBy: 'price_asc',
    currentView: 'grid' // 'grid' | 'map'
  };

  // Map variables
  let leafletMap = null;
  let markerLayerGroup = null;

  // Elements
  const gridContainer = document.getElementById('property-card-grid');
  const mapViewContainer = document.getElementById('map-view-container');
  const countText = document.getElementById('results-count-text');
  const emptyState = document.getElementById('empty-state');
  const sortSelect = document.getElementById('sort-select');
  const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
  const navLinksList = document.getElementById('nav-links-list');
  const heroSearchInput = document.getElementById('hero-search-input');
  const heroSearchSubmit = document.getElementById('hero-search-submit');
  const filterSubmitBtn = document.getElementById('filter-submit-btn');
  const resetFiltersBtn = document.getElementById('btn-reset-filters');
  const aggregatorSection = document.getElementById('aggregator-section');

  // View Switcher Elements
  const btnViewGrid = document.getElementById('btn-view-grid');
  const btnViewMap = document.getElementById('btn-view-map');

  // Alert Modal Elements
  const btnOpenAlertModal = document.getElementById('btn-open-alert-modal');
  const alertModalOverlay = document.getElementById('alert-modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const rentAlertForm = document.getElementById('rent-alert-form');
  const modalSuccessMsg = document.getElementById('modal-success-msg');

  // LHA Rate Chips
  const lhaChips = document.querySelectorAll('.lha-chip');

  // Source brand colors map
  const sourceColors = {
    'SpareRoom': '#0b8484',
    'Thanet Council': '#2b5c8f',
    'OpenRent': '#15803d',
    'Gumtree': '#009c48',
    'Miles & Barr': '#c2410c',
    'Oakwood Homes': '#7c3aed'
  };

  // 1. Mobile Menu Toggle
  if (mobileToggleBtn && navLinksList) {
    mobileToggleBtn.addEventListener('click', () => {
      navLinksList.classList.toggle('show-mobile');
    });
  }

  // 2. Fetch Aggregated Listings Data
  async function loadListings() {
    try {
      const response = await fetch('data/listings.json');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      allListings = data.listings || [];
      renderListings();
    } catch (err) {
      console.warn('Could not fetch data/listings.json dynamically, falling back to embedded dataset', err);
      // Fallback robust dataset
      allListings = [
        {
          id: "sr-ct9-001",
          source: "SpareRoom",
          sourceUrl: "https://www.spareroom.co.uk/flatshare/kent/margate",
          title: "Large Double Room in Victorian House with Garden",
          description: "Bright double bedroom, 5 mins walk from Margate Sands & train station. High speed fibre broadband, large kitchen, sunny courtyard garden.",
          propertyType: "Room",
          pricePcm: 520,
          pricePw: 120,
          billsIncluded: true,
          deposit: 300,
          town: "Margate",
          area: "Old Town / Seafront",
          postcode: "CT9 1NP",
          image: "assets/jakson_house.jpg",
          bedrooms: 1,
          bathrooms: 2,
          furnished: "Furnished",
          availableFrom: "Immediate",
          isCheapDeal: true,
          lhaCompliant: false,
          lat: 51.3890,
          lng: 1.3860,
          tags: ["Bills Included", "Super Deal", "5 min to Station"]
        },
        {
          id: "tc-khc-002",
          source: "Thanet Council",
          sourceUrl: "https://www.kenthomechoice.org.uk",
          title: "Thanet Affordable 1-Bed Flat Scheme (Kent Homechoice)",
          description: "Affordable 1-bedroom social housing unit managed via Thanet District Council allocation. Priority given to applicants on Thanet housing register.",
          propertyType: "Council Scheme",
          pricePcm: 465,
          pricePw: 107,
          billsIncluded: false,
          deposit: 0,
          town: "Ramsgate",
          area: "Newington",
          postcode: "CT12 6PG",
          image: "assets/feature_house.jpg",
          bedrooms: 1,
          bathrooms: 1,
          furnished: "Unfurnished",
          availableFrom: "Next Cycle",
          isCheapDeal: true,
          lhaCompliant: true,
          lat: 51.3450,
          lng: 1.3980,
          tags: ["Council Allocation", "LHA Eligible", "Zero Deposit"]
        },
        {
          id: "openrent-ct9-003",
          source: "OpenRent",
          sourceUrl: "https://www.openrent.co.uk/properties-to-rent/margate-kent",
          title: "Self-Contained Ground Floor Studio (No Agency Fees)",
          description: "Clean, modern ground-floor studio apartment with private shower room and kitchenette. Direct landlord let with zero admin fees. DPS protected deposit.",
          propertyType: "Studio",
          pricePcm: 595,
          pricePw: 137,
          billsIncluded: false,
          deposit: 595,
          town: "Margate",
          area: "Cliftonville West",
          postcode: "CT9 2HL",
          image: "assets/ocean_breeze.jpg",
          bedrooms: 0,
          bathrooms: 1,
          furnished: "Part-Furnished",
          availableFrom: "1st Nov",
          isCheapDeal: true,
          lhaCompliant: true,
          lat: 51.3915,
          lng: 1.4010,
          tags: ["No Agency Fees", "LHA Rate Match", "Direct Landlord"]
        },
        {
          id: "sr-ct11-004",
          source: "SpareRoom",
          sourceUrl: "https://www.spareroom.co.uk/flatshare/kent/ramsgate",
          title: "En-Suite Double Room near Royal Harbour",
          description: "Top floor double bedroom with private en-suite bathroom in a quiet professional flatshare. Superfast Wi-Fi, sea glimpses from window.",
          propertyType: "Room",
          pricePcm: 560,
          pricePw: 129,
          billsIncluded: true,
          deposit: 350,
          town: "Ramsgate",
          area: "Harbour / Town Centre",
          postcode: "CT11 9LR",
          image: "assets/lakeside_cottage.jpg",
          bedrooms: 1,
          bathrooms: 1,
          furnished: "Furnished",
          availableFrom: "Immediate",
          isCheapDeal: true,
          lhaCompliant: false,
          lat: 51.3340,
          lng: 1.4190,
          tags: ["En-Suite", "Bills Included", "Near Royal Harbour"]
        },
        {
          id: "gumtree-ct10-005",
          source: "Gumtree",
          sourceUrl: "https://www.gumtree.com/property-to-rent/broadstairs",
          title: "Cosy 1-Bed Annexe with Private Entrance, Broadstairs",
          description: "Quiet self-contained annexe suitable for single person or quiet professional. Includes private kitchenette and off-street parking space.",
          propertyType: "1-Bed",
          pricePcm: 680,
          pricePw: 156,
          billsIncluded: false,
          deposit: 680,
          town: "Broadstairs",
          area: "St Peter's",
          postcode: "CT10 2TR",
          image: "assets/hero.jpg",
          bedrooms: 1,
          bathrooms: 1,
          furnished: "Furnished",
          availableFrom: "Mid Nov",
          isCheapDeal: false,
          lhaCompliant: false,
          lat: 51.3580,
          lng: 1.4390,
          tags: ["Private Annexe", "Parking", "Broadstairs"]
        },
        {
          id: "sr-ct9-006",
          source: "SpareRoom",
          sourceUrl: "https://www.spareroom.co.uk/flatshare/kent/margate",
          title: "Budget Single Room in Arts Flatshare, Cliftonville",
          description: "Very affordable single room in welcoming creative community flatshare. Ideal for students, creatives, or low-budget workers.",
          propertyType: "Room",
          pricePcm: 410,
          pricePw: 95,
          billsIncluded: true,
          deposit: 250,
          town: "Margate",
          area: "Cliftonville",
          postcode: "CT9 2PA",
          image: "assets/jakson_house.jpg",
          bedrooms: 1,
          bathrooms: 1,
          furnished: "Furnished",
          availableFrom: "Immediate",
          isCheapDeal: true,
          lhaCompliant: true,
          lat: 51.3930,
          lng: 1.4050,
          tags: ["Cheapest in Town", "Under LHA Rate", "Bills Included"]
        }
      ];
      renderListings();
    }
  }

  // 3. Leaflet Map Initialization
  function initThanetMap() {
    if (leafletMap || typeof L === 'undefined') return;

    // Centered between Margate, Ramsgate and Broadstairs
    leafletMap = L.map('thanet-map').setView([51.365, 1.385], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);

    markerLayerGroup = L.layerGroup().addTo(leafletMap);
  }

  function updateMapMarkers(filteredListings) {
    if (!leafletMap || !markerLayerGroup) return;

    markerLayerGroup.clearLayers();
    const bounds = [];

    filteredListings.forEach(item => {
      if (!item.lat || !item.lng) return;

      const badgeBg = sourceColors[item.source] || '#0b253a';

      // Custom HTML Marker Pin
      const markerHtml = `
        <div class="custom-map-marker" style="background-color: ${badgeBg}; width: 34px; height: 34px;">
          £${item.pricePcm}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18]
      });

      const popupContent = `
        <div class="map-popup-card">
          <img src="${item.image || 'assets/hero.jpg'}" alt="${item.title}">
          <span style="font-size:0.7rem; font-weight:700; color:${badgeBg}; text-transform:uppercase;">${item.source} · ${item.town}</span>
          <h4>${item.title}</h4>
          <div class="popup-price">£${item.pricePcm} pcm</div>
          <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">View Listing ↗</a>
        </div>
      `;

      const marker = L.marker([item.lat, item.lng], { icon: customIcon })
        .bindPopup(popupContent);

      markerLayerGroup.addLayer(marker);
      bounds.push([item.lat, item.lng]);
    });

    if (bounds.length > 0) {
      leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }

  // 4. Filter & Render Function
  function renderListings() {
    if (!gridContainer) return;

    // Filter listings based on current filter state
    let filtered = allListings.filter(item => {
      // Search query
      if (filterState.searchQuery) {
        const q = filterState.searchQuery.toLowerCase();
        const textToMatch = `${item.title} ${item.town} ${item.area} ${item.postcode || ''} ${item.description || ''} ${item.source}`.toLowerCase();
        if (!textToMatch.includes(q)) return false;
      }

      // Town filter
      if (filterState.town !== 'All Thanet') {
        if (item.town.toLowerCase() !== filterState.town.toLowerCase()) return false;
      }

      // Property type filter
      if (filterState.propertyType !== 'All Types') {
        const selectedType = filterState.propertyType.toLowerCase();
        if (selectedType.includes(',')) {
          // Multiple types support (e.g. "studio,1-bed")
          const types = selectedType.split(',');
          if (!types.includes(item.propertyType.toLowerCase())) return false;
        } else {
          if (item.propertyType.toLowerCase() !== selectedType) return false;
        }
      }

      // Max price
      if (item.pricePcm > filterState.maxPrice) return false;

      // Source filter
      if (filterState.source !== 'ALL') {
        if (filterState.source === 'Local Agents') {
          if (item.source !== 'Miles & Barr' && item.source !== 'Oakwood Homes') return false;
        } else if (!item.source.toLowerCase().includes(filterState.source.toLowerCase())) {
          return false;
        }
      }

      // Toggle: LHA only
      if (filterState.onlyLha && !item.lhaCompliant) return false;

      // Toggle: Bills included only
      if (filterState.onlyBillsIncluded && !item.billsIncluded) return false;

      return true;
    });

    // Sorting
    if (filterState.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.pricePcm - b.pricePcm);
    } else if (filterState.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.pricePcm - a.pricePcm);
    }

    // Update count display
    if (countText) {
      const townLabel = filterState.town === 'All Thanet' ? 'Thanet (Margate, Ramsgate, Broadstairs)' : filterState.town;
      countText.textContent = `Showing ${filtered.length} low-cost listing${filtered.length === 1 ? '' : 's'} in ${townLabel}`;
    }

    // Handle empty state
    if (filtered.length === 0) {
      gridContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (mapViewContainer) mapViewContainer.style.display = 'none';
      return;
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (filterState.currentView === 'map' && mapViewContainer) {
        mapViewContainer.style.display = 'block';
      }
    }

    // Render Cards Grid
    gridContainer.innerHTML = filtered.map(item => {
      const badgeBg = sourceColors[item.source] || '#0b253a';
      const dealBadge = item.isCheapDeal 
        ? `<span class="deal-badge-chip">🔥 Super Deal</span>` 
        : (item.lhaCompliant ? `<span class="deal-badge-chip" style="background:#0284c7">🏠 LHA Match</span>` : '');

      const billsTag = item.billsIncluded 
        ? `<span class="card-bills-flag">⚡ Bills Included</span>` 
        : '';

      const tagsHtml = (item.tags || []).slice(0, 3).map(tag => `<span class="mini-tag">${tag}</span>`).join('');

      const ctaLabel = item.source === 'SpareRoom' ? 'View on SpareRoom ↗' :
                       item.source === 'Thanet Council' ? 'Apply on Kent Homechoice ↗' :
                       item.source === 'OpenRent' ? 'View on OpenRent ↗' :
                       item.source === 'Gumtree' ? 'View on Gumtree ↗' :
                       `View on ${item.source} ↗`;

      return `
        <article class="property-card" id="card-${item.id}">
          <div class="card-image-wrapper">
            <div class="card-badges-overlay">
              <span class="source-badge-chip" style="background-color: ${badgeBg}">
                ${item.source}
              </span>
              ${dealBadge}
            </div>
            <img src="${item.image || 'assets/hero.jpg'}" alt="${item.title}" class="property-img" loading="lazy">
          </div>
          <div class="card-content">
            <div class="card-meta">
              <span class="card-address" title="${item.area}, ${item.town} (${item.postcode || ''})">
                📍 ${item.area}, ${item.town} ${item.postcode ? `· ${item.postcode.split(' ')[0]}` : ''}
              </span>
              <div class="card-amenities">
                <span class="amenity-item" title="Bedrooms">
                  <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"></path>
                  </svg>
                  ${item.bedrooms !== undefined ? item.bedrooms : 1}
                </span>
                <span class="amenity-item" title="Bathrooms">
                  <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1Z"></path>
                    <path d="M6 12V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  ${item.bathrooms || 1}
                </span>
              </div>
            </div>

            <h3 class="card-title">${item.title}</h3>

            <div class="card-price-row">
              <span class="card-price-main">£${item.pricePcm}</span>
              <span class="card-price-sub">pcm ${item.pricePw ? `(£${item.pricePw} pw)` : ''}</span>
              ${billsTag}
            </div>

            <p class="card-desc-snippet">${item.description}</p>

            <div class="card-tags-list">
              <span class="mini-tag" style="font-weight:700; color:var(--primary-navy)">${item.propertyType}</span>
              ${tagsHtml}
            </div>

            <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer" class="card-outbound-btn">
              ${ctaLabel}
            </a>
          </div>
        </article>
      `;
    }).join('');

    // Update map markers if map view is active or map is initialized
    if (leafletMap) {
      updateMapMarkers(filtered);
    }
  }

  // 5. View Switcher (Grid vs Map)
  if (btnViewGrid && btnViewMap) {
    btnViewGrid.addEventListener('click', () => {
      filterState.currentView = 'grid';
      btnViewGrid.classList.add('active');
      btnViewMap.classList.remove('active');
      if (gridContainer) gridContainer.style.display = 'grid';
      if (mapViewContainer) mapViewContainer.style.display = 'none';
    });

    btnViewMap.addEventListener('click', () => {
      filterState.currentView = 'map';
      btnViewMap.classList.add('active');
      btnViewGrid.classList.remove('active');
      if (gridContainer) gridContainer.style.display = 'none';
      if (mapViewContainer) {
        mapViewContainer.style.display = 'block';
        initThanetMap();
        setTimeout(() => {
          if (leafletMap) leafletMap.invalidateSize();
        }, 100);
        renderListings();
      }
    });
  }

  // 6. LHA Rate Chips Click Handler
  lhaChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const rate = parseInt(chip.getAttribute('data-rate'), 10);
      const type = chip.getAttribute('data-type');

      // Toggle active state
      const wasActive = chip.classList.contains('active');
      lhaChips.forEach(c => c.classList.remove('active'));

      if (!wasActive) {
        chip.classList.add('active');
        filterState.maxPrice = rate;
        filterState.propertyType = type;
        document.getElementById('price-value').textContent = `Up to £${rate}/mo`;
        document.getElementById('type-value').textContent = type.includes(',') ? 'Affordable Flat' : type;
      } else {
        filterState.maxPrice = 99999;
        filterState.propertyType = 'All Types';
        document.getElementById('price-value').textContent = 'Any Budget';
        document.getElementById('type-value').textContent = 'All Types';
      }

      renderListings();
      if (aggregatorSection) {
        aggregatorSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 7. Rent Alert Modal Functionality
  if (btnOpenAlertModal && alertModalOverlay) {
    btnOpenAlertModal.addEventListener('click', () => {
      alertModalOverlay.style.display = 'flex';
    });
  }

  if (modalCloseBtn && alertModalOverlay) {
    modalCloseBtn.addEventListener('click', () => {
      alertModalOverlay.style.display = 'none';
    });
  }

  if (alertModalOverlay) {
    alertModalOverlay.addEventListener('click', (e) => {
      if (e.target === alertModalOverlay) {
        alertModalOverlay.style.display = 'none';
      }
    });
  }

  if (rentAlertForm) {
    rentAlertForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('alert-email').value;
      const budget = document.getElementById('alert-budget').value;
      const town = document.getElementById('alert-town').value;

      const newAlert = { email, budget, town, createdAt: new Date().toISOString() };
      const savedAlerts = JSON.parse(localStorage.getItem('brightrent_alerts') || '[]');
      savedAlerts.push(newAlert);
      localStorage.setItem('brightrent_alerts', JSON.stringify(savedAlerts));

      if (modalSuccessMsg) {
        modalSuccessMsg.style.display = 'block';
        setTimeout(() => {
          alertModalOverlay.style.display = 'none';
          modalSuccessMsg.style.display = 'none';
          rentAlertForm.reset();
        }, 2200);
      }
    });
  }

  // 8. Dropdown Interactivity for Hero Filter Bar
  const filterItems = document.querySelectorAll('.filter-item');
  filterItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('dropdown-opt')) {
        const selectedVal = e.target.getAttribute('data-val') || e.target.textContent;
        const valSpan = item.querySelector('.filter-value');
        if (valSpan) valSpan.textContent = selectedVal;

        // Update active class in options
        item.querySelectorAll('.dropdown-opt').forEach(opt => opt.classList.remove('active-opt'));
        e.target.classList.add('active-opt');

        // Apply state
        if (item.id === 'filter-town') {
          filterState.town = selectedVal;
        } else if (item.id === 'filter-type') {
          filterState.propertyType = selectedVal;
        } else if (item.id === 'filter-price') {
          const maxVal = parseInt(e.target.getAttribute('data-max') || '99999', 10);
          filterState.maxPrice = maxVal;
        }

        item.classList.remove('open');
        renderListings();
        return;
      }

      // Close other dropdowns
      filterItems.forEach(other => {
        if (other !== item) other.classList.remove('open');
      });

      item.classList.toggle('open');
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-item')) {
      filterItems.forEach(item => item.classList.remove('open'));
    }
  });

  // 9. Source Pill Filters
  const sourcePills = document.querySelectorAll('.source-pill');
  sourcePills.forEach(pill => {
    pill.addEventListener('click', () => {
      sourcePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterState.source = pill.getAttribute('data-source') || 'ALL';
      renderListings();
    });
  });

  // 10. Quick Feature Toggles (LHA & Bills)
  const toggleLha = document.getElementById('toggle-lha');
  if (toggleLha) {
    toggleLha.addEventListener('click', () => {
      filterState.onlyLha = !filterState.onlyLha;
      toggleLha.classList.toggle('active', filterState.onlyLha);
      renderListings();
    });
  }

  const toggleBills = document.getElementById('toggle-bills');
  if (toggleBills) {
    toggleBills.addEventListener('click', () => {
      filterState.onlyBillsIncluded = !filterState.onlyBillsIncluded;
      toggleBills.classList.toggle('active', filterState.onlyBillsIncluded);
      renderListings();
    });
  }

  // 11. Search Input Handlers
  function executeSearch() {
    if (heroSearchInput) {
      filterState.searchQuery = heroSearchInput.value.trim();
      renderListings();
      if (aggregatorSection) {
        aggregatorSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  if (heroSearchSubmit) {
    heroSearchSubmit.addEventListener('click', executeSearch);
  }
  if (heroSearchInput) {
    heroSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executeSearch();
    });
  }

  // 12. Filter Bar Submit Button
  if (filterSubmitBtn && aggregatorSection) {
    filterSubmitBtn.addEventListener('click', () => {
      renderListings();
      aggregatorSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 13. Sort Select Handler
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      filterState.sortBy = e.target.value;
      renderListings();
    });
  }

  // 14. Reset Filters Button
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      filterState = {
        searchQuery: '',
        town: 'All Thanet',
        propertyType: 'All Types',
        maxPrice: 99999,
        source: 'ALL',
        onlyLha: false,
        onlyBillsIncluded: false,
        sortBy: 'price_asc',
        currentView: 'grid'
      };

      if (heroSearchInput) heroSearchInput.value = '';
      document.getElementById('town-value').textContent = 'All Thanet';
      document.getElementById('type-value').textContent = 'All Types';
      document.getElementById('price-value').textContent = 'Any Budget';

      sourcePills.forEach(p => p.classList.toggle('active', p.getAttribute('data-source') === 'ALL'));
      if (toggleLha) toggleLha.classList.remove('active');
      if (toggleBills) toggleBills.classList.remove('active');
      if (sortSelect) sortSelect.value = 'price_asc';
      lhaChips.forEach(c => c.classList.remove('active'));

      if (btnViewGrid && btnViewMap) {
        btnViewGrid.classList.add('active');
        btnViewMap.classList.remove('active');
        if (gridContainer) gridContainer.style.display = 'grid';
        if (mapViewContainer) mapViewContainer.style.display = 'none';
      }

      renderListings();
    });
  }

  // 15. Footer Town Links
  const footerAreaLinks = document.querySelectorAll('.footer-area-link');
  footerAreaLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const town = link.getAttribute('data-town');
      if (town) {
        filterState.town = town;
        const valSpan = document.getElementById('town-value');
        if (valSpan) valSpan.textContent = town;
        renderListings();
        if (aggregatorSection) {
          aggregatorSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Initial Data Load
  loadListings();
});
