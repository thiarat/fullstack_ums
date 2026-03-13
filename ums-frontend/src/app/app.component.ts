import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);

  ngOnInit() {
    // Refresh profile data from DB on app load so stale JWT names are corrected
    if (this.auth.isLoggedIn()) {
      this.auth.refreshProfile().subscribe({ error: () => {} });
    }
  }
}
