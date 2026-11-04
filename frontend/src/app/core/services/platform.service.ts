import { Injectable, signal, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export type BackButtonConsumer = () => boolean; // Return true if event was consumed/handled

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  private location = inject(Location);
  private router = inject(Router);

  public isNative = signal<boolean>(Capacitor.isNativePlatform());
  public platform = signal<string>(Capacitor.getPlatform());
  public isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  private backConsumers: BackButtonConsumer[] = [];
  private lastBackPressTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.isOnline.set(true));
      window.addEventListener('offline', () => this.isOnline.set(false));
    }

    this.initHardwareBackButton();
  }

  /**
   * Register a custom back-button consumer (e.g. an open modal or bottom sheet).
   * Returns an unregister function.
   */
  public registerBackConsumer(consumer: BackButtonConsumer): () => void {
    this.backConsumers.push(consumer);
    return () => {
      this.backConsumers = this.backConsumers.filter(c => c !== consumer);
    };
  }

  private initHardwareBackButton(): void {
    if (!this.isNative()) return;

    try {
      App.addListener('backButton', ({ canGoBack }) => {
        // Priority 1: Check active modal/popup consumers (topmost first)
        for (let i = this.backConsumers.length - 1; i >= 0; i--) {
          const consumed = this.backConsumers[i]();
          if (consumed) return;
        }

        // Priority 2: Angular router navigation
        const currentUrl = this.router.url;
        const isRootRoute = currentUrl === '/' || currentUrl === '/dashboard' || currentUrl === '/login';

        if (!isRootRoute && canGoBack) {
          this.location.back();
          return;
        }

        // Priority 3: Root route exit confirmation (double press within 2 seconds)
        const now = Date.now();
        if (now - this.lastBackPressTime < 2000) {
          App.exitApp();
        } else {
          this.lastBackPressTime = now;
          console.log('[PlatformService] Press back again within 2 seconds to exit app');
        }
      });
    } catch (e) {
      console.warn('[PlatformService] Could not register App backButton listener', e);
    }
  }

  public isAndroid(): boolean {
    return this.platform() === 'android';
  }

  public isIOS(): boolean {
    return this.platform() === 'ios';
  }

  public isWeb(): boolean {
    return !this.isNative();
  }
}
