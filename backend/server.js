import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";
import { callAgent } from "./agent.js";
const app = express();

const PORT = 5000;
dotenv.config();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URL);

const startServer = async () => {
  try {
    // yaha per mongodb se connection banaye
    await client.connect();
    // pairing the database
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");

    app.get("/", (req, res) => {
      res.send("Hello backend how are you will  do it from zero from server");
    });

    // yaha per "chat" ki route banaye
    app.post("/chat", async (req, res) => {
      // saving the data comming from front end to the backend
      const intialMessage = req.body.message;
      // yaha per id generate karey aur each time to chat user karta
      const threadId = Date.now().toString();
      console.log("initialMessage", intialMessage);

      try {
        // yaha per callAgent function ko "client"  "intialMessage" aur "threadId" pass karey
        const response = await callAgent(client, intialMessage, threadId);
        res.status(200).json({ threadId, response, messageStatus: "success" });
      } catch (error) {
        console.log("error starting conversation", error);
        res.status(500).json({ messageStatus: "internal server error" });
      }
    });

    // yaha per "chat ki individualId" ki  route banaye
    app.post("/chat/:threadId", async (req, res) => {
      const threadId = req.params;
      // yaha per continuation of that topic joh user question pucha
      const { message } = req.body;
      try {
        const response = await callAgent(client, message, threadId);
        res
          .status(200)
          .json({ response, messageStatus: "success individual chatid" });
      } catch (error) {
        console.log(error.message);
        res
          .status(500)
          .json({ messageStatus: "check indidivual chat id functionality" });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
    console.log("Unable to connect to the server");
  }
};

startServer();
