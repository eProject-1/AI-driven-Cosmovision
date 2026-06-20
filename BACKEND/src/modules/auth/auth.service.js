// auth.service.js
import bcrypt from "bcryptjs";
import prisma from "../../config/db.js";
import { signToken } from "../../utils/jwt.util.js";
import { AppError } from "../../utils/AppError.js";

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
  const base =
    email
      .split("@")[0]
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_]/g, "_") || "user";

  const existingUsers = await prisma.user.findMany({
    where: {
      OR: [
        { username: base },
        { username: { startsWith: `${base}_` } },
      ],
    },
    select: { username: true },
  });

  const usernameSet = new Set(existingUsers.map((u) => u.username));
  if (!usernameSet.has(base)) return base;

  let index = 1;
  while (usernameSet.has(`${base}_${index}`)) index++;
  return `${base}_${index}`;
};

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("Email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username: await makeUsername(email),
        passwordHash,
        displayName: name,
        isVerified: false,
        profile: { create: {} },
        preferences: { create: {} },
      },
    });

    const token = signToken({ userId: user.id, role: user.role });
    return { user: toAuthUser(user), token };
  } catch (err) {
    if (err.code === "P2002") {
      throw new AppError("Email already exists", 409);
    }
    throw err;
  }
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  const isValidPassword =
    user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));

  if (!user || !isValidPassword) {
    throw new AppError("Email or password is incorrect", 401);
  }

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