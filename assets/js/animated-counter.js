/**
 * FINMETRICS PRO — INSTITUTIONAL ANIMATED COUNTER ENGINE
 * High-performance 60fps numerical ticking with requestAnimationFrame
 * Usage: window.FinCounter.animate(element, targetValue, options)
 */

(function (global) {
  'use strict';

  const easings = {
    easeOutQuart: function (t) {
      return 1 - Math.pow(1 - t, 4);
    },
    easeOutExpo: function (t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    },
    linear: function (t) {
      return t;
    }
  };

  const FinCounter = {
    /**
     * Animate an HTML element's numeric value to target
     * @param {HTMLElement|string} el
     * @param {number} targetValue
     * @param {object} options
     */
    animate: function (el, targetValue, options = {}) {
      const element = typeof el === 'string' ? document.getElementById(el) : el;
      if (!element) return;

      const duration = options.duration !== undefined ? options.duration : 650;
      const prefix = options.prefix !== undefined ? options.prefix : '';
      const suffix = options.suffix !== undefined ? options.suffix : '';
      const decimals = options.decimals !== undefined ? options.decimals : 0;
      const easingFn = easings[options.easing] || easings.easeOutQuart;

      // Extract existing numeric value if present
      const rawText = element.textContent.replace(/[^0-9.-]/g, '');
      const startValue = !isNaN(parseFloat(rawText)) && element.dataset.hasCounted === 'true'
        ? parseFloat(rawText)
        : 0;

      const target = Number(targetValue) || 0;
      if (startValue === target) {
        element.textContent = this.format(target, prefix, suffix, decimals);
        return;
      }

      // Cancel any ongoing animation for this element
      if (element._counterAnimId) {
        cancelAnimationFrame(element._counterAnimId);
      }

      element.classList.add('animate-count-up');
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easingFn(progress);
        const current = startValue + (target - startValue) * easeProgress;

        element.textContent = this.format(current, prefix, suffix, decimals);

        if (progress < 1) {
          element._counterAnimId = requestAnimationFrame(step);
        } else {
          element.textContent = this.format(target, prefix, suffix, decimals);
          element.dataset.hasCounted = 'true';
          element._counterAnimId = null;
          element.classList.remove('animate-count-up');
          if (typeof options.onComplete === 'function') {
            options.onComplete(target);
          }
        }
      };

      element._counterAnimId = requestAnimationFrame(step);
    },

    /**
     * Format a number with standard commas, prefix, and suffix
     */
    format: function (value, prefix = '', suffix = '', decimals = 0) {
      const num = Number(value) || 0;
      const formatted = num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      return `${prefix}${formatted}${suffix}`;
    },

    /**
     * Batch animate multiple metrics with staggered delay
     */
    animateBatch: function (items) {
      if (!Array.isArray(items)) return;
      items.forEach((item, index) => {
        setTimeout(() => {
          this.animate(item.el, item.val, item.options);
        }, index * 40);
      });
    }
  };

  global.FinCounter = FinCounter;
})(typeof window !== 'undefined' ? window : this);
