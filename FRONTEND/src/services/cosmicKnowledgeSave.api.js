import api from './api.js';

export async function getSavedCosmicKnowledge() {
  const { data } = await api.get('/cosmic-knowledge-notes/saved');
  // server: { success, data: { slugs: [...] } }
  return data;
}

export async function saveCosmicKnowledge(slug) {
  const { data } = await api.post(`/cosmic-knowledge-notes/${slug}/save`);
  return data;
}

export async function unsaveCosmicKnowledge(slug) {
  const { data } = await api.delete(`/cosmic-knowledge-notes/${slug}/save`);
  return data;
}

