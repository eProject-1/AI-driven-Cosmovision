/**
 * analytics.service.js
 * - Tổng hợp dữ liệu cho dashboard analytics.
 * - Thống kê user, planet, chatbot, request, recommendation.
 * - Viết an toàn để không crash nếu Prisma chưa có đủ model.
 */

const prisma = require("../../config/db");

async function safeCount(modelName, where = {}) {
  try {
    if (!prisma[modelName]) {
      return 0;
    }

    return await prisma[modelName].count({ where });
  } catch (error) {
    console.error(`Analytics count ${modelName} error:`, error.message);
    return 0;
  }
}

async function getOverviewStats() {
  try {
    const [
      totalUsers,
      totalPlanets,
      totalChatMessages,
      totalRecommendations,
      totalFavorites,
    ] = await Promise.all([
      safeCount("user"),
      safeCount("planet"),
      safeCount("chatMessage"),
      safeCount("recommendation"),
      safeCount("favorite"),
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        totalPlanets,
        totalChatMessages,
        totalRecommendations,
        totalFavorites,
      },
    };
  } catch (error) {
    console.error("Get overview stats error:", error.message);

    return {
      success: false,
      message: "Failed to get overview statistics.",
      error: error.message,
    };
  }
}

async function getUserGrowthStats(days = 7) {
  try {
    if (!prisma.user) {
      return {
        success: true,
        data: [],
      };
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: fromDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const grouped = {};

    users.forEach((user) => {
      const date = user.createdAt.toISOString().split("T")[0];

      if (!grouped[date]) {
        grouped[date] = 0;
      }

      grouped[date] += 1;
    });

    const data = Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Get user growth stats error:", error.message);

    return {
      success: false,
      message: "Failed to get user growth statistics.",
      error: error.message,
    };
  }
}

async function getChatAnalytics(days = 7) {
  try {
    if (!prisma.chatMessage) {
      return {
        success: true,
        data: {
          totalMessages: 0,
          userMessages: 0,
          assistantMessages: 0,
          messagesByDate: [],
        },
      };
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const messages = await prisma.chatMessage.findMany({
      where: {
        createdAt: {
          gte: fromDate,
        },
      },
      select: {
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const messagesByDateMap = {};

    let userMessages = 0;
    let assistantMessages = 0;

    messages.forEach((message) => {
      const date = message.createdAt.toISOString().split("T")[0];

      if (!messagesByDateMap[date]) {
        messagesByDateMap[date] = {
          date,
          total: 0,
          user: 0,
          assistant: 0,
        };
      }

      messagesByDateMap[date].total += 1;

      if (message.role === "user") {
        userMessages += 1;
        messagesByDateMap[date].user += 1;
      }

      if (message.role === "assistant") {
        assistantMessages += 1;
        messagesByDateMap[date].assistant += 1;
      }
    });

    return {
      success: true,
      data: {
        totalMessages: messages.length,
        userMessages,
        assistantMessages,
        messagesByDate: Object.values(messagesByDateMap),
      },
    };
  } catch (error) {
    console.error("Get chat analytics error:", error.message);

    return {
      success: false,
      message: "Failed to get chat analytics.",
      error: error.message,
    };
  }
}

async function getPopularPlanets(limit = 5) {
  try {
    if (!prisma.planet) {
      return {
        success: true,
        data: [],
      };
    }

    /**
     * Nếu schema có relation favorite/view thì có thể orderBy _count.
     * Bản dưới đây dùng findMany đơn giản để tránh lỗi schema.
     */
    const planets = await prisma.planet.findMany({
      take: limit,
    });

    return {
      success: true,
      data: planets,
    };
  } catch (error) {
    console.error("Get popular planets error:", error.message);

    return {
      success: false,
      message: "Failed to get popular planets.",
      error: error.message,
    };
  }
}

async function getRecentActivities(limit = 10) {
  try {
    const activities = [];

    if (prisma.user) {
      const recentUsers = await prisma.user.findMany({
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      recentUsers.forEach((user) => {
        activities.push({
          type: "user_registered",
          title: "New user registered",
          description: user.email || user.name || user.id,
          createdAt: user.createdAt,
        });
      });
    }

    if (prisma.chatMessage) {
      const recentChats = await prisma.chatMessage.findMany({
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      });

      recentChats.forEach((chat) => {
        activities.push({
          type: "chat_message",
          title: `New ${chat.role} message`,
          description:
            chat.content.length > 80
              ? `${chat.content.slice(0, 80)}...`
              : chat.content,
          createdAt: chat.createdAt,
        });
      });
    }

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      success: true,
      data: activities.slice(0, limit),
    };
  } catch (error) {
    console.error("Get recent activities error:", error.message);

    return {
      success: false,
      message: "Failed to get recent activities.",
      error: error.message,
    };
  }
}

async function getDashboardAnalytics() {
  try {
    const [overview, userGrowth, chatAnalytics, popularPlanets, recentActivities] =
      await Promise.all([
        getOverviewStats(),
        getUserGrowthStats(7),
        getChatAnalytics(7),
        getPopularPlanets(5),
        getRecentActivities(10),
      ]);

    return {
      success: true,
      data: {
        overview: overview.data,
        userGrowth: userGrowth.data,
        chatAnalytics: chatAnalytics.data,
        popularPlanets: popularPlanets.data,
        recentActivities: recentActivities.data,
      },
    };
  } catch (error) {
    console.error("Get dashboard analytics error:", error.message);

    return {
      success: false,
      message: "Failed to get dashboard analytics.",
      error: error.message,
    };
  }
}

module.exports = {
  getOverviewStats,
  getUserGrowthStats,
  getChatAnalytics,
  getPopularPlanets,
  getRecentActivities,
  getDashboardAnalytics,
};
