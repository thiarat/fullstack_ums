import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  sidebarOpen = signal(false);
  toggle() { this.sidebarOpen.update(v => !v); }
  close()   { this.sidebarOpen.set(false); }
  open()    { this.sidebarOpen.set(true); }
}
