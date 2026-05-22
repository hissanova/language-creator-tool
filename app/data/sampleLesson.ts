import type { Lesson } from "../types";

export const sampleLesson: Lesson = {
  title: "Chinese Conversation 01",
  audio: "/audio/sample.mp3",
  lines: [
    {
      speaker: "A",
      text: "你好，我正在学习中文。",
      translation: "Hello, I am studying Chinese.",
    },
    {
      speaker: "B",
      text: "很好！你学习多久了？",
      translation: "Great! How long have you been studying?",
    },
  ],
  dictionary: {
    你好: "hello",
    学习: "to study",
    中文: "Chinese language",
    很好: "very good",
    多久: "how long",
  },
};