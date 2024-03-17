import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import "dotenv/config";
import express from "express";
import log from "lambda-log";
import serverless from "serverless-http";
import twilio from "twilio";

const { MessagingResponse } = twilio.twiml;

const app = express();

const PHOTOS_TABLE = process.env.PHOTOS_TABLE;
const dynamoDbClient = DynamoDBDocument.from(new DynamoDB());

const QUEUE_URL = process.env.QUEUE_URL;
const sqsClient = new SQSClient();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/", async (req, res) => {
  log.info("start get /");

  const { body } = req;

  const params = {
    TableName: PHOTOS_TABLE,
    Key: {
      whatsappId: body.WaId,
    },
  };

  try {
    if (!("NumMedia" in body) || parseInt(body.NumMedia) === 0) {
      const message = new MessagingResponse().message("Envie uma imagem!");
      res.set("Content-Type", "text/xml");
      return res.send(message.toString()).status(200);
    }

    const { Item } = await dynamoDbClient.get(params);

    if (!Item || Item.imagesUrl.length === 2) {
      await dynamoDbClient.put({
        TableName: PHOTOS_TABLE,
        Item: {
          whatsappId: body.WaId,
          imagesUrl: [
            {
              mediaUrl: body.MediaUrl0,
              mediaContentType: body.MediaContentType0,
            },
          ],
        },
      });

      const message = new MessagingResponse().message(
        "Obrigado pela imagem! Envie outra para finalizar."
      );
      res.set("Content-Type", "text/xml");
      return res.send(message.toString()).status(200);
    }

    const { imagesUrl } = Item;

    imagesUrl.push({
      mediaUrl: body.MediaUrl0,
      mediaContentType: body.MediaContentType0,
    });

    await dynamoDbClient.update({
      TableName: PHOTOS_TABLE,
      Key: {
        whatsappId: body.WaId,
      },
      UpdateExpression: "set imagesUrl = :imagesUrl",
      ExpressionAttributeValues: {
        ":imagesUrl": imagesUrl,
      },
    });

    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({ imagesUrl, whatsappId: body.WaId }),
      })
    );

    const message = new MessagingResponse().message(
      "Obrigado pela imagem! Aguarde enquanto processamos."
    );

    log.info("end successfully get /");
    res.set("Content-Type", "text/xml");
    return res.send(message.toString()).status(200);
  } catch (error) {
    log.error("end error get /", { error: error.message });
    return res.status(500).json({
      message: "Could not retrieve numbers",
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
