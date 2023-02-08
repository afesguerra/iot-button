import {request, RequestOptions} from "https";

const doRequest = (options: RequestOptions) => new Promise((resolve, reject) => {
  let req = request(options);

  req.on('response', res => {
    resolve(res);
  });

  req.on('error', err => {
    reject(err);
  });

  req.end();
});

export const handler = async () => {
  const {apiToken, userId, taskId} = process.env;

  await doRequest({
    host: 'habitica.com',
    path: `/api/v3/tasks/${taskId}/score/up`,
    method: 'POST',
    headers: {
      'x-api-user': userId,
      'x-client': `${userId}-IoTButton`,
      'x-api-key': apiToken,
    },
  });
};
