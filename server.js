require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());
app.use(express.static("public"));

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    // Step 1: Azure Cognitive Searchで関連文書を取得
    const searchResponse = await axios.post(
      `${process.env.AZURE_SEARCH_ENDPOINT}/indexes/${process.env.AZURE_SEARCH_INDEX}/docs/search?api-version=2023-07-01-Preview`,
      {
        search: userMessage,
        top: 3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.AZURE_SEARCH_API_KEY,
        },
      }
    );

    const hits = searchResponse.data.value
      .map((doc) => `【${doc.name}】\n${doc.content}`)
      .join("\n---\n");

    // Step 2: GPTに検索結果を渡して応答生成
    const gptResponse = await axios.post(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION}`,
      {
        messages: [
          {
            role: "system",
            content:
              "以下は参考文書です。これを元にユーザーの質問に答えてください。\n" +
              hits,
          },
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.AZURE_OPENAI_API_KEY,
        },
      }
    );

    const reply = gptResponse.data.choices[0].message.content;
    res.send({ reply });
  } catch (error) {
    console.error("❌ エラー:", error.response?.data || error.message);
    res.status(500).send({ error: "RAG応答生成に失敗しました" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 RAGチャットボット起動中 → http://localhost:${port}`);
});
