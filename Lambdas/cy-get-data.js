const AWS = require('aws-sdk')
const dynamodb = new AWS.DynamoDB({ region: 'us-east-2', apiVersion: '2012-08-10' })
const cisp = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' })

exports.handler = (event, context, callback) => {
	console.info(`event: ${JSON.stringify(event, null, 2)}`)

	const accessToken = event.accessToken

	let params

	const type = event.type
	if (type === 'all') {
		params = {
			TableName: 'compare-yourself',
		}
		dynamodb.scan(params, (err, data) => {
			if (err) {
				console.log(err, err.stack) // an error occurred
				callback(err)
			} else {
				const items = data.Items.map(item => ({
					age: Number(item.Age.N),
					height: Number(item.Height.N),
					income: Number(item.Income.N),
				}))
				callback(null, items)
			}
		})
	} else if (type == 'single') {
		const cispParams = {
			AccessToken: accessToken,
		}

		cisp.getUser(cispParams, (err, result) => {
			if (err) {
				console.error(err)
				return callback(err)
			}
			console.log(result)
			const userId = result.UserAttributes[0].Value

			params = {
				Key: {
					UserId: {
						S: userId,
					},
				},
				TableName: 'compare-yourself',
			}

			dynamodb.getItem(params, (err, data) => {
				if (err) {
					console.log(err, err.stack) // an error occurred
					callback(err)
				} else {
					console.log(JSON.stringify(data, null, 2)) // successful response
					const item = {
						age: Number(data.Item.Age.N),
						height: Number(data.Item.Height.N),
						income: Number(data.Item.Income.N),
					}
					callback(null, [item])
				}
			})
		})
	} else {
		callback(null, 'Hello from lambda')
	}
}
