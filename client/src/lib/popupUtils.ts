/**
 * Utility functions for handling Mapbox popups
 */

/**
 * Forcefully removes all Mapbox popups from the DOM
 * This is a more aggressive approach that targets both the popups and their containers
 */
export const removeAllPopups = () => {
  try {
    // Target all popup elements first
    const popupElements = document.querySelectorAll('.mapboxgl-popup');
    
    // Remove each popup directly
    popupElements.forEach(popup => {
      popup.remove();
    });
    
    // Also clean up by targeting parent containers
    const popupContainers = document.querySelectorAll('.mapboxgl-popup-content');
    popupContainers.forEach(container => {
      const parent = container.parentElement;
      if (parent) {
        const grandparent = parent.parentElement;
        if (grandparent) {
          grandparent.remove();
        } else {
          parent.remove();
        }
      }
    });
    
    // Finally, remove any orphaned popup tips
    const popupTips = document.querySelectorAll('.mapboxgl-popup-tip');
    popupTips.forEach(tip => {
      const parent = tip.parentElement;
      if (parent) {
        parent.remove();
      } else {
        tip.remove();
      }
    });
  } catch (error) {
    console.error('Error cleaning up popups:', error);
  }
};

/**
 * Starts a repeated cleanup process for popups
 * Returns a function to stop the cleanup
 */
export const startPopupCleanupInterval = (intervalMs = 100) => {
  const intervalId = setInterval(removeAllPopups, intervalMs);
  return () => clearInterval(intervalId);
};