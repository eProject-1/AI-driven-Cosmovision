import { getData, postData } from "./api.js";

export const login = (email, password) => postData("/auth/login", { email, password });

export const register = (name, email, password) => postData("/auth/register", { name, email, password });

export const verifyEmail = (token) => postData("/auth/verify-email", { token });

export const resendVerification = (email) => postData("/auth/resend-verification", { email });

export const getMe = () => getData("/auth/me");
