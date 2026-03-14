import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

let openai;
function getOpenAI() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export async function scanReceipt(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Look at this receipt image and extract the following information. Return ONLY a JSON object with these fields:
- "vendor": the store or business name (string)
- "date": the date on the receipt in YYYY-MM-DD format (string)
- "amount": the total amount paid as a number (no dollar sign)

If you cannot find a field, use null. Only return the JSON object, nothing else.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 200,
  });

  const text = response.choices[0].message.content.trim();

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      vendor: parsed.vendor || null,
      date: parsed.date || null,
      amount: parsed.amount ? parseFloat(parsed.amount) : null,
      rawText: text,
    };
  } catch {
    return {
      vendor: null,
      date: null,
      amount: null,
      rawText: text,
    };
  }
}
