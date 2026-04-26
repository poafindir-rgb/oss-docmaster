/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { OSSMeeting, GeneratedDocs, AIValidation } from "../types";

const GEMINI_API_KEY = "AIzaSyA1yKH1RweT4T0lF4O_vacPF9zx0Girq5Q";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_PROMPT = `Ты — высококвалифицированный юрист в сфере ЖКХ РФ и системный аналитик. Твоя задача — помогать в подготовке документов для Общего Собрания Собственников (ОСС).
Все ответы должны быть строго на русском языке в формате JSON.
Не выдумывай данные, которых нет в запросе. Если данных не хватает для генерации качественного текста, используй плейсхолдеры в фигурных скобках {}.
Твои документы должны соответствовать Жилищному кодексу РФ и приказу Минстроя №44/пр.`;

export async function generateOSSDocuments(meeting: OSSMeeting): Promise<GeneratedDocs> {
  const prompt = `Сгенерируй тексты документов для ОСС на основе следующих данных:
Дом: ${meeting.houseAddress}
Тип собрания: ${meeting.type}
Даты: с ${meeting.dateStart} по ${meeting.dateEnd}
Инициатор: ${meeting.initiator}
Повестка: ${JSON.stringify(meeting.agenda.map(a => ({ n: a.number, t: a.title, d: a.decisionText })))}

Нужно сгенерировать:
1. noticeHtml — Текст уведомления о проведении собрания.
2. ballotHtml — Шаблон бюллетеня (решения собственника).
3. minutesHtml — Текст протокола ОСС (заготовка).
4. attachmentsIndexHtml — Опись приложений.

Ответь строго валидным JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            noticeHtml: { type: Type.STRING },
            ballotHtml: { type: Type.STRING },
            minutesHtml: { type: Type.STRING },
            attachmentsIndexHtml: { type: Type.STRING },
          },
          required: ["noticeHtml", "ballotHtml", "minutesHtml", "attachmentsIndexHtml"],
        },
      },
    });

    return JSON.parse(response.text || "{}") as GeneratedDocs;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

export async function validateOSS(meeting: OSSMeeting): Promise<AIValidation> {
  const prompt = `Проверь комплектность и логическую целостность ОСС:
Повестка: ${JSON.stringify(meeting.agenda)}
Приложения: ${JSON.stringify(meeting.attachments)}
Данные: ${JSON.stringify({ type: meeting.type, start: meeting.dateStart, end: meeting.dateEnd, address: meeting.houseAddress })}

Проверь:
1. Соответствие вопросов повестки и необходимых приложений.
2. Логику дат (начало не должно быть позже конца).
3. Наличие обязательных полей.
4. Структурную целостность формулировок.

Верни JSON с полями status (ok|warning|error), errors (список {code, message, howToFix}), warnings, checks.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            errors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  message: { type: Type.STRING },
                  howToFix: { type: Type.STRING },
                },
              },
            },
            warnings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  message: { type: Type.STRING },
                  howToFix: { type: Type.STRING },
                },
              },
            },
            checks: {
              type: Type.OBJECT,
              properties: {
                requiredFieldsComplete: { type: Type.BOOLEAN },
                agendaBallotConsistency: { type: Type.BOOLEAN },
                minutesConsistency: { type: Type.BOOLEAN },
                quorumMathValid: { type: Type.BOOLEAN },
                attachmentsComplete: { type: Type.BOOLEAN },
              },
            },
          },
        },
      },
    });

    return JSON.parse(response.text || "{}") as AIValidation;
  } catch (error) {
    console.error("AI Validation Error:", error);
    throw error;
  }
}
