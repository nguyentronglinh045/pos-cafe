import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Coffee } from 'lucide-react';
import { expect } from '@playwright/test';
import { expectCandidateImageFallback } from '../tests/supabase/permissionCandidateUi.ts';

// Called only after the existing CI browser phase, with a caller-owned page.
// The candidate E2E and this regression share the exact fallback assertion.
export async function candidateImageFallbackBrowserControl(page) {
  const html = extra => renderToStaticMarkup(createElement('button', { 'data-testid': 'candidate-image-card' },
    createElement(Coffee, { size: 22, 'data-testid': 'menu-image-placeholder' }), extra));
  await page.setContent(html(null));
  const card = page.getByTestId('candidate-image-card');
  await expect(card.getByRole('img')).toHaveCount(1);
  await expectCandidateImageFallback(card);

  await page.setContent(html(createElement('img', { alt: 'Synthetic item' })));
  await expect(card.getByTestId('menu-image-placeholder')).toBeVisible();
  await expect(card.locator('img')).toHaveCount(1);
  await expect(card.getByRole('img')).toHaveCount(2);
  let refused = false;
  try { await expectCandidateImageFallback(card, expect.configure({ timeout: 100 })); }
  catch (error) { refused = error?.matcherResult?.name === 'toHaveCount'; }
  expect(refused).toBe(true);

  await page.setContent('<button data-testid="candidate-image-card"></button>');
  await expect(card.locator('img')).toHaveCount(0);
  refused = false;
  try { await expectCandidateImageFallback(card, expect.configure({ timeout: 100 })); }
  catch (error) { refused = error?.matcherResult?.name === 'toBeVisible'; }
  expect(refused).toBe(true);
  return { svgPlaceholder: 1, nativeImageRefused: 1, missingPlaceholderRefused: 1 };
}
