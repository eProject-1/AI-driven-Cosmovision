import api from './api.js';

export async function getCosmicKnowledgeNotes() {
  const res = await api.get('/cosmic-knowledge-notes');
  return res.data;
}

