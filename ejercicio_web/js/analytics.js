/**
 * @file ejercicio_web/js/analytics.js
 * @description Vercel Web Analytics initialization module.
 */
import { inject } from '@vercel/analytics';

/**
 * Initializes Vercel Web Analytics.
 * This should be called once per page load.
 */
export function initAnalytics() {
  inject({
    mode: 'auto', // Automatically detect production/development
    debug: false, // Set to true to see debug logs in development
  });
}
