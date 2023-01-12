const {
    expressjwt: jwt,
    expressjwt
} = require("express-jwt");


function authJwt() {
    const secret = process.env.SECRET_KEY
    const api = process.env.API_URL;
    return expressjwt({
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [{
                url: /\/api\/v1\/products(.*)/,
                methods: ['GET', '0PTIONS'],
            },
            {
                url: /\/api\/v1\/categories(.*)/,
                methods: ['GET', '0PTIONS'],
            },
            {
                url: /\/public\/uploads(.*)/,
                methods: ['GET', '0PTIONS'],
            },
            `${api}/users/login`,
            `${api}/users/register`
        ]
    });
}

//check if the user is admin or user
async function isRevoked(req, token) {
    if (token.payload.isAdmin == false) {
        return true;
    }
    return false;
}
module.exports = authJwt;