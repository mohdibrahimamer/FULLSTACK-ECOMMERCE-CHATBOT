// Import Google's Gemini chat model and embeddings for AI text generation and vector creation
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
// Import structured output parser to ensure AI returns data in specific format
import { StructuredOutputParser } from "@langchain/core/output_parsers"
// Import MongoDB client for database connection
import { MongoClient } from "mongodb"
// Import MongoDB Atlas vector search for storing and searching embeddings
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb"
// Import Zod for data schema validation and type safety
import { z } from "zod"
// Load environment variables from .env file (API keys, connection strings)
import "dotenv/config"

// Create MongoDB client instance using connection string from environment variables
const client = new MongoClient(process.env.MONGO_URL)

// Initialize Google Gemini chat model for generating synthetic furniture data
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",            // Use Gemini 1.5 Flash model
  temperature: 0.7,                     // Set creativity level
  apiKey: process.env.GOOGLE_API_KEY,   // Google API key from environment variables
})

// Define schema for furniture item structure using Zod validation
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
  prices: z.object({
    full_price: z.number(),
    sale_price: z.number(),
  }),
  categories: z.array(z.string()),
  user_reviews: z.array(
    z.object({
      review_date: z.string(),
      rating: z.number(),
      comment: z.string(),
    })
  ),
  notes: z.string(),
})

// Create parser that ensures AI output matches our item schema
const parser = StructuredOutputParser.fromZodSchema(z.array(itemSchema))

// Function to create database and collection before seeding
const setupDatabaseAndCollection = async () => {
  console.log("Setting up database and collection...")

  const db = client.db("inventory_database")
  const collections = await db.listCollections({ name: "items" }).toArray()

  if (collections.length === 0) {
    await db.createCollection("items")
    console.log("Created 'items' collection in 'inventory_database' database")
  } else {
    console.log("'items' collection already exists in 'inventory_database' database")
  }
}

// Function to create vector search index
const createVectorSearchIndex = async () => {
  try {
    const db = client.db("inventory_database")
    const collection = db.collection("items")
    await collection.dropIndexes()
    const vectorSearchIdx = {
      name: "vector_index",
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: 768,
            similarity: "cosine",
          },
        ],
      },
    }
    console.log("Creating vector search index...")
    await collection.createSearchIndex(vectorSearchIdx)

    console.log("Successfully created vector search index")
  } catch (e) {
    console.error("Failed to create vector search index:", e)
  }
}

// Function to generate synthetic data
const generateSyntheticData = async () => {
  const prompt = `You are a helpful assistant that generates furniture store item data. Generate 10 furniture store items. Each record should include the following fields: item_id, item_name, item_description, brand, manufacturer_address, prices, categories, user_reviews, notes. Ensure variety in the data and realistic values.

  ${parser.getFormatInstructions()}`

  console.log("Generating synthetic data...")
  const response = await llm.invoke(prompt)
  return parser.parse(response.content)
}

// Function to create a searchable text summary from furniture item data
const createItemSummary = async (item) => {
  const manufacturerDetails = `Made in ${item.manufacturer_address.country}`
  const categories = item.categories.join(", ")
  const userReviews = item.user_reviews
    .map((review) => `Rated ${review.rating} on ${review.review_date}: ${review.comment}`)
    .join(" ")
  const basicInfo = `${item.item_name} ${item.item_description} from the brand ${item.brand}`
  const price = `At full price it costs: ${item.prices.full_price} USD, On sale it costs: ${item.prices.sale_price} USD`
  const notes = item.notes

  return `${basicInfo}. Manufacturer: ${manufacturerDetails}. Categories: ${categories}. Reviews: ${userReviews}. Price: ${price}. Notes: ${notes}`
}

// Main function to populate database with AI-generated furniture data
const seedDatabase = async () => {
  try {
    await client.connect()
    await client.db("admin").command({ ping: 1 })
    console.log("You successfully connected to MongoDB!")

    await setupDatabaseAndCollection()
    await createVectorSearchIndex()

    const db = client.db("inventory_database")
    const collection = db.collection("items")

    await collection.deleteMany({})
    console.log("Cleared existing data from items collection")

    const syntheticData = await generateSyntheticData()

    const recordsWithSummaries = await Promise.all(
      syntheticData.map(async (record) => ({
        pageContent: await createItemSummary(record),
        metadata: { ...record },
      }))
    )

    for (const record of recordsWithSummaries) {
      await MongoDBAtlasVectorSearch.fromDocuments(
        [record],
        new GoogleGenerativeAIEmbeddings({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: "text-embedding-004",
        }),
        {
          collection,
          indexName: "vector_index",
          textKey: "embedding_text",
          embeddingKey: "embedding",
        }
      )

      console.log("Successfully processed & saved record:", record.metadata.item_id)
    }

    console.log("Database seeding completed")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await client.close()
  }
}

// Execute seeding
seedDatabase().catch(console.error)
