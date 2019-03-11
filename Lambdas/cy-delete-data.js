const AWS = require('aws-sdk')
const dynamodb = new AWS.DynamoDB({ region: 'us-east-2', apiVersion: '2012-08-10' })
const cisp = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' })

exports.handler = (event, context, callback) => {
	console.info(`event: ${JSON.stringify(event, null, 2)}`)

	const accessToken = event.accessToken
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

		let params = {
			Key: {
				UserId: {
					S: userId,
				},
			},
			TableName: 'compare-yourself',
		}

		dynamodb.deleteItem(params, (err, data) => {
			if (err) {
				console.log(err, err.stack) // an error occurred
				callback(err)
			} else {
				console.log(JSON.stringify(data, null, 2)) // successful response
				const item = {
					message: 'Deleted',
				}
				callback(null, item)
			}
		})
	})
}
