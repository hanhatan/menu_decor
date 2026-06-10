/* ==========================================================================
   INTERACTIVE LOGIC: TIỆM LẨU NHÀ AN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // MENU CONFIGURATIONS
    const menuConfigs = {
        cantho: {
            title: 'chi nhánh Cần Thơ',
            getMenuPath: function(page) {
                return `menu/CT/MENU CT ${page}` + (page === 7 ? '.png' : '.jpg');
            }
        },
        longxuyen: {
            title: 'chi nhánh Long Xuyên',
            getMenuPath: function(page) {
                return `menu/MENU-LONGXUYEN/MENU LX ${page}.png`;
            }
        }
    };

    // STATE VARIABLES
    let currentMenuType = 'cantho'; // 'cantho' or 'longxuyen'
    let currentMenuPage = 1;
    const totalMenuPages = 16;
    
    // Lightbox State
    let lightboxMode = 'menu'; // 'menu' or 'decor'
    let currentDecorIndex = 0;
    let visibleDecorCards = [];
    let zoomScale = 1;
    let isDragging = false;
    let startX = 0, startY = 0;
    let translateX = 0, translateY = 0;
    let currentTranslateX = 0, currentTranslateY = 0;

    // DOM ELEMENTS - NAVIGATION & TABS
    const mainTabs = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.content-section');
    const brandLogo = document.getElementById('brand-logo');
    
    // DOM ELEMENTS - MENU PAGINATION
    const menuImg = document.getElementById('displayed-menu-img');
    const menuLoader = document.getElementById('menu-loader');
    const selectPage = document.getElementById('select-page');
    const btnFirst = document.getElementById('btn-first');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnLast = document.getElementById('btn-last');
    const btnPrevArrow = document.getElementById('btn-prev-arrow');
    const btnNextArrow = document.getElementById('btn-next-arrow');
    const btnZoomMenu = document.getElementById('btn-zoom-menu');
    const menuTouchArea = document.getElementById('menu-touch-area');

    // DOM ELEMENTS - DECOR GALLERY
    const branchTabs = document.querySelectorAll('.branch-tab');
    const decorCards = document.querySelectorAll('.decor-card');
    const decorGallery = document.getElementById('decor-gallery');

    // DOM ELEMENTS - LIGHTBOX
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');
    const zoomControls = document.getElementById('zoom-controls');

    /* ==========================================================================
       TAB SWITCHING SYSTEM
       ========================================================================== */
    mainTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetSectionId = tab.getAttribute('data-target');
            if (!targetSectionId) return; // Allow normal link navigation for non-tab links
            
            // Switch tabs
            mainTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch content sections
            sections.forEach(sec => {
                if (sec.id === targetSectionId) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('active');
                }
            });

            // Handle menu branch switching
            const menuType = tab.getAttribute('data-menu-type');
            if (menuType) {
                if (currentMenuType !== menuType) {
                    currentMenuType = menuType;

                    // Update info text dynamically
                    const menuInfoText = document.getElementById('menu-info-text');
                    if (menuInfoText) {
                        const branchName = currentMenuType === 'cantho' ? 'Cần Thơ' : 'Long Xuyên';
                        menuInfoText.innerHTML = `Thực đơn chi nhánh ${branchName} gồm <span class="highlight">16 trang</span>. Vuốt trái/phải hoặc dùng các nút điều hướng để xem chi tiết.`;
                    }

                    // Reset menu to first page on switch
                    updateMenuPage(1);
                }

                // Update URL quietly without page reload
                const newUrl = window.location.pathname + '?menu=' + (menuType === 'longxuyen' ? 'lx' : 'ct');
                window.history.replaceState({ path: newUrl }, '', newUrl);
            } else if (tab.id === 'tab-decor') {
                // Update URL quietly without page reload for decor
                const newUrl = window.location.pathname + '?menu=decor';
                window.history.replaceState({ path: newUrl }, '', newUrl);
            }

            // Scroll to top on switch
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Clicking logo takes back to Menu Tab
    if (brandLogo) {
        brandLogo.addEventListener('click', () => {
            const menuTabButton = document.getElementById('tab-menu-ct');
            if (menuTabButton) menuTabButton.click();
        });
    }

    /* ==========================================================================
       MENU PAGINATION SYSTEM
       ========================================================================== */
    // Initialize Page Dropdown
    function initPageSelect() {
        selectPage.innerHTML = '';
        for (let i = 1; i <= totalMenuPages; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Trang ${i} / ${totalMenuPages}`;
            selectPage.appendChild(option);
        }
    }

    // Update Menu Image and Buttons
    function updateMenuPage(page) {
        if (page < 1 || page > totalMenuPages) return;
        currentMenuPage = page;

        // Show loading spinner
        menuLoader.classList.add('active');
        
        // Form the image path
        const imagePath = menuConfigs[currentMenuType].getMenuPath(currentMenuPage);
        
        // Update image source
        menuImg.src = imagePath;
        menuImg.alt = `Menu Tiệm Lẩu Nhà An ${currentMenuType === 'cantho' ? 'Cần Thơ' : 'Long Xuyên'} Trang ${currentMenuPage}`;

        // When image is fully loaded, hide spinner
        menuImg.onload = () => {
            menuLoader.classList.remove('active');
        };

        // Fallback for loading error
        menuImg.onerror = () => {
            menuLoader.classList.remove('active');
            console.error(`Không thể tải ảnh thực đơn tại: ${imagePath}`);
        };

        // Sync dropdown selector
        selectPage.value = currentMenuPage;

        // Update disabled states of buttons
        const isFirst = currentMenuPage === 1;
        const isLast = currentMenuPage === totalMenuPages;

        btnFirst.disabled = isFirst;
        btnPrev.disabled = isFirst;
        btnPrevArrow.disabled = isFirst;

        btnNext.disabled = isLast;
        btnLast.disabled = isLast;
        btnNextArrow.disabled = isLast;

        // Sync lightbox image if it is open in 'menu' mode
        if (lightbox.classList.contains('active') && lightboxMode === 'menu') {
            updateLightboxContent();
        }
    }

    // Event Listeners for Pagination Buttons
    btnFirst.addEventListener('click', () => updateMenuPage(1));
    btnPrev.addEventListener('click', () => updateMenuPage(currentMenuPage - 1));
    btnNext.addEventListener('click', () => updateMenuPage(currentMenuPage + 1));
    btnLast.addEventListener('click', () => updateMenuPage(totalMenuPages));

    btnPrevArrow.addEventListener('click', () => updateMenuPage(currentMenuPage - 1));
    btnNextArrow.addEventListener('click', () => updateMenuPage(currentMenuPage + 1));

    selectPage.addEventListener('change', (e) => {
        updateMenuPage(parseInt(e.target.value));
    });

    // Touch Swipe Navigation for Menu
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 60; // minimum distance to count as swipe

    menuTouchArea.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    menuTouchArea.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    }, { passive: true });

    function handleSwipeGesture() {
        const deltaX = touchEndX - touchStartX;
        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX < 0) {
                // Swipe Left -> Next Page
                if (currentMenuPage < totalMenuPages) {
                    updateMenuPage(currentMenuPage + 1);
                }
            } else {
                // Swipe Right -> Prev Page
                if (currentMenuPage > 1) {
                    updateMenuPage(currentMenuPage - 1);
                }
            }
        }
    }

    /* ==========================================================================
       DECOR GALLERY SYSTEM
       ========================================================================== */
    // Helper to get currently visible cards based on branch filter
    function updateVisibleDecorCards() {
        const activeBranchTab = document.querySelector('.branch-tab.active');
        const branch = activeBranchTab ? activeBranchTab.getAttribute('data-branch') : 'all';
        
        visibleDecorCards = [];
        decorCards.forEach(card => {
            if (branch === 'all' || card.getAttribute('data-branch') === branch) {
                visibleDecorCards.push(card);
            }
        });
    }

    // Branch tab filtering
    branchTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            branchTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const selectedBranch = tab.getAttribute('data-branch');

            decorCards.forEach(card => {
                const cardBranch = card.getAttribute('data-branch');
                if (selectedBranch === 'all' || cardBranch === selectedBranch) {
                    card.style.display = 'flex';
                    // Animation trigger
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transition = 'opacity 0.3s ease';
                    }, 50);
                } else {
                    card.style.display = 'none';
                }
            });

            // Update internal list of visible cards for lightbox cycling
            updateVisibleDecorCards();
        });
    });

    // Clicking decor card opens lightbox
    decorCards.forEach(card => {
        card.addEventListener('click', () => {
            // Find current card's index in the filtered list
            updateVisibleDecorCards();
            currentDecorIndex = visibleDecorCards.indexOf(card);
            
            openLightbox('decor');
        });
    });

    // Hover zoom on menu image clicks
    menuTouchArea.addEventListener('click', (e) => {
        // Only trigger lightbox if it's not a swipe (can check if touch was minimal, but click listener handles this on desktop)
        // If clicking directly on desktop, zoom in
        openLightbox('menu');
    });

    btnZoomMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox('menu');
    });

    /* ==========================================================================
       FULLSCREEN LIGHTBOX MODAL WITH ZOOM & DRAG
       ========================================================================== */
    function openLightbox(mode) {
        lightboxMode = mode;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock screen scroll

        // Reset zoom states
        resetZoom();

        // Show/hide specific controls based on mode
        if (lightboxMode === 'menu') {
            zoomControls.style.display = 'flex';
            lightboxCaption.style.display = 'block';
        } else {
            zoomControls.style.display = 'none'; // No zoom controls needed for decor cards usually, but can keep it or hide it
            lightboxCaption.style.display = 'block';
        }

        updateLightboxContent();

        // Keyboard accessibility
        document.addEventListener('keydown', handleKeyDown);
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Unlock screen scroll
        resetZoom();
        document.removeEventListener('keydown', handleKeyDown);
    }

    function updateLightboxContent() {
        if (lightboxMode === 'menu') {
            lightboxImg.src = menuConfigs[currentMenuType].getMenuPath(currentMenuPage);
            lightboxImg.alt = `Menu Trang ${currentMenuPage}`;
            lightboxCaption.textContent = `Thực đơn Tiệm Lẩu Nhà An ${currentMenuType === 'cantho' ? 'Cần Thơ' : 'Long Xuyên'} — Trang ${currentMenuPage} / ${totalMenuPages}`;
            
            // Set navigation arrow visibility for menu
            lightboxPrev.style.display = currentMenuPage === 1 ? 'none' : 'flex';
            lightboxNext.style.display = currentMenuPage === totalMenuPages ? 'none' : 'flex';
        } else if (lightboxMode === 'decor') {
            if (visibleDecorCards.length === 0) updateVisibleDecorCards();
            
            const card = visibleDecorCards[currentDecorIndex];
            if (!card) return;

            const img = card.querySelector('.decor-thumb');
            const title = card.querySelector('.decor-info h3').textContent;
            const subtitle = card.querySelector('.decor-info p').textContent;

            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCaption.textContent = `${title} — ${subtitle}`;

            // Set navigation arrow visibility for decor gallery
            lightboxPrev.style.display = currentDecorIndex === 0 ? 'none' : 'flex';
            lightboxNext.style.display = currentDecorIndex === visibleDecorCards.length - 1 ? 'none' : 'flex';
        }
    }

    // Lightbox navigation cycling
    function navigateLightbox(direction) {
        resetZoom();
        if (lightboxMode === 'menu') {
            const targetPage = currentMenuPage + direction;
            if (targetPage >= 1 && targetPage <= totalMenuPages) {
                updateMenuPage(targetPage);
            }
        } else if (lightboxMode === 'decor') {
            const targetIndex = currentDecorIndex + direction;
            if (targetIndex >= 0 && targetIndex < visibleDecorCards.length) {
                currentDecorIndex = targetIndex;
                updateLightboxContent();
            }
        }
    }

    lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
    });

    lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
    });

    lightboxClose.addEventListener('click', closeLightbox);
    
    // Close lightbox on click outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === document.getElementById('lightbox-content')) {
            closeLightbox();
        }
    });

    function handleKeyDown(e) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    }

    /* Lightbox Touch Swiping */
    let lightboxTouchStartX = 0;
    let lightboxTouchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        // Only trigger swipe if we are NOT zoomed in and NOT touching the zoom controls
        if (zoomScale === 1 && !e.target.closest('.zoom-controls') && !e.target.closest('.lightbox-arrow')) {
            lightboxTouchStartX = e.changedTouches[0].screenX;
        }
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        if (zoomScale === 1 && !e.target.closest('.zoom-controls') && !e.target.closest('.lightbox-arrow')) {
            lightboxTouchEndX = e.changedTouches[0].screenX;
            handleLightboxSwipeGesture();
        }
    }, { passive: true });

    function handleLightboxSwipeGesture() {
        const deltaX = lightboxTouchEndX - lightboxTouchStartX;
        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX < 0) {
                navigateLightbox(1); // Swipe left -> Next
            } else {
                navigateLightbox(-1); // Swipe right -> Prev
            }
        }
    }

    /* Zoom and Drag Interaction Logic */
    function applyTransform() {
        lightboxImg.style.transform = `scale(${zoomScale}) translate(${translateX}px, ${translateY}px)`;
    }

    function resetZoom() {
        zoomScale = 1;
        translateX = 0;
        translateY = 0;
        currentTranslateX = 0;
        currentTranslateY = 0;
        applyTransform();
        zoomResetBtn.textContent = '100%';
        lightboxImg.style.cursor = 'grab';
    }

    zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (zoomScale < 3) {
            zoomScale += 0.5;
            zoomResetBtn.textContent = `${Math.round(zoomScale * 100)}%`;
            lightboxImg.style.cursor = zoomScale > 1 ? 'move' : 'grab';
            applyTransform();
        }
    });

    zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (zoomScale > 1) {
            zoomScale -= 0.5;
            if (zoomScale === 1) {
                resetZoom();
            } else {
                zoomResetBtn.textContent = `${Math.round(zoomScale * 100)}%`;
                applyTransform();
            }
        }
    });

    zoomResetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetZoom();
    });

    // Dragging image when zoomed in (Mouse Events)
    lightboxImg.addEventListener('mousedown', (e) => {
        if (zoomScale > 1) {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX - currentTranslateX;
            startY = e.clientY - currentTranslateY;
            lightboxImg.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging && zoomScale > 1) {
            translateX = (e.clientX - startX) / zoomScale;
            translateY = (e.clientY - startY) / zoomScale;
            applyTransform();
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            currentTranslateX = translateX * zoomScale;
            currentTranslateY = translateY * zoomScale;
            lightboxImg.style.cursor = 'move';
        }
    });

    // Dragging image when zoomed in (Touch Events)
    lightboxImg.addEventListener('touchstart', (e) => {
        if (zoomScale > 1 && e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX - currentTranslateX;
            startY = e.touches[0].clientY - currentTranslateY;
        }
    }, { passive: true });

    lightboxImg.addEventListener('touchmove', (e) => {
        if (isDragging && zoomScale > 1 && e.touches.length === 1) {
            translateX = (e.touches[0].clientX - startX) / zoomScale;
            translateY = (e.touches[0].clientY - startY) / zoomScale;
            applyTransform();
        }
    }, { passive: true });

    lightboxImg.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            currentTranslateX = translateX * zoomScale;
            currentTranslateY = translateY * zoomScale;
        }
    });

    // Prevent image drag default ghosting
    lightboxImg.addEventListener('dragstart', (e) => e.preventDefault());

    // Check URL parameters and hash on load to deep-link to a specific menu/section
    function handleDeepLinking() {
        const urlParams = new URLSearchParams(window.location.search);
        const menuParam = urlParams.get('menu') || urlParams.get('tab');
        const hash = window.location.hash.toLowerCase();

        let targetTab = null;

        if (menuParam) {
            const paramClean = menuParam.toLowerCase();
            if (paramClean === 'longxuyen' || paramClean === 'lx' || paramClean === 'long-xuyen') {
                targetTab = document.getElementById('tab-menu-lx');
            } else if (paramClean === 'decor' || paramClean === 'khonggian' || paramClean === 'space' || paramClean === 'decor-section') {
                targetTab = document.getElementById('tab-decor');
            } else if (paramClean === 'cantho' || paramClean === 'ct' || paramClean === 'can-tho') {
                targetTab = document.getElementById('tab-menu-ct');
            }
        }

        if (!targetTab && hash) {
            if (hash === '#longxuyen' || hash === '#lx' || hash === '#menu-lx') {
                targetTab = document.getElementById('tab-menu-lx');
            } else if (hash === '#decor' || hash === '#khonggian' || hash === '#space' || hash === '#decor-section') {
                targetTab = document.getElementById('tab-decor');
            } else if (hash === '#cantho' || hash === '#ct' || hash === '#menu-ct') {
                targetTab = document.getElementById('tab-menu-ct');
            }
        }

        if (targetTab) {
            targetTab.click();
            
            // Optional: deep link to a specific page
            const pageParam = urlParams.get('page') || urlParams.get('trang');
            if (pageParam) {
                const pageNum = parseInt(pageParam);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalMenuPages) {
                    updateMenuPage(pageNum);
                }
            }
        }
    }


    /* ==========================================================================
       INITIALIZATION CALLS
       ========================================================================== */
    initPageSelect();
    updateMenuPage(1);
    updateVisibleDecorCards();
    handleDeepLinking();
});
