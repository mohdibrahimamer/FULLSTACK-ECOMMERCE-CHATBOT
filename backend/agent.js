// yeh file mien error solve  karo jaldi baad mien
// yeh file mien error solve  karo jaldi baad mien
// yeh file mien error solve  karo jaldi baad mien
// yeh file mien error solve  karo jaldi baad mien
// yeh file mien error solve  karo jaldi baad mien
// yeh file  ko acha karo
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
export const callAgent = async (client, threadId, query) => {
  try {
    const db = client.db("inventory_database");
    const collection = db.collection("items");
    const GraphState = Annotation.Root({
      messages: Annotation({
        reducer: (x, y) => x.concat(y),
      }),
    });

    // creating  custom tools for inventory
    const itemLookupTool = tool(
      async ({ query, n = 10 }) => {
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
          console.log(
            `vector search returned result: ${result.length} results`
          );

          if (result.length === 0) {
            console.log(
              "vector search returned no results, trying to search..."
            );

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

          return JSON.stringify({
            results: result,
            searchType: "vector",
            query: query,
            count: result.length,
          });
        } catch (error) {
          console.log("error in the lookup functionality", error.message);
          console.log("error details", {
            error: error.message,
            stack: error.stack,
            name: error.name,
          });

          return JSON.stringify({
            error: "failed to search inventory",
            details: error.message,
            query: query,
          });
        }
      },
      {
        // now we are going to defina "metadata" and generating "schema"
        name: "item_lookup",
        description:
          "gathers furniture  item details from the inventory database",
        schema: z.object({
          query: z.string().describe("the search query"),
          n: z.number().default(10).describe("the number of results to return"),
        }),
      }
    );
    //  writing an array of all the avaliable tools
    const tools = [itemLookupTool];
    const toolNode = new ToolNode(tools);

    // defining the model
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      temperature: 0,
      maxRetries: 0,
      apiKey: process.env.GOOGLE_API_KEY,
      // yaha per "binding' custom tools to the model
    }).bindTools(tools);

    // yaha per writing the decision function
    const shouldContinue = (state) => {
      const message = state.messages;
      const lastMessage = message[message.length - 1];

      if (lastMessage.tool_calls?.length) {
        return "tools";
      }
      return "__end__";
    };

    // this  function calls the ai  model with retry logic
    const callModel = (state) => {
      return retryWithBackoff(async () => {
        // defining our template
        const prompt = ChatPromptTemplate.fromMessages([
          [
            "system",
            `You are a helpful E-commerce Chatbot Agent for a furniture store. 

IMPORTANT: You have access to an item_lookup tool that searches the furniture inventory database. ALWAYS use this tool when customers ask about furniture items, even if the tool returns errors or empty results.

When using the item_lookup tool:
- If it returns results, provide helpful details about the furniture items
- If it returns an error or no results, acknowledge this and offer to help in other ways
- If the database appears to be empty, let the customer know that inventory might be being updated
 Current time: time`,
          ],
          // yaha per placeholder for conversational history
          new MessagesPlaceholder("messages"),
        ]);
        // filling the promopt template with actual values
        const formattedPrompt = await prompt.formatMessages({
          // yaha per putting the current time stamop
          time: new Date().toISOString(),
          messages: state.messages,
        });

        // calling the  ai model with formatted prompt
        const result = await model.invoke(formattedPrompt);
        // yaha per returning  the new state
        return { messages: [result] };
      });
    };

    // building the workflow graph
    const workflow = new StateGraph(GraphState)
      // yaha per  calling the model
      .addNode("agent", callModel)
      .addNode("tools", toolNode) // yaha per tool execution node
      .addNode("__start__", "agent") // yaha per agent decides start
      .addConditionalEdges("agent", shouldContinue) // yaha per going back to the agent
      .addEdge("tools", "agent");

    // yha per intialize conversation and state persistent
    const checkpointer = new MongoDBSaver({ client, dbName });
    // compiling the  workflow
    const app = workflow.compile({ checkpointer });

    // executing the workflow
    const finalState = await app.invoke(
      {
        messages: [new HumanMessage(query)],
      },
      {
        recursionLimit: 15,
        configurable: { thread_id: threadId },
      }
    );
    // extractingt the final  response from the conversation
    const response =
      finalState.messages[finalState.messages.length - 1].content;
    console.log("agent response", response);
    return response;
  } catch (error) {
    console.log("error  conversation", error.message);
    console.log("check callAgent functionality");
    if (error.status === 429) {
      throw new Error(
        "rate limit error hit service unavailable try after 30 seconds"
      );
    } else if (error.status === 401) {
      throw new Error(
        "authentication failed please check your api configuration"
      );
    } else {
      throw new Error(`agent failed ${error.message}`);
    }
  }
};
