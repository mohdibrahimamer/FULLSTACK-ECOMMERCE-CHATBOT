import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";

// yeh package conversation k liyye use hota hai
import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";

// yeh package structured prompts create karta placeholders k saath
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

// yeh package "StateGraph" state based workflow banane mien help karta hai
import { StateGraph, Annotation } from "@langchain/langgraph";

// yeh package  custom tools banata
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// yeh package for saving conversation state
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

// yeh package vector search integration
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";

import { MongoClient } from "mongodb";
import { z } from "zod";
import "dotenv/config";
import e from "cors";

const client = new MongoClient(process.env.MONGO_URL);

// yaha per ratelimiting k liye ek function likhre
export const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
    } catch (error) {
      console.log("error", error.message);
      console.log("check retryWithBackoff functionality");
      if (error.status === 429 && attempt < maxRetries) {
        // creating a delay yaha per
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        console.log(`rate limit hit retrying after ${delay / 1000}seconds`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      // if the limits are over
      throw error;
    }
  }
  throw new Error("Rate limit exceeded");
};

// yaha per writing the main function is "callAgent"
export const callAgent = async (client, threadId) => {
  try {
    const db = client.db("inventory_database");
    const collection = db.collection("items");
    const GraphState = Annotation.Root({
      messages: Annotation({
        reducer: (x, y) => x.concat(y),
      }),
    });

    // creating  custom tools for inventory
    const itemLookupTool = tool(async ({ query, n = 10 }) => {
      // mongodb mien 10 items to look through
      try {
        console.log("Item lookup tool called with query:", query);
        const totalCount = await collection.countDocuments();
        console.log("total documents in collection", totalCount);

        if (totalCount === 0) {
          console.log("empty collections in mongodb database");
          return JSON.stringify({
            error: "no collections in mongodb database",
            message: "the inventory appears to be empty",
            count: 0,
          });
        }
        // finding sample documents for debugging purpose
        const sampleDocuments = await collection.find({}).limit(3).toArray();
        console.log("sampleDocuments", sampleDocuments);

        const dbConfig = {
          collection: collection,
          indexName: "vector_index",
          textKey: "embedding_text",
          embeddingKey: "embedding",
        };

        // yaha per searching the vector
        const vectorSearch = new MongoDBAtlasVectorSearch(
          new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "text-embedding-004",
          }),
          dbConfig
        );

        console.log("performing vector search");
        // performing vector search in similarity operation
        const result = await vectorSearch.similaritySearch(query, n);
        console.log(`vector search returned result: ${result.length} results`);

        if (result.length === 0) {
          console.log("vector search returned no results, trying to search...");

          const textResults = await collection
            .find({
              $or: [
                // OR condition - match any of these fields
                { item_name: { $regex: query, $options: "i" } }, // Case-insensitive search in item name
                { item_description: { $regex: query, $options: "i" } }, // Case-insensitive search in description
                { categories: { $regex: query, $options: "i" } }, // Case-insensitive search in categories
                { embedding_text: { $regex: query, $options: "i" } }, // Case-insensitive search in embedding text
              ],
            })
            .limit(n)
            .toArray();
          // Limit results and convert to array
          console.log(
            `text search returned result: ${textResults.length} results`
          );

          return JSON.stringify({
            results: textResults,
            searchType: "text",
            query: query,
            count: textResults.length,
          });
        }
      } catch (error) {
        console.log("error", error.message);
      }
    });
  } catch (error) {
    console.log("error starting conversation", error.message);
    console.log("check callAgent functionality");
  }
};
