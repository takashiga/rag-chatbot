const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    // 🔹 Step 1: クエリをベクトル化
    const embeddingResponse = await axios.post(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}/embeddings?api-version=${process.env.AZURE_OPENAI_API_VERSION}`,
      { input: userMessage },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.AZURE_OPENAI_API_KEY,
        },
      }
    );

    const queryVector = embeddingResponse.data.data[0].embedding;

    // 🔹 Step 2: Azure Search にベクトル検索クエリを送信
    const searchResponse = await axios.post(
      `${process.env.AZURE_SEARCH_ENDPOINT}/indexes/${process.env.AZURE_SEARCH_INDEX}/docs/search?api-version=2023-07-01-Preview`,
      {
        vector: {
          value: queryVector,
          fields: "embedding",
          k: 3,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.AZURE_SEARCH_API_KEY,
        },
      }
    );

    const topDocs = searchResponse.data.value
      .map((doc) => doc.content)
      .join("\n---\n");

    // 🔹 Step 3: GPT に検索結果とユーザーの質問を渡して応答生成
    const completionResponse = await axios.post(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_CHAT_DEPLOYMENT_NAME}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION}`,
      {
        messages: [
          {
            role: "system",
            content:
              "以下の情報を参考に、ユーザーの質問に日本語で自然に答えてください。",
          },
          {
            role: "user",
            content: `質問: ${userMessage}\n\n参考情報:\n${topDocs}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.AZURE_OPENAI_API_KEY,
        },
      }
    );

    const reply = completionResponse.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("❌ エラー:", error.response?.data || error.message);
    res.status(500).json({ error: "応答生成に失敗しました。" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
