const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} = require('@aws-sdk/lib-dynamodb');

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME;
const TOP_N = Number(process.env.TOP_N || 10);
const LEADERBOARD_PK = 'LEADERBOARD';
const MAX_SCORE = 999_999_999;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

function sanitizeName(raw) {
  return String(raw || '')
    .trim()
    .replace(/[<>"'&]/g, '')
    .slice(0, 20);
}

exports.handler = async (event) => {
  const method =
    event.requestContext?.http?.method || event.httpMethod || 'GET';

  try {
    if (method === 'GET') {
      return await getScores();
    }
    if (method === 'POST') {
      return await postScore(event);
    }
    return jsonResponse(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return jsonResponse(500, { error: 'Internal server error' });
  }
};

async function getScores() {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': LEADERBOARD_PK },
      ScanIndexForward: true,
      Limit: TOP_N,
    })
  );

  const scores = (result.Items || []).map((item, index) => ({
    rank: index + 1,
    playerName: item.playerName,
    score: item.score,
    floor: item.floor,
    createdAt: item.createdAt,
  }));

  return jsonResponse(200, { scores });
}

async function postScore(event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const playerName = sanitizeName(body.playerName);
  const score = Number(body.score);
  const floor = Number(body.floor);

  if (!playerName) {
    return jsonResponse(400, { error: 'playerName is required (1-20 chars)' });
  }
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return jsonResponse(400, { error: 'Invalid score' });
  }
  if (!Number.isFinite(floor) || floor < 0 || floor > 999_999) {
    return jsonResponse(400, { error: 'Invalid floor' });
  }

  const normalizedScore = Math.floor(score);
  const normalizedFloor = Math.floor(floor);
  const createdAt = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const invertedScore = String(MAX_SCORE - normalizedScore).padStart(10, '0');

  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: LEADERBOARD_PK,
        sk: `${invertedScore}#${createdAt}#${id}`,
        playerName,
        score: normalizedScore,
        floor: normalizedFloor,
        createdAt,
      },
    })
  );

  return jsonResponse(201, {
    ok: true,
    playerName,
    score: normalizedScore,
    floor: normalizedFloor,
  });
}
