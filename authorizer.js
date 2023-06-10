const { CognitoJwtVerifier } = require('aws-jwt-verify');

const COGNITO_USERPOOL_ID = process.env.COGNITO_USERPOOL_ID;
const COGNITO_WEBCLIENT_ID = process.env.COGNITO_WEBCLIENT_ID;

const jwtVerifier = CognitoJwtVerifier.create({
    userPoolId: COGNITO_USERPOOL_ID, // required
    tokenUse: 'id', // required
    clientId: COGNITO_WEBCLIENT_ID // required
});

const generatePolicy = (principalId, effect, resource) => {
    var authResponse = {};
    authResponse.principalId = principalId;

    if(effect && resource) {
        authResponse.policyDocument = {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource
                }
            ],
        };
    }

    authResponse.context = {
        foo: 'bar'
    };

    return authResponse;
};

exports.handler = async (event) => {
    var token = event.authorizationToken;
    console.log(token);
    
    try {
        const payload = await jwtVerifier.verify(token);
        console.log(JSON.stringify(payload));

        return generatePolicy("user", 'Allow', event.methodArn);
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify('Error: Invalid JWT Token'),
          };
    }
};