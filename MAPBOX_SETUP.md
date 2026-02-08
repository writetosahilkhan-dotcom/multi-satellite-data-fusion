# 🗺️ Mapbox Integration Guide

## Quick Setup

### 1. Get Your Free Mapbox Token

1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Sign up for a free account (if you don't have one)
3. Navigate to **Access Tokens** page
4. Click **Create a token** or copy your default public token
5. Copy the token (starts with `pk.`)

### 2. Add Token to Your Project

Open `/frontend/.env` and add your token:

```bash
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNscXh5ejFyZjBhNm0yanBjbnl6cjN4eWoifQ.example
```

### 3. Restart the Frontend

```bash
cd /Users/Sahil/Desktop/All/unified-satellite-dashboard
pkill -f "vite"
bash ./start-frontend.sh
```

The dashboard will now use **real Mapbox satellite imagery**!

---

## Map Styles Available

Once Mapbox is configured, you can switch between:

- **Satellite** - High-resolution satellite imagery with streets overlay
- **Dark** - Dark theme perfect for nighttime monitoring
- **Streets** - Detailed street map view
- **Outdoors** - Terrain and topographic features

Use the style switcher in the top-left corner of the map.

---

## Pricing & Limits

- **Free Tier**: 50,000 map loads/month
- **Map Load**: Each time the map displays = 1 load
- **Typical Usage**: ~1,500-3,000 loads/day for active monitoring

### Monitor Your Usage
- [Mapbox Statistics Dashboard](https://account.mapbox.com/statistics/)

---

## Fallback Mode

If no Mapbox token is provided, the dashboard automatically falls back to **OpenStreetMap** tiles (free, no signup required).

---

## Features with Mapbox

✅ **High-Resolution Satellite Imagery**
- Real satellite photos updated regularly
- Street overlays for context
- Global coverage

✅ **Multiple Map Styles**
- Switch between 4 different map views
- Optimized for different use cases

✅ **Better Performance**
- Faster tile loading
- CDN-powered delivery
- Retina display support

✅ **Accurate Satellite Tracking**
- Precise position overlay
- Smooth animations
- Real-time sync with satellite data

---

## Troubleshooting

### Map Shows OpenStreetMap Instead of Mapbox

1. Check your `.env` file has the token
2. Ensure token starts with `pk.`
3. Restart the frontend server
4. Check browser console for errors

### "Unauthorized" Error

- Your token may be invalid or restricted
- Generate a new token at Mapbox dashboard
- Ensure public token scopes are enabled

### Maps Not Loading

- Check internet connection
- Verify Mapbox services status: [https://status.mapbox.com/](https://status.mapbox.com/)
- Try clearing browser cache

---

## Advanced Configuration

### Custom Map Styles

You can create custom map styles at [Mapbox Studio](https://studio.mapbox.com/) and add them to the component:

```typescript
const mapStyles = {
  // ... existing styles
  custom: `https://api.mapbox.com/styles/v1/YOUR_USERNAME/YOUR_STYLE_ID/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
};
```

### Restrict Token (Recommended for Production)

1. Go to your token settings
2. Add **URL restrictions**: `http://localhost:3000/*`, `https://yourdomain.com/*`
3. Save changes

This prevents unauthorized use of your token.

---

## Support

- [Mapbox Documentation](https://docs.mapbox.com/)
- [Leaflet with Mapbox](https://docs.mapbox.com/help/tutorials/use-mapbox-gl-js-with-react/)
- [Token Management](https://docs.mapbox.com/help/how-mapbox-works/access-tokens/)
