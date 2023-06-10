'use strict';

const { DynamoDBClient,  PutItemCommand, UpdateItemCommand, DeleteItemCommand, QueryCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

const client = new DynamoDBClient({
  region: "us-east-1",
  maxRetries: 3,
  httpOptions: { timeout: 5000 }
});
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

module.exports.createNote = async (event, context) => {
  let data;
  context.callbackWaitsForEmptyEventLoop = false;


  if (event.body)   data = JSON.parse(event.body);
  else throw new Error('Invalid input data');  

  try {
    const input = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: { S: data.id },
        title: {S: data.title},
        body: {S: data.body}
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    };
    
    const command = new PutItemCommand(input);
    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify('A new note was created'),
    };
    
  } catch (error) {
    console.error('Error:', error); // Log the error for debugging

    return {
      statusCode: 500,
      body: JSON.stringify('Error creating the note'),
    };
  }
};

module.exports.updateNote = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  let notesId = event.pathParameters.id;
  let data;

  if (event.body)   data = JSON.parse(event.body);
  else throw new Error('Invalid input data');  

  try {

    const input = {
      TableName: NOTES_TABLE_NAME,
      Key: {notesId: {S: notesId}},
      UpdateExpression: "set #title = :title, #body = :body",
      ExpressionAttributeNames: {
        "#title": "title",
        "#body": "body"},
      ExpressionAttributeValues: { 
        ":title": {S: data.title}, 
        ":body": {S: data.body} },
      ConditionExpression: "attribute_exists(notesId)"
    };

    const command = new UpdateItemCommand(input);
    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify('The note with id ' + notesId + ' was updated successfully'),
    };
  } catch (error) {
    console.error('Error:', error); // Log the error for debugging

    return {
      statusCode: 500,
      body: JSON.stringify('Error updating the note'),
    };
  }

};

module.exports.deleteNote = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters.id;

  try {
    const input = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId: { S: notesId } },
      ConditionExpression: "attribute_exists(notesId)"
    };

    const command = new DeleteItemCommand(input);
    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify('The note with id ' + notesId + ' was deleted successfully'),
    };
  } catch (error) {
    console.error('Error:', error); // Log the error for debugging

    return {
      statusCode: 500,
      body: JSON.stringify('Error deleting the note'),
    };
  }
}

module.exports.getAllNotes = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const input = { TableName: NOTES_TABLE_NAME };
    const command = new ScanCommand(input); 
    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(response.Items.map(item => unmarshall(item)))
    };

  } catch (error) {
    console.error('Error:', error); // Log the error for debugging
    return {
      statusCode: 500,
      body: JSON.stringify('Arror at returning all notes')
    };

  }
}

module.exports.getNote  = async (event, context) => {
  let notesId = event.pathParameters.id;
  context.callbackWaitsForEmptyEventLoop = false;

  try {

    const input = {
      TableName: NOTES_TABLE_NAME,
      KeyConditionExpression: 'notesId = :notesId',
      ExpressionAttributeValues: {
        ':notesId': { S: notesId },
      },
      Limit: 1 // Limita la consulta a un solo elemento
    };

    const command = new QueryCommand(input);
    const response = await client.send(command);

   // Verifica si se encontró algún elemento
   if (response.Items.length === 1) {
      const item = unmarshall(response.Items[0]);

      return {
        statusCode: 200,
        body: JSON.stringify(item),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify('Item not found'),
      };
    }
  } catch (error) {
    console.error('Error:', error); // Log the error for debugging

    return {
      statusCode: 500,
      body: JSON.stringify('Error getting the note'),
    };
  }
}
 
