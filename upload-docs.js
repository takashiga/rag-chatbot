const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

// 環境変数の読み込み
const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const SEARCH_API_KEY = process.env.AZURE_SEARCH_API_KEY;
const SEARCH_INDEX = process.env.AZURE_SEARCH_INDEX;

const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const EMBEDDING_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME;
const OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

const folderPath = path.join(__dirname, "docs", "ikoralove");
const files = fs.readdirSync(folderPath);

(async () => {
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(folderPath, filename);
    const content = fs.readFileSync(filePath, "utf-8");

    // 🔹 Step 1: ベクトル生成
    const embeddingResponse = await axios.post(
      `${OPENAI_ENDPOINT}/openai/deployments/${EMBEDDING_DEPLOYMENT}/embeddings?api-version=${OPENAI_API_VERSION}`,
      { input: content },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": OPENAI_API_KEY,
        },
      }
    );

    const vector = embeddingResponse.data.data[0].embedding;

    // 🔹 Step 2: ドキュメント構造
    const doc = {
      id: `ikoralove_${i + 1}`,
      content: content,
      embedding: vector,
    };

    // 🔹 Step 3: Azure Search に登録
    await axios.post(
      `${SEARCH_ENDPOINT}/indexes/${SEARCH_INDEX}/docs/index?api-version=2023-07-01-Preview`,
      { value: [doc] },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": SEARCH_API_KEY,
        },
      }
    );

    console.log(`✅ 登録完了: ${filename}`);
  }
})();
