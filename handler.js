import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import express from "express";
import serverless from "serverless-http";
import log from 'lambda-log';

const app = express();
const PHOTOS_TABLE = process.env.PHOTOS_TABLE;
const dynamoDbClient = DynamoDBDocument.from(new DynamoDB());

app.use(express.json());

app.get("/bot", async (req, res) => {
  log.info('start get /bot');

  const params = {
    TableName: PHOTOS_TABLE,
    Key: {
      whatsappId: req.query.WaId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params);

    if (!Item) {
      return res
        .status(404)
        .json({ error: 'Could not find number with provided "whatsappId"' });
    }

    const { userId, name, email } = Item;

    log.info('end successfully get /bot');
    return res.json({ userId, name, email });
  } catch (error) {
    console.log(error);
    log.error('end error get /bot');
    return res
      .status(500)
      .json({
        message: "Could not retrieve number",
        error: error.message,
      });
  }
});

app.post("/bot", async (req, res) => {
  log.info('start post /bot');
  const { whatsappId, name, email } = req.body;

  const params = {
    TableName: PHOTOS_TABLE,
    Item: {
      whatsappId,
      name,
      email,
    },
  };

  try {
    await dynamoDbClient.put(params);
    log.info('end successfully post /bot');
    return res.json({ whatsappId, name, email });
  } catch (error) {
    console.log(error);
    log.error('end error post /bot');
    return res
      .status(500)
      .json({
        message: "Could not create number",
        error: error.message,
      });
  }
});

app.use((_req, res, _next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

export const handler = serverless(app);
