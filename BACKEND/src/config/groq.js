import Groq from "groq-sdk";
import { env } from "./env.js";

// tạo 1 instance( của Groq SDK với apiKey được lấy từ biến môi trường GROQ_API_KEY
const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export default groq;
