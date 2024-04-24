import fetch from 'node-fetch';

const handler = async (event: any = {}): Promise<any> => {
    console.log('event:', JSON.stringify(event, null, 2));
    const apiResult = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const apiJson = await apiResult.json();
    console.info('apiJson:', JSON.stringify(apiJson));

    return { statusCode: 200, body: JSON.stringify('Hello from Lambda!') };
}
module.exports = { handler }