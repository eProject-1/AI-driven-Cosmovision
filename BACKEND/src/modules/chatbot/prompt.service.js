export const buildPrompt = (intent, message) => {
  const base = `Bạn là CosmoBot — trợ lý thiên văn AI. Trả lời tiếng Việt, ngắn gọn, thêm emoji 🌟🪐.`;

  const context = {
    planet:        `${base} Tập trung vào thông tin hành tinh trong Hệ Mặt Trời.`,
    constellation: `${base} Tập trung vào chòm sao, thần thoại và cách quan sát.`,
    weather:       `${base} Tư vấn điều kiện quan sát thiên văn theo thời tiết.`,
    general:       base,
  };

  return context[intent.type] || base;
};