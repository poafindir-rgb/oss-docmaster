/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OSSMeeting, GeneratedDocs, AIValidation } from "../types";

const BACKEND_URL = "https://oss-docmaster-backend.vercel.app/api/analyze";

const SYSTEM_PROMPT = `
Ты — высококвалифицированный юрист в сфере ЖКХ РФ и системный аналитик.
Твоя задача — помогать в подготовке документов для Общего Собрания Собственников (ОСС).

Все ответы должны быть строго на русском языке в формате JSON.
Не выдумывай данные, которых нет в запросе.
Если данных не хватает для генерации качественного текста, используй плейсхолдеры в фигурных скобках {}.
Документы должны соответствовать Жилищному кодексу РФ и приказу Минстроя №44/пр.

Ответ всегда возвращай строго валидным JSON без markdown, без пояснений и без блока \`\`\`json.
`;

async function callOpenAIBackend(prompt: string): Promise<string> {
  const response = await fetch(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Backend error:", errorText);
    throw new Error("Ошибка backend AI");
  }

  const data = await response.json();
  return data.text || "";
}

function parseJsonFromText(text: string): any {
  const cleanText = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanText);
  } catch (error) {
    const match = cleanText.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error("Не найден JSON в ответе AI:", cleanText);
      throw error;
    }

    return JSON.parse(match[0]);
  }
}

export async function generateOSSDocuments(
  meeting: OSSMeeting
): Promise<GeneratedDocs> {
  const prompt = `
Сгенерируй тексты документов для общего собрания собственников на основе следующих данных.

Данные ОСС:
${JSON.stringify(
  {
    id: meeting.id,
    houseAddress: meeting.houseAddress,
    type: meeting.type,
    dateStart: meeting.dateStart,
    dateEnd: meeting.dateEnd,
    location: meeting.location,
    initiator: meeting.initiator,
    secretary: meeting.secretary,
    chairperson: meeting.chairperson,
    status: meeting.status,
    agenda: meeting.agenda,
    owners: meeting.owners,
    attachments: meeting.attachments,
  },
  null,
  2
)}

Нужно сгенерировать:

1. noticeHtml — текст уведомления о проведении ОСС.
2. ballotHtml — шаблон бюллетеня / решения собственника.
3. minutesHtml — заготовку протокола ОСС.
4. attachmentsIndexHtml — опись приложений.

Требования:
- HTML должен быть готов для отображения в интерфейсе.
- Используй теги div, h2, h3, p, ul, li, table, tr, td, th.
- Не используй внешние CSS-файлы и скрипты.
- Не придумывай отсутствующие данные.
- Если данных не хватает, используй плейсхолдеры вида {указать дату}, {указать место}, {указать ФИО}.
- Для каждого вопроса повестки добавь формулировку решения.
- В бюллетене должны быть варианты голосования: За / Против / Воздержался.
- В протоколе должны быть блоки: сведения о собрании, повестка, итоги голосования, решения, подписи.

Верни строго валидный JSON без markdown и без пояснений:

{
  "noticeHtml": "<div>...</div>",
  "ballotHtml": "<div>...</div>",
  "minutesHtml": "<div>...</div>",
  "attachmentsIndexHtml": "<div>...</div>"
}
`;

  try {
    const resultText = await callOpenAIBackend(prompt);
    const result = parseJsonFromText(resultText);

    return {
      noticeHtml: result.noticeHtml || "",
      ballotHtml: result.ballotHtml || "",
      minutesHtml: result.minutesHtml || "",
      attachmentsIndexHtml: result.attachmentsIndexHtml || "",
      agendaItems: meeting.agenda,
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

export async function validateOSS(
  meeting: OSSMeeting
): Promise<AIValidation> {
  const prompt = `
Проверь комплектность и логическую целостность документов ОСС.

Данные ОСС:
${JSON.stringify(
  {
    id: meeting.id,
    houseAddress: meeting.houseAddress,
    type: meeting.type,
    dateStart: meeting.dateStart,
    dateEnd: meeting.dateEnd,
    location: meeting.location,
    initiator: meeting.initiator,
    secretary: meeting.secretary,
    chairperson: meeting.chairperson,
    status: meeting.status,
    agenda: meeting.agenda,
    ownersCount: meeting.owners.length,
    owners: meeting.owners,
    attachments: meeting.attachments,
  },
  null,
  2
)}

Проверь:

1. Заполнены ли обязательные поля.
2. Корректна ли логика дат.
3. Соответствует ли повестка бюллетеням и протоколу.
4. Есть ли приложения, необходимые для вопросов повестки.
5. Есть ли риски по кворуму и математике долей.
6. Есть ли противоречия в формулировках решений.
7. Достаточно ли данных для подготовки уведомления, бюллетеня, протокола и описи.

Верни строго валидный JSON без markdown и без пояснений:

{
  "status": "ok|warning|error",
  "errors": [
    {
      "code": "string",
      "message": "string",
      "howToFix": "string"
    }
  ],
  "warnings": [
    {
      "code": "string",
      "message": "string",
      "howToFix": "string"
    }
  ],
  "checks": {
    "requiredFieldsComplete": true,
    "agendaBallotConsistency": true,
    "minutesConsistency": true,
    "quorumMathValid": true,
    "attachmentsComplete": true
  }
}
`;

  try {
    const resultText = await callOpenAIBackend(prompt);
    const result = parseJsonFromText(resultText);

    return {
      status: result.status || "warning",
      errors: Array.isArray(result.errors) ? result.errors : [],
      warnings: Array.isArray(result.warnings) ? result.warnings : [],
      checks: {
        requiredFieldsComplete: Boolean(result.checks?.requiredFieldsComplete),
        agendaBallotConsistency: Boolean(result.checks?.agendaBallotConsistency),
        minutesConsistency: Boolean(result.checks?.minutesConsistency),
        quorumMathValid: Boolean(result.checks?.quorumMathValid),
        attachmentsComplete: Boolean(result.checks?.attachmentsComplete),
      },
    };
  } catch (error) {
    console.error("AI Validation Error:", error);
    throw error;
  }
}
