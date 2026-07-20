// src/app/utils/highlight.pipe.ts
// Custom Angular pipe to safely highlight query term matches in raw text fields.
// Connects to: app.html
// Created: 2026-07-20

import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string, search: string): SafeHtml {
    if (!value) return '';
    if (!search || !search.trim()) return value;

    try {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedSearch})`, 'gi');
      
      // Wrap matching fragments inside <mark class="text-highlight"> tags
      const highlighted = value.replace(regex, '<mark class="text-highlight">$1</mark>');
      return this.sanitizer.bypassSecurityTrustHtml(highlighted);
    } catch (e) {
      console.error('HighlightPipe error: ', e);
      return value;
    }
  }
}
