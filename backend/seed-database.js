// yaha per "chatgooglegenerativeai"  "googleGenerativeAIEmbbedding" use karey
import {
  ChatGoogleGenerativeAI,
  googleGenerativeAIEmbedding,
} from "@langchain/google-genai";
// yaha per google ka "gemini" use karey
// agar ap open ai ka model se embadding  nai kar sakte
// "embeeding" use for comparing similarity between the  words in the prompt given by the user
//"chat googlegenerativeai" use karey means general chat by  the user
import { structuredOutputParser } from "langchain/output_parsers";
import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { z } from "zod";
import dotenv from "dotenv";

const client = new MongoClient(process.env.MONGO_URL);

// yaha per "llm" k naamse variable create karey
// yaha per ek new chat banarey agent k liye
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  // yaha per "temperature" means creativity 0.7 means medium creative
  temperature: 0.7,
  apiKey: process.env.GOOGLE_API_KEY,
});

// similar jaisa moongoose ka schema banate thae
// yaha per "schema" banarey "zod" ka use karke
const itemSchema = z.object({
  item_id: z.string(),
  item_name: z.string(),
  item_description: z.string(),
  brand: z.string(),
  manufacturer_address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string(),
  }),
  image: z.string(),
  prices: z.object({
    full_price: z.number(),
    sale_price: z.number(),
  }),
  //   category tag like antique , modern , vintage etc ka matlab hoga
  categories: z.array(z.string()),
  //   yaha per user reviews k liye object dalrey
  user_reviews: z.array(
    z.object({
      review_date: z.string(),
      rating: z.number(),
      comment: z.string(),
    })
  ),

  notes: z.string(),
});

// parser means  "Ai o/p" matches se our "itemSchema"
const parser = structuredOutputParser.fromZodSchema(z.array(itemSchema));

// yaha  per "setupdatabaseandcollection" functionality likhre
const setupDatabaseAndCollection = async () => {
  console.log("setting up database and collection...");
  // yaha per  client ka reference karey
  // yaha per "db" k naam se variable  banaye aur "inventory  database" naam rakhe
  const db = client.db("inventory_database");
  const collections = await db.listCollections({ name: "items" }).toArray();

  if (collections.length === 0) {
    // yaha per "items" k naam se collection banaye
    await db.createCollection("items");
    console.log("created items collection in inventory database...");
  } else {
    console.log("collection already exists in inventory database...");
  }
};
