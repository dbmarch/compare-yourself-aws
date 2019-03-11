const AWS = require('aws-sdk')
const dynamodb = new AWS.DynamoDB({ region: 'us-east-2', apiVersion: '2012-08-10' })

exports.handler = (event, context, callback) => {
	console.info('Lambda context: ', JSON.stringify(context, null, 2))
	console.info('Lambda event:', JSON.stringify(event, null, 2))
	const params = {
		Item: {
			UserId: {
				S: event.userId,
			},
			Age: {
				N: event.age,
			},
			Height: {
				N: event.height,
			},
			Income: {
				N: event.income,
			},
		},
		TableName: 'compare-yourself',
	}

	console.info(`dynamodb.putItem ${JSON.stringify(params, null, 2)}`)

	dynamodb.putItem(params, (err, data) => {
		if (err) {
			console.info('Error: ', err)
			callback(err)
		} else {
			console.info(data)
			callback(null, data)
		}
	})
}
