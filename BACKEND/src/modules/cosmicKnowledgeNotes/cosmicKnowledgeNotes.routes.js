import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  getCosmicKnowledgeNotes,
  getSavedCosmicKnowledgeNotes,
  saveCosmicKnowledgeNoteBySlug,
  unsaveCosmicKnowledgeNoteBySlug,
} from './cosmicKnowledgeNotes.controller.js';

const router = Router();

router.get('/', getCosmicKnowledgeNotes);

// Saved cosmic knowledge (protected)
router.get('/saved', authenticate, getSavedCosmicKnowledgeNotes);
router.post('/:slug/save', authenticate, saveCosmicKnowledgeNoteBySlug);
router.delete('/:slug/save', authenticate, unsaveCosmicKnowledgeNoteBySlug);

export default router;


