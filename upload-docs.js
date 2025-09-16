require("dotenv").config();
const axios = require("axios");

// 環境変数から設定を読み込む
const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
const indexName = process.env.AZURE_SEARCH_INDEX;
const apiKey = process.env.AZURE_SEARCH_API_KEY;

// 登録する文書（自由に追加OK）
const documents = [
  {
    id: "doc001",
    name: "Azure Cognitive Searchとは？",
    content:
      "Azure Cognitive Searchは、構造化および非構造化データに対して強力な検索機能を提供するクラウドサービスです。",
  },
  {
    id: "doc002",
    name: "OpenAIの使い方",
    content: "Azure OpenAIを使えば、GPTモデルをAPI経由で安全に利用できます。",
  },
  {
    id: "doc003",
    name: "RAGとは？",
    content:
      "RAG（検索拡張生成）は、検索結果をもとに生成AIが回答する手法です。",
  },
];

async function uploadDocuments() {
  try {
    const response = await axios.post(
      `${endpoint}/indexes/${indexName}/docs/index?api-version=2023-07-01-Preview`,
      { value: documents },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      }
    );
    console.log("✅ 文書登録完了:", response.data);
  } catch (error) {
    console.error("❌ 文書登録失敗:", error.response?.data || error.message);
  }
}

uploadDocuments();
