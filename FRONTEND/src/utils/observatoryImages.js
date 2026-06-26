const DEFAULT_OBSERVATORY_IMAGE =
  "https://images.unsplash.com/photo-1620589105774-b057272eff2c?auto=format&fit=crop&w=1400&q=85";

const OBSERVATORY_IMAGES = {
  "nha-trang-observatory":
    "https://images.unsplash.com/photo-1620589105774-b057272eff2c?auto=format&fit=crop&w=1400&q=85",
  "paranal-observatory":
    "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1400&q=85",
  "la-silla-observatory":
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",
  "alma-observatory":
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",
  "royal-observatory-greenwich":
    "https://images.unsplash.com/photo-1488866022504-f2584929ca5f?auto=format&fit=crop&w=1400&q=85",
  "wm-keck-observatory":
    "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&w=1400&q=85",
  "cuc-phuong-stargazing-site":
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85",
  "bach-ma-stargazing-site":
    "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&w=1400&q=85",
  "bidoup-nui-ba-stargazing-site":
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",
  "phuoc-binh-stargazing-site":
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85",
  "ba-vi-stargazing-site":
    "https://images.unsplash.com/photo-1488866022504-f2584929ca5f?auto=format&fit=crop&w=1400&q=85",
};

export function getObservatoryImage(site) {
  return OBSERVATORY_IMAGES[site?.slug] || site?.imageUrl || DEFAULT_OBSERVATORY_IMAGE;
}
