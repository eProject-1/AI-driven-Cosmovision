import bcrypt from "bcryptjs";
import prisma from "../../config/db.js";
import { signToken } from "../../utils/jwt.util.js";

const toAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  name: user.displayName || user.username,
  displayName: user.displayName,
  role: user.role,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
});

const makeUsername = async (email) => {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_") || "user";
  let username = base;
  let index = 1;

  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}_${index}`;
    index += 1;
  }

  return username;
};

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw Object.assign(new Error("Email already exists"), { statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      username: await makeUsername(email),
      passwordHash,
      displayName: name,
      isVerified: true,
      profile: { create: {} },
      preferences: { create: {} },
    },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user: toAuthUser(user), token };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  const isValidPassword = user?.passwordHash && await bcrypt.compare(password, user.passwordHash);

  if (!user || !isValidPassword) {
    throw Object.assign(new Error("Email or password is incorrect"), { statusCode: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user: toAuthUser(user), token };
};

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    },
  });

  return user ? toAuthUser(user) : null;
};
