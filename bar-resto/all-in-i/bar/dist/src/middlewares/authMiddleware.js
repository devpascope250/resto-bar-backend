"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_jwe_1 = require("../utils/jwt-jwe");
// Define the possible user types
const authType = ['ADMIN', 'PARTNER_ADMIN', 'WAITER', 'MANAGER', 'CHEF', 'KITCHEN'];
function authMiddleware(allowedRoles) {
    return async (req, res, next) => {
        var _a, _b;
        // use token from cookies exist or use authorization header by Bearer token
        const token = req.cookies.log_token || ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
        const ebm_token = (_b = req.headers['ebmtoken']) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
        // If no token is found, return unauthorized
        if (!token) {
            return res.status(401).json({ message: 'You`re not authorized to access this resource, please login first' });
        }
        // check X-Platform from header
        // if (!req.headers['x-platform']) {
        //     return res.status(401).json({ message: 'Unauthorized' });
        // }
        const decode = await (0, jwt_jwe_1.verifyEncryptedToken)(token);
        if (!decode) {
            return res.status(401).json({ message: 'UnAuthorized for this resource' });
        }
        try {
            if (!allowedRoles.includes(decode === null || decode === void 0 ? void 0 : decode.user.role)) {
                return res.status(403).json({ message: 'You are not authorized to access this resource!!' });
            }
            req.user = {
                id: decode.user.id,
                role: decode.user.role,
                partnerId: decode.user.partnerId,
            };
            req.context = {
                ebm_token: ebm_token
            };
            next();
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
}
