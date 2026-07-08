import prisma from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.util.js';
import { AppError } from '../../utils/AppError.js';

const cosmicNoteSlugSelect = {
  id: true,
  slug: true,
};

async function getCosmicKnowledgeNotes(req, res) {
  const notes = await prisma.cosmicKnowledgeNote.findMany({
    where: { isVisible: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      subtitle: true,
      body: true,
      imageUrl: true,
      detailIntro: true,
      galleryImages: true,
      keyFacts: true,
      timeline: true,
      interestingFact: true,
      displayOrder: true,
      ctaLabel: true,
    },
  });

  return res.json({
    success: true,
    items: notes,
  });
}

const getSavedCosmicKnowledgeNotes = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError('Unauthorized', 401);

  const saved = await prisma.savedCosmicKnowledgeNote.findMany({
    where: { userId },
    select: {
      cosmicKnowledgeNote: {
        select: { slug: true },
      },
    },
    orderBy: { savedAt: 'desc' },
  });

  const slugs = saved.map((x) => x.cosmicKnowledgeNote.slug);
  return sendSuccess(res, { slugs }, 'Saved cosmic knowledge fetched successfully');
});

const saveCosmicKnowledgeNoteBySlug = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError('Unauthorized', 401);

  const { slug } = req.params;
  const note = await prisma.cosmicKnowledgeNote.findUnique({
    where: { slug },
    select: cosmicNoteSlugSelect,
  });

  if (!note) throw new AppError('Cosmic knowledge note not found', 404);

  const existing = await prisma.savedCosmicKnowledgeNote.findUnique({
    where: {
      userId_cosmicKnowledgeNoteId: {
        userId,
        cosmicKnowledgeNoteId: note.id,
      },
    },
  }).catch(() => null);

  if (existing) {
    return sendSuccess(res, { saved: true, slug }, 'Cosmic knowledge already saved');
  }

  await prisma.savedCosmicKnowledgeNote.create({
    data: {
      userId,
      cosmicKnowledgeNoteId: note.id,
    },
  });

  return sendSuccess(res, { saved: true, slug }, 'Cosmic knowledge saved successfully');
});

const unsaveCosmicKnowledgeNoteBySlug = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError('Unauthorized', 401);

  const { slug } = req.params;
  const note = await prisma.cosmicKnowledgeNote.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!note) throw new AppError('Cosmic knowledge note not found', 404);

  const existing = await prisma.savedCosmicKnowledgeNote.findUnique({
    where: {
      userId_cosmicKnowledgeNoteId: {
        userId,
        cosmicKnowledgeNoteId: note.id,
      },
    },
  }).catch(() => null);

  if (!existing) {
    return sendSuccess(res, { saved: false, slug }, 'Cosmic knowledge already removed');
  }

  await prisma.savedCosmicKnowledgeNote.delete({
    where: {
      userId_cosmicKnowledgeNoteId: {
        userId,
        cosmicKnowledgeNoteId: note.id,
      },
    },
  });

  return sendSuccess(res, { saved: false, slug }, 'Cosmic knowledge removed successfully');
});

export {
  getCosmicKnowledgeNotes,
  getSavedCosmicKnowledgeNotes,
  saveCosmicKnowledgeNoteBySlug,
  unsaveCosmicKnowledgeNoteBySlug,
};


