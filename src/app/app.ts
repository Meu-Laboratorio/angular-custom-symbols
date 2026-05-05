import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

interface Reservoir {
  capacity: number;
  level: number;
  tapOpen: boolean;
  tapFlowRate: number;
}

interface TankConfig {
  x: number;
  topY: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnDestroy {
  private readonly TICK_MS = 100;
  private readonly INLET_RATE_LS = 60; // L/s fill speed
  private readonly BOTTOM_Y = 415;

  reservoirs: Reservoir[] = [
    { capacity: 200, level: 0, tapOpen: false, tapFlowRate: 20 },
    { capacity: 500, level: 0, tapOpen: false, tapFlowRate: 50 },
    { capacity: 1000, level: 0, tapOpen: false, tapFlowRate: 100 },
  ];

  readonly tanks: TankConfig[] = [
    { x: 90, topY: 255, width: 100, height: 160 },
    { x: 295, topY: 215, width: 140, height: 200 },
    { x: 540, topY: 175, width: 180, height: 240 },
  ];

  waterInputAmount = 100;
  tapFlowInputs = [20, 50, 100];
  pendingWater = 0;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  // ── Water-level helpers ──────────────────────────────────────────────

  getWaterHeight(i: number): number {
    const { level, capacity } = this.reservoirs[i];
    return (level / capacity) * this.tanks[i].height;
  }

  getWaterY(i: number): number {
    return this.BOTTOM_Y - this.getWaterHeight(i);
  }

  /** Y position for the level label (just below the water surface, capped inside tank). */
  getLevelTextY(i: number): number {
    const t = this.tanks[i];
    const textY = this.getWaterY(i) + 16;
    return Math.min(textY, this.BOTTOM_Y - 6);
  }

  getFillPercent(i: number): number {
    return Math.min(100, (this.reservoirs[i].level / this.reservoirs[i].capacity) * 100);
  }

  isOverflowing(i: number): boolean {
    return i < 2 && this.reservoirs[i].level >= this.reservoirs[i].capacity - 0.05;
  }

  isFlowingIn(i: number): boolean {
    return i === 0 ? this.pendingWater > 0 : this.isOverflowing(i - 1);
  }

  // ── User actions ─────────────────────────────────────────────────────

  addWater(): void {
    if (this.waterInputAmount > 0) {
      this.pendingWater += this.waterInputAmount;
      this.ensureRunning();
    }
  }

  toggleTap(i: number): void {
    this.reservoirs[i].tapOpen = !this.reservoirs[i].tapOpen;
    this.reservoirs[i].tapFlowRate = this.tapFlowInputs[i];
    if (this.reservoirs[i].tapOpen) this.ensureRunning();
  }

  applyTapFlow(i: number): void {
    this.reservoirs[i].tapFlowRate = this.tapFlowInputs[i];
  }

  // ── Simulation ───────────────────────────────────────────────────────

  private ensureRunning(): void {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.tick(), this.TICK_MS);
    }
  }

  private tick(): void {
    const dt = this.TICK_MS / 1000;

    // Fill reservoir 0 from pending water
    if (this.pendingWater > 0) {
      const addNow = Math.min(this.pendingWater, this.INLET_RATE_LS * dt);
      this.reservoirs[0].level += addNow;
      this.pendingWater -= addNow;
      if (this.pendingWater < 0.001) this.pendingWater = 0;
    }

    // Drain and overflow for each reservoir
    for (let i = 0; i < 3; i++) {
      const r = this.reservoirs[i];

      // Drain via tap
      if (r.tapOpen && r.level > 0) {
        const drain = Math.min(r.level, r.tapFlowRate * dt);
        r.level -= drain;
      }

      // Overflow to next reservoir
      if (i < 2 && r.level > r.capacity) {
        this.reservoirs[i + 1].level += r.level - r.capacity;
        r.level = r.capacity;
      }

      // Clamp
      r.level = Math.max(0, Math.min(r.capacity, r.level));
    }

    // Stop simulation when idle
    const hasWater = this.reservoirs.some(r => r.level > 0.001);
    if (!hasWater && this.pendingWater === 0) {
      clearInterval(this.intervalId!);
      this.intervalId = null;
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
