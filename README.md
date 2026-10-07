# 🪔 Diya — Sacred Light

An interactive, physics-based digital Indian Diya built programmatically from a single terracotta diya asset. Features real-time fluid flame dynamics, spring-damper inertia, mobile gyroscope orientation (buoyant gravity tilt), accelerometer shake interactions, and dynamic ambient illumination.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cosmickdd/diya)

---

## ✨ Features

- **Realistic Luminous Flame**: Multi-layered SVG vector flame with glowing golden inner petal, fiery tip, 3D highlight wings, and central radiant light beam.
- **Mobile Gyroscope Tilt (`DeviceOrientationEvent`)**: Real buoyant flame physics — as you tilt your phone left/right, the flame leans counter to the tilt to remain pointing straight up at the sky.
- **Liquid Oil Simulation**: Shimmering golden flame reflections on the oil pool that shift with gravity and phone tilt. Tapping the oil generates expanding ripple rings.
- **Accelerometer Motion (`DeviceMotionEvent`)**: Moving or jerking the phone creates inertial lag and sheds floating golden sparks/embers. A violent shake blows out the flame.
- **Extinguish & Smoke Dynamics**: Swipe rapidly across the flame or click *Extinguish* to blow it out; the cherry-red wick ember glows and emits realistic curling wisps of smoke.
- **Dynamic Ambient Canvas**: Pulsing warm candlelight illuminating the surrounding room, synchronized with the flame's breathing and flicker.
- **Desktop Simulation**: Full mouse air draft interaction, keyboard arrow keys to simulate phone tilt, and spacebar to toggle.
- **Optimized for Vercel**: Zero-config static deployment with asset caching and clean URLs.

---

## 📱 Controls & Interactions

| Device | Action | Effect |
| :--- | :--- | :--- |
| **Mobile** | **Tilt Phone Left / Right** | Flame leans naturally to stay upright against gravity |
| **Mobile** | **Tilt Phone Forward / Flat** | Shifts perspective: wider flame belly & brighter oil reflection |
| **Mobile** | **Shake Phone** | Emits a burst of floating golden embers |
| **Mobile** | **Vigorous Shake** | Blows out the flame with smoke |
| **All** | **Tap / Click Diya** | Ignites unlit diya; ripples oil surface when lit |
| **All** | **Fast Swipe across Flame** | Blows out the flame |
| **Desktop** | **Left / Right Arrow Keys** | Simulates left/right phone tilt |
| **Desktop** | **Up / Down Arrow Keys** | Simulates front/back phone tilt |
| **Desktop** | **Mouse Move** | Creates gentle localized air currents |
| **Desktop** | **Spacebar / Key 'L'** | Toggle light / extinguish |

---

## 🚀 Deployment on Vercel

1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/cosmickdd/diya.git
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import the `diya` repository.
4. Framework Preset: **Other** (Static HTML).
5. Click **Deploy**.

---

## 🛠️ Local Development

Open `index.html` directly in any modern browser, or run a local dev server:

```bash
npx serve .
```

---

## 📜 License

MIT License © 2026 cosmickdd
