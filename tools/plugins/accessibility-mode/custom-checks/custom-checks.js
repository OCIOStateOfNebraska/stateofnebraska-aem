import { ERROR_TYPES, MESSAGES } from './constants.js';
import { prepareDismissal } from './utils.js';

/**
 * populate the results array with custom checks
 * @param {Object<Array>} results
 */
export default function checkCustom(results) {
  /**
   * 01. Check fore more than one instance of the ALERT block.
   */
  const alerts = [...document.querySelectorAll('.alert.block')];
  if (alerts.length > 1) {
    alerts.forEach((card, index) => {
      if (index === 0) {
        const key = prepareDismissal(card.textContent);

        results.push({
          element: card,
          type: ERROR_TYPES.WARNING,
          content: MESSAGES.TOO_MANY_ALERTS_MESSAGE,
          inline: false,
          position: 'beforeBegin',
          dismiss: key,
        });
      }
    });
  }
}
